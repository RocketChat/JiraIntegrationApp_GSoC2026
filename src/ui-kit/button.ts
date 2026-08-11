import { ButtonElement } from "@rocket.chat/ui-kit";
import { plainText } from "./text";

export function buildButton({
    appId,
    text,
    blockId = "",
    actionId = "",
    value,
    url,
    style,
}: {
    appId: string;
    text: string;
    blockId?: string;
    actionId?: string;
    value?: string;
    url?: string;
    style?: ButtonElement["style"];
}): ButtonElement {
    return {
        type: "button",
        text: plainText(text),
        appId,
        blockId,
        actionId,
        ...(value && { value }),
        ...(url && { url }),
        ...(style && { style }),
    };
}
