import axios from 'axios'
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
    const params = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      access_token: this.getAppAccessToken()
    }

    const tokenExchangeUrl = `${this.getTokenExchangeEnpoint()}?${Querystring.stringify(params)}`

    return this.facebookAPIRequest(tokenExchangeUrl).then((respBody: ITokenReq) => {
      let meEndpointUrl = `${this.getInfoEndpoint(meFields)}?access_token=${respBody.access_token}`
      const token = respBody.access_token
      const token_refresh_interval_sec = respBody.token_refresh_interval_sec

      if (this.requireAppSecret) {
        meEndpointUrl +=
          '&appsecret_proof=' +
          Crypto.createHmac('sha256', this.appSecret)
            .update(respBody.access_token)
            .digest('hex')
      }

      return this.facebookAPIRequest(meEndpointUrl).then(
        (respBody: ISMSAccountReq | IEmailAccountReq) => {
          const response: ISMSAccountInfo | IEmailAccountInfo = Object.assign(respBody, {
            access_token: token,
            token_refresh_interval_sec: token_refresh_interval_sec
          })
          return response
        }
      )
    })
  }
  public logoutUser(token: string): Promise<ISuccessResp> {
    let logoutUrl = `${this.getLogoutEndpoint()}?access_token=${token}`

    if (this.requireAppSecret) {
      logoutUrl +=
        '&appsecret_proof=' +
        Crypto.createHmac('sha256', this.appSecret)
          .update(token)
          .digest('hex')
    }

    return this.facebookAPIRequest(logoutUrl, 'POST').then((respBody: ISuccessResp) => {
      return respBody
    })
  }
  public removeUser(id: string): Promise<ISuccessResp> {
    const delUrl = `${this.getRemovalEndpoint(id)}?access_token=${this.getAppAccessToken()}`

    return this.facebookAPIRequest(delUrl, 'DELETE').then((respBody: ISuccessResp) => {
      return respBody
    })
  }

  private facebookAPIRequest(url: string, method: string = 'GET') {
    return axios({
      method,
      url
    })
      .then(resp => resp.data)
      .then(respBody => {
        console.log(respBody)
        if (respBody.error) {
          throw new Error(respBody.error)
        }
        return respBody
      })
      .catch(error => {
        throw new Error(error)
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
