import { RawEvent, EventCategory } from './types';

const MOUSEMOVE_THROTTLE_MS = 100;
const SCROLL_THROTTLE_MS = 150;

export type EventCallback = (event: RawEvent) => void;

export class EventCollector {
  private callback: EventCallback;
  private lastMouseMove = 0;
  private lastScroll = 0;
  private lastKeystrokeTime = 0;
  private bound = false;

  private handlers: { type: string; handler: EventListener }[] = [];

  constructor(callback: EventCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.bound) return;
    this.bound = true;

    this.listen('mousemove', this.onMouseMove);
    this.listen('click', this.onClick);
    this.listen('scroll', this.onScroll, true);
    this.listen('keydown', this.onKeyDown);
    this.listen('submit', this.onSubmit, true);
    this.listen('popstate', this.onNavigation);
    this.listen('hashchange', this.onNavigation);
    this.listen('visibilitychange', this.onVisibility);
  }

  stop(): void {
    if (!this.bound) return;
    this.bound = false;
    for (const { type, handler } of this.handlers) {
      document.removeEventListener(type, handler, true);
      window.removeEventListener(type, handler);
    }
    this.handlers = [];
  }

  private listen(
    type: string,
    handler: (e: Event) => void,
    capture = false,
  ): void {
    const bound = handler.bind(this) as EventListener;
    const target = type === 'popstate' || type === 'hashchange' ? window : document;
    target.addEventListener(type, bound, capture);
    this.handlers.push({ type, handler: bound });
  }

  private emit(category: EventCategory, e: Event, overrides: Partial<RawEvent> = {}): void {
    const now = performance.now();
    const me = e as MouseEvent;
    const event: RawEvent = {
      category,
      timestamp: now,
      x: me.clientX || 0,
      y: me.clientY || 0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollDeltaY: 0,
      keystrokeInterval: 0,
      targetTagIndex: this.tagIndex(e.target as Element | null),
      ...overrides,
    };
    this.callback(event);
  }

  private onMouseMove(e: Event): void {
    const now = performance.now();
    if (now - this.lastMouseMove < MOUSEMOVE_THROTTLE_MS) return;
    this.lastMouseMove = now;
    this.emit('mousemove', e);
  }

  private onClick(e: Event): void {
    this.emit('click', e);
  }

  private onScroll(e: Event): void {
    const now = performance.now();
    if (now - this.lastScroll < SCROLL_THROTTLE_MS) return;
    this.lastScroll = now;
    this.emit('scroll', e, { scrollDeltaY: window.scrollY });
  }

  private onKeyDown(e: Event): void {
    const now = performance.now();
    const interval = this.lastKeystrokeTime > 0 ? now - this.lastKeystrokeTime : 0;
    this.lastKeystrokeTime = now;
    this.emit('keypress', e, { keystrokeInterval: interval });
  }

  private onSubmit(e: Event): void {
    this.emit('submit', e);
  }

  private onNavigation(e: Event): void {
    this.emit('navigation', e);
  }

  private onVisibility(_e: Event): void {
    this.emit('visibility', _e);
  }

  private tagIndex(el: Element | null): number {
    if (!el) return 0;
    const tags = ['div', 'button', 'a', 'input', 'span', 'form', 'img', 'p'];
    const tag = el.tagName.toLowerCase();
    const idx = tags.indexOf(tag);
    return idx >= 0 ? idx + 1 : 0;
  }
}
