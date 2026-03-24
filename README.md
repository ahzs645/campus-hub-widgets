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
| `@firstform/campus-hub-widgets-media` | Poster Carousel, Poster Feed, Slideshow, Image, Media Player, YouTube, Web, Rich Text |
| `@firstform/campus-hub-widgets-fun` | Nothing Glyph, Bottle Spin, Rock Paper Scissors, Kaomoji, Coin Dice, Word of the Day, Flashcard |
| `@firstform/campus-hub-widgets-utility` | QR Code, Widget Stack, Simple Table |

## Usage

Install the widgets you need:

```bash
npm install @firstform/campus-hub-widgets-time @firstform/campus-hub-widgets-environment
```

Import in your app entry point to register widgets:

```typescript
import '@firstform/campus-hub-widgets-time';
import '@firstform/campus-hub-widgets-environment';
```

## Building a Widget

See [@firstform/campus-hub-widget-sdk](https://github.com/firstform/campus-hub-widget-sdk) for the widget development SDK.
