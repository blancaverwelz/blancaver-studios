// Vercel serverless function — POST /api/contact
//
// Flow: validate fields → verify reCAPTCHA v3 token with Google → send the
// submission to the client's inbox via Resend. Nothing here is stored;
// each submission either sends or fails, there's no database in between.
//
// Required environment variables (set in Vercel → Project → Settings →
// Environment Variables, never committed to the repo):
//   RECAPTCHA_SECRET_KEY   Google reCAPTCHA v3 secret key
//   RESEND_API_KEY         Resend API key
//   RESEND_FROM_EMAIL      Verified sender, e.g. "Blancaver Studios<onboarding@resend.dev>"
//   RESEND_TO_EMAIL        Where submissions should land (the client's inbox)

const RECAPTCHA_SCORE_THRESHOLD = 0.5

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    // Not configured — don't block submissions in dev/preview, but this
    // should always be set in production.
    return { ok: true, skipped: true }
  }
  if (!token) return { ok: false, reason: 'Missing reCAPTCHA token.' }

  const params = new URLSearchParams({ secret, response: token })
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await res.json()

  if (!data.success) return { ok: false, reason: 'reCAPTCHA verification failed.' }
  if (typeof data.score === 'number' && data.score < RECAPTCHA_SCORE_THRESHOLD) {
    return { ok: false, reason: 'reCAPTCHA score too low.' }
  }
  if (data.action && data.action !== 'contact_submit') {
    return { ok: false, reason: 'reCAPTCHA action mismatch.' }
  }
  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const {
    name = '',
    email = '',
    company = '',
    message = '',
    budget = '',
    timeline = '',
    source = '',
    details = '',
    website = '', // honeypot
    recaptchaToken = '',
  } = body

  // Honeypot tripped — pretend success, don't explain why to the caller.
  if (website) {
    return res.status(200).json({ ok: true })
  }

  // Re-validate server-side. Never trust that the client's own checks ran.
  const errors = []
  if (!name.trim()) errors.push('name')
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email')
  if (!message.trim()) errors.push('message')
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Please fill in all required fields correctly.' })
  }

  const recaptcha = await verifyRecaptcha(recaptchaToken)
  if (!recaptcha.ok) {
    return res.status(400).json({ error: 'Spam check failed. Please try again.' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.RESEND_TO_EMAIL
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Blancaver Studios <onboarding@resend.dev>'

  if (!resendApiKey || !toEmail) {
    console.error('Contact form is missing RESEND_API_KEY or RESEND_TO_EMAIL.')
    return res.status(500).json({ error: 'The contact form is not fully configured yet.' })
  }

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Company', company],
    ['Budget', budget],
    ['Timeline', timeline],
    ['How they found me', source],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#8a8a90;font-size:13px;white-space:nowrap;">${label}</td><td style="padding:6px 0;color:#111;font-size:13px;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="margin:0 0 16px;">New message from Blancaver Studios</h2>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">${rows}</table>
      <p style="color:#8a8a90;font-size:13px;margin:0 0 4px;">What they need help with</p>
      <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;margin:0 0 20px;">${escapeHtml(message)}</p>
      ${
        details
          ? `<p style="color:#8a8a90;font-size:13px;margin:0 0 4px;">Additional details</p>
             <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(details)}</p>`
          : ''
      }
    </div>
  `

  try {
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `New contact form message from ${name}`,
        html,
      }),
    })

    if (!sendRes.ok) {
      const errBody = await sendRes.json().catch(() => ({}))
      console.error('Resend send failed:', errBody)
      return res.status(502).json({ error: 'Could not send your message. Please try again.' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Contact form send error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
