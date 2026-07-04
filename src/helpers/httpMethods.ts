import {
    IHttp,
    IHttpResponse,
} from "@rocket.chat/apps-engine/definition/accessors";
import { URLEnum } from "../enums/URLEnum";
import { IApiGetObject, IApiBodyObject } from "../interfaces/IApiUtility";

function getApiURL(cloudId: string) {
    return `${URLEnum.BASE_URL}${cloudId}/rest/api/3`;
}
export async function getRequest(
    http: IHttp,
    endpoint: string,
    data: IApiGetObject,
): Promise<IHttpResponse> {
    const apiURL = getApiURL(data.token.cloudID);

    const response = await http.get(`${apiURL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${data.token.accessToken}`,
            Accept: "application/json",
        },
    });

    if (!response || !response.statusCode.toString().startsWith("2")) {
        throw new Error(
            `Error Occured: Response: ${response?.content || JSON.stringify(response?.data)}`,
        );
    }

    return response as IHttpResponse;
}

export async function postRequest(
    http: IHttp,
    endpoint: string,
    data: IApiBodyObject,
) {
    const apiURL = getApiURL(data.token.cloudID);

    const response = await http.post(`${apiURL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${data.token.accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        data: data.body,
    });

    if (!response || !response.statusCode.toString().startsWith("2")) {
        throw new Error(
            `Error Occured: Response: ${response?.content || JSON.stringify(response?.data)}`,
        );
    }

    return response as IHttpResponse;
}

export async function putRequest(
    http: IHttp,
    endpoint: string,
    data: IApiBodyObject,
) {
    const apiURL = getApiURL(data.token.cloudID);

    const response = await http.put(`${apiURL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${data.token.accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        data: data.body,
    });

    if (!response || !response.statusCode.toString().startsWith("2")) {
        throw new Error(
            `Error Occured: Response: ${response?.content || JSON.stringify(response?.data)}`,
        );
    }

    return response as IHttpResponse;
}
