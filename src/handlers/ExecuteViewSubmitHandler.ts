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
import { issueCreatedMessage } from "../helpers/messageTemplates";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";
import { IssueDetailsModal } from "../modals/IssueDetailsModal";

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
        const { view, user, triggerId } = this.context.getInteractionData();

        const projectMap = new ProjectMap(
            this.persistence,
            this.read.getPersistenceReader(),
        );

        const [viewId, roomId, issueKey] = view.id.split("|");
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
                        issueCreatedMessage({
                            key: created.key,
                            summary,
                            description,
                            assigneeUsername: assignee?.username,
                            deadline: deadlineStr,
                            raisedByUsername: user.username,
                            issueURL: created.issueURL,
                        }),
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
            case ModalEnum.JIRA_ISSUE_DETAILS_MODAL: {
                const commentText =
                    view.state?.[
                        ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_BLOCK
                    ]?.[ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_ACTION];

                try {
                    const authPersistence = new AuthPersistence(
                        this.persistence,
                        this.read.getPersistenceReader(),
                    );
                    const token = (await authPersistence.getAccessToken(
                        user,
                    )) as IJiraAuthToken;

                    await this.app
                        .getJiraSDK()
                        .addComment(
                            token,
                            this.read,
                            user,
                            this.persistence,
                            issueKey,
                            commentText,
                        );

                    const updatedModal = await IssueDetailsModal({
                        app: this.app,
                        read: this.read,
                        modify: this.modify,
                        http: this.http,
                        sender: user,
                        room,
                        persis: this.persistence,
                        triggerId,
                        id: this.app.getID(),
                        issueKey,
                    });

                    return this.context
                        .getInteractionResponder()
                        .updateModalViewResponse(updatedModal);
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
                        `Failed to add comment: ${message}`,
                    );
                }

                break;
            }
        }
        return { success: true };
    }
}
