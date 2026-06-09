import {
    IRead,
    IHttp,
    IPersistence,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import { sendMessage, sendNotification } from "../helpers/message";
import { authorize } from "../oauth/authorize";
import { JiraSDK } from "../core/JiraSDK";
import { AuthPersistence } from "../persistence/authPersistence";
import { ConnectJiraProject } from "../modals/ConnectJiraModal";
import { ProjectMap } from "../persistence/projectMap";
import { IJiraProjectMap } from "../interfaces/IJiraProject";
import { CreateIssueModal } from "../modals/CreateIssueModal";

export class Handler {
    private sdk: JiraSDK;
    constructor(
        protected readonly app: JiraApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        protected readonly sender: IUser,
        protected readonly room: IRoom,
        protected readonly triggerId: string,
    ) {
        this.sdk = app.getJiraSDK();
    }

    async showHelp(): Promise<void> {
        console.log("Help message executed");
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
        await authorize(
            this.app,
            this.read,
            this.modify,
            this.sender,
            this.room,
            this.persistence,
        );
    }

    async create(args: string[]): Promise<void> {
        const authPersistence = new AuthPersistence(
            this.persistence,
            this.read.getPersistenceReader(),
        );

        const projectMap = new ProjectMap(
            this.persistence,
            this.read.getPersistenceReader(),
        );
        const token = await authPersistence.getAccessToken(this.sender);

        const project = await projectMap.getProjectByRoom(this.room.id);
        if (!token) {
            await sendNotification(
                this.read,
                this.modify,
                this.sender,
                this.room,
                "You are not authenticated with Jira. Please run `/jira login` first.",
            );
            return;
        }
        if (args.length < 2) {
            const modal = await CreateIssueModal({
                app: this.app,
                modify: this.modify,
                http: this.http,
                sender: this.sender,
                room: this.room,
                persis: this.persistence,
                triggerId: this.triggerId,
                id: this.app.getID(),
                read: this.read,
            });

            await this.modify
                .getUiController()
                .openSurfaceView(
                    modal,
                    { triggerId: this.triggerId },
                    this.sender,
                );
        } else {
            const issueType = args[0];
            const summary = args.slice(1).join(" ");

            if (!project) {
                await sendNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room,
                    "This channel is not linked to any jira project. Please run `/jira connect` to connect this channel with a project",
                );
                return;
            }
            try {
                const created = await this.sdk.createJiraIssue(
                    this.read,
                    this.persistence,
                    this.sender,
                    { projectKey: project.projectKey, summary, issueType },
                );

                await sendMessage(
                    this.read,
                    this.modify,
                    this.room,
                    this.sender,
                    `## 🎫 New Jira Ticket Created!
                🔑 **Key:** ${created.key}
                📝 **Summary:** ${summary}
                📄 **Description:** N/A
                👤 **Assignee:** Unassigned
                📅 **Deadline:** N/A
                🔵 **Status:** Todo
                🙋 **Raised By:** @${this.sender.username}
                🔗 **Link:** ${created.issueURL}
                `,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.";
                await sendNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room,
                    `Failed to create issue: ${message}`,
                );
            }
        }
    }

    async connect(): Promise<void> {
        const modal = await ConnectJiraProject({
            app: this.app,
            read: this.read,
            modify: this.modify,
            http: this.http,
            sender: this.sender,
            room: this.room,
            persis: this.persistence,
            triggerId: this.triggerId,
            id: this.app.getID(),
        });

        await this.modify
            .getUiController()
            .openSurfaceView(modal, { triggerId: this.triggerId }, this.sender);
    }

    async connect(): Promise<void> {
        const modal = await ConnectJiraProject({
            app: this.app,
            read: this.read,
            modify: this.modify,
            http: this.http,
            sender: this.sender,
            room: this.room,
            persis: this.persistence,
            triggerId: this.triggerId,
            id: this.app.getID()
        });

        await this.modify.getUiController().openSurfaceView(modal, { triggerId: this.triggerId }, this.sender);
    }
    async myIssues(): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for my issues",
        );
    }
    async search(args: string[]): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for search",
        );
    }
    async assign(args: string[]): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for assign",
        );
    }
    async share(args: string[]): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for share",
        );
    }
    async setCommands(args: string[]): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for setCommands",
        );
    }
    async subscribe(args: string[]): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for subscribe",
        );
    }
    async cancel(): Promise<void> {
        await sendNotification(
            this.read,
            this.modify,
            this.sender,
            this.room,
            "Handler for cancel",
        );
    }
}
