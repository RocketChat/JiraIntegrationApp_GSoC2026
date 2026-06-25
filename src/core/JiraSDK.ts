import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { JiraApp } from "../../JiraApp";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getCallbackURL } from "../helpers/getEndpointURLS";
import { getCloudURL, getCredentials } from "../helpers/getSettings";
import { AuthPersistence } from "../persistence/authPersistence";
import { IJiraIssue, IJiraIssueResponse } from "../interfaces/IJiraIssue";
import { IJiraProject } from "../interfaces/IJiraProject";
import { sendDMNotification } from "../helpers/message";
import { URLEnum } from "../enums/URLEnum";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";

export class JiraSDK {
    private readonly app: JiraApp;
    private readonly http: IHttp;
    constructor(app: JiraApp, http: IHttp) {
        this.app = app;
        this.http = http;
    }

    public async getAccessToken(
        read: IRead,
        code: string,
        user: IUser,
        modify: IModify,
        persis: IPersistence,
    ): Promise<IJiraAuthToken> {
        const { clientId, clientSecret } = await getCredentials(read);
        const redirectUri = await getCallbackURL(this.app);

        const response = await this.http.post(URLEnum.TOKEN_URL, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            data: {
                grant_type: "authorization_code",
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            },
        });

        const responseData = response.data;

        const cloudId = await this.getCloudId(responseData.access_token);

