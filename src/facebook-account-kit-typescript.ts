import * as Request from 'request'
import * as Querystring from 'querystring'
import * as Crypto from 'crypto'
import {
  ISMSAccountInfo,
  ISuccessResp,
  IEmailAccountInfo,
  ISMSAccountReq,
  IEmailAccountReq,
  ITokenReq
} from './types/account'

export default class AccountKit {
  private appId: string = ''
  private appSecret: string = ''
  private apiVersion: string = 'v1.1'
  private requireAppSecretValue: boolean = true
  private baseUrl: string = 'https://graph.accountkit.com/'

  constructor(id: string, secret: string, version?: string) {
    this.appId = id
    this.appSecret = secret
    if (version !== undefined) {
      this.apiVersion = version
    }
  }

  public requireAppSecret(_requireAppSecret: boolean): void {
    this.requireAppSecretValue = _requireAppSecret
  }
  public getAccountInfo(
    authorizationCode: string,
    meFields?: Array<string>
  ): Promise<ISMSAccountInfo | IEmailAccountInfo> {
    return new Promise((resolve, reject) => {
      const params = {
        grant_type: 'authorization_code',
        code: authorizationCode,
        access_token: this.getAppAccessToken()
      }

      const tokenExchangeUrl = `${this.getTokenExchangeEnpoint()}?${Querystring.stringify(params)}`

      Request.get(
        {
          url: tokenExchangeUrl,
          json: true
        },
        (error, resp, respBody: ITokenReq) => {
          if (error) {
            reject(error)
            return
          } else if (respBody.error) {
            reject(respBody.error)
            return
          } else if (resp.statusCode !== 200) {
            const errorMsg = 'Invalid AccountKit Graph API status code (' + resp.statusCode + ')'
            reject(new Error(errorMsg))
            return
          }

          let meEndpointUrl = `${this.getInfoEndpoint(meFields)}?access_token=${
            respBody.access_token
          }`
          const token = respBody.access_token
          const token_refresh_interval_sec = respBody.token_refresh_interval_sec

          if (this.requireAppSecretValue) {
            meEndpointUrl +=
              '&appsecret_proof=' +
              Crypto.createHmac('sha256', this.appSecret)
                .update(respBody.access_token)
                .digest('hex')
          }

          Request.get(
            {
              url: meEndpointUrl,
              json: true
            },
            (error, resp, respBody: ISMSAccountReq | IEmailAccountReq) => {
              if (error) {
                reject(error)
                return
              } else if (respBody.error) {
                reject(respBody.error)
                return
              } else if (resp.statusCode !== 200) {
                const errorMsg = `Invalid AccountKit Graph API status code (${resp.statusCode})`
                reject(new Error(errorMsg))
                return
              }

              const response: ISMSAccountInfo | IEmailAccountInfo = Object.assign(respBody, {
                access_token: token,
                token_refresh_interval_sec: token_refresh_interval_sec
              })

              resolve(response)
            }
          )
        }
      )
    })
  }
  public logoutUser(token: string): Promise<ISuccessResp> {
    return new Promise((resolve, reject) => {
      let logoutUrl = `${this.getLogoutEndpoint()}?access_token=${token}`

      if (this.requireAppSecretValue) {
        logoutUrl +=
          '&appsecret_proof=' +
          Crypto.createHmac('sha256', this.appSecret)
            .update(token)
            .digest('hex')
      }

      Request.post(
        {
          url: logoutUrl,
          json: true
        },
        (error, resp, respBody) => {
          if (error) {
            reject(error)
            return
          } else if (respBody.error) {
            reject(respBody.error)
            return
          } else if (resp.statusCode !== 200) {
            const errorMsg = `Invalid AccountKit Graph API status code (${resp.statusCode})`
            reject(new Error(errorMsg))
            return
          }

          resolve(respBody)
        }
      )
    })
  }
  public removeUser(id: string): Promise<ISuccessResp> {
    return new Promise((resolve, reject) => {
      const delUrl = `${this.getRemovalEndpoint(id)}?access_token=${this.getAppAccessToken()}`

      Request.del(
        {
          url: delUrl,
          json: true
        },
        (error, resp, respBody) => {
          if (error) {
            reject(error)
            return
          } else if (respBody.error) {
            reject(respBody.error)
            return
          } else if (resp.statusCode !== 200) {
            const errorMsg = `Invalid AccountKit Graph API status code (${resp.statusCode})`
            reject(new Error(errorMsg))
            return
          }

          resolve(respBody)
        }
      )
    })
  }
  private getApiVersion(): string {
    return this.apiVersion
  }
  private getAppAccessToken(): string {
    return ['AA', this.appId, this.appSecret].join('|')
  }
  private getInfoEndpoint(meFields?: Array<string>): string {
    if (meFields) {
      return `${this.baseUrl}${this.apiVersion}/me?fields=${meFields.join(',')}`
    }

    return `${this.baseUrl}${this.apiVersion}/me`
  }
  private getLogoutEndpoint(): string {
    return `${this.baseUrl}${this.apiVersion}/logout`
  }
  private getRemovalEndpoint(id: string): string {
    return `${this.baseUrl}${this.apiVersion}/${id}`
  }
  private getTokenExchangeEnpoint(): string {
    return `${this.baseUrl}${this.apiVersion}/access_token`
  }
}
