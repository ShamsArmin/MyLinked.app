import React from 'react'

function readTheme() {
  const de = document.documentElement
  const style = getComputedStyle(de)
  return {
    dataTheme: de.getAttribute('data-theme'),
    hasDarkClass: de.classList.contains('dark'),
    b1: style.getPropertyValue('--b1').trim(),
    b2: style.getPropertyValue('--b2').trim(),
    bc: style.getPropertyValue('--bc').trim(),
  }
}

export default function BootDiagnostics() {
  if (import.meta.env.PROD && !import.meta.env.VITE_SHOW_BOOT) return null
  const [info, setInfo] = React.useState(readTheme())
  React.useEffect(() => {
    const obs = new MutationObserver(() => setInfo(readTheme()))
    obs.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','class'] })
    return () => obs.disconnect()
  }, [])
  return (
    <div style={{
      position:'fixed', bottom:8, right:8, background:'rgba(0,0,0,.7)',
      color:'#fff', padding:'8px 10px', fontSize:12, borderRadius:6, zIndex:99999
    }}>
      <div>data-theme: <b>{info.dataTheme}</b></div>
      <div>dark class: {String(info.hasDarkClass)}</div>
      <div>--b2: {info.b2}</div>
      <div>--bc: {info.bc}</div>
    </div>
  )
}
