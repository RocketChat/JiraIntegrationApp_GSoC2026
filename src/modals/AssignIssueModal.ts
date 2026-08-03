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
import { usersSelectElement } from "../ui-kit/elements";

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
    const assigneeInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_ASSIGN_ISSUE_USER_BLOCK,
        actionId: ElementEnum.JIRA_ASSIGN_ISSUE_USER_ACTION,
        label: "Assignee",
        element: usersSelectElement({ placeholder: "Select a user" }),
    });

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_ASSIGN_ISSUE_MODAL}|${room?.id}|${issueKey}`,
        title: `Assign ${issueKey}`,
        blocks: [assigneeInput],
        submitText: "Assign",
    });
}
