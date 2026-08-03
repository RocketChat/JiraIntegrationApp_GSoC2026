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
import { ModalEnum } from "../enums/ModalEnum";
import { ElementEnum } from "../enums/ElementEnum";
import { buildInputBlock } from "../ui-kit/inputBlock";
import { buildModal } from "../ui-kit/modal";
import { datePickerElement } from "../ui-kit/elements";

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
    const deadlineInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_SET_DEADLINE_DATE_BLOCK,
        actionId: ElementEnum.JIRA_SET_DEADLINE_DATE_ACTION,
        label: "Deadline",
        element: datePickerElement({ placeholder: "mm/dd/yyyy" }),
    });

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_SET_DEADLINE_MODAL}|${room?.id}|${issueKey}`,
        title: `Set Deadline for ${issueKey}`,
        blocks: [deadlineInput],
        submitText: "Set Deadline",
    });
}
