import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'rich-text',
    name: 'Rich Text',
    description: 'Auto-scrolling rich text announcements',
    icon: 'newspaper',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    defaultProps: {
      content: '',
      scrollSpeed: 40,
      fontSize: 16,
      textColor: '',
      scrollDirection: 'up',
      pauseOnHover: false,
    },
  },
  load: () => import('./RichText'),
  loadOptions: () => import('./RichTextOptions'),
});
