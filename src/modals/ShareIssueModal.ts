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
import { ActionsBlock, InputBlock } from "@rocket.chat/ui-kit";
import { ModalEnum } from "../enums/ModalEnum";
import { ElementEnum } from "../enums/ElementEnum";
import { buildButton } from "../ui-kit/button";
import { buildInputBlock } from "../ui-kit/inputBlock";
import { buildModal } from "../ui-kit/modal";
import {
    multiChannelsSelectElement,
    multiUsersSelectElement,
} from "../ui-kit/elements";

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
            buildButton({
                appId: id,
                text: `Share to ${otherTarget}s instead`,
                value: JSON.stringify({ shareTo, issueKey }),
                blockId: ElementEnum.JIRA_ISSUE_SHARE_TO_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_SHARE_TO_ACTION,
            }),
        ],
    };

    const input: InputBlock =
        shareTo === "channel"
            ? buildInputBlock({
                  appId: id,
                  blockId: ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_BLOCK,
                  actionId: ElementEnum.JIRA_ISSUE_SHARE_CHANNELS_ACTION,
                  label: "Share to Channels",
                  element: multiChannelsSelectElement({
                      placeholder: "Enter Channels to share",
                  }),
              })
            : buildInputBlock({
                  appId: id,
                  blockId: ElementEnum.JIRA_ISSUE_SHARE_USERS_BLOCK,
                  actionId: ElementEnum.JIRA_ISSUE_SHARE_USERS_ACTION,
                  label: "Share to Users",
                  element: multiUsersSelectElement({
                      placeholder: "Enter users to share",
                  }),
              });

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_SHARE_ISSUE_MODAL}|${room?.id}|${issueKey}`,
        title: "Share this Issue",
        blocks: [issueActionsBlock, input],
        submitText: "Share",
        closeText: "Close",
    });
}
