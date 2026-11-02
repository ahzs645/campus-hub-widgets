# Campus Hub Widgets

Widget packages for the Campus Hub Engine, organized by category.

## Packages

| Package | Widgets |
|---------|---------|
| `@firstform/campus-hub-widgets-time` | Clock, Countdown, F1 Countdown, Holiday Calendar, Time Progress, Word Clock |
| `@firstform/campus-hub-widgets-environment` | Air Quality, Aurora Forecast, Drought Level, Fire Hazard Rating, Gas Prices, Groundwater Level, Satellite View, Sunset / Sunrise, UV Index, Weather |
| `@firstform/campus-hub-widgets-campus` | Cafeteria Menu, Calendar, Climbing Gym, Club Spotlight, Confessions, Events List, Google Calendar, Group Fitness, Job Board, Library Availability |
| `@firstform/campus-hub-widgets-transit` | Bus Connection |
| `@firstform/campus-hub-widgets-info` | Crypto Tracker, Daily Horoscope, Exchange Rate, Home Assistant, ISS Tracker, News Ticker, RSS Reader, Stock Quotes, Team Schedule |
| `@firstform/campus-hub-widgets-media` | Canva, Google Sheets, Image, Media Player, Poster Carousel, Poster Feed, PowerPoint, Radio Station, Rich Text, Slideshow, Stream Player, Web Embed, Web Region, YouTube |
| `@firstform/campus-hub-widgets-fun` | Bottle Spin, Coin & Dice, Flashcard, Fortune Cookie, Kaomoji, Nothing Glyph, Rock Paper Scissors, Trivia Game, Word of the Day |
| `@firstform/campus-hub-widgets-utility` | QR Code, Simple Table, Widget Stack, WiFi Share |
| `@firstform/campus-hub-widgets-macos` | Dashboard Clock, Dashboard Weather, macOS Calendar, macOS Dictionary, macOS iPod, macOS Sticky Note, macOS Stocks, macOS Translate |

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

`packages/shared` (`@firstform/campus-hub-widgets-shared`) is the one
workspace member that is not a widget package: it declares no
`campusHub.widgets` entry, so discovery skips it. It holds UI pieces several
widget packages import, such as `SourceUnavailable`, the state a widget shows
when its *configured* source fails and it has no last-good data. Widgets only
ever show their built-in demo data when no source is configured, and always
with a "Demo" badge.

## Development

```bash
npm install      # links workspaces, installs each package's own deps
npm test
npm run typecheck
```

The widget SDK is an **optional peer dependency** of each widget package: the
host supplies it. For standalone checks only, the workspace root installs it
as a dev dependency from GitHub (with `react-dom` and its types, which the SDK
needs), so `npm run typecheck` covers every package and `npm test` can run
SDK-dependent tests here. These root dev dependencies are never installed by a
host, which only installs the individual packages.

Never run `npm install` inside this repo while it is checked out as a submodule
of a host — the nested `node_modules` shadows the host's copies for these
packages only, which produces failures that look impossible.

## Building a widget

See [`docs/authoring-widgets.md`](https://github.com/ahzs645/campus-hub-widget-sdk/blob/main/docs/authoring-widgets.md)
in the SDK for the package contract, dependency rules, and a starter template.
Widgets do not have to live in this repository — the same contract works from
a repository you own.
