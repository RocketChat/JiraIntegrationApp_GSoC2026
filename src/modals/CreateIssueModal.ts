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
import { ProjectMap } from "../persistence/projectMap";
import { InputBlock } from "@rocket.chat/ui-kit";

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

    const projectDropdown: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_PROJECT_SELECT_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Project",
        },
        element: {
            type: "static_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Select Project",
            },
            ...(linkedProjectData && {
                initialOption: {
                    text: {
                        type: TextTypes.PLAIN_TEXT,
                        text: `${linkedProjectData.key} - ${linkedProjectData.name}`,
                    },
                    value: linkedProjectData.key,
                },
            }),
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

    const issueTypeDropdown: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_CREATE_ISSUE_TYPE_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Issue Type",
        },
        element: {
            type: "static_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Select issue type",
            },
            initialOption: {
                text: { type: TextTypes.PLAIN_TEXT, text: "Task" },
                value: "Task",
            },
            options: [
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Task" },
                    value: "Task",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Bug" },
                    value: "Bug",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Story" },
                    value: "Story",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Epic" },
                    value: "Epic",
                },
            ],
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_TYPE_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_TYPE_ACTION,
        },
    };

    const summaryInput: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Summary",
        },
        element: {
            type: "plain_text_input",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Enter issue summary",
            },
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_SUMMARY_ACTION,
        },
    };

    const descriptionInput: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Description",
        },
        optional: true,
        element: {
            type: "plain_text_input",
            multiline: true,
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Enter issue description",
            },
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_DESCRIPTION_ACTION,
        },
    };

    const priorityDropdown: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Priority",
        },
        element: {
            type: "static_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Select priority",
            },
            options: [
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Highest" },
                    value: "Highest",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "High" },
                    value: "High",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Medium" },
                    value: "Medium",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Low" },
                    value: "Low",
                },
                {
                    text: { type: TextTypes.PLAIN_TEXT, text: "Lowest" },
                    value: "Lowest",
                },
            ],
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_PRIORITY_ACTION,
        },
    };

    const assigneeInput: InputBlock = {
        type: "input",
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Assignee (optional)",
        },
        optional: true,
        blockId: ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_BLOCK,
        element: {
            type: "users_select",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Enter assignee email or leave blank",
            },
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_ASSIGNEE_ACTION,
        },
    };

    const deadlineInput: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Deadline (optional)",
        },
        optional: true,
        element: {
            type: "datepicker",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "mm/dd/yyyy",
            },
            appId: id,
            blockId: ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_DEADLINE_ACTION,
        },
    };

    return {
        type: UIKitSurfaceType.MODAL,
        id: ModalEnum.JIRA_CREATE_ISSUE_MODAL + "|" + room?.id,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: "Create Jira Issue",
        },
        blocks: [
            projectDropdown,
            issueTypeDropdown,
            summaryInput,
            descriptionInput,
            priorityDropdown,
            assigneeInput,
            deadlineInput,
        ],
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Create",
            },
            blockId: ElementEnum.JIRA_CREATE_ISSUE_SUBMIT_BLOCK,
            actionId: ElementEnum.JIRA_CREATE_ISSUE_SUBMIT_ACTION,
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
