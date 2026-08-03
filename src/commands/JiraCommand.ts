import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    ISlashCommandPreview,
    ISlashCommandPreviewItem,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { JiraApp } from "../../JiraApp";
import { ICommandUtilityParams } from "../interfaces/ICommandUtility";
import { CommandUtility } from "./CommandUtility";

export class JiraCommand implements ISlashCommand {
    constructor(private readonly app: JiraApp) {}
    command: string = "jira";
    i18nParamsExample: string = "";
    i18nDescription: string = "";
    providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        const params = context.getArguments();
        const room = context.getRoom();
        const sender = context.getSender();
        const triggerId = context.getTriggerId();
        const threadId = context.getThreadId();

        const commandUtilityParams: ICommandUtilityParams = {
            params,
            sender,
            room,
            triggerId,
            threadId,
            read,
            modify,
            http,
            persis,
            app: this.app,
        };

        const commandUtility = new CommandUtility(commandUtilityParams);
        await commandUtility.resolveCommand();
    }
}
