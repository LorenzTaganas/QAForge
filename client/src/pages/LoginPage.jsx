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
    <main className="auth-page min-h-screen bg-[#0D1119] px-4 py-6 text-[#DDE5F2] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[#20283A] bg-[#171B25] shadow-[0_28px_80px_rgba(0,0,0,0.42)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-[#20283A] bg-[#111722] p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="relative z-10">
            <BrandMark />
            <div className="mt-20 max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4B8DFF]/30 bg-[#28559A]/20 px-3 py-1.5 text-xs font-medium text-[#B7D5FF]">
                <ShieldCheck size={14} aria-hidden="true" />
                Quality operations, connected
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#F4F7FB] xl:text-5xl">
                Quality starts with confidence.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-[#A3A8B7]">
                Manage issues, organize test cases, execute test runs, and track software quality in one workspace.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#78849A]">Built for your QA workflow</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {capabilities.map((capability) => (
                <div key={capability} className="flex items-center gap-2 text-sm text-[#AAB5C7]">
                  <CheckCircle2 size={15} className="shrink-0 text-[#4B8DFF]" aria-hidden="true" />
                  {capability}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full border border-[#4B8DFF]/15" />
          <div className="pointer-events-none absolute -bottom-8 -right-4 h-48 w-48 rounded-full border border-[#4B8DFF]/10" />
          <div className="pointer-events-none absolute right-12 top-32 grid w-56 grid-cols-3 gap-2 opacity-70">
            {['#4B8DFF', '#49C2B1', '#FFB454', '#5D7699', '#4B8DFF', '#8A90A4'].map((color, index) => (
              <div key={`${color}-${index}`} className="h-10 rounded-md border border-[#20283A] bg-[#171B25] p-2">
                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: color }} />
                <div className="mt-2 h-1 w-full rounded-full bg-[#20283A]" />
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <BrandMark />
            </div>
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6EA8FF]">QAForge workspace</p>
              <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#F4F7FB]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#AAB5C7]">Sign in to continue to your QAForge workspace.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#DDE5F2]">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#78849A]" aria-hidden="true" />
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
                    className="w-full rounded-lg border border-[#2B3345] bg-[#111722] py-3 pl-10 pr-3 text-sm text-[#F4F7FB] placeholder-[#66748A] outline-none transition focus:border-[#4B8DFF] focus:ring-2 focus:ring-[#4B8DFF]/20"
                  />
                </div>
                {errors.email && <p id="email-error" className="mt-2 text-xs text-[#F08C8C]" role="alert">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#DDE5F2]">Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#78849A]" aria-hidden="true" />
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
                    className="w-full rounded-lg border border-[#2B3345] bg-[#111722] py-3 pl-10 pr-11 text-sm text-[#F4F7FB] placeholder-[#66748A] outline-none transition focus:border-[#4B8DFF] focus:ring-2 focus:ring-[#4B8DFF]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-[#78849A] transition hover:bg-[#20283A] hover:text-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B8DFF]"
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="mt-2 text-xs text-[#F08C8C]" role="alert">{errors.password}</p>}
              </div>

              {apiError && (
                <div className="rounded-lg border border-[#A6535B]/50 bg-[#612D35]/20 px-3.5 py-3 text-sm text-[#F3A5A5]" role="alert">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3F7FEA] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(63,127,234,0.22)] transition hover:bg-[#5792F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8BB8FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171B25] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 border-t border-[#20283A] pt-5 text-center text-xs leading-5 text-[#78849A]">
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
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3F7FEA] text-lg font-bold text-white shadow-[0_8px_20px_rgba(63,127,234,0.25)]">Q</div>
    <div>
      <div className="text-lg font-semibold tracking-tight text-[#F4F7FB]">QAForge</div>
      <div className="text-xs text-[#78849A]">Quality management platform</div>
    </div>
  </div>
)

export default LoginPage
