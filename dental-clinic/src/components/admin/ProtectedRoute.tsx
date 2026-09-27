import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'unauthorized' }
  | { status: 'authorized' }

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let mounted = true

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return
      if (!session?.user) {
        setAuth({ status: 'unauthenticated' })
        return
      }

      // Admin access is controlled ONLY by admin_users.user_id — never by email.
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        console.error('Admin check failed:', error.message)
        setAuth({ status: 'unauthorized' })
        return
      }
      setAuth({ status: data ? 'authorized' : 'unauthorized' })
    }

    check()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setAuth({ status: 'unauthenticated' })
      else check()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (auth.status === 'loading') {
    return (
      <div className="loading-wrap">
        <div>
          <div className="spinner" />
          <p>Verifying admin access…</p>
        </div>
      </div>
    )
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />
  }

  if (auth.status === 'unauthorized') {
    return (
      <div className="loading-wrap">
        <div style={{ maxWidth: 440, padding: 24 }}>
          <div className="big" style={{ fontSize: '2.6rem', marginBottom: 12 }}>
            🔒
          </div>
          <h2 style={{ color: '#0f172a', marginBottom: 8 }}>Not authorized</h2>
          <p style={{ marginBottom: 20 }}>
            You are signed in, but you are not authorized as an admin.
          </p>
          <button
            className="btn btn-outline btn-sm"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/admin/login'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
