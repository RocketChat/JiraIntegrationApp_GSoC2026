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
import { ModalEnum } from "../enums/ModalEnum";
import { ProjectMap } from "../persistence/projectMap";
import { LayoutBlock, SectionBlock } from "@rocket.chat/ui-kit";
import { ElementEnum } from "../enums/ElementEnum";
import { buildButton } from "../ui-kit/button";
import { buildModal } from "../ui-kit/modal";
import { markdown } from "../ui-kit/text";

export async function IssueListModal({
    app,
    read,
    modify: _modify,
    http: _http,
    sender,
    room,
    persis,
    triggerId: _triggerId,
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
    const token = (await authPersistence.getAccessToken(
        sender,
    )) as IJiraAuthToken;

    const projectMap = new ProjectMap(persis, read.getPersistenceReader());
    const project = room
        ? await projectMap.getProjectByRoom(room.id)
        : undefined;

    if (!project) {
        throw new Error(
            "This channel is not linked to any jira project. Please run `/jira connect` to connect this channel with a project, or specify an issue key: `/jira issues [issue-key]`.",
        );
    }

    const issues = await app.getJiraSDK().searchIssues(
        token,
        read,
        sender,
        persis,
        `project = ${project.projectKey} ORDER BY updated DESC`, // JQL Query - Jira Query Language
    );

    const blocks: LayoutBlock[] = issues.length
        ? buildIssueListBlocks(issues, id)
        : [
              {
                  type: "section",
                  text: markdown(
                      `No issues found for project *${project.projectKey}*.`,
                  ),
              },
          ];

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_ISSUE_LIST_MODAL}|${room?.id}`,
        title: `Issues in ${project.projectKey}`,
        blocks,
        closeText: "Close",
    });
}

function buildIssueListBlocks(
    issues: Array<{
        key: string;
        summary: string;
        status?: string;
        priority?: string;
    }>,
    appId: string,
): LayoutBlock[] {
    return issues.map((issue, index) => {
        const section: SectionBlock = {
            type: "section",
            text: markdown(
                `*${issue.key}* - ${issue.summary}\nStatus: ${issue.status || "N/A"} | Priority: ${issue.priority || "N/A"}`,
            ),
            accessory: buildButton({
                appId,
                text: "View Details",
                value: issue.key,
                blockId: `${ElementEnum.JIRA_ISSUE_LIST_VIEW_DETAILS_BLOCK}-${index}`,
                actionId: ElementEnum.JIRA_ISSUE_LIST_VIEW_DETAILS_ACTION,
            }),
        };

        return section;
    });
}
