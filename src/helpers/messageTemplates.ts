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
