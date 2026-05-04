import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const waitlistCollection = import.meta.env.VITE_FIREBASE_COLLECTION || 'waitlist';
const storageKey = 'harbour-waitlist-email';

const marqueebrands = [
  { name: 'The Whole Truth',    logo: '/logos/twt.svg' },
  { name: 'Wellbeing Nutrition',logo: '/logos/wellbeing.svg' },
  { name: 'Setu',               logo: '/logos/setu.svg' },
  { name: 'Yoga Bar',           logo: '/logos/yogabar.svg' },
  { name: 'Fast&Up',            logo: '/logos/fastup.svg' },
  { name: 'Oziva',              logo: '/logos/oziva.svg' },
  { name: 'Muscleblaze',        logo: '/logos/muscleblaze.svg' },
];

const whyHarbour = [
  {
    label: 'Coverage',
    value: '100+',
    title: 'D2C health brands, one search.',
    copy: 'Protein, creatine, electrolytes, greens, sleep, gut health — all in one place.',
  },
  {
    label: 'Integrity',
    value: 'Pure Purchase Intent',
    title: 'Product fit decides placement.',
    copy: 'What fits you, ranks first. No sponsored slots. No brand deals. Your goal decides what you see.',
  },
  {
    label: 'Speed',
    value: 'Seconds',
    title: 'Ask. Get answers.',
    copy: 'Tell Harbour what you want. It handles the ingredients, macros, and prices — you just pick.',
  },
];

const steps = [
  {
    step: 'Step 01',
    title: 'Describe the need',
    copy: 'Just say what you want.',
    label: 'Example query',
    example: '"Clean whey isolate, under three thousand, low lactose."',
  },
  {
    step: 'Step 02',
    title: 'Harbour finds the fit',
    copy: 'Ingredients, price, macros — checked together, not one by one.',
    label: 'What gets compared',
    example: 'Protein %, additives, flavours, final price, everything you ask for',
  },
  {
    step: 'Step 03',
    title: 'See the best matches',
    copy: 'What fits, why it fits, and what the trade-offs are — before you buy.',
    label: 'Example output',
    example: '3 options. Best on purity. Best on value. No paid results.',
  },
];

const trustStats = [
  { label: 'Result Source',    value: 'Direct',    desc: 'Every answer comes straight from the brand — no aggregators, no middlemen.' },
  { label: 'Brands',           value: '100+',       desc: 'Health brands live on Harbour' },
  { label: 'Placement Model',  value: 'Zero Ads',   desc: 'Ranked only by what fits your search' },
];

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validateName(n)  { return n.trim().length >= 2; }

async function submitToFirestore(payload) {
  await addDoc(collection(db, waitlistCollection), {
    name:       payload.name,
    email:      payload.email.toLowerCase(),
    phone:      payload.phone,
    city:       payload.city,
    pain:       payload.pain,
    source:     payload.source,
    created_at: serverTimestamp(),
  });
}

async function shareLandingPage(setStatus) {
  const shareData = {
    title: 'Harbour',
    text: 'Found a cleaner way to discover health and protein products in India.',
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      setStatus({ message: 'Shared.', state: 'success' });
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    setStatus({ message: 'Link copied to clipboard.', state: 'success' });
  } catch {
    setStatus({ message: 'Could not share right now.', state: 'error' });
  }
}

