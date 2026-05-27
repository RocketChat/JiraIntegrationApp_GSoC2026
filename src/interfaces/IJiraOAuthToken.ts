export interface IJiraAuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    tokenType?: string;
    createdAt: string;
    updatedAt: string;
}