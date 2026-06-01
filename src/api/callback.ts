import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpoint,
    IApiEndpointInfo,
    IApiExample,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { JiraApp } from "../../JiraApp";
import { authTemplate } from "../helpers/getAuthPageTemplate";

export class CallbackEndpoint extends ApiEndpoint {
    path: string = "callback";
    constructor(public app: JiraApp) {
        super(app);
    }
    async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse> {
        const { state, code } = request.query;

        const user = await read.getUserReader().getById(state);

        const sdk = this.app.getJiraSDK();

        await sdk.getAccessToken(read, code, user, modify, persis);

        return {
            status: 200,
            content: authTemplate,
        };
    }
}
