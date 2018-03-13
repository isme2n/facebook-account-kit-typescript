export interface ISMSAccountInfo extends ISMSAccountReq, ITokenReq {}

export interface ISMSAccountReq {
  id: string
  phone: {
    number: string
    country_prefix: string
    national_number: string
  }
  application: {
    id: string
  }
  error?: any
}

export interface IEmailAccountInfo extends IEmailAccountReq, ITokenReq {}
export interface IEmailAccountReq {
  email: {
    address: string
  }
  id: string
  application: {
    id: string
  }
  error?: any
}
export interface ITokenReq {
  access_token: string
  token_refresh_interval_sec: string
  error?: any
}

export interface ISuccessResp {
  success: boolean
}
