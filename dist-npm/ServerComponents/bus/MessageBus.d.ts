/**
 * Interface for message bus callbacks, i.e. (data: any) => any,
 * so you can supply a single data argument of any type, and it may return any type.
 */
export interface IMessageBusCallback {
    (title: string, data?: any, sender?: string): any;
}
/**
 *  Handle returned when subscribing to a topic
 */
export declare class MessageBusHandle {
    constructor(topic: string, callback: IMessageBusCallback);
    topic: string;
    callback: IMessageBusCallback;
}
/**
 * Simple message bus service, used for subscribing and unsubsubscribing to topics.
 * @see {@link https://gist.github.com/floatingmonkey/3384419}
 */
export declare class MessageBusService {
    private static cache;
    /**
     * Publish to a topic
     */
    publish(topic: string, title: string, data?: any): void;
    /**
     * Subscribe to a topic
     * @param {string} topic The desired topic of the message.
     * @param {IMessageBusCallback} callback The callback to call.
     */
    subscribe(topic: string, callback: IMessageBusCallback): MessageBusHandle;
    /**
     * Unsubscribe to a topic by providing its handle
     */
    unsubscribe(handle: MessageBusHandle): void;
}
