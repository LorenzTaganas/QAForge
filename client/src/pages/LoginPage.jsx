import { useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const capabilities = [
  'Requirement traceability',
  'Test execution workflows',
  'Defect tracking and triage',
  'Release confidence analytics',
]

const getSafeDestination = (location) => {
  const from = location.state?.from

  if (!from || typeof from.pathname !== 'string' || !from.pathname.startsWith('/') || from.pathname.startsWith('//')) {
    return '/'
  }

  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const nextErrors = {}
    const email = formData.email.trim()

    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = 'Enter a valid work email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setApiError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading || !validateForm()) {
      return
    }

    setLoading(true)
    setApiError('')

    try {
      await login(formData.email.trim(), formData.password)
      navigate(getSafeDestination(location), { replace: true })
    } catch (error) {
      if (error.response?.status === 401) {
        setApiError('We could not sign you in with those credentials.')
      } else if (!error.response) {
        setApiError('Unable to reach QAForge. Check your connection and try again.')
      } else {
        setApiError('Sign-in is temporarily unavailable. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page min-h-screen bg-[#070B14] px-4 py-6 text-[#DDE5F2] sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto grid min-h-[560px] w-full max-w-6xl overflow-hidden rounded-2xl border border-[#2B416C] bg-[#101726]/90 backdrop-blur-xl shadow-[0_28px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(0,240,255,0.15)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-[#233352] bg-[#0A101E] p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="relative z-10">
            <BrandMark />
            <div className="mt-16 max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-3 py-1.5 text-xs font-medium text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <ShieldCheck size={14} aria-hidden="true" />
                Sci-Fi QA Command Center
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Quality starts with <span className="bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] bg-clip-text text-transparent">confidence</span>.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-[#8B97A9]">
                Manage issues, organize test cases, execute test runs, and track software quality in an immersive glassmorphic workspace.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#00F0FF]">Isometric QA capabilities</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {capabilities.map((capability) => (
                <div key={capability} className="flex items-center gap-2 text-sm text-[#DDE5F2]">
                  <CheckCircle2 size={15} className="shrink-0 text-[#00F0FF]" aria-hidden="true" />
                  {capability}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full border border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,240,255,0.1)]" />
          <div className="pointer-events-none absolute -bottom-8 -right-4 h-48 w-48 rounded-full border border-[#3B82F6]/20" />
          <div className="pointer-events-none absolute right-12 top-32 grid w-56 grid-cols-3 gap-2 opacity-80">
            {['#00F0FF', '#3B82F6', '#8B5CF6', '#233352', '#00F0FF', '#172138'].map((color, index) => (
              <div key={`${color}-${index}`} className="h-10 rounded-lg border border-[#2B416C] bg-[#101726]/80 p-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: color }} />
                <div className="mt-2 h-1 w-full rounded-full bg-[#233352]" />
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#101726]/70">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <BrandMark />
            </div>
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#00F0FF]">QAForge command access</p>
              <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#8B97A9]">Sign in to enter your sci-fi QA workspace.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#8B97A9]" aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-[#2B416C] bg-[#070B14]/90 py-3 pl-10 pr-3 text-sm text-white placeholder-[#8B97A9] outline-none transition focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                </div>
                {errors.email && <p id="email-error" className="mt-2 text-xs text-red-400" role="alert">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-white">Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#8B97A9]" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#2B416C] bg-[#070B14]/90 py-3 pl-10 pr-11 text-sm text-white placeholder-[#8B97A9] outline-none transition focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-[#8B97A9] transition hover:bg-[#172138] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="mt-2 text-xs text-red-400" role="alert">{errors.password}</p>}
              </div>

              {apiError && (
                <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3.5 py-3 text-sm text-red-300" role="alert">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#070B14]/40 border-t-[#070B14]" aria-hidden="true" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to Command Center
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 border-t border-[#233352] pt-5 text-center text-xs leading-5 text-[#8B97A9]">
              Need access to QAForge? Contact your workspace administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

const BrandMark = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#3B82F6] text-lg font-bold text-[#070B14] shadow-[0_0_20px_rgba(0,240,255,0.4)]">Q</div>
    <div>
      <div className="text-lg font-bold tracking-wider text-white">QAForge</div>
      <div className="text-xs text-[#00F0FF]">Sci-Fi QA Platform</div>
    </div>
  </div>
)

export default LoginPage
