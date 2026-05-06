# Encoder

A TensorFlow.js-based behavioral fingerprint encoder that generates a continuously-updated 32-dimensional fingerprint from user browser events. The fingerprint is computed via a GRU recurrent neural network and POSTed to a configurable endpoint.

## How It Works

1. **Collect** - DOM events (clicks, mouse movements, scrolling, keystrokes, navigation) are captured in real-time
2. **Encode** - Each event is normalized into a feature vector and fed through a GRU encoder that maintains a 32-dim hidden state
3. **Emit** - The fingerprint is POSTed to your endpoint on configurable triggers (time interval, event count, session end)

The fingerprint is a rolling representation of user behavior -- it's always current and always available.

## Quick Start (Script Tag)

```html
<script
  src="https://cdn.example.com/encoder.min.js"
  data-endpoint="https://api.example.com/fingerprint"
  data-interval="30000"
  data-event-count="100"
  data-headers='{"Authorization":"Bearer YOUR_TOKEN"}'
></script>
```

The encoder auto-initializes when the script loads with a `data-endpoint` attribute.

## Configuration

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-endpoint` | (required) | URL to POST fingerprint payloads to |
| `data-interval` | `30000` | Emit every N milliseconds (0 to disable) |
| `data-event-count` | `100` | Emit every N events (0 to disable) |
| `data-headers` | `{}` | JSON object of custom HTTP headers |

## JavaScript API

The encoder exposes `window.Encoder` for manual control:

```javascript
// Get the current 32-dimensional fingerprint
const fp = window.Encoder.getFingerprint();
// => [0.123, -0.456, 0.789, ...] (32 numbers)

// Manually trigger a POST to the configured endpoint
window.Encoder.send();

// Pause event collection and emission
window.Encoder.pause();

// Resume collection and emission
window.Encoder.resume();

// Programmatic initialization (alternative to data-* attributes)
window.Encoder.init({
  endpoint: 'https://api.example.com/fingerprint',
  interval: 30000,
  eventCount: 100,
  headers: { 'Authorization': 'Bearer token' },
});

// Tear down and clean up
window.Encoder.destroy();
```

## Payload Format

Each POST sends a JSON body:

```json
{
  "fingerprint": [0.123, -0.456, 0.789, "... 32 floats total"],
  "timestamp": 1700000000000,
  "sessionId": "m1abc123-x7yz9w",
  "triggerType": "interval"
}
```

`triggerType` is one of: `"interval"`, `"event_count"`, `"session_end"`, `"manual"`.

## Events Captured

| Category | Source | Sampling |
|----------|--------|----------|
| Mouse movement | `mousemove` | Throttled to ~10Hz |
| Clicks | `click` | Every click |
| Scrolling | `scroll` | Throttled to ~7Hz |
| Keystrokes | `keydown` | Timing only (no content) |
| Form submit | `submit` | Every submit |
| Navigation | `popstate`, `hashchange` | Every navigation |
| Visibility | `visibilitychange` | State changes |

**Privacy**: No PII is captured. The encoder records event types, coordinates, timestamps, and timing deltas only -- never text content, element IDs, or user data.

## Building from Source

```bash
# Install dependencies
npm install

# Generate model weights and build the full bundle (includes TF.js)
npm run build
# Output: dist/encoder.min.js (~877KB, ~180KB gzipped)

# Build slim version (requires TF.js loaded separately via CDN)
npm run build:slim
# Output: dist/encoder.slim.js (~15KB gzipped)
```

For the slim build, load TF.js from a CDN before the encoder script:

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4/dist/tf.min.js"></script>
<script src="encoder.slim.js" data-endpoint="..."></script>
```

## Architecture

```
DOM Events → EventCollector → FeatureExtractor → GRU Encoder → 32-dim State
                                                                    ↓
                                                          TriggerManager
                                                                    ↓
                                                          HTTP Sender → POST
```

The GRU encoder processes events one at a time, updating its 32-dimensional hidden state with each event. This state vector is the fingerprint -- a compact, continuous representation of the user's behavioral patterns up to that point.

## Model Details

- **Architecture**: Single-layer GRU (16-dim input, 32-dim hidden)
- **Parameters**: 4,704 total (18.8KB)
- **Initialization**: Deterministic Xavier/Glorot with fixed seed (42)
- **Inference**: One GRU step per event (~0.1ms on modern hardware)

## License

MIT