        if (!response.statusCode.toString().startsWith("2") || !responseData) {
            throw new Error(
                `Failed to exchange Jira authorization code. Status: ${response.statusCode}. Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        const now = new Date().toISOString();
        const token: IJiraAuthToken = {
            accessToken: responseData.access_token,
            refreshToken: responseData.refresh_token,
            expiresIn: responseData.expires_in,
            scope: responseData.scope,
            tokenType: responseData.token_type,
            cloudID: cloudId,
            createdAt: now,
            updatedAt: now,
        };

        const authPersistence = new AuthPersistence(
            persis,
            read.getPersistenceReader(),
        );

        const existingToken = await authPersistence.getAccessToken(user);
        await authPersistence.saveAccessToken(user, {
            ...token,
            createdAt: existingToken?.createdAt || now,
        });

        await sendDMNotification(
            read,
            modify,
            user,
            "Jira login successful 🚀",
        );

        return token;
    }

    public async refreshAccessToken(
        read: IRead,
        user: IUser,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IJiraAuthToken> {
        const authPersistence = new AuthPersistence(
            persis,
            read.getPersistenceReader(),
        );
        const existingToken = await authPersistence.getAccessToken(user);

        if (!existingToken?.refreshToken) {
            throw new Error("No Jira refresh token found for this user.");
        }

        const { clientId, clientSecret } = await getCredentials(read);

        const response = await http.post(URLEnum.TOKEN_URL, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            data: {
                grant_type: "refresh_token",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: existingToken.refreshToken,
            },
        });

        const responseData = response.data;

        if (
            !response.statusCode.toString().startsWith("2") ||
            !responseData.access_token
        ) {
            throw new Error(
                `Failed to refresh Jira access token. Status: ${response.statusCode}. Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        const now = new Date().toISOString();
        const token: IJiraAuthToken = {
            accessToken: responseData.access_token,
            refreshToken:
                responseData.refresh_token || existingToken.refreshToken,
            cloudID: existingToken.cloudID,
            expiresIn: responseData.expires_in,
            scope: responseData.scope,
            tokenType: responseData.token_type,
            createdAt: existingToken.createdAt,
            updatedAt: now,
        };

        await authPersistence.saveAccessToken(user, token);

        return token;
    }

    public async createJiraIssue(
        read: IRead,
        persis: IPersistence,
        user: IUser,
        issue: IJiraIssue,
    ): Promise<IJiraIssueResponse> {
        const authPersistence = new AuthPersistence(
            persis,
            read.getPersistenceReader(),
        );
        let token = await authPersistence.getAccessToken(user);

        if (!token) {
            throw new Error(
                "Not authenticated with Jira. Please run `/jira login` first.",
            );
        }

        if (this.isTokenExpired(token)) {
            token = await this.refreshAccessToken(
                read,
                user,
                this.http,
                persis,
            );
        }

        const cloudId = token.cloudID;
        const siteURL = await getCloudURL(read);

        const issueBody: Record<string, any> = {
            fields: {
                project: { key: issue.projectKey },
                summary: issue.summary,
                issuetype: { name: issue.issueType },
            },
        };

        if (issue.description) {
            issueBody.fields.description = this.buildDescriptionADF(
                issue.description,
            );
        }

        if (issue.assignee) {
            const accountResult = await this.getAccountId(
                issue.assignee.emails[0].address,
                token,
                cloudId,
            );
            if (accountResult.success) {
                issueBody.fields.assignee = {
                    accountId: accountResult.accountId,
                };
            }
        }

        if (issue.priority) {
            issueBody.fields.priority = { name: issue.priority };
        }

        if (issue.deadline) {
            issueBody.fields.duedate = issue.deadline
                .toISOString()
                .split("T")[0];
        }

        const response = await this.http.post(
            `${URLEnum.API_URL}${cloudId}/rest/api/3/issue`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                data: issueBody,
            },
        );

        if (!response.statusCode.toString().startsWith("2")) {
            throw new Error(
                `Failed to create Jira issue. Status: ${response.statusCode}. ` +
                    `Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        return {
            id: response.data.id,
            key: response.data.key,
            issueURL: `${siteURL}/browse/${response.data.key}`,
        };
    }

    public async getJiraIssue(
        token: IJiraAuthToken,
        read: IRead,
        user: IUser,
        persis: IPersistence,
        issueKey: string,
    ): Promise<IJiraIssue> {
        if (this.isTokenExpired(token)) {
            token = await this.refreshAccessToken(
                read,
                user,
                this.http,
                persis,
            );
        }

        const cloudID = token.cloudID;
        const response = await this.http.get(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/issue/${issueKey}`,
            {
                headers: {
                    Authorization: `Bearer ${token?.accessToken}`,
                    Accept: "application/json",
                },
            },
        );

        if (!response.statusCode.toString().startsWith("2") || !response.data) {
            throw new Error(
                "Unable to fetch the Jira issue, please check the issueKey",
            );
        }

        const fields = response.data.fields;

        const issue: IJiraIssue = {
            projectKey: fields.project?.key,
            summary: fields.summary,
            issueType: fields.issuetype?.name,
            priority: fields.priority?.name,
            status: fields.status?.name,
        };

        if (fields.description) {
            issue.description = this.extractTextFromADF(fields.description);
        }

        if (fields.duedate) {
            issue.deadline = new Date(fields.duedate);
        }

        return issue;
    }

    // Added this because Jira api returns `description` in Atlassian Document Format
    // This function convert it into string
    private extractTextFromADF(node: any): string {
        if (!node) {
            return "";
        }

        if (node.type === "text") {
            return node.text || "";
        }

        if (!Array.isArray(node.content)) {
            return "";
        }

        return node.content
            .map((child: any) => this.extractTextFromADF(child))
            .join("");
    }

    public async getJiraProjects(
        token: IJiraAuthToken,
        read: IRead,
        user: IUser,
        persis: IPersistence,
    ): Promise<IJiraProject[]> {
        if (this.isTokenExpired(token)) {
            token = await this.refreshAccessToken(
                read,
                user,
                this.http,
                persis,
            );
        }

        const cloudId = token.cloudID;
        const response = await this.http.get(
            `${URLEnum.API_URL}${cloudId}/rest/api/3/project`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    Accept: "application/json",
                },
            },
        );

