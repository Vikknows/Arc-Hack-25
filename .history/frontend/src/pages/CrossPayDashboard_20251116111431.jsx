import { useMemo, useState } from 'react'
import './CrossPayDashboard.css'
import { API_BASE } from '../src/api'

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

const formatUsd = (value) => `$${Number(value || 0).toLocaleString()}`

const jsonRequest = async (path, options = {}) => {
  const base = API_BASE || ''
  const normalisedPath = path.startsWith('/') ? path : `/${path}`
  const target = `${base}${normalisedPath}`

  const response = await fetch(target, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || 'Request failed'
    throw new Error(message)
  }

  return payload
}

const normaliseChainBalances = (payload) => {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.map((entry, index) => ({
      chain: entry.chain || entry.name || entry.network || `Chain ${index + 1}`,
      balance: Number(entry.balance ?? entry.amount ?? entry.value ?? 0),
    }))
  }

  if (typeof payload === 'object') {
    return Object.entries(payload)
      .filter(([key, value]) => typeof value === 'number' && key.toLowerCase() !== 'total')
      .map(([chain, balance]) => ({
        chain: chain.replace(/_/g, ' '),
        balance,
      }))
  }

  return []
}

export default function CrossPayDashboard() {
  const [salary, setSalary] = useState(6200)
  const [instantPercentage, setInstantPercentage] = useState(45)
  const [maxWait, setMaxWait] = useState(18)
  const [buckets, setBuckets] = useState(initialBuckets)
  const [depositStatus, setDepositStatus] = useState('idle')
  const [walletId, setWalletId] = useState('')
  const [walletStatus, setWalletStatus] = useState('idle')
  const [walletError, setWalletError] = useState('')
  const [unifiedBalance, setUnifiedBalance] = useState(0)
  const [chainBalances, setChainBalances] = useState([])
  const [balanceStatus, setBalanceStatus] = useState('idle')
  const [balanceError, setBalanceError] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletRefreshedAt, setWalletRefreshedAt] = useState(null)
  const [status, setStatus] = useState('GOOD')
  const [routingData, setRoutingData] = useState(null)
  const [optimiseStatus, setOptimiseStatus] = useState('idle')
  const [optimiseError, setOptimiseError] = useState('')
  const [bridgeMessage, setBridgeMessage] = useState('Bridge via Arc → CrossPay wallet once optimizer confirms funds ready.')
  const [baselineFxRate, setBaselineFxRate] = useState(820)
  const [lastAction, setLastAction] = useState('Waiting for the first action…')

  const instantAvailable = useMemo(() => {
    if (routingData && typeof routingData.instantAvailable === 'number') {
      return routingData.instantAvailable
    }
    return Math.round((salary * instantPercentage) / 100)
  }, [routingData, salary, instantPercentage])

  const optimisedPending = useMemo(() => {
    if (routingData && typeof routingData.optimisedPending === 'number') {
      return routingData.optimisedPending
    }
    return Math.max(salary - instantAvailable, 0)
  }, [routingData, salary, instantAvailable])

  const optimisationBoost = useMemo(() => {
    const statusBoost = status === 'GOOD' ? 0.035 : status === 'OK' ? 0.018 : 0.003
    const waitBoost = Math.min(maxWait / 48, 1) * 0.01
    return statusBoost + waitBoost
  }, [status, maxWait])

  const gainedVsInstant = useMemo(() => {
    if (routingData && typeof routingData.extraGainedVsInstant === 'number') {
      return routingData.extraGainedVsInstant
    }
    return Math.round(salary * optimisationBoost)
  }, [routingData, salary, optimisationBoost])

  const totalSalaryReceived = useMemo(() => {
    if (routingData && typeof routingData.totalSalaryReceived === 'number') {
      return routingData.totalSalaryReceived
    }
    return salary + (routingData ? 0 : gainedVsInstant)
  }, [routingData, salary, gainedVsInstant])

  const bucketTotal = buckets.rent + buckets.savings + buckets.investing
  const bucketDelta = totalSalaryReceived - bucketTotal

  const handleBucketChange = (field, value) => {
    const numeric = Number(value) || 0
    setBuckets((prev) => ({ ...prev, [field]: numeric }))
  }

  const handleDeposit = async () => {
    setDepositStatus('loading')
    try {
      await jsonRequest('/api/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: salary,
        }),
      })

      setDepositStatus('success')
      setLastAction(`Deposited ${formatUsd(salary)} with ${instantPercentage}% instant availability.`)
    } catch (error) {
      console.error(error)
      setDepositStatus('error')
      setLastAction('Deposit attempt failed — retry or inspect /api/deposit logs.')
    }
  }

  const loadUnifiedBalance = async (targetWalletId = walletId) => {
    if (!targetWalletId) {
      setBalanceStatus('error')
      setBalanceError('Create a wallet to fetch balances.')
      return
    }

    setWalletLoading(true)
    setBalanceStatus('loading')
    setBalanceError('')
    try {
      const params = new URLSearchParams({ walletId: targetWalletId, wallet_id: targetWalletId })
      const payload = await jsonRequest(`/api/unified-balance?${params.toString()}`)
      const unified =
        payload.unifiedBalance ??
        payload.unified_balance ??
        payload.total ??
        payload.gateway_total ??
        payload.gateway?.total ??
        0
      const chains =
        payload.chainBalances ||
        payload.chain_balances ||
        payload.chains ||
        payload.gateway?.chains ||
        payload.breakdown

      setUnifiedBalance(unified || 0)
      setChainBalances(normaliseChainBalances(chains))
      setWalletRefreshedAt(new Date())
      setBalanceStatus('success')
      setLastAction('Unified balance refreshed from Gateway.')
    } catch (error) {
      console.error(error)
      setBalanceStatus('error')
      setBalanceError(error.message)
      setLastAction(`Balance refresh failed: ${error.message}`)
    } finally {
      setWalletLoading(false)
    }
  }

  const handleCreateWallet = async () => {
    setWalletStatus('loading')
    setWalletError('')
    try {
      const payload = await jsonRequest('/api/create-wallet', { method: 'POST' })
      const createdId = payload.walletId || payload.wallet_id || payload.id
      if (!createdId) {
        throw new Error('Wallet id missing in response')
      }
      setWalletId(createdId)
      setWalletStatus('success')
      setLastAction(`Wallet created (${createdId}).`)
      await loadUnifiedBalance(createdId)
    } catch (error) {
      console.error(error)
      setWalletStatus('error')
      setWalletError(error.message)
      setLastAction(`Wallet creation failed: ${error.message}`)
    }
  }

  const handleRefreshBalance = () => {
    loadUnifiedBalance()
  }

  const handleOptimise = async () => {
    setOptimiseStatus('loading')
    setOptimiseError('')
    setBridgeMessage('Bridging in progress… orchestrating Node Bridge Kit routes.')
    try {
      const payload = await jsonRequest('/api/optimise', { method: 'POST' })
      setRoutingData(payload)
      setBridgeMessage('Bridge complete — balances synced from routing engine.')
      setOptimiseStatus('success')
      setBuckets((prev) => ({
        rent: Number(payload.rentBucket ?? prev.rent),
        savings: Number(payload.savingsBucket ?? prev.savings),
        investing: Number(payload.investingBucket ?? prev.investing),
      }))
      if (typeof payload.baselineFxRate === 'number' && payload.baselineFxRate > 0) {
        setBaselineFxRate(payload.baselineFxRate)
      }
      setLastAction(`Optimised window executed. Converted ${formatUsd(payload.converted_this_run || 0)}.`)
    } catch (error) {
      console.error(error)
      setOptimiseStatus('error')
      setOptimiseError(error.message)
      setBridgeMessage('Bridge failed — retry after checking optimiser logs.')
      setLastAction(`Optimise failed: ${error.message}`)
    }
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
          <button type="button" className="ghost" onClick={handleCreateWallet} disabled={walletStatus === 'loading'}>
            {walletStatus === 'loading' ? 'Creating…' : 'Create wallet'}
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
          <p className={`status-chip ${balanceStatus === 'error' ? 'status-error' : balanceStatus === 'success' ? 'status-success' : ''}`}>
            {balanceStatus === 'idle' && 'Awaiting refresh'}
            {balanceStatus === 'loading' && 'Calling /api/unified-balance'}
            {balanceStatus === 'success' && 'Gateway data synced'}
            {balanceStatus === 'error' && (balanceError || 'Unable to fetch balance')}
          </p>
          {!!chainBalances.length && (
            <ul className="chain-balances">
              {chainBalances.map((entry) => (
                <li key={entry.chain}>
                  <span>{entry.chain}</span>
                  <strong>{formatUsd(entry.balance)}</strong>
                </li>
              ))}
            </ul>
          )}
          {walletError && <p className="error-text">{walletError}</p>}
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
          <textarea value={bridgeMessage} readOnly />
          <div className="optimisation-actions">
            <button type="button" className="primary" onClick={handleOptimise} disabled={optimiseStatus === 'loading'}>
              {optimiseStatus === 'loading' ? 'Bridging…' : 'Optimise now'}
            </button>
            <button type="button" className="ghost" onClick={handleConvertNow}>
              Convert now
            </button>
          </div>
          <p className={`status-chip ${optimiseStatus === 'error' ? 'status-error' : optimiseStatus === 'success' ? 'status-success' : ''}`}>
            {optimiseStatus === 'idle' && 'Waiting to call /api/optimise'}
            {optimiseStatus === 'loading' && 'Bridging in progress'}
            {optimiseStatus === 'success' && 'Optimise complete'}
            {optimiseStatus === 'error' && (optimiseError || 'Optimise failed')}
          </p>
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
