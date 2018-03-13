import AccountKit from '../src/facebook-account-kit-typescript'

/**
 * AccountKit test
 */

const appId = ''
const appSecret = ''

describe('AccountKit test', () => {
  it('AccountKit is instantiable', () => {
    expect(new AccountKit(appId, appSecret)).toBeInstanceOf(AccountKit)
  })
})
