import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'word-clock',
    name: 'Word Clock',
    description: 'Display time as illuminated words on a letter grid',
    icon: 'type',
    minW: 2,
    minH: 2,
    maxW: 5,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: { glow: true, inactiveOpacity: 15 },
    // Demonstrates the declarative options schema: auto-rendered by the editor
    // via SchemaOptionsForm (no bespoke OptionsComponent needed).
    optionsSchema: [
      {
        name: 'glow',
        label: 'Glow active words',
        fieldType: 'boolean',
        default: true,
        section: 'Appearance',
      },
      {
        name: 'inactiveOpacity',
        label: 'Inactive letter opacity',
        fieldType: 'number',
        default: 15,
        min: 0,
        max: 100,
        unit: '%',
        section: 'Appearance',
        helpText: 'How visible the unlit letters are (0–100%).',
      },
    ],
  },
  load: () => import('./WordClock'),
});
