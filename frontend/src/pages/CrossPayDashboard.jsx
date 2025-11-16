import { useMemo, useState } from 'react'
import './CrossPayDashboard.css'

const statusMap = {
  GOOD: {
    label: 'GOOD',
    description: 'FX window locked • coverage hedge active',
  },
  OK: {
    label: 'OK',
    description: 'Window flexible • mild slippage possible',
  },
  BAD: {
    label: 'BAD',
    description: 'High volatility • instant only',
  },
}

const initialBuckets = {
  rent: 2800,
  savings: 1800,
  investing: 1400,
}

const formatUsd = (value) => `$${value.toLocaleString()}`

export default function CrossPayDashboard() {
  const [salary, setSalary] = useState(6200)
  const [instantPercentage, setInstantPercentage] = useState(45)
  const [maxWait, setMaxWait] = useState(18)
  const [buckets, setBuckets] = useState(initialBuckets)
  const [depositStatus, setDepositStatus] = useState('idle')
  const [walletId, setWalletId] = useState('')
  const [unifiedBalance, setUnifiedBalance] = useState(0)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletRefreshedAt, setWalletRefreshedAt] = useState(null)
  const [status, setStatus] = useState('GOOD')
  const [bridgeMessage, setBridgeMessage] = useState('Bridge via Arc → CrossPay wallet once optimizer confirms funds ready.')
  const [baselineFxRate, setBaselineFxRate] = useState(820)
  const [lastAction, setLastAction] = useState('Waiting for the first action…')

  const instantAvailable = useMemo(
    () => Math.round((salary * instantPercentage) / 100),
    [salary, instantPercentage],
  )
  const optimisedPending = useMemo(() => Math.max(salary - instantAvailable, 0), [salary, instantAvailable])

  const optimisationBoost = useMemo(() => {
    const statusBoost = status === 'GOOD' ? 0.035 : status === 'OK' ? 0.018 : 0.003
    const waitBoost = Math.min(maxWait / 48, 1) * 0.01
    return statusBoost + waitBoost
  }, [status, maxWait])

  const gainedVsInstant = useMemo(() => Math.round(salary * optimisationBoost), [salary, optimisationBoost])

  const totalSalaryReceived = useMemo(() => salary + gainedVsInstant, [salary, gainedVsInstant])

  const bucketTotal = buckets.rent + buckets.savings + buckets.investing
  const bucketDelta = totalSalaryReceived - bucketTotal

  const handleBucketChange = (field, value) => {
    const numeric = Number(value) || 0
    setBuckets((prev) => ({ ...prev, [field]: numeric }))
  }

  const handleDeposit = async () => {
    setDepositStatus('loading')
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary,
          instantPercentage,
          maxWait,
          buckets,
        }),
      })

      if (!response.ok) {
        throw new Error('Deposit failed')
      }

      setDepositStatus('success')
      setLastAction(`Deposited ${formatUsd(salary)} with ${instantPercentage}% instant availability.`)
    } catch (error) {
      console.error(error)
      setDepositStatus('error')
      setLastAction('Deposit attempt failed — retry or inspect /api/deposit logs.')
    }
  }

  const handleCreateWallet = () => {
    const wallet = `WALLET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setWalletId(wallet)
    setUnifiedBalance(instantAvailable + optimisedPending)
    setWalletRefreshedAt(new Date())
    setLastAction(`Wallet created (${wallet}).`)
  }

  const handleRefreshBalance = () => {
    setWalletLoading(true)
    setTimeout(() => {
      const delta = Math.round(Math.random() * 400 - 200)
      setUnifiedBalance((prev) => Math.max(prev + delta, 0))
      setWalletLoading(false)
      setWalletRefreshedAt(new Date())
      setLastAction('Unified balance refreshed from settlement layer.')
    }, 600)
  }

  const handleOptimise = () => {
    setLastAction(`Optimizer recalculated FX spread. Status ${statusMap[status].label}.`)
  }

  const handleConvertNow = () => {
    setLastAction('Instant conversion triggered — executing bridge instructions now.')
  }

  const instantLocal = Math.round(instantAvailable * baselineFxRate)
  const optimizedLocal = Math.round(totalSalaryReceived * baselineFxRate)

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="eyebrow">CrossPay Console</p>
          <h2>Salary Orchestration Dashboard</h2>
        </div>
        <div className="dashboard__header-meta">
          <span>Last refresh: {walletRefreshedAt ? walletRefreshedAt.toLocaleTimeString() : '—'}</span>
          <span>Status: {status}</span>
        </div>
      </header>

      <div className="dashboard__grid">
        <section className="panel salary-settings">
          <header>
            <h3>Salary Settings</h3>
            <p>Define payout preferences per pay run.</p>
          </header>
          <label>
            Salary amount
            <input
              type="number"
              min="0"
              value={salary}
              onChange={(event) => setSalary(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Instant availability %
            <input
              type="range"
              min="0"
              max="100"
              value={instantPercentage}
              onChange={(event) => setInstantPercentage(Number(event.target.value))}
            />
            <span className="range-value">{instantPercentage}%</span>
          </label>
          <label>
            Max wait (hours)
            <input
              type="number"
              min="1"
              max="96"
              value={maxWait}
              onChange={(event) => setMaxWait(Number(event.target.value) || 0)}
            />
          </label>
          <button
            type="button"
            className="primary"
            onClick={handleDeposit}
            disabled={depositStatus === 'loading'}
          >
            {depositStatus === 'loading' ? 'Sending…' : 'Deposit to wallet'}
          </button>
          <p className={`status-chip status-${depositStatus}`}>
            {depositStatus === 'idle' && 'Awaiting instruction'}
            {depositStatus === 'loading' && 'Submitting to /api/deposit'}
            {depositStatus === 'success' && 'Deposit queued successfully'}
            {depositStatus === 'error' && 'Deposit failed — retry'}
          </p>
        </section>

        <section className="panel balances-summary">
          <header>
            <h3>Balances Summary</h3>
            <p>Live view of salary routing.</p>
          </header>
          <div className="summary-row">
            <span>Instant available</span>
            <strong>{formatUsd(instantAvailable)}</strong>
          </div>
          <div className="summary-row">
            <span>Optimised pending</span>
            <strong>{formatUsd(optimisedPending)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total salary received</span>
            <strong>{formatUsd(totalSalaryReceived)}</strong>
          </div>
        </section>

        <section className="panel buckets-panel">
          <header>
            <h3>Buckets</h3>
            <p>Route once optimisation settles.</p>
          </header>
          <div className="bucket-list">
            <div className="bucket-item">
              <label>
                Rent bucket
                <input
                  type="number"
                  value={buckets.rent}
                  onChange={(event) => handleBucketChange('rent', event.target.value)}
                />
              </label>
            </div>
            <div className="bucket-item">
              <label>
                Savings bucket
                <input
                  type="number"
                  value={buckets.savings}
                  onChange={(event) => handleBucketChange('savings', event.target.value)}
                />
              </label>
            </div>
            <div className="bucket-item">
              <label>
                Investing bucket
                <input
                  type="number"
                  value={buckets.investing}
                  onChange={(event) => handleBucketChange('investing', event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="bucket-summary">
            <span>Allocated</span>
            <strong>{formatUsd(bucketTotal)}</strong>
            <span className={bucketDelta >= 0 ? 'positive' : 'negative'}>
              {bucketDelta >= 0 ? '+' : '-'}
              {formatUsd(Math.abs(bucketDelta))} remaining
            </span>
          </div>
        </section>

        <section className="panel wallet-panel">
          <header>
            <h3>Wallet</h3>
            <p>Generate IDs + refresh balances.</p>
          </header>
          <button type="button" className="ghost" onClick={handleCreateWallet}>
            Create wallet
          </button>
          <div className="wallet-id">
            <span>Wallet ID</span>
            <strong>{walletId || 'Not created'}</strong>
          </div>
          <div className="wallet-balance">
            <span>Unified balance</span>
            <strong>{formatUsd(unifiedBalance)}</strong>
          </div>
          <button type="button" onClick={handleRefreshBalance} disabled={!walletId || walletLoading}>
            {walletLoading ? 'Refreshing…' : 'Refresh unified balance'}
          </button>
        </section>

        <section className="panel optimisation-panel">
          <header>
            <h3>Optimisation Controls</h3>
            <p>FX guardrails + bridging instructions.</p>
          </header>
          <div className="status-pills">
            {Object.keys(statusMap).map((key) => (
              <button
                key={key}
                type="button"
                className={`pill ${status === key ? 'is-active' : ''}`}
                onClick={() => setStatus(key)}
              >
                {statusMap[key].label}
              </button>
            ))}
          </div>
          <p className="status-description">{statusMap[status].description}</p>
          <textarea value={bridgeMessage} onChange={(event) => setBridgeMessage(event.target.value)} />
          <div className="optimisation-actions">
            <button type="button" className="primary" onClick={handleOptimise}>
              Optimise window
            </button>
            <button type="button" className="ghost" onClick={handleConvertNow}>
              Convert now
            </button>
          </div>
        </section>

        <section className="panel extra-value-panel">
          <header>
            <h3>Extra Value</h3>
            <p>What optimisation unlocked vs instant.</p>
          </header>
          <div className="extra-value">
            <span className="gain">+{formatUsd(gainedVsInstant)} vs instant</span>
            <label>
              Baseline FX rate
              <input
                type="number"
                value={baselineFxRate}
                onChange={(event) => setBaselineFxRate(Number(event.target.value) || 0)}
              />
            </label>
            <div className="local-values">
              <div>
                <span>Instant local value</span>
                <strong>₦{instantLocal.toLocaleString()}</strong>
              </div>
              <div>
                <span>Optimised local value</span>
                <strong>₦{optimizedLocal.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel last-action">
          <header>
            <h3>Last action summary</h3>
            <p>Traceability for payroll ops.</p>
          </header>
          <p>{lastAction}</p>
        </section>
      </div>
    </div>
  )
}
