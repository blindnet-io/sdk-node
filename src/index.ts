import fetch from 'node-fetch'
import { Response } from 'node-fetch'
import { v4 as uuidv4 } from 'uuid';
import { AuthenticationError, BlindnetServiceError } from './error'
import { b642arr, arr2b64 } from './helper'
import { JWTHelper } from './jwtHelper'

class Blindnet {
  private appKey: Uint8Array
  private appId: string
  private endpoint: string
  private clientJwt
  private protocolVersion: string = "1"

  constructor(appKey: string, appId: string, endpoint: string) {
    this.appKey = b642arr(appKey).slice(0, 32)
    this.appId = appId
    this.endpoint = endpoint
    this.updateClientJwt()
  }

  static async init(appKey: string, appId: string, endpoint: string = 'https://api.blindnet.io') {
    const instance = new Blindnet(appKey, appId, endpoint)
    await new Promise(resolve => setTimeout(resolve, 0))
    return instance
  }

  static ctut(appKey: Uint8Array, appId: string, param: string | string[]): Promise<string> {
    let gr = undefined
    if (typeof param === 'string')
      gr = { gid: param }
    else
      gr = { uids: param }

    const body = {
      ...gr,
      app: appId,
      tid: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24
    }

    return JWTHelper.createAndSign('tjwt', body, appKey)
  }

  createTempUserToken(param: string | string[]): Promise<string> {
    return Blindnet.ctut(this.appKey, this.appId, param)
  }

  static createTempUserToken(appKey: string, appId: string, param: string | string[]): Promise<string> {
    return Blindnet.ctut(b642arr(appKey).slice(0, 32), appId, param)
  }

  static cut(appKey: Uint8Array, appId: string, userId: string, groupId: string) {
    const body = {
      app: appId,
      uid: userId,
      gid: groupId,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 1
    }

    return JWTHelper.createAndSign('jwt', body, appKey)
  }

  createUserToken(userId: string, groupId: string = '') {
    return Blindnet.cut(this.appKey, this.appId, userId, groupId)
  }

  static createUserToken(appKey: string, appId: string, userId: string, groupId: string = '') {
    return Blindnet.cut(b642arr(appKey).slice(0, 32), appId, userId, groupId)
  }

  private async updateClientJwt() {
    const body = {
      app: this.appId,
      tid: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 1
    }

    this.clientJwt = await JWTHelper.createAndSign('cjwt', body, this.appKey)
  }

  private async repeatAuth(f: () => Promise<Response>, n: number, err: string) {
    let resp
    try {
      resp = await f()
    } catch {
      throw new BlindnetServiceError('Could not connect to blindnet')
    }

    if (resp.status === 401 && n > 0) {
      await this.updateClientJwt()
      return this.repeatAuth(f, n - 1, err)
    } else if (resp.status === 401) {
      throw new AuthenticationError()
    } else if (resp.status === 200) {
      return undefined
    } else {
      throw new BlindnetServiceError(err)
    }
  }

  async forgetData(dataId: string) {
    const f = () =>
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/documents/${dataId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error deleting data with id ${dataId}`)
  }

  async revokeAccess(userId: string) {
    const f = () =>
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/documents/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error revoking access to user ${userId}`)
  }

  async forgetUser(userId: string) {
    const f = () =>
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error deleting user ${userId}`)
  }

  async forgetGroup(groupId: string) {
    const f = () =>
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/group/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error deleting group ${groupId}`)
  }
}

export = Blindnet
