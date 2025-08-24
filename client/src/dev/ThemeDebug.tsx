import React from 'react';

export default function ThemeDebug() {
  if (import.meta.env.PROD) return null;

  const read = () => ({
    attr: document.documentElement.getAttribute('data-theme'),
    dark: document.documentElement.classList.contains('dark'),
    b1: getComputedStyle(document.documentElement).getPropertyValue('--b1').trim(),
    b2: getComputedStyle(document.documentElement).getPropertyValue('--b2').trim(),
    bc: getComputedStyle(document.documentElement).getPropertyValue('--bc').trim(),
  });

  const [info, setInfo] = React.useState(read());

  React.useEffect(() => {
    const obs = new MutationObserver(() => setInfo(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{
      position: 'fixed', right: 8, bottom: 8, fontSize: 12,
      padding: '6px 8px', background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 6, zIndex: 99999
    }}>
      <div>theme: <b>{info.attr}</b></div>
      <div>dark class: {String(info.dark)}</div>
      <div>--b2: {info.b2}</div>
      <div>--bc: {info.bc}</div>
    </div>
  );
}