export default function App() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '', pain: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted,  setIsSubmitted]  = useState(false);
  const [status,       setStatus]       = useState({ message: '', state: '' });
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, waitlistCollection),
      (snap) => setWaitlistCount(snap.size),
      () => {}
    );
    return unsub;
  }, []);

  function updateField(e) {
    const { name, value } = e.target;
    setFormData(cur => ({ ...cur, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.company) {
      setStatus({ message: 'Submission blocked.', state: 'error' });
      return;
    }

    const payload = {
      name:   formData.name.trim(),
      email:  formData.email.trim(),
      phone:  formData.phone.trim(),
      city:   formData.city.trim(),
      pain:   formData.pain.trim(),
      source: 'landing-page',
      created_at: new Date().toISOString(),
    };

    if (!validateName(payload.name)) {
      setStatus({ message: 'Please enter your full name.', state: 'error' });
      return;
    }
    if (!validateEmail(payload.email)) {
      setStatus({ message: 'Please enter a valid email address.', state: 'error' });
      return;
    }

    const existing = window.localStorage.getItem(storageKey);
    if (existing && existing === payload.email.toLowerCase()) {
      setIsSubmitted(true);
      setStatus({ message: 'You are on the list.', state: 'success' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: 'Saving your spot...', state: '' });

    try {
      await submitToFirestore(payload);
      window.localStorage.setItem(storageKey, payload.email.toLowerCase());
      setIsSubmitted(true);
      setStatus({ message: 'You are on the list.', state: 'success' });
    } catch (err) {
      if (err.status === 409) {
        window.localStorage.setItem(storageKey, payload.email.toLowerCase());
        setIsSubmitted(true);
        setStatus({ message: 'You are already on the list.', state: 'success' });
      } else {
        setStatus({ message: 'Something failed on our side. Please try again.', state: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#top" className="nav-logo" aria-label="Harbour home">Harbour</a>
            <span className="nav-tag">Better discovery for everyone </span>
          </div>
          <a className="nav-cta" href="#waitlist">Join waitlist</a>
        </div>
      </nav>

      <main id="top">

        {/* ── Hero ── */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-eyebrow reveal" style={{ '--d': '0ms' }}>
              Zero paid placements · 100+ brands
            </div>
            <h1 className="hero-title reveal" style={{ '--d': '80ms' }}>
              Something just searched <em>100 health brands</em> for you.
            </h1>
            <p className="hero-sub reveal" style={{ '--d': '160ms' }}>
              Your AI finds the product. Their AI knows the brand. Harbour connects the two.
            </p>
            <div className="hero-actions reveal" style={{ '--d': '220ms' }}>
              {/* <a className="btn-primary" href="#waitlist">Get early access</a> */}
              <span className="hero-note">Beta Launch · Limited spots</span>
            </div>

            {/* Diagram */}
            <div className="diagram-wrap reveal" style={{ '--d': '300ms' }}>
              <img
                src="/exchange-diagram.svg"
                alt="Harbour Exchange Layer — your AI connects to 100+ health brands"
              />
            </div>
          </div>
        </section>

        {/* ── Marquee ── */}
        <div className="marquee-section reveal" style={{ '--d': '100ms' }}>
          <p className="marquee-label">Brands on Harbour</p>
          <div className="marquee-track-wrap">
            <div className="marquee-track">
              {[...marqueebrands, ...marqueebrands].map((b, i) => (
                <div className="m-pill" key={i}>
                  <img
                    src={b.logo}
                    alt={b.name}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="m-pill-fallback">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="wrap">
          <div className="stats-bar reveal" style={{ '--d': '80ms' }}>
            {trustStats.map(s => (
              <div className="stat" key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-val">{s.value}</div>
                <div className="stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why Harbour ── */}
        <section className="section">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <div className="section-label">Why Harbour exists</div>
                <h2 className="section-title">
                  You've read more labels than a pharmacist.{' '}
                  <em>Let that sink in</em>
                </h2>
              </div>
              <p className="section-sub">
                More options was supposed to make this easier.
              </p>
            </div>

            <div className="cards-grid reveal" style={{ '--d': '80ms' }}>
              {whyHarbour.map(item => (
                <article className="card" key={item.title}>
                  <div className="card-tag">{item.label}</div>
                  <div className="card-num">{item.value}</div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-copy">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <div className="section-label">How it works</div>
                <h2 className="section-title">
                  Simple input. <em>Sharper output.</em>
                </h2>
              </div>
              <p className="section-sub">
                Built for buying decisions, not pfaffing. Harbour understands what you mean, checks
                what matters, and returns a tighter shortlist.
              </p>
            </div>

            <div className="steps-grid reveal" style={{ '--d': '80ms' }}>
              {steps.map(s => (
                <article className="step" key={s.step}>
                  <div className="step-num">{s.step}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-copy">{s.copy}</p>
                  <div className="step-example">
                    <div className="step-eg-label">{s.label}</div>
                    <div className="step-eg-text">{s.example}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Waitlist ── */}
        <section className="waitlist-section" id="waitlist">
          <div className="wrap">
            <div className="waitlist-inner">

              <div className="waitlist-lhs">
                <div className="waitlist-eyebrow">Early access</div>
                <h2 className="waitlist-heading">
                  Get in before <em>everyone else.</em>
                </h2>
                <p className="waitlist-desc">
                  Beta Launch. Limited spots. Mumbai &amp; Bangalore first.
                </p>
                
              </div>

              <div className="form-card">
                {!isSubmitted ? (
                  <>
                    {/* <div className="form-card-head">
                      <div className="form-card-eyebrow">Join the waitlist</div>
                      <h3 className="form-card-title">Get in before everyone else.</h3>
                      <p className="form-card-sub">Beta Launch. Limited spots.</p>
                    </div> */}

                    <form className="form-grid" onSubmit={handleSubmit} noValidate>
                      <div className="field">
                        <label htmlFor="name">Full name</label>
                        <input
                          id="name" name="name" type="text"
                          autoComplete="name" placeholder="Aarav Mehta" required
                          value={formData.name} onChange={updateField}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                          id="email" name="email" type="email"
                          autoComplete="email" inputMode="email"
                          placeholder="aarav@domain.com" required
                          value={formData.email} onChange={updateField}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="phone">WhatsApp number</label>
                        <input
                          id="phone" name="phone" type="tel"
                          autoComplete="tel" inputMode="tel"
                          placeholder="+91 98XXXXXX12"
                          value={formData.phone} onChange={updateField}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="city">City</label>
                        <input
                          id="city" name="city" type="text"
                          autoComplete="address-level2" placeholder="Mumbai"
                          value={formData.city} onChange={updateField}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="pain">Biggest confusion when buying health products online</label>
                        <textarea
                          id="pain" name="pain"
                          placeholder="What makes you pause before buying?"
                          value={formData.pain} onChange={updateField}
                        />
                        <span className="field-note">
                          Ingredients, protein quality, fake claims, pricing, delivery, or all of it.
                        </span>
                      </div>

                      <div className="honeypot" aria-hidden="true">
                        <label htmlFor="company">Company</label>
                        <input
                          id="company" name="company" type="text"
                          tabIndex="-1" autoComplete="off"
                          value={formData.company} onChange={updateField}
                        />
                      </div>

                      <div className="form-submit">
                        <button className="submit-btn" type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Joining...' : 'Join the waitlist'}
                        </button>
                        <div className="form-status" data-state={status.state} role="status" aria-live="polite">
                          {status.message}
                        </div>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="success-state">
                    <div className="success-badge">✓ You're in</div>
                    <p className="form-card-title">You're on the list.</p>
                    <p className="success-msg">
                      We'll reach out when Harbour opens for your city. The quieter the launch,
                      the better the experience.
                    </p>
                    <button
                      className="share-btn"
                      type="button"
                      onClick={() => shareLandingPage(setStatus)}
                    >
                      Share Harbour
                    </button>
                    <div className="form-status" data-state={status.state} role="status" aria-live="polite">
                      {status.message}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="footer-brand">Harbour</span>
          <span className="footer-copy"> · Built by founders from IIT , XLRI and MICA · </span>
        </div>
      </footer>
    </>
  );
}
