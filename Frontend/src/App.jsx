import { useEffect, useMemo, useState } from 'react'
import CharacterStage from './components/CharacterStage'
import { characters } from './data/characters'
import './App.css'

const rate = 820

const narrativeBlocks = [
  {
    title: 'Problem',
    copy: 'Global salaries juggle FX timing, bank partners, compliance, and communication. Teams lose money + confidence.',
  },
  {
    title: 'Solution',
    copy: 'CrossPay abstracts everything into a salary wallet that connects to Arc. Automations, proofs, and FX live together.',
  },
  {
    title: 'Why blockchain',
    copy: 'USDC on Arc + smart contracts unlock deterministic settlement, programmable rules, and transparent receipts.',
  },
]

const contractBoxes = ['FX Optimizer', 'Salary Streamer', 'Payment Splitter', 'Compliance Receipts', 'Employer Escrow']

const stablecoinLogic = [
  'Programmable holds + release windows per jurisdiction.',
  'On-chain FX savings proofs for employers + regulators.',
  'Bucket rules route USDC to bank accounts, cards, or DeFi destinations.',
  'Compliance receipts minted per payout for audit trails.',
]

const flowDiagram = [
  'US employer funds Escrow with USD/USDC on Arc.',
  'FX Optimizer locks a conversion window + hedges volatility.',
  'Salary Streamer batches conversions + triggers Payment Splitter.',
  'Payment Splitter routes buckets to banks, cards, or on-chain vaults.',
  'Compliance Receipts + analytics pushed to employer & user console.',
]

