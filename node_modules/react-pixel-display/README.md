# react-pixel-display

LED matrix display simulator for React and vanilla JavaScript. Renders pixel-based text and effects on canvas, ImageData, or SVG with glow, animations, and BDF font support.

## Install

```bash
npm install react-pixel-display
```

## React Usage

```jsx
import { PixelDisplay } from 'react-pixel-display';

function App() {
  return (
    <PixelDisplay
      text="HELLO"
      width={64}
      height={16}
      foregroundColor="#ff6600"
      effect="fixed"
      glow
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `64` | Display width in pixels |
| `height` | `number` | `16` | Display height in pixels |
| `text` | `string` | — | Text to render |
| `pixels` | `HexColor[]` | — | Direct pixel data (overrides text) |
| `font` | `'legacy' \| 'canvas' \| 'bdf'` | `'legacy'` | Font renderer to use |
| `fontName` | `string` | `'VCR_OSD_MONO'` | Font name for canvas/bdf rendering |
| `foregroundColor` | `string` | `'#ff6600'` | Text/pixel color |
| `backgroundColor` | `string` | `'#111'` | Background color |
| `effect` | `EffectName` | `'fixed'` | Display effect |
| `speed` | `number` | `50` | Effect animation speed |
| `renderer` | `'imagedata' \| 'canvas' \| 'svg'` | `'imagedata'` | Rendering backend |
| `glow` | `boolean` | `true` | Enable LED glow effect |
| `scale` | `number` | `8` | Pixel scale factor |
| `pixelGap` | `number` | `0.15` | Gap between pixels |

### Ref API

```jsx
const ref = useRef(null);

<PixelDisplay ref={ref} text="HELLO" />

ref.current.start();   // Start animation
ref.current.stop();    // Stop animation
ref.current.isRunning(); // Check animation state
```

## Vanilla JS Usage

```js
import { CanvasLEDRenderer, textToPixels } from 'react-pixel-display/core';

const renderer = new CanvasLEDRenderer(container, { width: 64, height: 16, glow: true });
const pixels = textToPixels('HELLO', 64, 16, '#ff6600', '#111');
renderer.setData(pixels);
renderer.renderStatic();
```

## Effects

### Text Effects
`fixed`, `scroll_ltr`, `scroll_rtl`, `blink`, `breeze`, `snow`, `laser`, `fade`, `typewriter`, `bounce`, `sparkle`

### Ambient Effects
`rainbow`, `matrix`, `plasma`, `gradient`, `fire`, `water`, `stars`, `confetti`, `plasma_wave`, `radial_pulse`, `hypnotic`, `lava`, `aurora`

### Color Effects
`color_cycle`, `rainbow_text`, `neon`

## Renderers

- **ImageData** (`imagedata`) — Fast pixel-level rendering via canvas ImageData
- **Canvas** (`canvas`) — Standard canvas 2D drawing
- **SVG** (`svg`) — SVG-based rendering

## License

MIT
