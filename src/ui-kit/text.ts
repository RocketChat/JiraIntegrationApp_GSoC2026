import { Markdown, PlainText } from "@rocket.chat/ui-kit";

export function plainText(text: string): PlainText {
    return { type: "plain_text", text };
}

export function markdown(text: string): Markdown {
    return { type: "mrkdwn", text };
}
