import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-sticky-note',
    name: 'macOS Sticky Note',
    description: 'Classic macOS note paper for quick reminders',
    icon: 'info',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 3,
    tags: ['retro', 'utility'],
    defaultProps: {
      title: 'Sticky note',
      text: 'Add a reminder…',
      color: '#fff8a6',
    },
  },
  load: () => import('./MacOSStickyNote'),
  loadOptions: () => import('./MacOSStickyNoteOptions'),
});
