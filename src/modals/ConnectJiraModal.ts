import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { JiraApp } from "../../JiraApp";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";
import { UIKitSurfaceType } from "@rocket.chat/apps-engine/definition/uikit";
import { ElementEnum } from "../enums/ElementEnum";
import { TextTypes } from "../enums/TextTypes";
import { ModalEnum } from "../enums/ModalEnum";
import { InputBlock } from "@rocket.chat/ui-kit";

export async function ConnectJiraProject({
    app,
    read,
    modify,
    http,
    sender,
    room,
    persis,
    triggerId,
    id,
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
}): Promise<IUIKitSurfaceViewParam> {
    const authPersistence = new AuthPersistence(
        persis,
        read.getPersistenceReader(),
    );

    const token = await authPersistence.getAccessToken(sender);

    const projects = await app
        .getJiraSDK()
        .getJiraProjects(token as IJiraAuthToken, read, sender, persis);

    const projectDropdown: InputBlock = {
        type: "input",
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Select Jira Project",
        },
        element: {
            type: "static_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Choose a project...",
            },
            options: projects.map((project) => ({
                text: {
                    type: TextTypes.PLAIN_TEXT,
                    text: `${project.key} - ${project.name}`,
                },
                value: project.key,
            })),
            appId: id,
            blockId: ElementEnum.JIRA_PROJECT_SELECT_BLOCK,
            actionId: ElementEnum.JIRA_PROJECT_SELECT_ACTION,
        },
    };

    return {
        type: UIKitSurfaceType.MODAL,
        id: ModalEnum.JIRA_CONNECT_MODAL + "|" + room?.id,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: `Connect #${room?.slugifiedName} with Jira Project`,
        },
        blocks: [projectDropdown],
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Connect",
            },
            blockId: ElementEnum.JIRA_CONNECT_BLOCK,
            actionId: ElementEnum.JIRA_CONNECT_ACTION,
            appId: id,
        },
        clearOnClose: true,
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
