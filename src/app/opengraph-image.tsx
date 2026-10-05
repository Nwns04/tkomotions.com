import { ImageResponse } from 'next/og';

export const alt = 'TKO Motions: Business Innovation and Digital Solutions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'flex-end', padding: '72px', background: '#142a1d', color: '#fff', fontSize: 64, fontWeight: 700 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><span style={{ color: '#b9f337', fontSize: 24 }}>TKO MOTIONS / NIGERIA</span><span>WHAT NEEDS TO MOVE?</span><span style={{ fontSize: 25, fontWeight: 400 }}>Business Innovation &amp; Digital Solutions</span></div></div>, size);
}