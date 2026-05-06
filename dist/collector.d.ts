import { RawEvent } from './types';
export type EventCallback = (event: RawEvent) => void;
export declare class EventCollector {
    private callback;
    private lastMouseMove;
    private lastScroll;
    private lastKeystrokeTime;
    private bound;
    private handlers;
    constructor(callback: EventCallback);
    start(): void;
    stop(): void;
    private listen;
    private emit;
    private onMouseMove;
    private onClick;
    private onScroll;
    private onKeyDown;
    private onSubmit;
    private onNavigation;
    private onVisibility;
    private tagIndex;
}
