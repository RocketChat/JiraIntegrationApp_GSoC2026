import { IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getCredentials } from "./getSettings";
import { URLEnum } from "../enums/URLEnum";
import { JiraApp } from "../../JiraApp";
import { getCallbackURL } from "./getEndpointURLS";

export async function getAuthorizationURL(app: JiraApp, read: IRead, user: IUser) {
    const { clientId } = await getCredentials(read);

    const baseURL = URLEnum.baseURL;
    const audience = "api.atlassian.com";
    const redirectURL = await getCallbackURL(app);
    const responseType = "code";
    const prompt = "consent";

    const scope = [
        "read:jira-work",
        "write:jira-work",
        "read:jira-user",
        "read:me",
        "manage:jira-webhook",
        "offline_access",
    ].join(" ");

    const encodedScope = encodeURIComponent(scope);
    const encodedRedirect = encodeURIComponent(redirectURL);

    const state = user.id;

    const url =
        `${baseURL}?` +
        `audience=${audience}&` +
        `client_id=${clientId}&` +
        `scope=${encodedScope}&` +
        `redirect_uri=${encodedRedirect}&` +
        `state=${state}&` +
        `response_type=${responseType}&` +
        `prompt=${prompt}`;

    return url;
}