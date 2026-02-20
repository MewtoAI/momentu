'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SparkleIcon } from '@/components/icons'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnUrl = searchParams.get('returnUrl') || '/criar'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-serif text-2xl text-[#2C1810] mb-2">Verifique seu e-mail</h2>
        <p className="text-[#2C1810]/60">
          Enviamos um link de acesso para <strong>{email}</strong>
        </p>
        <p className="text-sm text-[#2C1810]/40 mt-2">Clique no link para continuar.</p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-[#C9607A] hover:underline"
        >
          Usar outro e-mail
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-[#2C1810]/60 mb-1">Seu e-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          required
          className="w-full px-4 py-3 rounded-xl border border-[#2C1810]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9607A]/30 text-[#2C1810]"
        />
      </div>

      {error && (
        <p className="text-rose-600 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9607A] text-white py-3 rounded-full font-medium hover:bg-[#b54d68] transition-colors disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Receber link de acesso'}
      </button>

      <p className="text-xs text-center text-[#2C1810]/40">
        Sem senha. Enviamos um link seguro para seu e-mail.
      </p>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-[#2C1810]/40 hover:text-[#2C1810]/60 transition-colors mt-2"
      >
        ← Voltar
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <SparkleIcon size={20} color="#C9607A" animate />
            <span className="font-serif text-xl text-[#2C1810]">momentu</span>
          </div>
          <h1 className="font-serif text-2xl text-[#2C1810] mb-2">Entrar na sua conta</h1>
          <p className="text-[#2C1810]/50 text-sm">Ou criar uma nova — é grátis</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2C1810]/5">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-[#2C1810]/40">Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
