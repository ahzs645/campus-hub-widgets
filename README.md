# Campus Hub Widgets

Widget packages for the Campus Hub Engine, organized by category.

## Packages

| Package | Widgets |
|---------|---------|
| `@firstform/campus-hub-widgets-time` | Clock, Countdown, Time Progress, Holiday Calendar, F1 Countdown, Word Clock |
| `@firstform/campus-hub-widgets-environment` | Weather, Air Quality, UV Index, Fire Hazard, Aurora Forecast, Drought Level, Groundwater Level, Satellite View |
| `@firstform/campus-hub-widgets-campus` | Cafeteria Menu, Club Spotlight, Confessions, Group Fitness, Library Availability, Job Board, Events List, Climbing Gym, Google Calendar |
| `@firstform/campus-hub-widgets-transit` | Bus Connection |
| `@firstform/campus-hub-widgets-info` | News Ticker, Exchange Rate, Crypto Tracker, ISS Tracker, RSS Reader, Home Assistant |
| `@firstform/campus-hub-widgets-media` | Poster Carousel, Poster Feed, Slideshow, Image, Media Player, Radio Station, YouTube, Web, Rich Text |
| `@firstform/campus-hub-widgets-fun` | Nothing Glyph, Bottle Spin, Rock Paper Scissors, Kaomoji, Coin Dice, Word of the Day, Flashcard |
| `@firstform/campus-hub-widgets-utility` | QR Code, Widget Stack, Simple Table |

## Usage

Install the widgets you need:

```bash
npm install @firstform/campus-hub-widgets-time @firstform/campus-hub-widgets-environment
```

That is the whole integration step. Each package declares
`campusHub.widgets` in its `package.json`, and the host's Vite plugin
(`campusHubWidgets()` from the SDK) discovers every installed package and
generates `virtual:campus-hub-widgets`. There is no registration file to edit.

## Repository layout

This is an npm workspace; every package under `packages/` is a workspace
member. Each external dependency is declared **once**, by the package that
imports it — never re-declared at the root or in a host, which would make the
installer produce a second, nested copy that silently wins for that package.

A widget is two files plus its component:

```
packages/<category>/src/<widget>/
  meta.ts          manifest + loaders. No component or library imports.
  <Widget>.tsx     the component, reached only via meta's load()
  <Widget>Options.tsx   optional bespoke options UI, reached via loadOptions()
```

`meta.ts` is loaded by every host that reads the widget catalogue, so keeping
it free of heavy imports is what keeps them out of the entry bundle. Across
this repo that is the difference between a 1.67 MB and an 81 kB entry chunk.

## Development

```bash
npm install      # links workspaces, installs each package's own deps
npm test
npm run typecheck
```

The widget SDK is an **optional peer dependency**: the host supplies it, so it
is not installed here. Tests that need it run in the host repo instead.

Never run `npm install` inside this repo while it is checked out as a submodule
of a host — the nested `node_modules` shadows the host's copies for these
packages only, which produces failures that look impossible.

## Building a widget

See [`docs/authoring-widgets.md`](https://github.com/ahzs645/campus-hub-widget-sdk/blob/main/docs/authoring-widgets.md)
in the SDK for the package contract, dependency rules, and a starter template.
Widgets do not have to live in this repository — the same contract works from
a repository you own.
