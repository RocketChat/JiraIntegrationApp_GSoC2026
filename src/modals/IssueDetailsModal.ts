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
import { getCloudURL } from "../helpers/getSettings";
import { InputBlock, LayoutBlock, SectionBlock } from "@rocket.chat/ui-kit";

export async function IssueDetailsModal({
    app,
    read,
    modify: _modify,
    http: _http,
    sender,
    room,
    persis,
    triggerId: _triggerId,
    id,
    issueKey,
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
    issueKey: string;
}): Promise<IUIKitSurfaceViewParam> {
    const authPersistence = new AuthPersistence(
        persis,
        read.getPersistenceReader(),
    );
    const token = (await authPersistence.getAccessToken(
        sender,
    )) as IJiraAuthToken;

    const issue = await app
        .getJiraSDK()
        .getJiraIssue(token, read, sender, persis, issueKey);

    const comments = await app
        .getJiraSDK()
        .getComments(token, read, sender, persis, issueKey);

    const siteURL = await getCloudURL(read);
    const issueURL = `${siteURL}/browse/${issueKey}`;

    const summarySection: SectionBlock = {
        type: "section",
        text: {
            type: TextTypes.MARKDOWN,
            text: `*${issue.summary}*\n${issueKey} · ${issue.issueType}`,
        },
        accessory: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Open in Jira",
            },
            url: issueURL,
            appId: id,
            blockId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_BLOCK,
            actionId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_ACTION,
        },
    };

    const detailsSection: SectionBlock = {
        type: "section",
        fields: [
            {
                type: TextTypes.MARKDOWN,
                text: `*Status*\n${issue.status || "N/A"}`,
            },
            {
                type: TextTypes.MARKDOWN,
                text: `*Priority*\n${issue.priority || "N/A"}`,
            },
            {
                type: TextTypes.MARKDOWN,
                text: `*Assignee*\n${issue.assigneeName || "Unassigned"}`,
            },
            {
                type: TextTypes.MARKDOWN,
                text: `*Deadline*\n${issue.deadline ? issue.deadline.toDateString() : "N/A"}`,
            },
        ],
    };

    const descriptionSection: SectionBlock = {
        type: "section",
        text: {
            type: TextTypes.MARKDOWN,
            text: `*Description*\n${issue.description || "N/A"}`,
        },
    };

    const commentsHeaderSection: SectionBlock = {
        type: "section",
        text: {
            type: TextTypes.MARKDOWN,
            text: `*Comments (${comments.length})*`,
        },
    };

    const commentSections: SectionBlock[] = comments.length
        ? comments.map((comment) => ({
              type: "section",
              text: {
                  type: TextTypes.MARKDOWN,
                  text: `*${comment.author}* · ${comment.created.toDateString()}\n${comment.body}`,
              },
          }))
        : [
              {
                  type: "section",
                  text: {
                      type: TextTypes.MARKDOWN,
                      text: "_No comments yet._",
                  },
              },
          ];

    const commentInput: InputBlock = {
        type: "input",
        blockId: ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_BLOCK,
        label: {
            type: TextTypes.PLAIN_TEXT,
            text: "Add a comment",
        },
        element: {
            type: "plain_text_input",
            placeholder: {
                type: TextTypes.PLAIN_TEXT,
                text: "Write a comment...",
            },
            appId: id,
            blockId: ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_BLOCK,
            actionId: ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_ACTION,
        },
    };

    const blocks: LayoutBlock[] = [
        summarySection,
        detailsSection,
        { type: "divider" },
        descriptionSection,
        { type: "divider" },
        commentInput,
        { type: "divider" },
        commentsHeaderSection,
        ...commentSections,
    ];

    return {
        type: UIKitSurfaceType.MODAL,
        id: `${ModalEnum.JIRA_ISSUE_DETAILS_MODAL}|${room?.id}|${issueKey}`,
        title: {
            type: TextTypes.PLAIN_TEXT,
            text: `Issue ${issueKey}`,
        },
        blocks,
        submit: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Post Comment",
            },
            blockId: ElementEnum.JIRA_ISSUE_DETAILS_SUBMIT_BLOCK,
            actionId: ElementEnum.JIRA_ISSUE_DETAILS_SUBMIT_ACTION,
            appId: id,
        },
        clearOnClose: true,
        close: {
            type: "button",
            text: {
                type: TextTypes.PLAIN_TEXT,
                text: "Close",
            },
            blockId: "",
            actionId: "",
            appId: id,
        },
    };
}
