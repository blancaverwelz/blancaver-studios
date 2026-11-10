const steps = [
  ['01', 'Share your idea.', 'Tell us what you need.'],
  ['02', 'Align the details.', 'Scope, timeline, budget.'],
  ['03', 'Agree on a plan.', 'Clear next steps.'],
]

export default function ContactProcess() {
  return (
    <ol className="contact-process" aria-label="How we work together">
      {steps.map(([number, title, description], index) => (
        <li key={number} style={{ '--step-delay': `${index * 120}ms` }}>
          <span className="contact-process-number" aria-hidden="true">{number}</span>
          <p><strong>{title}</strong></p>
          <p className="contact-process-description">{description}</p>
        </li>
      ))}
    </ol>
  )
}
