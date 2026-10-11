import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const demoAccounts = [
  { email: 'qa@qaforge.local', password: 'password123', role: 'QA Tester', badge: 'Tester' },
  { email: 'lead@qaforge.local', password: 'password123', role: 'QA Lead', badge: 'Lead' },
  { email: 'developer@qaforge.local', password: 'password123', role: 'Developer', badge: 'Dev' },
  { email: 'manager@qaforge.local', password: 'password123', role: 'Project Manager', badge: 'PM' },
]

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: 'qa@qaforge.local',
    password: 'password123',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setApiError('')
      await login(formData.email, formData.password)
      navigate('/')
    } catch (error) {
      setApiError(error.response?.data?.message || 'Invalid credentials. Please verify your account.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (account) => {
    setFormData({ email: account.email, password: account.password })
    setErrors({})
    setApiError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-jira-bg px-4 py-8 text-jira-text">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-jira-blue/10 blur-[120px]" />
        <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-jira-border bg-jira-surface shadow-[0_30px_100px_rgba(0,0,0,0.8)] lg:grid-cols-12">

        {/* Left column: Jira/QAForge Branding & Value Proposition */}
        <div className="relative flex flex-col justify-between border-b border-jira-border bg-jira-sidebar p-8 lg:col-span-7 lg:border-b-0 lg:border-r lg:p-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-jira-blue font-bold text-white shadow-md">
                Q
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">QAForge</span>
                <span className="text-xs text-jira-muted">Enterprise Quality Platform</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-jira-blue/30 bg-jira-blue/10 px-3 py-1 text-xs font-medium text-blue-400">
                <Shield size={13} />
                Jira-integrated Test Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
                Deliver flawless software with agile test orchestration.
              </h1>

              <p className="text-sm leading-relaxed text-jira-muted">
                Seamlessly trace requirements, execute test suites, log high-fidelity bug reports, and track release confidence metrics directly from your engineering boards.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3 pt-6 border-t border-jira-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-jira-muted">
              Key Platform Capabilities
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Requirement Traceability',
                'Live Execution Boards',
                'Defect Tracking & Triage',
                'Real-time QA Analytics',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-jira-text">
                  <CheckCircle2 size={14} className="text-jira-blue shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Login Form & Quick Demo Selectors */}
        <div className="flex flex-col justify-between p-8 lg:col-span-5 lg:p-10 bg-jira-surface">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Sign in to QAForge</h2>
              <p className="mt-1 text-xs text-jira-muted">
                Choose a demo persona below or enter your credentials.
              </p>
            </div>

            {/* Quick Demo Accounts Selector */}
            <div className="mb-6">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
                Quick Demo Login
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoAccount(account)}
                    className="flex flex-col items-start rounded-lg border border-jira-border bg-jira-surface-2 p-2.5 text-left transition hover:border-jira-blue/50 hover:bg-jira-surface-3 group"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                        {account.role}
                      </span>
                      <span className="rounded bg-jira-bg px-1.5 py-0.5 text-[9px] font-semibold text-jira-muted border border-jira-border">
                        {account.badge}
                      </span>
                    </div>
                    <span className="mt-1 text-[10px] text-jira-muted truncate w-full">
                      {account.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-jira-border" />
              </div>
              <div className="relative bg-jira-surface px-3 text-[10px] font-medium uppercase tracking-wider text-jira-muted">
                Or sign in manually
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="email">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-jira-muted" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-9 text-xs"
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="password">
                    Password
                  </label>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] font-medium text-blue-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-jira-muted" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-9 pr-9 text-xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-jira-muted hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              {apiError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>Sign in to workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center border-t border-jira-border pt-4">
            <p className="text-[11px] text-jira-muted">
              Secure enterprise authentication • QAForge v1.0
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
