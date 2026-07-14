import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function sendNotification(
    read: IRead,
    modify: IModify,
    sender: IUser,
    room: IRoom,
    message: any,
    blocks?: LayoutBlock[],
) {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }

    return read.getNotifier().notifyUser(sender, msg.getMessage());
}

export async function sendMessage(
    read: IRead,
    modify: IModify,
    room: IRoom,
    sender?: IUser,
    message?: any,
    blocks?: LayoutBlock[],
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }

    await modify.getCreator().finish(msg);
}

export async function getDirect(read: IRead, modify: IModify, appUser: IUser, username: string): Promise <IRoom | undefined > {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        console.log(error);
        return;
    }

    if (room) {
        return room;
    } else {
        let roomId: string;

        const newRoom = modify.getCreator().startRoom()
        .setType(RoomType.DIRECT_MESSAGE)
        .setCreator(appUser)
        .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);
        return await read.getRoomReader().getById(roomId);
    }
}

export async function sendDM(
    read: IRead,
    modify: IModify,
    sender: IUser,
    message: string,
) {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const room = await getDirect(read, modify, appUser, sender.username) as IRoom;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    await modify.getCreator().finish(msg);
}

export async function sendDMNotification(
    read: IRead,
    modify: IModify,
    sender: IUser,
    message: string,
) {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    let room = await getDirect(read, modify, appUser, sender.username) as IRoom;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    await read.getNotifier().notifyUser(sender, msg.getMessage());
}

export async function sendDMOnInstall(
    read: IRead,
    modify: IModify,
    user: IUser,
) {
        const message = `
Hello **${user.name}!** Thank you for installing the **Jira Rocket.Chat App**.

To get started, configure the app in **Administration > Workspace > Apps > Jira**:

• Create an Atlassian OAuth 2.0 (3LO) app and add this app's callback URL as an authorized redirect URL.
• Enter the **Jira OAuth Client ID**, **Jira OAuth Client Secret**, and your **Jira Cloud URL** in the app settings.

Once configured, users can authenticate with \`/jira login\` and explore the available features with \`/jira help\`.

The app can create, search, assign, and share Jira issues, connect channels to Jira projects

Happy collaborating with \`Jira\` and \`Rocket.Chat\` :rocket:
        `;
        await sendDM(read, modify, user, message);
}
