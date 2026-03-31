import React, { useState, useEffect } from 'react';

const initialWaitlistCount = 0;
const storageKey = 'harbour-waitlist-email';
const exampleBrands = [
  'The Whole Truth',
  'MuscleBlaze',
  'Only Whats Needed',
  'Wellbeing Nutrition',
  'Cosmix',
  'Plix',
];

const whyHarbour = [
  {
    label: 'Coverage',
    value: '100+',
    title: 'Indian D2C health brands, in one search layer.',
    copy:
      'Protein, creatine, electrolytes, greens, sleep, gut health, and more. No hopping between fifteen tabs to compare basics.',
  },
  {
    label: 'Integrity',
    value: 'Pure Purchase Intent',
    title: 'Product fit decides placement.',
    copy:
      'Harbour is built to rank by fit. Your goal comes first. Product placement does not.',
  },
  {
    label: 'Speed',
    value: 'Seconds',
    title: 'Search everything without reading everything.',
    copy:
      'Describe the outcome you want. Harbour handles filters, ingredients, macros, price checks, and delivery constraints behind the scenes.',
  },
];

const steps = [
  {
    step: 'Step 01',
    title: 'Describe the need',
    copy:
      'Write it the way you would text someone who actually knows the category.',
    label: 'Example query',
    example:
      '“Need a clean whey isolate under ₹3,000 with low lactose and fast delivery to Bangalore.”',
  },
  {
    step: 'Step 02',
    title: 'Harbour evaluates real fit',
    copy:
      'Ingredients, protein per serving, sweeteners, pricing, stock, and shipping get weighed together, not in isolation.',
    label: 'What gets compared',
    example:
      'Protein %, additives, flavor options, final price, shipping ETA, and whether the claims hold up.',
  },
  {
    step: 'Step 03',
    title: 'See the best matches',
    copy:
      'You see what matches your goal, why it matches, and what trade-offs to expect before you spend.',
    label: 'Example output',
    example:
      '3 products that fit. One best on purity. One best on value. One fastest to your pincode. No paid placement.',
  },
];

