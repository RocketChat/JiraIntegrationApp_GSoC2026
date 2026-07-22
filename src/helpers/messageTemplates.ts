import { ActionsBlock, LayoutBlock } from "@rocket.chat/ui-kit";
import { IMessageAttachment } from "@rocket.chat/apps-engine/definition/messages";
import { ElementEnum } from "../enums/ElementEnum";
import { TextTypes } from "../enums/TextTypes";

export function issueQuickActionsBlock(params: {
    appId: string;
    issueKey: string;
    hasAssignee: boolean;
    hasDeadline: boolean;
}): LayoutBlock[] {
    const { appId, issueKey, hasAssignee, hasDeadline } = params;

    const elements: ActionsBlock["elements"][number][] = [];

    if (!hasAssignee) {
        elements.push({
            type: "button",
            text: { type: TextTypes.PLAIN_TEXT, text: "Assign this issue" },
            appId,
            value: issueKey,
            blockId: ElementEnum.JIRA_ISSUE_CREATED_ASSIGN_BLOCK,
            actionId: ElementEnum.JIRA_ISSUE_CREATED_ASSIGN_ACTION,
        });
    }

    if (!hasDeadline) {
        elements.push({
            type: "button",
            text: { type: TextTypes.PLAIN_TEXT, text: "Set Deadline" },
            appId,
            value: issueKey,
            blockId: ElementEnum.JIRA_ISSUE_CREATED_SET_DEADLINE_BLOCK,
            actionId: ElementEnum.JIRA_ISSUE_CREATED_SET_DEADLINE_ACTION,
        });
    }

    if (elements.length === 0) {
        return [];
    }

    return [
        {
            type: "actions",
            blockId: ElementEnum.JIRA_ISSUE_CREATED_ACTIONS_BLOCK,
            elements,
        },
    ];
}

export function issueCreatedAttachment(params: {
    key: string;
    summary: string;
    description?: string;
    issueType: string;
    priority?: string;
    assigneeUsername?: string;
    issueURL: string;
}): IMessageAttachment {
    const {
        key,
        summary,
        description,
        issueType,
        priority,
        assigneeUsername,
        issueURL,
    } = params;

    return {
        title: {
            link: issueURL,
            value: `${key} - ${summary}`,
        },
        text: description,
        fields: [
            {
                title: "Status",
                value: "`Todo`",
                short: true,
            },
            {
                title: "Priority",
                value: `\`${priority || "Medium"}\``,
                short: true,
            },
            {
                title: "Type",
                value: `\`${issueType}\``,
                short: true,
            },
            {
                title: "Assignee",
                value: assigneeUsername || "Unassigned",
                short: true,
            },
        ],
    };
}

export function issueCreatedMessage(params: {
    key: string;
    summary: string;
    description?: string;
    assigneeUsername?: string;
    deadline?: string;
    raisedByUsername: string;
    issueURL: string;
}): string {
    const {
        key,
        summary,
        description,
        assigneeUsername,
        deadline,
        raisedByUsername,
        issueURL,
    } = params;

    return `## 🎫 New Jira Ticket Created!
🔑 **Key:** ${key}
📝 **Summary:** ${summary}
📄 **Description:** ${description || "N/A"}
👤 **Assignee:** ${assigneeUsername ? `@${assigneeUsername}` : "Unassigned"}
📅 **Deadline:** ${deadline || "N/A"}
🔵 **Status:** Todo
🙋 **Raised By:** @${raisedByUsername}
🔗 **Link:** ${issueURL}
`;
}

export function issueSharedMessage(params: {
    sharedByName: string;
    issueKey: string;
    summary: string;
    issueType: string;
    description?: string;
    priority?: string;
    deadline?: Date;
    issueURL: string;
    isDirect: boolean;
}): string {
    const {
        sharedByName,
        issueKey,
        summary,
        issueType,
        description,
        priority,
        deadline,
        issueURL,
        isDirect,
    } = params;

    const headline = isDirect
        ? `### @${sharedByName} has shared you an issue`
        : `### @${sharedByName} has shared an issue`;

    return `${headline}
🔑 **Key:** ${issueKey}
📝 **Summary:** ${summary}
🏷️ **Type:** ${issueType}
📄 **Description:** ${description || "N/A"}
⚡ **Priority:** ${priority || "N/A"}
📅 **Deadline:** ${deadline ? deadline.toDateString() : "N/A"}
🔗 **Link:** ${issueURL}
`;
}

export function issueUpdateMessage(params: {
    issueKey: string;
    field: string;
    oldValue: string;
    newValue: string;
}) {
    const message = `### Jira issue Updated
    **Issue:** ${params.issueKey}
    **Field:** ${params.field}
    **Changes:** ${params.oldValue} -> ${params.newValue}
    `;

    return message;
}
