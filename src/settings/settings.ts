import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export const settings: ISetting[] = [
    {
        id: "client-id",
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: false,
        section: "CredentialSettings",
        i18nLabel: "Jira OAuth Client ID",
        i18nPlaceholder: "Client ID",
        hidden: false,
        multiline: false,
    },
    {
        id: "client-secret",
        type: SettingType.PASSWORD,
        packageValue: "",
        required: true,
        public: false,
        section: "CredentialSettings",
        i18nLabel: "Jira OAuth Client Secret",
        i18nPlaceholder: "Client Secret",
        hidden: false,
        multiline: false,
    },
    {
        id: "jira-cloud-url",
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: false,
        section: "CredentialSettings",
        i18nLabel: "Jira Cloud URL",
        i18nPlaceholder: "Jira Cloud URL",
        hidden: false,
        multiline: false,
    },
];