function formatCount(value) {
  return Number(value).toLocaleString('en-IN');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateName(name) {
  return name.trim().length >= 2;
}

async function fetchWaitlistCount() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/get_waitlist_count`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) return null;
  return response.json();
}

async function submitToSupabase(payload) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseTable = import.meta.env.VITE_SUPABASE_TABLE || 'waitlist';
  const supabaseSubmitUrl = import.meta.env.VITE_SUPABASE_SUBMIT_URL;

  if (!supabaseAnonKey || (!supabaseSubmitUrl && !supabaseUrl)) {
    throw new Error('Missing Supabase configuration');
  }

  const endpoint =
    supabaseSubmitUrl ||
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(supabaseTable)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([payload]),
  });

  if (!response.ok) {
    let details = null;

    try {
      details = await response.json();
    } catch {
      try {
        details = await response.text();
      } catch {
        details = null;
      }
    }

    const error = new Error('Supabase request failed');
    error.status = response.status;
    error.details = details;
    throw error;
  }
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
    setStatus({
      message: 'Could not share right now. You can still copy the URL manually.',
      state: 'error',
    });
  }
}

export default function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    pain: '',
    company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState({ message: '', state: '' });
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount);

  useEffect(() => {
    fetchWaitlistCount().then((count) => {
      if (count !== null) setWaitlistCount(count);
    });
  }, []);

  const trustStats = [
    {
      label: 'Early waitlist',
      value: formatCount(waitlistCount),
      copy: 'People who read the label before they buy.',
    },
    {
      label: 'Brands indexed',
      value: '100+',
      copy: 'Health brands in India ready to be found.',
    },
    {
      label: 'Results Ranked By Fit',
      value: '100%',
      copy: 'Not spend. Just match quality.',
    },
  ];

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (formData.company) {
      setStatus({ message: 'Submission blocked.', state: 'error' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      pain: formData.pain.trim(),
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
      setWaitlistCount(initialWaitlistCount + 1);
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: 'Saving your spot...', state: '' });

    try {
      await submitToSupabase(payload);
      window.localStorage.setItem(storageKey, payload.email.toLowerCase());
      setIsSubmitted(true);
      setWaitlistCount((count) => count + 1);
      setStatus({ message: 'You are on the list.', state: 'success' });
    } catch (error) {
      if (error.status === 404) {
        setStatus({
          message:
            'Server could not find the waitlist table. Run the SQL setup in your Server dashboard and confirm the table name is public.waitlist.',
          state: 'error',
        });
      } else if (
        error.status === 409 ||
        (error.details && typeof error.details === 'object' && error.details.code === '23505')
      ) {
        window.localStorage.setItem(storageKey, payload.email.toLowerCase());
        setIsSubmitted(true);
        setStatus({ message: 'You are already on the list.', state: 'success' });
      } else {
        setStatus({
          message: 'Something failed on our side. Please try again in a moment.',
          state: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand-lockup">
            <a href="#top" className="brand-mark" aria-label="Harbour home">
              Harbour
            </a>
            <div className="microcopy">Better Discovery · India</div>
          </div>
          <a className="nav-cta microcopy" href="#waitlist">
            Join waitlist
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow reveal" style={{ '--delay': '60ms' }}>
                100+ brands indexed. Zero paid placements.
              </div>
              <h1 className="hero-title reveal" style={{ '--delay': '120ms' }}>
                Something just searched <em>100 health brands</em> for you.
              </h1>
              <p className="hero-subtitle reveal" style={{ '--delay': '200ms' }}>
                You describe what you need in plain language. Harbour connects your AI agent to every Indian health brand. One conversation. Every brand. Exactly what fits.
              </p>

              <div
                className="brand-row reveal"
                style={{ '--delay': '260ms' }}
                aria-label="Example brands indexed"
              >
                {exampleBrands.map((brand) => (
                  <span className="chip" key={brand}>
                    {brand}
                  </span>
                ))}
              </div>

              <div className="stats-grid reveal" style={{ '--delay': '320ms' }} aria-label="Trust metrics">
                {trustStats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <div className="meta">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                    <p className="stat-copy">{stat.copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="sticky-wrap reveal" style={{ '--delay': '180ms' }}>
              <section className="waitlist-card" id="waitlist" aria-labelledby="waitlist-title">
                <div className="card-head">
                  <div>
                    <div className="eyebrow">Early access</div>
                    <h2 className="card-title" id="waitlist-title">
                      Get in before everyone else.
                    </h2>
                    <p className="card-subtitle">Mumbai &amp; Bangalore first. Limited spots.</p>
                  </div>
                  <div className="pill">
                    <span>Waitlist</span>
                    <strong>{formatCount(waitlistCount)}</strong>
                  </div>
                </div>

                {!isSubmitted ? (
                  <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
                    <div className="field">
                      <label htmlFor="name">Full name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Aarav Mehta"
                        required
                        value={formData.name}
                        onChange={updateField}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="aarav@domain.com"
                        required
                        value={formData.email}
                        onChange={updateField}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="phone">WhatsApp number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+91 98XXXXXX12"
                        value={formData.phone}
                        onChange={updateField}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="city">City</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={updateField}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="pain">
                        Biggest confusion when buying health products online
                      </label>
                      <textarea
                        id="pain"
                        name="pain"
                        placeholder="What makes you pause before buying?"
                        value={formData.pain}
                        onChange={updateField}
                      />
                      <div className="field-note">
                        Ingredients, protein quality, fake claims, pricing, delivery, or all of it.
                      </div>
                    </div>

                    <div className="honeypot" aria-hidden="true">
                      <label htmlFor="company">Company</label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        tabIndex="-1"
                        autoComplete="off"
                        value={formData.company}
                        onChange={updateField}
                      />
                    </div>

                    <div className="submit-row">
                      <button className="submit-btn" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Joining...' : 'Join the waitlist'}
                      </button>
                      <div className="form-status" data-state={status.state} role="status" aria-live="polite">
                        {status.message}
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="success-panel visible" aria-live="polite">
                    <div>
                      <div className="meta">You're in</div>
                      <p className="card-subtitle">
                        We’ll reach out when Harbour opens for your city. The quieter the launch,
                        the better the experience.
                      </p>
                    </div>
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
              </section>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head reveal">
              <div>
                <div className="eyebrow">Why Harbour exists</div>
                <h2 className="section-title">
                  India&apos;s health aisle is growing. <em>Trust is not.</em>
                </h2>
              </div>
              <p className="section-copy">
              Too many tabs. Too many claims. Too much noise. Harbour helps people buy protein and health products in India with less bias, less friction, and more clarity.
              </p>
            </div>

            <div className="reason-grid reveal" style={{ '--delay': '80ms' }}>
              {whyHarbour.map((item) => (
                <article className="reason-card" key={item.title}>
                  <div className="meta">{item.label}</div>
                  <div className="reason-number">{item.value}</div>
                  <h3 className="reason-title">{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head reveal">
              <div>
                <div className="eyebrow">How it works</div>
                <h2 className="section-title">
                  Simple input. <em>Sharper output.</em>
                </h2>
              </div>
              <p className="section-copy">
                Built for real buying decisions, not keyword stuffing. Harbour understands
                what you mean, checks what matters, and returns a tighter shortlist.
              </p>
            </div>

            <div className="steps-grid reveal" style={{ '--delay': '80ms' }}>
              {steps.map((step) => (
                <article className="step-card" key={step.step}>
                  <div className="step-kicker">{step.step}</div>
                  <div>
                    <h3 className="step-title">{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                  <div className="example-block">
                    <div className="example-label meta">{step.label}</div>
                    <div className="example-text">{step.example}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="container footer">
          <div>
            <strong>Harbour</strong> <span>Better discovery for everyone.</span>
          </div>
          <div className="microcopy">Launching in Mumbai &amp; Bangalore first</div>
        </footer>
      </main>
    </div>
  );
}
