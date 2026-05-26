import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { JiraApp } from "../../JiraApp";
import {
    ICommandUtility,
    ICommandUtilityParams,
} from "../interfaces/ICommandUtility";
import { Handler } from "../handlers/Handler";
import { sendNotification } from "../helpers/message";

export class CommandUtility implements ICommandUtility {
    app: JiraApp;
    params: string[];
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string | undefined;
    threadId?: string | undefined;

    constructor(props: ICommandUtilityParams) {
        this.app = props.app;
        this.params = props.params;
        this.sender = props.sender;
        this.room = props.room;
        this.read = props.read;
        this.persis = props.persis;
        this.modify = props.modify;
        this.http = props.http;
        this.triggerId = props.triggerId;
        this.threadId = props.threadId;
    }

    public async resolveCommand(): Promise<void> {
        const [commandRaw, ...args] = this.params;
        const command = commandRaw?.toLowerCase();
        const handler = new Handler(
            this.app,
            this.read,
            this.http,
            this.persis,
            this.modify,
            this.sender,
            this.room,
            this.triggerId || "",
        );

        const commandMap: Record<string, (args: string[]) => Promise<void>> = {
            help: () => handler.showHelp(),
            login: () => handler.login(),
            create: (args) => handler.create(args),
            my: () => handler.myIssues(),
            search: (args) => handler.search(args),
            assign: (args) => handler.assign(args),
            share: (args) => handler.share(args),
            set: (args) => handler.setCommands(args),
            subscribe: (args) => handler.subscribe(args),
            cancel: () => handler.cancel(),
        };

        if (!command || command === 'help') {
            await handler.showHelp();
            return;
        }

        const commandHandler = commandMap[command];
        if (!commandHandler) {
            await handler.showHelp();
            return;
        }

        await commandHandler(args);
    }
}