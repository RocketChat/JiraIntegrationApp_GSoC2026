import {
    IRead,
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import { LayoutBlock } from "@rocket.chat/ui-kit";
import { TextTypes } from "../enums/TextTypes";
import { ElementEnum } from "../enums/ElementEnum";
import { sendNotification } from "../helpers/message";
import { getAuthorizationURL } from "../helpers/getAuthorizationURL";

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
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Click 👇 to Login with Jira",
                emoji: true,
            },
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    actionId: ElementEnum.LOGIN_BUTTON_ACTION,
                    appId: app.getID(),
                    blockId: ElementEnum.LOGIN_BUTTON_BLOCK,
                    text: {
                        type: "plain_text",
                        text: "Login with Jira",
                        emoji: true,
                    },
                    style: "primary",
                    url: url
                },
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