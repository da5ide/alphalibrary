'use client'

import { useState, useEffect, useRef } from 'react'

export default function AdminCatalogPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('ag_admin_pw')
    if (stored) {
      verify(stored, true)
    } else {
      setChecking(false)
    }
  }, [])

  const verify = async (pw: string, silent = false) => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    })
    const data = await res.json()
    if (data.ok) {
      sessionStorage.setItem('ag_admin_pw', pw)
      setAuthed(true)
    } else if (!silent) {
      setError('Wrong password.')
    }
    setChecking(false)
    return data.ok
  }

  const submit = async () => {
    setError('')
    await verify(password)
  }

  if (checking) return null

  if (!authed) {
    return (
      <div style={{minHeight:'100vh',background:'#f7f5f2',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,fontFamily:'-apple-system,sans-serif'}}>
        <h1 style={{fontSize:18,fontWeight:600,letterSpacing:'0.04em',color:'#1a1a1a',marginBottom:8}}>Alphagallery Catalog</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{border:'1.5px solid #e0dcd6',borderRadius:10,padding:'12px 16px',fontSize:15,width:280,outline:'none',background:'white',fontFamily:'inherit',boxSizing:'border-box' as const}}
        />
        {error && <p style={{fontSize:13,color:'#c0392b',margin:0}}>{error}</p>}
        <button onClick={submit} style={{background:'#1a1a1a',color:'white',border:'none',padding:'13px 0',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',width:280,fontFamily:'inherit'}}>
          Enter
        </button>
        <a href="/library/admin" style={{fontSize:12,color:'#888',textDecoration:'none',marginTop:4}}>← Back to admin</a>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      src="/library/admin/catalog/tool"
      style={{width:'100%',height:'100vh',border:'none',display:'block'}}
      title="Catalog tool"
    />
  )
}
