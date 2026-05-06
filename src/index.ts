import { GRUEncoder } from './encoder';
import { EventCollector } from './collector';
import { FeatureExtractor } from './features';
import { FingerprintSender, parseDestination } from './sender';
import { TriggerManager } from './triggers';
import { EncoderConfig, DEFAULT_CONFIG, TriggerType } from './types';

export interface EncoderInstance {
  getFingerprint(): number[];
  send(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

class FingerprintEncoder implements EncoderInstance {
  private encoder: GRUEncoder;
  private collector: EventCollector;
  private features: FeatureExtractor;
  private sender: FingerprintSender;
  private triggers: TriggerManager;
  private ready = false;

  constructor(config: EncoderConfig) {
    const sessionId = config.sessionId || generateSessionId();
    const destination = parseDestination(config.destination, config.eventName, config.headers);

    this.encoder = new GRUEncoder();
    this.features = new FeatureExtractor();
    this.sender = new FingerprintSender(sessionId, destination);

    this.collector = new EventCollector((event) => {
      if (!this.ready) return;
      const featureVec = this.features.extract(event);
      this.encoder.step(featureVec);
      this.triggers.recordEvent();
    });

    this.triggers = new TriggerManager(
      (triggerType: TriggerType) => {
        if (!this.ready) return;
        const fp = this.encoder.getFingerprint();
        this.sender.send(fp, triggerType);
      },
      config.interval,
      config.eventCount,
    );

    this.init();
  }

  private async init(): Promise<void> {
    await this.encoder.initialize();
    this.ready = true;
    this.collector.start();
    this.triggers.start();
  }

  getFingerprint(): number[] {
    return Array.from(this.encoder.getFingerprint());
  }

  send(): void {
    const fp = this.encoder.getFingerprint();
    this.sender.send(fp, 'manual');
  }

  pause(): void {
    this.collector.stop();
    this.triggers.pause();
  }

  resume(): void {
    this.collector.start();
    this.triggers.resume();
  }

  destroy(): void {
    this.collector.stop();
    this.triggers.stop();
    this.encoder.dispose();
  }
}

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

function parseConfigFromScript(): EncoderConfig {
  const scripts = document.querySelectorAll('script[src*="encoder"]');
  const script = scripts[scripts.length - 1] as HTMLScriptElement | undefined;

  if (!script) return { ...DEFAULT_CONFIG };

  let headers: Record<string, string> = {};
  const headersAttr = script.getAttribute('data-headers');
  if (headersAttr) {
    try {
      headers = JSON.parse(headersAttr);
    } catch {
      // Invalid JSON, ignore
    }
  }

  return {
    destination: script.getAttribute('data-destination') || DEFAULT_CONFIG.destination,
    interval: parseInt(script.getAttribute('data-interval') || '', 10) || DEFAULT_CONFIG.interval,
    eventCount: parseInt(script.getAttribute('data-event-count') || '', 10) || DEFAULT_CONFIG.eventCount,
    eventName: script.getAttribute('data-event-name') || DEFAULT_CONFIG.eventName,
    headers,
  };
}

let instance: FingerprintEncoder | null = null;

const api = {
  getFingerprint(): number[] {
    if (!instance) return [];
    return instance.getFingerprint();
  },

  send(): void {
    if (instance) instance.send();
  },

  pause(): void {
    if (instance) instance.pause();
  },

  resume(): void {
    if (instance) instance.resume();
  },

  destroy(): void {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  },

  init(config?: Partial<EncoderConfig>): void {
    if (instance) instance.destroy();
    const merged = { ...DEFAULT_CONFIG, ...config };
    instance = new FingerprintEncoder(merged);
  },
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as any).Encoder = api;

  const autoInit = () => {
    const config = parseConfigFromScript();
    api.init(config);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export default api;
export { FingerprintEncoder, EncoderConfig, DEFAULT_CONFIG };
