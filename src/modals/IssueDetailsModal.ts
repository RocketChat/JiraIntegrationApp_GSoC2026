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
import { getCloudURL } from "../helpers/getSettings";
import { ActionsBlock, LayoutBlock, SectionBlock } from "@rocket.chat/ui-kit";
import { buildButton } from "../ui-kit/button";
import { buildInputBlock } from "../ui-kit/inputBlock";
import { buildModal } from "../ui-kit/modal";
import { markdown } from "../ui-kit/text";
import { plainTextInputElement } from "../ui-kit/elements";

const COMMENTS_PAGE_SIZE = 3;

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
    commentsLimit = COMMENTS_PAGE_SIZE,
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
    commentsLimit?: number;
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

    const { comments, total: totalComments } = await app
        .getJiraSDK()
        .getComments(token, read, sender, persis, issueKey, 0, commentsLimit);

    const hasMoreComments = totalComments > comments.length;

    const siteURL = await getCloudURL(read);
    const issueURL = `${siteURL}/browse/${issueKey}`;

    const summarySection: SectionBlock = {
        type: "section",
        text: markdown(`*${issue.summary}*\n${issueKey} · ${issue.issueType}`),
    };

    const issueActionsBlock: ActionsBlock = {
        type: "actions",
        blockId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_BLOCK,
        elements: [
            buildButton({
                appId: id,
                text: "Open in Jira",
                url: issueURL,
                blockId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_DETAILS_OPEN_ACTION,
            }),
            buildButton({
                appId: id,
                text: "Share Issue",
                value: issueKey,
                blockId: ElementEnum.JIRA_ISSUE_DETAILS_SHARE_BLOCK,
                actionId: ElementEnum.JIRA_ISSUE_DETAILS_SHARE_ACTION,
            }),
        ],
    };

    const detailsSection: SectionBlock = {
        type: "section",
        fields: [
            markdown(`*Status*\n${issue.status || "N/A"}`),
            markdown(`*Priority*\n${issue.priority || "N/A"}`),
            markdown(`*Assignee*\n${issue.assigneeName || "Unassigned"}`),
            markdown(
                `*Deadline*\n${issue.deadline ? issue.deadline.toDateString() : "N/A"}`,
            ),
        ],
    };

    const descriptionSection: SectionBlock = {
        type: "section",
        text: markdown(`*Description*\n${issue.description || "N/A"}`),
    };

    const commentsHeaderSection: SectionBlock = {
        type: "section",
        text: markdown(`*Comments (${totalComments})*`),
    };

    const commentSections: SectionBlock[] = comments.length
        ? comments.map((comment) => ({
              type: "section",
              text: markdown(
                  `*${comment.author}* · ${comment.created.toDateString()}\n${comment.body}`,
              ),
          }))
        : [{ type: "section", text: markdown("_No comments yet._") }];

    const loadMoreCommentsBlock: ActionsBlock | undefined = hasMoreComments
        ? {
              type: "actions",
              blockId: ElementEnum.JIRA_ISSUE_DETAILS_LOAD_MORE_COMMENTS_BLOCK,
              elements: [
                  buildButton({
                      appId: id,
                      text: "Load more Comments",
                      blockId:
                          ElementEnum.JIRA_ISSUE_DETAILS_LOAD_MORE_COMMENTS_BLOCK,
                      actionId:
                          ElementEnum.JIRA_ISSUE_DETAILS_LOAD_MORE_COMMENTS_ACTION,
                      value: String(commentsLimit + COMMENTS_PAGE_SIZE),
                  }),
              ],
          }
        : undefined;

    const commentInput = buildInputBlock({
        appId: id,
        blockId: ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_BLOCK,
        actionId: ElementEnum.JIRA_ISSUE_DETAILS_COMMENT_ACTION,
        label: "Add a comment",
        element: plainTextInputElement({ placeholder: "Write a comment..." }),
    });

    const blocks: LayoutBlock[] = [
        summarySection,
        detailsSection,
        { type: "divider" },
        descriptionSection,
        { type: "divider" },
        issueActionsBlock,
        commentInput,
        { type: "divider" },
        commentsHeaderSection,
        ...commentSections,
        ...(loadMoreCommentsBlock ? [loadMoreCommentsBlock] : []),
    ];

    return buildModal({
        appId: id,
        id: `${ModalEnum.JIRA_ISSUE_DETAILS_MODAL}|${room?.id}|${issueKey}`,
        title: `Issue ${issueKey}`,
        blocks,
        submitText: "Post Comment",
        submitBlockId: ElementEnum.JIRA_ISSUE_DETAILS_SUBMIT_BLOCK,
        submitActionId: ElementEnum.JIRA_ISSUE_DETAILS_SUBMIT_ACTION,
        closeText: "Close",
    });
}
