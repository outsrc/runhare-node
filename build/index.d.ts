export declare type RunHareEventPriority = 'normal' | 'high';
export declare type RunHareEventStatus = 'queued' | 'prequed';
export interface RunHareResponse<EventTypes> {
    status: RunHareEventStatus;
    message: keyof EventTypes;
    priority: RunHareEventPriority;
}
export declare const createClient: <EventTypes>(namespace: string, sendKey?: string | undefined, origin?: string | undefined) => {
    sendEvent: <K extends keyof EventTypes>(event: K, message: EventTypes[K], priority?: RunHareEventPriority, signal?: boolean | undefined) => Promise<RunHareResponse<EventTypes>>;
};
