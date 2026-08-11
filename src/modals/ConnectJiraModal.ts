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
import { ElementEnum } from "../enums/ElementEnum";
import { ModalEnum } from "../enums/ModalEnum";
import { buildInputBlock } from "../ui-kit/inputBlock";
import { buildModal } from "../ui-kit/modal";
import { buildOptions } from "../ui-kit/options";
import { staticSelectElement } from "../ui-kit/elements";

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

    const projectDropdown = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_PROJECT_SELECT_BLOCK,
        actionId: ElementEnum.JIRA_PROJECT_SELECT_ACTION,
        label: "Select Jira Project",
        element: staticSelectElement({
            placeholder: "Choose a project...",
            options: buildOptions(
                projects.map((project) => ({
                    text: `${project.key} - ${project.name}`,
                    value: project.key,
                })),
            ),
        }),
    });

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_CONNECT_MODAL}|${room?.id}`,
        title: `Connect #${room?.slugifiedName} with Jira Project`,
        blocks: [projectDropdown],
        submitText: "Connect",
        submitBlockId: ElementEnum.JIRA_CONNECT_BLOCK,
        submitActionId: ElementEnum.JIRA_CONNECT_ACTION,
    });
}
