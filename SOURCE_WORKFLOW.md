# Widget sources and samples

Live content comes from a source selected in the host's Sources library. The same picker offers the Source Store and Add source in supported editors, including template creation. Source-specific URLs, station identities, and provider presets belong to the source catalog; the widget manifest declares which source types it accepts.

Unconfigured widgets show local sample content marked Demo. Gallery and editor previews also use the SDK WidgetPreviewProvider to force sample mode even if a saved widget has a live source. Sample artwork is an inline SVG from widgets-shared and does not download media. Local clocks, games, and manual content need no source.

To connect real content, choose a saved source, import a supported source from the Store, or create a source in the shared modal. Standalone hosts may use the URL field in widget options. Configured source failures show an error or the last successfully loaded data with a failure notice; they never substitute sample records.

The F1 schedule, macOS stock quotes, dictionary, translation, remote glyph animations, and macOS weather now accept saved source URLs. Existing explicit media URLs, calendar IDs/API keys, and explicit weather location lookups remain usable. Old preset-only configurations without a saved URL require selecting a source.

Collections use stable item IDs and SDK __sourceRefs references. Slideshow links populate slides as {id, url, caption}; Poster Carousel links populate posters as {id, image, title}. Re-selecting a managed image updates that item, and manual items remain intact. These IDs allow a host to propagate later source URL changes to the correct item.

Environment, information, and transit widgets follow the same source workflow. Bus Connection accepts a saved GTFS ZIP URL and an optional realtime URL from source metadata. Its unconfigured display uses a local fake trip schedule marked Demo; a configured feed failure reports unavailable and never falls back to the packaged timetable. Older explicit provider credentials, location coordinates, and dataset IDs retain their provider implementation paths where supported; newly created widget manifests keep source URLs empty.
