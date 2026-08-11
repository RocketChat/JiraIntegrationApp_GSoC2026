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
import { ProjectMap } from "../persistence/projectMap";
import { buildInputBlock } from "../ui-kit/inputBlock";
import { buildModal } from "../ui-kit/modal";
import { buildOption, buildOptions } from "../ui-kit/options";
import {
    datePickerElement,
    plainTextInputElement,
    staticSelectElement,
    usersSelectElement,
} from "../ui-kit/elements";

const ISSUE_TYPE_OPTIONS = buildOptions(
    ["Task", "Bug", "Story", "Epic"].map((value) => ({ text: value, value })),
);

const PRIORITY_OPTIONS = buildOptions(
    ["Highest", "High", "Medium", "Low", "Lowest"].map((value) => ({
        text: value,
        value,
    })),
);

export async function CreateIssueModal({
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
    const token = await authPersistence.getAccessToken(sender);

    const projects = await app
        .getJiraSDK()
        .getJiraProjects(token as IJiraAuthToken, read, sender, persis);

    const projectMap = new ProjectMap(persis, read.getPersistenceReader());
    const linkedProject = room
        ? await projectMap.getProjectByRoom(room.id)
        : undefined;

    const linkedProjectData = linkedProject
        ? projects.find((p) => p.key === linkedProject.projectKey)
        : undefined;

    const projectDropdown = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_PROJECT_SELECT_BLOCK,
        actionId: ElementEnum.JIRA_PROJECT_SELECT_ACTION,
        label: "Project",
        element: staticSelectElement({
            placeholder: "Select Project",
            options: buildOptions(
                projects.map((project) => ({
                    text: `${project.key} - ${project.name}`,
                    value: project.key,
                })),
            ),
            initialOption: linkedProjectData
                ? buildOption(
                      `${linkedProjectData.key} - ${linkedProjectData.name}`,
                      linkedProjectData.key,
                  )
                : undefined,
        }),
    });

    const issueTypeDropdown = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_TYPE_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_TYPE_ACTION,
        label: "Issue Type",
        element: staticSelectElement({
            placeholder: "Select issue type",
            options: ISSUE_TYPE_OPTIONS,
            initialOption: buildOption("Task", "Task"),
        }),
    });

    const summaryInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_ACTION,
        label: "Summary",
        element: plainTextInputElement({
            placeholder: "Enter issue summary",
        }),
    });

    const descriptionInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_ACTION,
        label: "Description",
        optional: true,
        element: plainTextInputElement({
            placeholder: "Enter issue description",
            multiline: true,
        }),
    });

    const priorityDropdown = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_ACTION,
        label: "Priority",
        element: staticSelectElement({
            placeholder: "Select priority",
            options: PRIORITY_OPTIONS,
        }),
    });

    const assigneeInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_ACTION,
        label: "Assignee (optional)",
        optional: true,
        element: usersSelectElement({
            placeholder: "Enter assignee email or leave blank",
        }),
    });

    const deadlineInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_BLOCK,
        actionId: ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_ACTION,
        label: "Deadline (optional)",
        optional: true,
        element: datePickerElement({ placeholder: "mm/dd/yyyy" }),
    });

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_CREATE_ISSUE_MODAL}|${room?.id}`,
        title: "Create Jira Issue",
        blocks: [
            projectDropdown,
            issueTypeDropdown,
            summaryInput,
            descriptionInput,
            priorityDropdown,
            assigneeInput,
            deadlineInput,
        ],
        submitText: "Create",
        submitBlockId: ElementEnum.JIRA_CREATE_ISSUE_SUBMIT_BLOCK,
        submitActionId: ElementEnum.JIRA_CREATE_ISSUE_SUBMIT_ACTION,
    });
}
