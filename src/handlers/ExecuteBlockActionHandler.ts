import {
    IRead,
    IHttp,
    IPersistence,
    IModify,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IUIKitModalResponse,
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { JiraApp } from "../../JiraApp";
import { ElementEnum } from "../enums/ElementEnum";
import { sendMessage, sendNotification } from "../helpers/message";
import { issueSharedMessage } from "../helpers/messageTemplates";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";
import { getCloudURL } from "../helpers/getSettings";
import { IssueDetailsModal } from "../modals/IssueDetailsModal";
import { ShareIssueModal } from "../modals/ShareIssueModal";

export class ExecuteBlockActionHandler {
    private context: UIKitBlockInteractionContext;

    constructor(
        protected readonly app: JiraApp,
        context: UIKitBlockInteractionContext,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
    ) {
        this.context = context;
    }

    public async execute(): Promise<IUIKitResponse | IUIKitModalResponse> {
        const { actionId, user, value, container, triggerId } =
            this.context.getInteractionData();

        const [, roomIdFromView, issueKeyFromView] = container.id.split("|");

        const room =
            this.context.getInteractionData().room ??
            ((await this.read.getRoomReader().getById(roomIdFromView)) as
                | IRoom
                | undefined);

        switch (actionId) {
            case ElementEnum.JIRA_ISSUE_LIST_VIEW_DETAILS_ACTION: {
                const issueKey = value;

                if (!issueKey || !room) {
                    break;
                }

                try {
                    const modal = await IssueDetailsModal({
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

                    await this.modify
                        .getUiController()
                        .openSurfaceView(modal, { triggerId }, user);
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
                        `Failed to load issue details: ${message}`,
                    );
                }

                break;
            }
            case ElementEnum.JIRA_ISSUE_DETAILS_LOAD_MORE_COMMENTS_ACTION: {
                const issueKey = issueKeyFromView;
                const commentsLimit = Number(value) || 3;

                if (!issueKey || !room) {
                    break;
                }

                try {
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
                        commentsLimit,
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
                        `Failed to load more comments: ${message}`,
                    );
                }

                break;
            }
            case ElementEnum.JIRA_ISSUE_DETAILS_SHARE_ACTION: {
                const issueKey = value;

                if (!issueKey || !room) {
                    break;
                }

                try {
                    const modal = await ShareIssueModal({
                        app: this.app,
                        read: this.read,
                        modify: this.modify,
                        http: this.http,
                        sender: user,
                        room,
                        persis: this.persistence,
                        triggerId,
                        id: this.app.getID(),
                        shareTo: "user",
                        issueKey,
                    });

                    await this.modify
                        .getUiController()
                        .openSurfaceView(modal, { triggerId }, user);
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
                        `Failed to load issue details: ${message}`,
                    );
                }

                break;
            }

            case ElementEnum.JIRA_ISSUE_SHARE_TO_ACTION: {
                try {
                    const { issueKey, shareTo } = JSON.parse(value as string);
                    const otherTarget = shareTo === "user" ? "channel" : "user";
                    let modal = await ShareIssueModal({
                        app: this.app,
                        read: this.read,
                        modify: this.modify,
                        http: this.http,
                        sender: user,
                        room,
                        persis: this.persistence,
                        triggerId,
                        id: this.app.getID(),
                        shareTo: otherTarget,
                        issueKey,
                    });

                    await this.modify
                        .getUiController()
                        .updateSurfaceView(
                            modal,
                            { triggerId: triggerId },
                            user,
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
                        room as IRoom,
                        `Failed to load issue details: ${message}`,
                    );
                }
                break;
            }
        }
        return { success: true };
    }
}
