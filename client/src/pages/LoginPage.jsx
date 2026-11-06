import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TestTube2,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const getSafeDestination = (location) => {
  const from = location.state?.from
  if (!from || typeof from.pathname !== 'string' || !from.pathname.startsWith('/') || from.pathname.startsWith('//')) {
    return '/'
  }
  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}

const Brand = ({ compact = false }) => (
  <div className="flex items-center gap-2.5">
    <span className={`flex items-center justify-center rounded-md bg-qf-primary font-bold text-[#0F1016] ${compact ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-base'}`}>Q</span>
    <span className={`font-semibold tracking-tight text-qf-text ${compact ? 'text-sm' : 'text-base'}`}>QAForge</span>
  </div>
)

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
    if (!email) nextErrors.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (!formData.password) nextErrors.password = 'Password is required.'
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
    if (loading || !validateForm()) return
    setLoading(true)
    setApiError('')
    try {
      await login(formData.email.trim(), formData.password)
      navigate(getSafeDestination(location), { replace: true })
    } catch (error) {
      if (error.response?.status === 401) setApiError('Those credentials did not match an account in this workspace.')
      else if (!error.response) setApiError('Unable to reach QAForge. Check the API server and your connection.')
      else setApiError('Sign-in is temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-qf-bg text-qf-text">
      <section className="relative hidden w-[45%] flex-col justify-between border-r border-qf-border bg-qf-sidebar p-10 lg:flex xl:p-14">
        <Brand />

        <div className="max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-qf-border bg-qf-surface px-2.5 py-1 text-[11px] font-medium text-qf-secondary">
            <ShieldCheck size={13} className="text-qf-primary" />
            Quality assurance workspace
          </p>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-qf-text xl:text-[2.75rem]">
            Quality starts with confidence.
          </h1>
          <p className="mt-4 text-sm leading-6 text-qf-secondary">
            Manage issues, organize test cases, execute test runs, and track software quality in one workspace.
          </p>

          <div className="mt-10 space-y-2.5">
            <div className="rounded-lg border border-qf-border bg-qf-surface p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-qf-text">
                  <TestTube2 size={14} className="text-qf-primary" />
                  Authentication regression
                </span>
                <span className="rounded border border-qf-success/30 bg-qf-success/10 px-1.5 py-0.5 text-[10px] font-medium text-qf-success">Passing</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-qf-card">
                <div className="h-full w-[86%] rounded-full bg-qf-success" />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-qf-muted">
                <span>24 of 28 cases executed</span>
                <span>86% pass rate</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-qf-border bg-qf-surface p-3.5">
                <div className="flex items-center gap-2 text-[10px] text-qf-muted">
                  <BarChart3 size={12} /> Open defects
                </div>
                <p className="mt-2 text-xl font-semibold text-qf-text">7</p>
                <p className="mt-0.5 text-[10px] text-qf-warning">2 critical to triage</p>
              </div>
              <div className="rounded-lg border border-qf-border bg-qf-surface p-3.5">
                <div className="flex items-center gap-2 text-[10px] text-qf-muted">
                  <CheckCircle2 size={12} /> Coverage
                </div>
                <p className="mt-2 text-xl font-semibold text-qf-text">92%</p>
                <p className="mt-0.5 text-[10px] text-qf-success">Requirements linked</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-qf-muted">
          <span>Issue tracking</span>
          <span>Test runs</span>
          <span>Traceability</span>
          <span>Quality reporting</span>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-qf-text">Welcome back</h2>
          <p className="mt-1.5 text-sm text-qf-secondary">Sign in to continue to your QAForge workspace.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-qf-secondary">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-qf-muted" aria-hidden="true" />
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
                  className="input-field pl-9"
                />
              </div>
              {errors.email && <p id="email-error" className="mt-1.5 text-[11px] text-qf-danger" role="alert">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-qf-secondary">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-qf-muted" aria-hidden="true" />
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
                  className="input-field pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1.5 rounded p-1.5 text-qf-muted transition hover:bg-qf-card hover:text-qf-text"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="mt-1.5 text-[11px] text-qf-danger" role="alert">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="rounded-md border border-qf-danger/35 bg-qf-danger/10 px-3 py-2.5 text-xs leading-5 text-qf-danger" role="alert">
                {apiError}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F1016]/30 border-t-[#0F1016]" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-qf-muted">
            Accounts are created by your workspace administrator. Contact them if you need access or a password reset.
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
