import {
    IRead,
    IHttp,
    IPersistence,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IUIKitModalResponse,
    IUIKitResponse,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { JiraApp } from "../../JiraApp";
import { ModalEnum } from "../enums/ModalEnum";
import { ElementEnum } from "../enums/ElementEnum";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { ProjectMap } from "../persistence/projectMap";
import { sendMessage, sendNotification } from "../helpers/message";

export class ExecuteViewSubmitHandler {
    private context: UIKitViewSubmitInteractionContext;

    constructor(
        protected readonly app: JiraApp,
        context: UIKitViewSubmitInteractionContext,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
    ) {
        this.context = context;
    }

    public async execute(): Promise<IUIKitResponse | IUIKitModalResponse> {
        const { view, user } = this.context.getInteractionData();

        const projectMap = new ProjectMap(
            this.persistence,
            this.read.getPersistenceReader(),
        );

        const [viewId, roomId] = view.id.split("|");
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        switch (viewId) {
            case ModalEnum.JIRA_CONNECT_MODAL: {
                const projectKey =
                    view.state &&
                    view.state?.[ElementEnum.JIRA_PROJECT_SELECT_BLOCK]?.[
                        ElementEnum.JIRA_PROJECT_SELECT_ACTION
                    ];

                await projectMap.createLink(projectKey, room.id);

                await sendNotification(
                    this.read,
                    this.modify,
                    user,
                    room,
                    "Project linked successfully",
                );
                break;
            }
            case ModalEnum.JIRA_CREATE_ISSUE_MODAL: {
                const project =
                    view.state &&
                    view.state?.[ElementEnum.JIRA_PROJECT_SELECT_BLOCK]?.[
                        ElementEnum.JIRA_PROJECT_SELECT_ACTION
                    ];
                const issueType =
                    view.state?.[ElementEnum.JIRA_CREATE_ISSUE_TYPE_BLOCK]?.[
                        ElementEnum.JIRA_CREATE_ISSUE_TYPE_ACTION
                    ];
                const summary =
                    view.state?.[ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_BLOCK]?.[
                        ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_ACTION
                    ];
                const description =
                    view.state?.[
                        ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_BLOCK
                    ]?.[ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_ACTION];
                const priority =
                    view.state?.[
                        ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_BLOCK
                    ]?.[ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_ACTION];
                const assigneeId =
                    view.state?.[
                        ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_BLOCK
                    ]?.[ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_ACTION];
                const deadlineStr =
                    view.state?.[
                        ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_BLOCK
                    ]?.[ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_ACTION];

                const assignee = assigneeId
                    ? await this.read.getUserReader().getByUsername(assigneeId)
                    : undefined;
                const deadline = deadlineStr
                    ? new Date(deadlineStr)
                    : undefined;

                try {
                    const created = await this.app
                        .getJiraSDK()
                        .createJiraIssue(this.read, this.persistence, user, {
                            projectKey: project,
                            summary,
                            issueType,
                            description,
                            assignee,
                            priority,
                            deadline,
                        });

                    await sendMessage(
                        this.read,
                        this.modify,
                        room,
                        user,
                        `## 🎫 New Jira Ticket Created!
                        🔑 **Key:** ${created.key}
                        📝 **Summary:** ${summary}
                        📄 **Description:** ${description}
                        👤 **Assignee:** ${assignee ? `@${assignee.username}` : "Unassigned"}
                        📅 **Deadline:** ${deadlineStr ? deadlineStr : "N/A"}
                        🔵 **Status:** Todo
                        🙋 **Raised By:** @${user.username}
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
                        user,
                        room,
                        `Failed to create issue: ${message}`,
                    );
                }

                break;
            }
        }
        return { success: true };
    }
}