        if (
            !response.statusCode.toString().startsWith("2") ||
            !Array.isArray(response.data)
        ) {
            throw new Error(
                `Failed to fetch Jira projects. Status: ${response.statusCode}. Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        return response.data.map((p: any) => ({
            id: p.id,
            key: p.key,
            name: p.name,
        }));
    }
    public async assignIssue(
        read: IRead,
        persis: IPersistence,
        sender: IUser,
        token: IJiraAuthToken,
        assignData: { issueKey: string; username: string },
    ) {
        const { issueKey, username } = assignData;

        if (this.isTokenExpired(token)) {
            token = await this.refreshAccessToken(
                read,
                sender,
                this.http,
                persis,
            );
        }

        const cloudID = token.cloudID;

        const assigneeEmail = (
            await read.getUserReader().getByUsername(username)
        ).emails[0].address;

        const { accountId } = await this.getAccountId(
            assigneeEmail,
            token,
            cloudID,
        );

        const response = await this.http.put(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/issue/${issueKey}/assignee`,
            {
                headers: {
                    Authorization: `Bearer ${token?.accessToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                content: JSON.stringify({
                    accountId: accountId,
                }),
            },
        );

        if (!response.statusCode.toString().startsWith("2")) {
            throw new Error(
                `Failed to assign Jira issue. Status: ${response.statusCode}. ` +
                    `Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        return { success: true, message: "Issue assigned to user" };
    }

    public async updateIssueDetails(
        read: IRead,
        persis: IPersistence,
        sender: IUser,
        token: IJiraAuthToken,
        issueDetails: { issueKey: string; field: string; value: string },
    ): Promise<{
        success: boolean;
        changes: { existingValue: string; value: string };
    }> {
        const { issueKey, value } = issueDetails;
        const field = issueDetails.field.toLowerCase();

        if (this.isTokenExpired(token)) {
            token = await this.refreshAccessToken(
                read,
                sender,
                this.http,
                persis,
            );
        }

        const cloudID = token.cloudID;

        const issue = await this.getJiraIssue(
            token,
            read,
            sender,
            persis,
            issueKey,
        );

        const existingValue =
            field === "deadline" || field === "duedate"
                ? this.formatDate(issue.deadline)
                : (issue[field] ?? "Not set");

        if (field === "status") {
            const issueUpdate = await this.updateIssueStatus(
                issueKey,
                value,
                token,
                cloudID,
            );
            if (issueUpdate.success) {
                return {
                    success: issueUpdate.success,
                    changes: { existingValue, value },
                };
            }
        }

        const fields = await this.buildUpdateFields(
            field,
            value,
            token,
            cloudID,
        );

        const response = await this.http.put(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/issue/${issueKey}`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                data: { fields },
            },
        );

        if (!response.statusCode.toString().startsWith("2")) {
            throw new Error(
                `Failed to update Jira issue. Status: ${response.statusCode}. ` +
                    `Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        return {
            success: true,
            changes: { existingValue, value },
        };
    }

    private async buildUpdateFields(
        field: string,
        value: string,
        token: IJiraAuthToken,
        cloudID: string,
    ) {
        switch (field) {
            case "priority": {
                const priorityName = await this.resolvePriorityName(
                    value,
                    token,
                    cloudID,
                );
                return { priority: { name: priorityName } };
            }
            case "deadline":
                return { duedate: this.resolveDeadline(value) };
            default:
                throw new Error(
                    `Unsupported field "${field}". Supported fields: priority, status, deadline.`,
                );
        }
    }
    private async resolvePriorityName(
        value: string,
        token: IJiraAuthToken,
        cloudID: string,
    ): Promise<string> {
        const response = await this.http.get(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/priority`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    Accept: "application/json",
                },
            },
        );

        if (
            !response.statusCode.toString().startsWith("2") ||
            !Array.isArray(response.data)
        ) {
            throw new Error("Failed to fetch Jira priorities for validation.");
        }

        const match = response.data.find(
            (priority: any) =>
                priority.name?.toLowerCase() === value.trim().toLowerCase(),
        );

        if (!match) {
            const validNames = response.data
                .map((priority: any) => priority.name)
                .join(", ");
            throw new Error(
                `Invalid priority "${value}". Valid options: ${validNames}.`,
            );
        }

        return match.name;
    }

    private resolveDeadline(value: string): string {
        const normalized = value.trim().toLowerCase();

        if (normalized === "today") {
            return new Date().toISOString().split("T")[0];
        }

        if (normalized === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split("T")[0];
        }

        const dateMatch = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!dateMatch) {
            throw new Error(
                `Invalid deadline "${value}". Use "today", "tomorrow", or a date in dd/mm/yyyy format.`,
            );
        }

        const [, day, month, year] = dateMatch.map(Number);
        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            throw new Error(
                `Invalid deadline "${value}". The date does not exist.`,
            );
        }

        return date.toISOString().split("T")[0];
    }

    private formatDate(date?: Date): string {
        if (!date || isNaN(date.getTime())) {
            return "Not set";
        }

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}/${date.getFullYear()}`;
    }

    private async updateIssueStatus(
        issueKey: string,
        statusName: string,
        token: IJiraAuthToken,
        cloudID: string,
    ): Promise<{ success: boolean }> {
        const transitionsResponse = await this.http.get(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/issue/${issueKey}/transitions`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    Accept: "application/json",
                },
            },
        );

        if (
            !transitionsResponse.statusCode.toString().startsWith("2") ||
            !Array.isArray(transitionsResponse.data?.transitions)
        ) {
            throw new Error(
                "Failed to fetch available status transitions for this issue.",
            );
        }

        const transitions = transitionsResponse.data.transitions;
        const match = transitions.find(
            (transition: any) =>
                transition.to?.name?.toLowerCase() ===
                statusName.trim().toLowerCase(),
        );

        if (!match) {
            const validStatuses = transitions
                .map((transition: any) => transition.to?.name)
                .join(", ");
            throw new Error(
                `Invalid status "${statusName}". Valid options from the current state: ${validStatuses}.`,
            );
        }

        const response = await this.http.post(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/issue/${issueKey}/transitions`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                data: { transition: { id: match.id } },
            },
        );

        if (!response.statusCode.toString().startsWith("2")) {
            throw new Error(
                `Failed to update Jira issue status. Status: ${response.statusCode}. ` +
                    `Response: ${response.content || JSON.stringify(response.data)}`,
            );
        }

        return {
            success: true,
        };
    }

    private buildDescriptionADF(text: string): Record<string, any> {
        return {
            type: "doc",
            version: 1,
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text }],
                },
            ],
        };
    }

