# Schematic Component Library

Reusable React TypeScript SVG parts for building industrial HMI schematics.

## Usage

```tsx
import {
  SchematicCanvas,
  Hopper,
  Pipe,
  Pump,
  Valve,
  Tank,
  Gauge,
  AlarmBeacon,
} from '../components/schematic'

export default function ProcessOverview() {
  return (
    <SchematicCanvas viewBox="0 0 900 420">
      <Hopper x={90} y={90} status="online" level={72} label="H-101" />
      <Pipe x={170} y={205} length={110} status="running" />
      <Valve x={320} y={205} status="online" open label="V-101" />
      <Pipe x={380} y={205} length={120} status="running" />
      <Pump x={560} y={205} status="running" rpm={1450} temperature={64} label="P-301" />
      <Pipe x={650} y={205} length={90} status="running" />
      <Tank x={790} y={95} status="online" level={61} temperature={67} label="T-201" />
      <Gauge x={770} y={315} status="online" value={5.2} max={8} unit="bar" label="PT-201" />
      <AlarmBeacon x={845} y={315} status="warning" active label="A-118" />
    </SchematicCanvas>
  )
}
```

## Component Pattern

Each equipment component renders an SVG `<g>` group and accepts `x`, `y`, `scale`, `status`, and `label`.
This makes the parts easy to place inside a larger schematic renderer.

## Pump Props

`Pump` is the centrifugal pump primitive.

- `status`: `online`, `running`, `ok`, `idle`, `warning`, `critical`, `offline`, or custom string.
- `rpm`: controls blade animation speed when operational.
- `temperature`: shown as a secondary readout.
- `x`, `y`: renderer coordinates.
- `scale`: optional SVG scale.
- `label`: optional equipment tag.

The pump uses animated SVG blades, dark industrial styling, and a glowing operational state.
