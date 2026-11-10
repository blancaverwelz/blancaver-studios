import ContactForm from "./ContactForm";
import ContactProcess from "./ContactProcess";

export default function ContactSection() {
  return (
    <div
      className="contact-overlay"
      role="region"
      aria-labelledby="contact-form-heading"
      tabIndex={0}
    >
      <h1 id="contact-form-heading">
        Let’s get <span>in touch</span>
      </h1>
      <ContactForm />
      <ContactProcess />
      <p className="contact-location">
        Manila, Philippines · Operating worldwide
      </p>
    </div>
  );
}