    private async getAccountId(
        email: string,
        token: IJiraAuthToken,
        cloudID: string,
    ) {
        const response = await this.http.get(
            `${URLEnum.API_URL}${cloudID}/rest/api/3/user/search?query=${encodeURIComponent(email)}`,
            {
                headers: {
                    Authorization: `Bearer ${token?.accessToken}`,
                    Accept: "application/json",
                },
            },
        );

        if (response?.data?.length > 0) {
            return { success: true, accountId: response.data[0].accountId };
        }
        return { success: false, error: "User not found in Jira" };
    }

    private async getCloudId(accessToken: string): Promise<string> {
        const response = await this.http.get(URLEnum.ACCESSIBLE_RESOURCES_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });

        if (
            !response.statusCode.toString().startsWith("2") ||
            !Array.isArray(response.data) ||
            !response.data.length
        ) {
            throw new Error(
                "Failed to retrieve accessible Jira cloud resources. Ensure the app has the correct OAuth scopes.",
            );
        }

        return response.data[0].id;
    }

    private isTokenExpired(token: IJiraAuthToken): boolean {
        if (!token.expiresIn || !token.updatedAt) {
            return false;
        }
        const updatedAt = new Date(token.updatedAt).getTime();
        const expiresAt = updatedAt + token.expiresIn * 1000;
        return Date.now() >= expiresAt - 60_000;
    }
}
