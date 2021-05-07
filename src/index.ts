'use strict'

import fetch from 'node-fetch'
import { Response } from 'node-fetch'
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
    this.appKey = b642arr(appKey)
    this.appId = appId
    this.endpoint = endpoint
    this.updateClientJwt()
  }

  static async init(appKey: string, appId: string, endpoint: string = 'https://api.blindnet.io') {
    return new Blindnet(appKey, appId, endpoint)
  }

  createTempUserToken(group: string | string[]): Promise<string> {
    let gr = undefined
    if (typeof group === 'string')
      gr = { user_group_id: group }
    else
      gr = { user_id: group }

    const body = {
      ...gr,
      app_id: this.appId,
      nbf: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }

    return JWTHelper.createAndSign('stjwt', body, this.appKey)
  }

  createUserToken(userId: string, groupId: string) {
    const body = {
      app_id: this.appId,
      user_id: userId,
      user_group_id: groupId,
      nbf: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 1
    }

    return JWTHelper.createAndSign('jwt', body, this.appKey)
  }

  private async updateClientJwt() {
    console.log('client jwt updated')
    const body = {
      app_id: this.appId,
      nbf: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 1
    }

    this.clientJwt = await JWTHelper.createAndSign('cl', body, this.appKey)
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
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/new/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error deleting user ${userId}`)
  }

  async deleteGroup(groupId: string) {
    const f = () =>
      fetch(`${this.endpoint}/api/v${this.protocolVersion}/new/group/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientJwt}`
        }
      })

    return await this.repeatAuth(f, 1, `Error deleting group ${groupId}`)
  }
}

export default Blindnet
