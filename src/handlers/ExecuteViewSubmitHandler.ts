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
import {
    getDirect,
    sendDM,
    sendMessage,
    sendNotification,
} from "../helpers/message";
import {
    issueCreatedMessage,
    issueSharedMessage,
    issueCreatedAttachment,
    issueQuickActionsBlock,
} from "../helpers/messageTemplates";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";
import { IssueDetailsModal } from "../modals/IssueDetailsModal";
import { getCloudURL } from "../helpers/getSettings";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

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

                    const createdMessageText = issueCreatedMessage({
                        key: created.key,
                        summary,
                        description,
                        assigneeUsername: assignee?.username,
                        deadline: deadlineStr,
                        raisedByUsername: user.username,
                        issueURL: created.issueURL,
                    });

                    await sendMessage(
                        this.read,
                        this.modify,
                        room,
                        user,
                        createdMessageText,
                        issueQuickActionsBlock({
                            appId: this.app.getID(),
                            issueKey: created.key,
                            hasAssignee: !!assignee,
                            hasDeadline: !!deadline,
                        }),
                        [
                            issueCreatedAttachment({
                                key: created.key,
                                summary,
                                description,
                                issueType,
                                priority,
                                assigneeUsername: assignee?.username,
                                issueURL: created.issueURL,
                            }),
                        ],
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
            case ModalEnum.JIRA_SHARE_ISSUE_MODAL: {
                const channelIds: string[] | undefined =
                    view.state?.[ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_BLOCK]?.[
                        ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_ACTION
                    ];
                const usernames: string[] | undefined =
                    view.state?.[ElementEnum.JIRA_ISSUE_SHARE_USERS_BLOCK]?.[
                        ElementEnum.JIRA_ISSUE_SHARE_USERS_ACTION
                    ];

                try {
                    const authPersistence = new AuthPersistence(
                        this.persistence,
                        this.read.getPersistenceReader(),
                    );
                    const token = (await authPersistence.getAccessToken(
                        user,
                    )) as IJiraAuthToken;

                    const issue = await this.app
                        .getJiraSDK()
                        .getJiraIssue(
                            token,
                            this.read,
                            user,
                            this.persistence,
                            issueKey,
                        );

                    const siteURL = await getCloudURL(this.read);
                    const issueURL = `${siteURL}/browse/${issueKey}`;
                    const appUser = (await this.read
                        .getUserReader()
                        .getAppUser()) as IUser;

                    let sharedCount = 0;

                    if (channelIds?.length) {
                        for (const channelId of channelIds) {
                            const targetRoom = await this.read
                                .getRoomReader()
                                .getById(channelId);

                            if (!targetRoom) continue;

                            await sendMessage(
                                this.read,
                                this.modify,
                                targetRoom,
                                user,
                                issueSharedMessage({
                                    sharedByName: user.username,
                                    issueKey,
                                    summary: issue.summary,
                                    issueType: issue.issueType,
                                    description: issue.description,
                                    priority: issue.priority,
                                    deadline: issue.deadline,
                                    issueURL,
                                    isDirect: false,
                                }),
                            );
                        }
                    }

                    if (usernames?.length) {
                        for (const username of usernames) {
                            const targetUser = await this.read
                                .getUserReader()
                                .getByUsername(username);

                            if (!targetUser) continue;

                            const dmRoom = await getDirect(
                                this.read,
                                this.modify,
                                appUser,
                                targetUser.username,
                            );

                            if (!dmRoom) continue;

                            await sendMessage(
                                this.read,
                                this.modify,
                                dmRoom,
                                user,
                                issueSharedMessage({
                                    sharedByName: user.username,
                                    issueKey,
                                    summary: issue.summary,
                                    issueType: issue.issueType,
                                    description: issue.description,
                                    priority: issue.priority,
                                    deadline: issue.deadline,
                                    issueURL,
                                    isDirect: true,
                                }),
                            );
                            sharedCount++;
                        }
                    }

                    if (sharedCount === 0) {
                        await sendNotification(
                            this.read,
                            this.modify,
                            user,
                            room,
                            "Please select at least one channel or user to share this issue with.",
                        );
                    }
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
                        `Failed to share issue: ${message}`,
                    );
                }

                break;
            }
            case ModalEnum.JIRA_ASSIGN_ISSUE_MODAL: {
                const username =
                    view.state?.[ElementEnum.JIRA_ASSIGN_ISSUE_USER_BLOCK]?.[
                        ElementEnum.JIRA_ASSIGN_ISSUE_USER_ACTION
                    ];

                if (!username) {
                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        "Please select a user to assign this issue to.",
                    );
                    break;
                }

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
                        .assignIssue(this.read, this.persistence, user, token, {
                            issueKey,
                            username,
                        });

                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `Issue **${issueKey}** has been assigned to @${username}.`,
                    );

                    const assignee = await this.read
                        .getUserReader()
                        .getByUsername(username);

                    if (assignee) {
                        await sendDM(
                            this.read,
                            this.modify,
                            assignee,
                            `You have been assigned to Jira issue **${issueKey}** by @${user.username}.`,
                        );
                    }
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
                        `Failed to assign issue: ${message}`,
                    );
                }

                break;
            }
            case ModalEnum.JIRA_SET_DEADLINE_MODAL: {
                const dateStr =
                    view.state?.[ElementEnum.JIRA_SET_DEADLINE_DATE_BLOCK]?.[
                        ElementEnum.JIRA_SET_DEADLINE_DATE_ACTION
                    ];

                if (!dateStr) {
                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        "Please select a deadline date.",
                    );
                    break;
                }

                try {
                    const authPersistence = new AuthPersistence(
                        this.persistence,
                        this.read.getPersistenceReader(),
                    );
                    const token = (await authPersistence.getAccessToken(
                        user,
                    )) as IJiraAuthToken;

                    const deadline = new Date(dateStr);

                    await this.app
                        .getJiraSDK()
                        .setIssueDeadline(
                            this.read,
                            this.persistence,
                            user,
                            token,
                            { issueKey, deadline },
                        );

                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `Deadline for issue **${issueKey}** has been set to ${deadline.toDateString()}.`,
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
                        `Failed to set deadline: ${message}`,
                    );
                }

                break;
            }
        }
        return { success: true };
    }
}
