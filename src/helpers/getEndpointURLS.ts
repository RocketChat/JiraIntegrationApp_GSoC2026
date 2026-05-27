import { IApiEndpointMetadata } from "@rocket.chat/apps-engine/definition/api";
import { JiraApp } from "../../JiraApp";

export async function getCallbackURL(app: JiraApp): Promise<string> {
    const accessors = app.getAccessors();
    const webhookEndpoint = accessors.providedApiEndpoints.find((endpoint) => endpoint.path === 'callback') as IApiEndpointMetadata;
    let siteUrl: string = await accessors.environmentReader.getServerSettings().getValueById('Site_Url') as string;
    if (siteUrl.charAt(siteUrl.length - 1) === '/') {
        siteUrl = siteUrl.substring(0, siteUrl.length - 1);
    }
    return siteUrl + webhookEndpoint.computedPath;
}