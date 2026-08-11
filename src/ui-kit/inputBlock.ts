import { InputBlock } from "@rocket.chat/ui-kit";
import { plainText } from "./text";
import { Actionless } from "./types";

export function buildInputBlock({
    appId,
    blockId,
    actionId,
    label,
    optional,
    element,
}: {
    appId: string;
    blockId: string;
    actionId: string;
    label: string;
    optional?: boolean;
    element: Actionless<InputBlock["element"]>;
}): InputBlock {
    return {
        type: "input",
        blockId,
        label: plainText(label),
        ...(optional && { optional }),
        element: {
            ...element,
            appId,
            blockId,
            actionId,
        } as InputBlock["element"],
    };
}
