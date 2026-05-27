import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IJiraAuthToken } from "../interfaces/IJiraOAuthToken";

export class AuthPersistence {
    constructor(
        private readonly persis: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) {}

    public async saveAccessToken(user: IUser, token: IJiraAuthToken): Promise<string> {
        const associations = this.getAuthAssociations(user);

        return this.persis.updateByAssociations(
            associations,
            token,
            true,
        );
    }

    public async getAccessToken(user: IUser): Promise<IJiraAuthToken | undefined> {
        const [token] = await this.persistenceRead.readByAssociations(
            this.getAuthAssociations(user),
        );

        return token as IJiraAuthToken | undefined;
    }

    public async revokeAccessToken(user: IUser): Promise<Array<object>> {
        return this.persis.removeByAssociations(this.getAuthAssociations(user));
    }

    private getAuthAssociations(user: IUser): Array<RocketChatAssociationRecord> {
        return [
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.USER,
                user.id,
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                "jira-auth",
            ),
        ];
    }
}
