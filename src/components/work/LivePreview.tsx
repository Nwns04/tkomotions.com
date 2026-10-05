export function LivePreview({ url, title }: { url: string; title: string }) {
  return <div className="site-preview"><iframe src={url} title={`${title} live preview`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><a className="site-preview-link" href={url} target="_blank" rel="noreferrer">OPEN FULL SYSTEM ↗</a></div>;
}