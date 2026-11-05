/** Self-contained artwork for sample widgets. Never requests a remote asset. */
export function createDemoImage(label = 'Campus life', variant = 0): string {
  const colors = [['#183b56', '#46bfa4'], ['#4a256b', '#dc83a5'], ['#895e28', '#e5b966'], ['#214c62', '#8bc7db']][Math.abs(variant) % 4];
  const text = label.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]!));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="800" height="600" fill="url(#bg)"/><circle cx="650" cy="130" r="92" fill="white" opacity=".22"/><path d="M0 450 190 220 390 430 550 300 800 520V600H0Z" fill="white" opacity=".17"/><path d="M0 520 300 340 500 500 690 390 800 470V600H0Z" fill="white" opacity=".18"/><text x="58" y="510" fill="white" font-family="sans-serif" font-size="38" font-weight="700">${text}</text><text x="60" y="548" fill="white" opacity=".8" font-family="sans-serif" font-size="19">Sample artwork · Demo</text></svg>`)}`;
}

export function DemoBadge() {
  return <span className="absolute right-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">Demo</span>;
}
