import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IJiraProjectMap } from "../interfaces/IJiraProject";

export class ProjectMap {
    constructor(
        private readonly persis: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) {}

    public async createLink(
        projectKey: string,
        roomId: string,
    ): Promise<string> {
        return this.persis.updateByAssociations(
            this.getAssociations(roomId),
            { projectKey, roomId } as IJiraProjectMap,
            true,
        );
    }

    public async getProjectByRoom(
        roomId: string,
    ): Promise<IJiraProjectMap | undefined> {
        const [record] = await this.persistenceRead.readByAssociations(
            this.getAssociations(roomId),
        );
        return record as IJiraProjectMap | undefined;
    }

    private getAssociations(
        roomId: string,
    ): Array<RocketChatAssociationRecord> {
        return [
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.ROOM,
                roomId,
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                "jira-project-map",
            ),
        ];
    }
}
