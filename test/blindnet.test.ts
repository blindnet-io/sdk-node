import * as chai from 'chai'
import * as mocha from 'mocha'
import * as cc from 'chai-as-promised'
const { Blindnet } = require('../src')

chai.use(require('chai-as-promised'))
const { expect } = chai

describe('Blindnet', async () => {

  const appKey = 'WGZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmY='
  const appId = '0'

  const blindnet = await Blindnet.init(appKey, appId, '')

})