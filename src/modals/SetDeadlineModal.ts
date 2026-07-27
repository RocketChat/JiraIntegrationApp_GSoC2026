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

export async function SetDeadlineModal({
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
    const deadlineInput: InputBlock = {
        type: "input",
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Deadline",
        },
        blockId: ElementEnum.JIRA_SET_DEADLINE_DATE_BLOCK,
        element: {
            type: "datepicker",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "mm/dd/yyyy",
            },
            appId: id,
            blockId: ElementEnum.JIRA_SET_DEADLINE_DATE_BLOCK,
            actionId: ElementEnum.JIRA_SET_DEADLINE_DATE_ACTION,
        },
    };

    return {
        type: UIKitSurfaceType.MODAL,
        id: `${ModalEnum.JIRA_SET_DEADLINE_MODAL}|${room?.id}|${issueKey}`,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: `Set Deadline for ${issueKey}`,
        },
        blocks: [deadlineInput],
        clearOnClose: true,
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Set Deadline",
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
