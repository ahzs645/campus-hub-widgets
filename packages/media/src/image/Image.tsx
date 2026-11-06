import { useState } from 'react';
import { useWidgetPreview, type WidgetComponentProps } from '@firstform/campus-hub-widget-sdk';
import { createDemoImage, DemoBadge, SourceUnavailable } from '@firstform/campus-hub-widgets-shared';
interface ImageConfig { url?: string; alt?: string; fit?: 'cover' | 'contain' | 'fill'; }
const DEMO_IMAGE = createDemoImage('Campus life');
export default function ImageWidget({ config }: WidgetComponentProps) {
  const preview = useWidgetPreview();
  const imageConfig = config as ImageConfig | undefined;
  const configuredUrl = imageConfig?.url?.trim() || '';
  const isDemo = preview || !configuredUrl;
  const url = isDemo ? DEMO_IMAGE : configuredUrl;
  const [failedUrl, setFailedUrl] = useState('');
  return <div className="relative h-full w-full overflow-hidden rounded-lg">
    {failedUrl === url && !isDemo ? <SourceUnavailable label="Image" /> : <img src={url} alt={isDemo ? 'Sample campus artwork' : imageConfig?.alt || 'Image'} className="h-full w-full" style={{ objectFit: imageConfig?.fit || 'cover' }} onError={() => setFailedUrl(url)} />}
    {isDemo && <DemoBadge />}
  </div>;
}
