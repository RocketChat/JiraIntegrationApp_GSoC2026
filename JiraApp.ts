import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { settings } from "./src/settings/settings";
import { JiraCommand } from "./src/commands/JiraCommand";
import { JiraSDK } from "./src/core/JiraSDK";
import { CallbackEndpoint } from "./src/api/callback";
import { ApiVisibility, ApiSecurity } from "@rocket.chat/apps-engine/definition/api";
import { UIKitViewSubmitInteractionContext, UIKitBlockInteractionContext, IUIKitResponse } from "@rocket.chat/apps-engine/definition/uikit";
import { ExecuteViewSubmitHandler } from "./src/handlers/ExecuteViewSubmitHandler";
import { ExecuteBlockActionHandler } from "./src/handlers/ExecuteBlockActionHandler";

export class JiraApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public getJiraSDK(): JiraSDK {
        return new JiraSDK(this, this.getAccessors().http);
    }

    public async initialize(
        configurationExtend: IConfigurationExtend,
        environmentRead: IEnvironmentRead,
    ): Promise<void> {
        await Promise.all(
            settings.map((setting) => {
                configurationExtend.settings.provideSetting(setting);
            }),
        );

        await configurationExtend.slashCommands.provideSlashCommand(
            new JiraCommand(this),
        );

        await configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new CallbackEndpoint(this)],
        });
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void | IUIKitResponse> {
        const handler = new ExecuteViewSubmitHandler(
            this,
            context,
            read,
            http,
            persistence,
            modify,
        );

        return await handler.execute();
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<IUIKitResponse> {
        const handler = new ExecuteBlockActionHandler(
            this,
            context,
            read,
            http,
            persistence,
            modify,
        );

        return await handler.execute();
    }
}
