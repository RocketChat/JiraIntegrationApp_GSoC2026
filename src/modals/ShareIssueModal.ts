import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import {
    ActionsBlock,
    InputBlock,
    LayoutBlock,
    SectionBlock,
} from "@rocket.chat/ui-kit";
import { UIKitSurfaceType } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalEnum } from "../enums/ModalEnum";
import { TextTypes } from "../enums/TextTypes";
import { ElementEnum } from "../enums/ElementEnum";

export async function ShareIssueModal({
    app,
    read,
    modify: _modify,
    http: _http,
    sender,
    room,
    persis,
    triggerId: _triggerId,
    id,
    shareTo,
    issueKey,
}: {
    app: JiraApp;
    read: IRead;
    modify: IModify;
    http: IHttp;
    sender: IUser;
    room: IRoom | undefined;
    persis: IPersistence;
    triggerId: string | undefined;
    id: string;
    shareTo: "channel" | "user";
    issueKey: string;
}): Promise<IUIKitSurfaceViewParam> {
    const otherTarget = shareTo === "user" ? "channel" : "user";

    const issueActionsBlock: ActionsBlock = {
        type: "actions",
        blockId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_BLOCK,
        elements: [
            {
                type: "button",
                text: {
                    type: TextTypes.PLAIN_TEXT,
                    text: `Share to ${otherTarget}s instead`,
                },
                appId: id,
                value: JSON.stringify({ shareTo, issueKey }),
                blockId: ElementEnum.JIRA_ISSUE_SHARE_TO_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_SHARE_TO_ACTION,
            },
        ],
    };

    let input: InputBlock;
    if (shareTo === "channel") {
        input = {
            type: "input",
            label: {
                type: TextTypes.PLAIN_TEXT,
                text: "Share to Channels",
            },
            blockId: ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_BLOCK,
            element: {
                type: "multi_channels_select",
                placeholder: {
                    type: TextTypes.PLAIN_TEXT,
                    text: "Enter Channels to share",
                },
                appId: id,
                blockId: ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_ACTION,
            },
        };
    } else {
        input = {
            type: "input",
            label: {
                type: TextTypes.PLAIN_TEXT,
                text: "Share to Users",
            },
            blockId: ElementEnum.JIRA_ISSUE_SHARE_USERS_BLOCK,
            element: {
                type: "multi_users_select",
                placeholder: {
                    type: TextTypes.PLAIN_TEXT,
                    text: "Enter users to share",
                },
                appId: id,
                blockId: ElementEnum.JIRA_ISSUE_SHARE_USERS_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_SHARE_USERS_ACTION,
            },
        };
    }

    return {
        type: UIKitSurfaceType.MODAL,
        id: `${ModalEnum.JIRA_SHARE_ISSUE_MODAL}|${room?.id}|${issueKey}`,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: `Share this Issue`,
        },
        blocks: [issueActionsBlock, input],
        clearOnClose: true,
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Share",
            },
            blockId: "",
            actionId: "",
            appId: id,
        },
        close: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Close",
            },
            blockId: "",
            actionId: "",
            appId: id,
        },
    };
}
