import { IUser } from "@rocket.chat/apps-engine/definition/users";

export interface IJiraIssue {
    projectKey: string;
    summary: string;
    issueType: string;
    description?: string;
    assignee?: IUser;
    priority?: string;
    status?: string;
    deadline?: Date;
}

export interface IJiraIssueResponse {
    id: string;
    key: string;
    issueURL: string;
}
