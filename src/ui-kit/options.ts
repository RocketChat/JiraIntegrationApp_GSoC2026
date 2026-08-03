import { Option } from "@rocket.chat/ui-kit";
import { plainText } from "./text";

export function buildOption(text: string, value: string): Option {
    return { text: plainText(text), value };
}

export function buildOptions(
    items: ReadonlyArray<{ text: string; value: string }>,
): Option[] {
    return items.map((item) => buildOption(item.text, item.value));
}
