import {
    DatePickerElement,
    MultiChannelsSelectElement,
    MultiUsersSelectElement,
    Option,
    PlainTextInputElement,
    StaticSelectElement,
    UsersSelectElement,
} from "@rocket.chat/ui-kit";
import { plainText } from "./text";
import { Actionless } from "./types";

export function staticSelectElement({
    placeholder,
    options,
    initialOption,
}: {
    placeholder: string;
    options: Option[];
    initialOption?: Option;
}): Actionless<StaticSelectElement> {
    return {
        type: "static_select",
        placeholder: plainText(placeholder),
        options,
        ...(initialOption && { initialOption }),
    };
}

export function usersSelectElement({
    placeholder,
}: { placeholder?: string } = {}): Actionless<UsersSelectElement> {
    return {
        type: "users_select",
        ...(placeholder && { placeholder: plainText(placeholder) }),
    };
}

export function multiUsersSelectElement({
    placeholder,
}: { placeholder?: string } = {}): Actionless<MultiUsersSelectElement> {
    return {
        type: "multi_users_select",
        ...(placeholder && { placeholder: plainText(placeholder) }),
    };
}

export function multiChannelsSelectElement({
    placeholder,
}: { placeholder?: string } = {}): Actionless<MultiChannelsSelectElement> {
    return {
        type: "multi_channels_select",
        ...(placeholder && { placeholder: plainText(placeholder) }),
    };
}

export function plainTextInputElement({
    placeholder,
    multiline,
}: {
    placeholder?: string;
    multiline?: boolean;
} = {}): Actionless<PlainTextInputElement> {
    return {
        type: "plain_text_input",
        ...(placeholder && { placeholder: plainText(placeholder) }),
        ...(multiline  && { multiline }),
    };
}

export function datePickerElement({
    placeholder,
}: { placeholder?: string } = {}): Actionless<DatePickerElement> {
    return {
        type: "datepicker",
        ...(placeholder && { placeholder: plainText(placeholder) }),
    };
}
