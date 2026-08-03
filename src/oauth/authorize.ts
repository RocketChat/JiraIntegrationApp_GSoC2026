import {
    IRead,
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import { LayoutBlock } from "@rocket.chat/ui-kit";
import { ElementEnum } from "../enums/ElementEnum";
import { sendNotification } from "../helpers/message";
import { getAuthorizationURL } from "../helpers/getAuthorizationURL";
import { buildButton } from "../ui-kit/button";
import { plainText } from "../ui-kit/text";

export async function authorize(
    app: JiraApp,
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    persistence: IPersistence,
) {

    const url = await getAuthorizationURL(app, read, user);
    const blocks: LayoutBlock[] = [
        {
            type: "section",
            text: plainText("Click 👇 to Login with Jira"),
        },
        {
            type: "actions",
            elements: [
                buildButton({
                    appId: app.getID(),
                    text: "Login with Jira",
                    blockId: ElementEnum.LOGIN_BUTTON_BLOCK,
                    actionId: ElementEnum.LOGIN_BUTTON_ACTION,
                    url,
                    style: "primary",
                }),
            ],
        },
    ];
    await sendNotification(
        read,
        modify,
        user,
        room,
        "Login with Jira",
        blocks,
    );
}