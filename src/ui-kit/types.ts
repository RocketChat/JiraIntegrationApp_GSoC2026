export type Actionless<E> = Omit<E, "appId" | "blockId" | "actionId">;
