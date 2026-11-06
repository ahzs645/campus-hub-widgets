import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-translation',
    name: 'macOS Translate',
    description: 'Aqua-style translation desk with live text conversion',
    icon: 'languages',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    tags: ['retro', 'info'],
    acceptsSources: [{ propName: 'apiUrl', types: ['api'], capabilityHint: 'MyMemory-compatible translation endpoint.' }],
    defaultProps: {
      apiUrl: '',
      fromLang: 'en',
      toLang: 'fr',
    },
  },
  load: () => import('./MacOSTranslation'),
  loadOptions: () => import('./MacOSTranslationOptions'),
});

