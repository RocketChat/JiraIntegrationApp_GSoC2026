import {
    IRead,
    IHttp,
    IPersistence,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import { sendNotification } from "../helpers/message";
import { authorize } from "../oauth/authorize";

export class Handler {
    constructor(
        protected readonly app: JiraApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        protected readonly sender: IUser,
        protected readonly room: IRoom,
        protected readonly triggerId: string,
    ) {}

    async showHelp(): Promise<void> {

        console.log("Help message executed")
        const helpMessage = `## Jira App
**Welcome to the Jira App! Here's a list of available commands:**
\`/jira help\` - Show this help message
\`/jira login\` -  Authenticate with Jira
\`/jira create [issue-type] [project-key] [summary]\` -  Create a new Jira issu
\`/jira my\` -  View your assigned issues 
\`/jira search [query]\` -  Search for Jira issues 
\`/jira assign [issue-key] [username]\` - Assign an issue to a user 
\`/jira share [issue-key]\` - Share an issue in the channel 
\`/jira set [project-key]\` - Set default project for the channel 
\`/jira subscribe\` - Subscribe to Jira notifications 
`;

        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            helpMessage,
            [],
        );
    }

    async login(): Promise<void> {
        await authorize(this.app, this.read, this.modify, this.sender, this.room, this.persistence)
    }

    async create(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for create");
    }
    async myIssues(): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for my issues");
    }
    async search(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for search");
    }
    async assign(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for assign");
    }
    async share(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for share");
    }
    async setCommands(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for setCommands");
    }
    async subscribe(args: string[]): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for subscribe");
    }
    async cancel(): Promise<void> {
        await sendNotification(this.read, this.modify, this.sender, this.room, "Handler for cancel");
    }
}
