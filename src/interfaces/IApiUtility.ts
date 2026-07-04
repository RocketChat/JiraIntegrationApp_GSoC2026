import { IJiraAuthToken } from "./IJiraOAuthToken";

export interface IApiGetObject {
    token: IJiraAuthToken;
}

export interface IApiBodyObject {
    token: IJiraAuthToken;
    body: object;
}
