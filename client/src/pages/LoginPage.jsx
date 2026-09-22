import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, TestTube2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const demoAccounts = [
  { email: 'qa@qaforge.local', password: 'password123', role: 'QA Tester' },
  { email: 'lead@qaforge.local', password: 'password123', role: 'QA Lead' },
  { email: 'developer@qaforge.local', password: 'password123', role: 'Developer' },
  { email: 'manager@qaforge.local', password: 'password123', role: 'Project Manager' },
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
      setApiError(error.response?.data?.message || 'Login failed. Please try again.')
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-900/80 shadow-[0_30px_80px_rgba(2,6,23,0.85)] backdrop-blur-sm lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),transparent_35%),linear-gradient(135deg,#020817,#0b1220_40%,#0f172a)] p-8 md:p-10 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
              <ShieldCheck size={12} />
              QAForge
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Quality Assurance & Test Management Platform
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Organize requirements, execute test runs, track defects, and monitor release quality
              with a realistic QA workflow built for modern software teams.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: TestTube2, label: 'Requirements', value: 'Traceability' },
                { icon: Sparkles, label: 'Test Runs', value: 'Execution' },
                { icon: ShieldCheck, label: 'Defects', value: 'Reporting' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
                  <div className="mb-3 inline-flex rounded-xl border border-sky-400/20 bg-sky-500/10 p-2 text-sky-300">
                    <Icon size={18} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-6 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300">
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h2 className="text-2xl font-bold text-white">Sign in</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-10 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3.5 text-slate-400 transition hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-400">
              Demo accounts
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-left text-sm text-slate-300 transition hover:border-sky-400/40 hover:bg-slate-950"
                >
                  <div>
                    <div className="font-semibold text-white">{account.role}</div>
                    <div className="text-xs text-slate-400">{account.email}</div>
                  </div>
                  <span className="text-xs font-medium text-sky-300">Use</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
