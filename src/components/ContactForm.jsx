import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const initialFields = {
  name: '',
  email: '',
  message: '',
  // Honeypot — real visitors never see or fill this in.
  website: '',
}

/**
 * Loads the Google reCAPTCHA v3 script once, only while this component is
 * mounted, so no other page on the site pays for it.
 */
function useRecaptcha(siteKey) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!siteKey) return

    if (window.grecaptcha) {
      setReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.onload = () => {
      window.grecaptcha?.ready(() => setReady(true))
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [siteKey])

  return ready
}

export default function ContactForm() {
  const [fields, setFields] = useState(initialFields)
  // Explicit states: don't infer "is it loading" from booleans scattered
  // around — one status drives the whole UI.
  const [status, setStatus] = useState('IDLE') // IDLE | SUBMITTING | SUCCESS | ERROR
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const recaptchaReady = useRecaptcha(RECAPTCHA_SITE_KEY)

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errors = {}
    if (!fields.name.trim()) errors.name = 'Your name is required.'
    if (!fields.email.trim()) {
      errors.email = 'Your email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = 'That email address looks incomplete.'
    }
    if (!fields.message.trim()) errors.message = 'Tell us a little about the project.'
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Prevent duplicate submits while one is already in flight.
    if (status === 'SUBMITTING') return

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Honeypot tripped — silently pretend success, don't tip off the bot.
    if (fields.website) {
      setStatus('SUCCESS')
      return
    }

    setStatus('SUBMITTING')
    setErrorMessage('')

    try {
      let recaptchaToken = ''
      if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
        recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
          action: 'contact_submit',
        })
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, recaptchaToken }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong sending your message.')
      }

      setStatus('SUCCESS')
      setFields(initialFields)
    } catch (err) {
      setStatus('ERROR')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'SUCCESS') {
    return (
      <div className="contact-success" role="status" aria-live="polite">
        <span className="contact-success-icon">
          <CheckCircle2 size={28} strokeWidth={1.75} />
        </span>
        <h3 className="text-white ">Thanks!</h3>
        <p className="max-w-sm text-white/60 ">
          We&rsquo;ve received your message and we&rsquo;ll get back to you within 24–48 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus('IDLE')}
          className="mt-2 text-[var(--color-neon-teal)] uppercase hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="contact-form" aria-labelledby="contact-form-heading" aria-busy={status === 'SUBMITTING'}
    >
      {/* Honeypot field — visually hidden, off the tab order, ignored by real users */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={handleChange}
        />
      </div>

      <div className="contact-fields-row">
        <div className="field-group">
          <label className="contact-sr-only" htmlFor="name">
            Your Name <span className="text-[var(--color-neon-teal)]">*</span>
          </label>
          <input
          id="name"
          required
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          autoComplete="name"
            name="name"
            type="text"
            placeholder="Your name"
            className="contact-input"
            value={fields.name}
            onChange={handleChange}
          />
          {fieldErrors.name && <p id="name-error" className="field-error" role="alert">{fieldErrors.name}</p>}
        </div>

        <div className="field-group">
          <label className="contact-sr-only" htmlFor="email">
            Email Address <span className="text-[var(--color-neon-teal)]">*</span>
          </label>
          <input
          id="email"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          autoComplete="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            className="contact-input"
            value={fields.email}
            onChange={handleChange}
          />
          {fieldErrors.email && <p id="email-error" className="field-error" role="alert">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="field-group">
        <label className="contact-sr-only" htmlFor="message">
          What Can We Help You With? <span className="text-[var(--color-neon-teal)]">*</span>
        </label>
        <textarea
          id="message"
          required
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? 'message-error' : undefined}
          name="message"
          rows={3}
          placeholder="Tell us about your project, goals, or ideas..."
          className="contact-input contact-input--message"
          value={fields.message}
          onChange={handleChange}
        />
        {fieldErrors.message && <p id="message-error" className="field-error" role="alert">{fieldErrors.message}</p>}
      </div>

      {status === 'ERROR' && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-red-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'SUBMITTING' || (Boolean(RECAPTCHA_SITE_KEY) && !recaptchaReady)}
        className="contact-submit"
      >
        {status === 'SUBMITTING' ? 'Sending…' : 'Send Message'}
        {status !== 'SUBMITTING' && (
          <ArrowRight
            size={18}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        )}
      </button>


      {RECAPTCHA_SITE_KEY && (
        <p className="contact-legal">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/40"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/40"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      )}
    </form>
  )
}
