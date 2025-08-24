import React from 'react'
export default function HealthCheck() {
  const [ok, setOk] = React.useState<'idle'|'ok'|'fail'>('idle')
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user', { credentials:'include' })
        setOk(res.ok ? 'ok' : 'fail')
      } catch { setOk('fail') }
    })()
  }, [])
  return (
    <div style={{ position:'fixed', top:8, left:8, background:'#222', color:'#fff', padding:'6px 8px', borderRadius:6, fontSize:12 }}>
      /api/user: {ok}
    </div>
  )
}
