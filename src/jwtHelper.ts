import base64url from 'base64url'
import * as ed from 'noble-ed25519'
import { arr2b64url } from './helper'

class JWTHelper {

  // static async createAndSign(type: 'jwt' | 'stjwt' | 'cl', body: any, key: Uint8Array) {
  static async createAndSign(type: 'jwt' | 'ojwt' | 'cl', body: any, key: Uint8Array) {
    const textEncoder = new TextEncoder()
    const textDecoder = new TextDecoder()

    const header = { 'alg': 'EdDSA', 'typ': type }
    const hb = `${base64url.encode(JSON.stringify(header))}.${base64url.encode(JSON.stringify(body))}`
    const hb_bytes = textEncoder.encode(hb)
    const signature = await ed.sign(hb_bytes, key)
    const b64signature = arr2b64url(signature)

    return `${hb}.${b64signature}`
  }
}

export {
  JWTHelper
}