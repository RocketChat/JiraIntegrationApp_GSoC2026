import { LayoutBlock } from "@rocket.chat/ui-kit";
import { IUIKitSurfaceViewParam } from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitSurfaceType } from "@rocket.chat/apps-engine/definition/uikit";
import { buildButton } from "./button";
import { plainText } from "./text";

export function buildModal({
    appId,
    id,
    title,
    blocks,
    submitText,
    submitBlockId,
    submitActionId,
    closeText = "Cancel",
    clearOnClose = true,
}: {
    appId: string;
    id: string;
    title: string;
    blocks: LayoutBlock[];
    submitText?: string;
    submitBlockId?: string;
    submitActionId?: string;
    closeText?: string;
    clearOnClose?: boolean;
}): IUIKitSurfaceViewParam {
    return {
        type: UIKitSurfaceType.MODAL,
        id,
        title: plainText(title),
        blocks,
        clearOnClose,
        ...(submitText && {
            submit: buildButton({
                appId,
                text: submitText,
                blockId: submitBlockId,
                actionId: submitActionId,
            }),
        }),
        close: buildButton({ appId, text: closeText }),
    };
}
