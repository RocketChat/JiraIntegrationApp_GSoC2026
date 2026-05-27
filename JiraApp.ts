import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IHttp,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { settings } from "./src/settings/settings";
import { JiraCommand } from "./src/commands/JiraCommand";
import { JiraSDK } from "./src/core/JiraSDK";
import { CallbackEndpoint } from "./src/api/callback";
import { ApiVisibility, ApiSecurity } from "@rocket.chat/apps-engine/definition/api";

export class JiraApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public getJiraSDK(): JiraSDK {
        return new JiraSDK(this);
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
}