const programmableNodes = ['USDC In', 'FX Timing', 'Salary Split', 'Payout', 'Receipts']

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('crosspay-theme') || 'dark')
  const [salary, setSalary] = useState(6000)

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('crosspay-theme', theme)
  }, [theme])

  const converted = useMemo(() => {
    const fee = salary * 0.0035
    const net = salary - fee
    return {
      origin: salary,
      local: Math.round(net * rate),
      fee,
    }
  }, [salary])

  return (
    <div className="site">
      <div className="nebula" />
      <header className="site-header">
        <nav className="nav">
          <a href="#top" className="brand">
            CrossPay
          </a>
          <ul>
            <li>
              <a href="#narrative">PLAYBOOK</a>
            </li>
            <span className="nav-sep">|</span>
            <li>
              <a href="#wallet">WALLET</a>
            </li>
            <span className="nav-sep">|</span>
            <li>
              <a href="#contracts">ARCHITECTURE</a>
            </li>
            <span className="nav-sep">|</span>
            <li>
              <a href="#characters">CREW</a>
            </li>
          </ul>
          <div className="nav-actions">
            <button
              className={`theme-toggle ${theme === 'light' ? 'is-light' : ''}`}
              type="button"
              aria-pressed={theme === 'light'}
              aria-label="Toggle color theme"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            >
              <span className="sun">☀</span>
              <span className="moon">☾</span>
              <span className="thumb" />
            </button>
            <div className="nav-cta">
              <button className="ghost">Log in</button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-wave" aria-hidden="true" />
          <div className="hero-copy reveal">
            <p className="eyebrow">CrossPay · Global salaries made local</p>
            <h1>Earn anywhere. Live as a local.</h1>
            <p className="lead">
              CrossPay makes global salaries feel local—no matter where you live, work, or send money.
              You get paid in one country, we auto-handle chains, fees, FX timing, and compliance so spending feels native.
            </p>
            <div className="hero-cta">
              <button className="primary ripple">Launch beta</button>
              <button className="ghost">See console</button>
            </div>
            <div className="stats">
              <div>
                <span>$4.2B</span>
                <p>Processed</p>
              </div>
              <div>
                <span>120+</span>
                <p>Countries live</p>
              </div>
              <div>
                <span>&lt;35s</span>
                <p>Settlement</p>
              </div>
            </div>
          </div>
          <div className="hero-panel">
            <div className="wallet-card glass-card hero-salary">
              <div className="wallet-card__header">
                <span>Salary preview</span>
                <span className="status">Realtime</span>
              </div>
              <div className="balance">
                <p>Origin payroll</p>
                <h2 className="fx-value">${converted.origin.toLocaleString()}</h2>
                <p className="sub">
                  Local take-home <span className="fx-value">₦{converted.local.toLocaleString()}</span>
                </p>
              </div>
              <label htmlFor="heroRange" className="hero-range-label">
                Drag to preview
                <input
                  id="heroRange"
                  type="range"
                  className="neon-range"
                  min="2000"
                  max="15000"
                  value={salary}
                  onChange={(event) => setSalary(Number(event.target.value))}
                />
              </label>
              <p className="card-footer">Fees ${converted.fee.toFixed(2)} locked for 24h.</p>
            </div>
            <div className="globe-card glass-card delay hero-cta-card">
              <p>CrossPay turns global income into an intuitive experience: you get paid, and we handle the rest.</p>
              <button className="primary ripple">Explore CrossPay Console</button>
            </div>
          </div>
        </section>

        <section className="section narrative" id="narrative">
          <div className="section-heading">
            <p className="eyebrow arrow-trail">PROBLEM → CROSSPAY → SOLUTION</p>
            <h2>Global earners need local feelings 👾</h2>
            <p className="subhead">CrossPay’s story mirrors our users: they earn abroad but live at home.</p>
          </div>
          <div className="grid grid-3">
            {narrativeBlocks.map((block) => (
              <article className="card glass-card lift" key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section wallet-ui" id="wallet">
          <div className="section-heading">
            <p className="eyebrow">THE CROSSPAY SALARY WALLET</p>
            <h2>Explore the world of Cross border Wallets 💳</h2>
            <p className="subhead">
              Salaries enter CrossPay, and we immediately make them spendable in the country you call home.
            </p>
          </div>
          <div className="wallet-screenshot glass-card lift">
            <div className="wallet-left">
              <div className="wallet-balance">
                <span>Total balance</span>
                <strong>$12,480.32</strong>
              </div>
              <ul>
                <li>USD Wallet · ACH + Fedwire</li>
                <li>GBP Wallet · Faster Payments</li>
                <li>NGN Wallet · UPI / IMPS</li>
              </ul>
            </div>
            <div className="wallet-right">
              <p>Upcoming salary</p>
              <strong>₹ 312,000 arriving Friday</strong>
              <button className="primary ripple">Automate payout</button>
            </div>
          </div>
        </section>

        <section className="section architecture" id="contracts">
          <div className="section-heading">
            <p className="eyebrow">SMART CONTRACT ARCHITECTURE</p>
            <h2>Explaining the system 👾</h2>
            <p className="subhead">Each module lives on-chain so salaries always feel predictable, transparent, and local.</p>
          </div>
          <div className="grid grid-3 contract-grid">
            {contractBoxes.map((label) => (
              <article className="card glass-card lift" key={label}>
                <h3>{label}</h3>
                <p>Runs on-chain to keep settlements transparent and automated.</p>
              </article>
            ))}
          </div>
          <div className="node-flow glass-card">
            {programmableNodes.map((node, index) => (
              <div className="node" key={node} style={{ animationDelay: `${index * 0.4}s` }}>
                <span>{node}</span>
                {index < programmableNodes.length - 1 && <i>→</i>}
              </div>
            ))}
            <button className="ghost simulate">Simulate</button>
          </div>
        </section>

        <section className="section stablecoin" id="logic">
          <div className="section-heading">
            <p className="eyebrow">ADVANCED STABLECOIN LOGIC</p>
            <h2>Tied directly to Arc requirements</h2>
            <p className="subhead">Stablecoin rails remove FX and settlement anxiety for people who earn abroad.</p>
          </div>
          <ul className="stablecoin-list glass-card">
            {stablecoinLogic.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section flow-diagram" id="flow">
          <div className="section-heading">
            <p className="eyebrow">FLOW DIAGRAM</p>
            <h2>US employer → Arc → local payout.</h2>
            <p className="subhead">From employer to grocery store, CrossPay handles the entire route.</p>
          </div>
          <div className="flow-beam" aria-hidden="true">
            <span />
          </div>
          <div className="flow-diagram-card glass-card">
            {flowDiagram.map((step, index) => (
              <div key={step} className="flow-diagram-step">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <CharacterStage characters={characters} />

        <section className="section cta glass-card" id="ctaSection">
          <div>
            <p className="eyebrow">CALL TO ACTION</p>
            <h2>Global salaries. Local superpowers.</h2>
            <p className="subhead">Join the beta, route payroll through CrossPay, and live locally without friction.</p>
          </div>
          <div className="cta-actions">
            <input type="email" placeholder="Work email" />
            <button className="primary ripple">Join waitlist</button>
          </div>
        </section>
      </main>

      <footer className="site-footer glass-card">
        <div className="footer-brand">
          <div>
            <strong>CrossPay</strong>
            <p>Pixel-serious wallet for global salaries.</p>
          </div>
        </div>
        <div className="footer-grid">
          <div>
            <h5>Product</h5>
            <a href="#wallet">Wallet</a>
            <a href="#contracts">Architecture</a>
            <a href="#flow">Flow diagram</a>
          </div>
          <div>
            <h5>Legal</h5>
            <a href="#">Compliance</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div>
            <h5>Company</h5>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>
          <div>
            <h5>Contact</h5>
            <a href="mailto:hey@crosspay.global">hey@crosspay.global</a>
            <a href="#">X / Twitter</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
        <p className="footer-note">© {new Date().getFullYear()} CrossPay · Built with glass + neon energy.</p>
      </footer>
    </div>
  )
}

export default App
