interface RunHarePayloadSignature {
    headers: {
        'x-runhare-auth': string;
        'x-runhare-auth-expiry': string;
        'content-type': 'application/json';
    };
    payload: string;
}
export declare const signPayload: <T>(payload: T, secret: string, ttl?: number) => RunHarePayloadSignature;
export declare const verifyRequest: (sendKey: string, payload: any, headers: any) => {
    verified: true;
} | {
    verified: false;
    error: string;
};
export declare type RunHareEventPriority = 'normal' | 'high';
export declare type RunHareEventStatus = 'queued' | 'prequed';
export interface RunHareResponse<EventTypes> {
    status: RunHareEventStatus;
    message: keyof EventTypes;
    priority: RunHareEventPriority;
}
export interface PayloadHeaders {
    'x-runhare-auth'?: string;
    'x-runhare-auth-expiry'?: string;
    'x-runhare-event'?: string;
    'x-runhare-event-id'?: string;
    [key: string]: string | undefined;
}
export declare const createClient: <EventTypes>(namespace: string, sendKey?: string | undefined, origin?: string | undefined, ttl?: number | undefined, tracer?: ((payload: any, headers: any) => void) | undefined) => {
    sendEvent: <K extends keyof EventTypes>(event: K, message: EventTypes[K], priority?: RunHareEventPriority, signal?: boolean | undefined) => Promise<RunHareResponse<EventTypes>>;
};
export interface ConsumerOptions {
    rejectUnregisteredMessages?: boolean;
}
export interface EventSuccess {
    result: 'sucess';
}
export interface EventFailed {
    result: 'fail';
    error: string;
}
export declare type ConsumerResponse = EventSuccess | EventFailed;
export declare const createConsumer: <EventTypes>(sendKey?: string | undefined, options?: ConsumerOptions | undefined) => {
    createHandler: <K extends keyof EventTypes>(events: K[], consumer: (event: K, payload: EventTypes[K], headers?: PayloadHeaders | undefined) => Promise<ConsumerResponse>) => (payload: EventTypes[K], headers?: PayloadHeaders | undefined) => Promise<ConsumerResponse>;
};
export {};
