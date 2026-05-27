import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { JiraApp } from "../../JiraApp";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getCallbackURL } from "../helpers/getEndpointURLS";
import { getCredentials } from "../helpers/getSettings";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";
import { sendDMNotification } from "../helpers/message";

export class JiraSDK {
    private readonly app: JiraApp;
    constructor(app: JiraApp) {
        this.app = app;
    }

    public async getAccessToken(
        read: IRead,
        code: string,
        user: IUser,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IJiraAuthToken> {
        const { clientId, clientSecret } = await getCredentials(read);
        const redirectUri = await getCallbackURL(this.app);

        const response = await http.post(
            "https://auth.atlassian.com/oauth/token",
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                data: {
                    grant_type: "authorization_code",
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: redirectUri,
                },
            },
        );

        const responseData = response.data;

        if (!response.statusCode.toString().startsWith("2") || !responseData) {
            throw new Error(
                `Failed to exchange Jira authorization code. Status: ${response.statusCode}. Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        const now = new Date().toISOString();
        const token: IJiraAuthToken = {
            accessToken: responseData.access_token,
            refreshToken: responseData.refresh_token,
            expiresIn: responseData.expires_in,
            scope: responseData.scope,
            tokenType: responseData.token_type,
            createdAt: now,
            updatedAt: now,
        };

        const authPersistence = new AuthPersistence(
            persis,
            read.getPersistenceReader(),
        );

        const existingToken = await authPersistence.getAccessToken(user);
        await authPersistence.saveAccessToken(user, {
            ...token,
            createdAt: existingToken?.createdAt || now,
        });

        await sendDMNotification(
            read,
            modify,
            user,
            "Jira login successful 🚀",
        );

        return token;
    }

    public async refreshAccessToken(
        read: IRead,
        user: IUser,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IJiraAuthToken> {
        const authPersistence = new AuthPersistence(
            persis,
            read.getPersistenceReader(),
        );
        const existingToken = await authPersistence.getAccessToken(user);

        if (!existingToken?.refreshToken) {
            throw new Error("No Jira refresh token found for this user.");
        }

        const { clientId, clientSecret } = await getCredentials(read);

        const response = await http.post(
            "https://auth.atlassian.com/oauth/token",
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                data: {
                    grant_type: "refresh_token",
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: existingToken.refreshToken,
                },
            },
        );

        const responseData = response.data;

        if (
            !response.statusCode.toString().startsWith("2") ||
            !responseData.access_token
        ) {
            throw new Error(
                `Failed to refresh Jira access token. Status: ${response.statusCode}. Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        const now = new Date().toISOString();
        const token: IJiraAuthToken = {
            accessToken: responseData.access_token,
            refreshToken:
                responseData.refresh_token || existingToken.refreshToken,
            expiresIn: responseData.expires_in,
            scope: responseData.scope,
            tokenType: responseData.token_type,
            createdAt: existingToken.createdAt,
            updatedAt: now,
        };

        await authPersistence.saveAccessToken(user, token);

        return token;
    }
}
