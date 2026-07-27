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
import { InputBlock } from "@rocket.chat/ui-kit";
import { UIKitSurfaceType } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalEnum } from "../enums/ModalEnum";
import { TextTypes } from "../enums/TextTypes";
import { ElementEnum } from "../enums/ElementEnum";

export async function AssignIssueModal({
    app,
    read: _read,
    modify: _modify,
    http: _http,
    sender: _sender,
    room,
    persis: _persis,
    triggerId: _triggerId,
    id,
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
    issueKey: string;
}): Promise<IUIKitSurfaceViewParam> {
    const assigneeInput: InputBlock = {
        type: "input",
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Assignee",
        },
        blockId: ElementEnum.JIRA_ASSIGN_ISSUE_USER_BLOCK,
        element: {
            type: "users_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Select a user",
            },
            appId: id,
            blockId: ElementEnum.JIRA_ASSIGN_ISSUE_USER_BLOCK,
            actionId: ElementEnum.JIRA_ASSIGN_ISSUE_USER_ACTION,
        },
    };

    return {
        type: UIKitSurfaceType.MODAL,
        id: `${ModalEnum.JIRA_ASSIGN_ISSUE_MODAL}|${room?.id}|${issueKey}`,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: `Assign ${issueKey}`,
        },
        blocks: [assigneeInput],
        clearOnClose: true,
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Assign",
            },
            blockId: "",
            actionId: "",
            appId: id,
        },
        close: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Cancel",
            },
            blockId: "",
            actionId: "",
            appId: id,
        },
    };
}
