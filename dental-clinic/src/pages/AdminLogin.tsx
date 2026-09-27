import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // If already signed in, bounce to the dashboard (the route guard re-verifies admin access).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin', { replace: true })
      else setChecking(false)
    })
  }, [navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate('/admin', { replace: true })
  }

  if (checking) {
    return (
      <div className="loading-wrap">
        <div>
          <div className="spinner" />
          <p>Checking session…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card">
          <div className="card-pad">
            <div className="login-logo">
              <span className="brand-mark" aria-hidden>
                🦷
              </span>
              Clinic Admin
            </div>
            <h1>Welcome back</h1>
            <p className="login-sub">
              Sign in with your clinic administrator account.
            </p>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clinic.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p style={{ marginTop: 18, textAlign: 'center' }}>
              <a href="/" className="muted" style={{ fontSize: '0.88rem' }}>
                ← Back to the website
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
