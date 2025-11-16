// frontend/src/pages/CrossPayDashboard.jsx
import { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'

const emptyRoutingState = {
  deposited: 0,
  converted_this_run: 0,
  instantAvailable: 0,
  optimisedPending: 0,
  rentBucket: 0,
  savingsBucket: 0,
  investingBucket: 0,
  totalSalaryReceived: 0,
  extraGainedVsInstant: 0,
  baselineFxRate: 0,
}

export default function CrossPayDashboard() {
  const [routingState, setRoutingState] = useState(emptyRoutingState)
  const [salaryInput, setSalaryInput] = useState(1000)
  const [instantPercent, setInstantPercent] = useState(40) // 40 percent
  const [maxWaitHours, setMaxWaitHours] = useState(24)
  const [fxRateDeposit, setFxRateDeposit] = useState(1.0)

  const [marketCondition, setMarketCondition] = useState('GOOD')
  const [currentFxRate, setCurrentFxRate] = useState(1.02)

  const [walletInfo, setWalletInfo] = useState({
    walletSetId: null,
    walletId: null,
    address: null,
    blockchain: null,
  })

  const [loading, setLoading] = useState(false)
  const [optimising, setOptimising] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // ---------- helpers ----------

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Request failed ${res.status}: ${text}`)
    }

    return res.json()
  }

  // ---------- initial load ----------

  useEffect(() => {
    // load state + wallet on mount
    const loadInitial = async () => {
      try {
        const [state, wallet] = await Promise.allSettled([
          fetchJson(`${API_BASE}/state`),
          fetchJson(`${API_BASE}/circle/wallet`),
        ])

        if (state.status === 'fulfilled') {
          setRoutingState((prev) => ({ ...prev, ...state.value }))
        }

        if (wallet.status === 'fulfilled') {
          setWalletInfo(wallet.value)
        }
      } catch (error) {
        console.error(error)
      }
    }

    loadInitial()
  }, [])

  // ---------- actions ----------

  async function handleDeposit() {
    try {
      setLoading(true)
      setErrorMessage('')
      setStatusMessage('Depositing salary into optimiser...')

      const body = {
        amount: Number(salaryInput),
        fx_rate_at_deposit: Number(fxRateDeposit),
        instant_percent: Number(instantPercent) / 100,
        max_wait_seconds: Number(maxWaitHours) * 3600,
      }

      const data = await fetchJson(`${API_BASE}/salary/deposit`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setRoutingState(data)
      setStatusMessage('Salary deposited into CrossPay engine.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Could not deposit salary. Check backend is running.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOptimise() {
    try {
      setOptimising(true)
      setErrorMessage('')
      setStatusMessage('Running optimisation tick...')

      const body = {
        market_condition: marketCondition,
        current_fx_rate: Number(currentFxRate),
      }

      const data = await fetchJson(`${API_BASE}/optimisation/tick`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setRoutingState(data)

      if (data.converted_this_run > 0) {
        setStatusMessage(
          `Optimised ${data.converted_this_run.toFixed(
            2,
          )} from pending to instant based on market condition.`,
        )
      } else {
        setStatusMessage('No conversion this tick. Funds kept in optimised lane.')
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Optimisation call failed. Check the optimisation routes.')
    } finally {
      setOptimising(false)
    }
  }

  async function handleOverride() {
    try {
      setOverrideLoading(true)
      setErrorMessage('')
      setStatusMessage('Converting all optimised funds now...')

      const data = await fetchJson(`${API_BASE}/optimisation/override`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      setRoutingState(data)

      if (data.converted_this_run > 0) {
        setStatusMessage(
          `Converted ${data.converted_this_run.toFixed(
            2,
          )} from optimised to instant on user override.`,
        )
      } else {
        setStatusMessage('Nothing to convert. Optimised balance is zero.')
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Override call failed. Check the override route.')
    } finally {
      setOverrideLoading(false)
    }
  }

  async function refreshWallet() {
    try {
      setStatusMessage('Refreshing Circle wallet info...')
      const data = await fetchJson(`${API_BASE}/circle/wallet`)
      setWalletInfo(data)
      setStatusMessage('Loaded Circle wallet from backend.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Could not load wallet. Check Circle endpoints.')
    }
  }

  // ---------- derived values ----------

  const totalBuckets =
    routingState.rentBucket +
    routingState.savingsBucket +
    routingState.investingBucket

  const rentPercent =
    totalBuckets > 0 ? (routingState.rentBucket / totalBuckets) * 100 : 0
  const savingsPercent =
    totalBuckets > 0 ? (routingState.savingsBucket / totalBuckets) * 100 : 0
  const investingPercent =
    totalBuckets > 0 ? (routingState.investingBucket / totalBuckets) * 100 : 0

  return (
    <div className="dashboard">
      <div className="section-heading">
        <p className="eyebrow">LIVE ENGINE</p>
        <h2>CrossPay routing console</h2>
        <p className="subhead">
          This dashboard is wired to the FastAPI backend. Every button call hits the optimiser and Circle wallet integration.
        </p>
      </div>

      {/* top row */}
      <div className="grid grid-3">
        {/* salary + settings */}
        <article className="glass-card lift dash-card">
          <h3>1. Salary deposit</h3>
          <p className="dash-muted">
            Choose salary, instant slice, and max wait. Then send it into the CrossPay engine.
          </p>

          <label className="dash-label">
            Salary amount (USDC)
            <input
              type="number"
              min="0"
              step="10"
              value={salaryInput}
              onChange={(e) => setSalaryInput(Number(e.target.value))}
            />
          </label>

          <label className="dash-label">
            Instant percentage
            <input
              type="range"
              min="0"
              max="100"
              value={instantPercent}
              onChange={(e) => setInstantPercent(Number(e.target.value))}
            />
            <span className="dash-value">{instantPercent}% goes straight to instant lane.</span>
          </label>

          <label className="dash-label">
            Max wait time
            <select
              value={maxWaitHours}
              onChange={(e) => setMaxWaitHours(Number(e.target.value))}
            >
              <option value={0}>No wait (always convert)</option>
              <option value={24}>24 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>

          <label className="dash-label">
            FX at deposit
            <input
              type="number"
              step="0.01"
              value={fxRateDeposit}
              onChange={(e) => setFxRateDeposit(Number(e.target.value))}
            />
            <span className="dash-hint">
              Used for the baseline "what if we converted instantly" comparison.
            </span>
          </label>

          <button
            type="button"
            className="primary ripple dash-button"
            onClick={handleDeposit}
            disabled={loading}
          >
            {loading ? 'Depositing...' : 'Deposit salary'}
          </button>

          <p className="dash-small">
            Last deposit recorded: <strong>{routingState.deposited.toFixed(2)}</strong> USDC
          </p>
        </article>

        {/* balances */}
        <article className="glass-card lift dash-card">
          <h3>2. Balances</h3>
          <p className="dash-muted">
            Live view of instant balance vs optimised queue and bucket totals.
          </p>

          <div className="dash-balance-main">
            <div>
              <span className="dash-label-inline">Instant available</span>
              <p className="dash-number">{routingState.instantAvailable.toFixed(2)} USDC</p>
            </div>
            <div>
              <span className="dash-label-inline">Optimised pending</span>
              <p className="dash-number">{routingState.optimisedPending.toFixed(2)} USDC</p>
            </div>
          </div>

          <div className="dash-bar">
            <div
              className="dash-bar-instant"
              style={{
                width:
                  routingState.instantAvailable + routingState.optimisedPending > 0
                    ? `${
                        (routingState.instantAvailable /
                          (routingState.instantAvailable + routingState.optimisedPending)) *
                        100
                      }%`
                    : '0%',
              }}
            />
          </div>
          <div className="dash-bar-legend">
            <span>Instant</span>
            <span>Optimised</span>
          </div>

          <div className="dash-buckets">
            <div>
              <h4>Rent</h4>
              <p className="dash-number-small">
                {routingState.rentBucket.toFixed(2)} USDC
              </p>
              <p className="dash-muted-small">{rentPercent.toFixed(0)}% of buckets</p>
            </div>
            <div>
              <h4>Savings</h4>
              <p className="dash-number-small">
                {routingState.savingsBucket.toFixed(2)} USDC
              </p>
              <p className="dash-muted-small">{savingsPercent.toFixed(0)}% of buckets</p>
            </div>
            <div>
              <h4>Investing</h4>
              <p className="dash-number-small">
                {routingState.investingBucket.toFixed(2)} USDC
              </p>
              <p className="dash-muted-small">{investingPercent.toFixed(0)}% of buckets</p>
            </div>
          </div>

          <p className="dash-small">
            Total salary processed: <strong>{routingState.totalSalaryReceived.toFixed(2)}</strong> USDC
          </p>
        </article>

        {/* wallet / circle */}
        <article className="glass-card lift dash-card">
          <h3>3. Circle wallet on Arc</h3>
          <p className="dash-muted">
            This is pulled from the Circle Wallets integration you wired in the backend.
          </p>

          <button
            type="button"
            className="ghost dash-button"
            onClick={refreshWallet}
          >
            Refresh wallet
          </button>

          {walletInfo.walletId ? (
            <div className="dash-wallet">
              <p className="dash-small">
                <span className="dash-label-inline">Wallet set</span>
                <span className="dash-mono">{walletInfo.walletSetId}</span>
              </p>
              <p className="dash-small">
                <span className="dash-label-inline">Wallet id</span>
                <span className="dash-mono">{walletInfo.walletId}</span>
              </p>
              <p className="dash-small">
                <span className="dash-label-inline">Address</span>
                <span className="dash-mono">{walletInfo.address}</span>
              </p>
              <p className="dash-small">
                <span className="dash-label-inline">Chain</span>
                <span>{walletInfo.blockchain}</span>
              </p>
            </div>
          ) : (
            <p className="dash-muted-small">
              No wallet info yet. Hit "Refresh wallet" to query the backend.
            </p>
          )}
        </article>
      </div>

      {/* bottom row */}
      <div className="grid grid-2 dash-bottom-row">
        {/* optimisation controls */}
        <article className="glass-card lift dash-card">
          <h3>4. Optimisation engine</h3>
          <p className="dash-muted">
            This drives your Python routing_service logic. It decides how much of the queue to convert.
          </p>

          <label className="dash-label">
            Market condition
            <select
              value={marketCondition}
              onChange={(e) => setMarketCondition(e.target.value)}
            >
              <option value="GOOD">Good market</option>
              <option value="OK">Normal market</option>
              <option value="BAD">Bad market</option>
            </select>
          </label>

          <label className="dash-label">
            Current FX rate
            <input
              type="number"
              step="0.01"
              value={currentFxRate}
              onChange={(e) => setCurrentFxRate(Number(e.target.value))}
            />
          </label>

          <div className="dash-button-row">
            <button
              type="button"
              className="primary ripple"
              onClick={handleOptimise}
              disabled={optimising}
            >
              {optimising ? 'Optimising...' : 'Run optimisation tick'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={handleOverride}
              disabled={overrideLoading}
            >
              {overrideLoading ? 'Converting...' : 'Convert all now'}
            </button>
          </div>

          <p className="dash-small">
            Last converted this run: <strong>{routingState.converted_this_run.toFixed(2)}</strong> USDC
          </p>
        </article>

        {/* extra value vs instant */}
        <article className="glass-card lift dash-card">
          <h3>5. Extra value vs instant</h3>
          <p className="dash-muted">
            Compares your smart routing to a naive strategy that always converts at deposit time.
          </p>

          <p className="dash-number">
            {routingState.extraGainedVsInstant.toFixed(2)} USDC
          </p>
          <p className="dash-muted-small">
            Extra value gained so far compared with converting everything instantly.
          </p>

          <p className="dash-small">
            Baseline FX at deposit: <strong>{routingState.baselineFxRate.toFixed(4)}</strong>
          </p>

          {routingState.extraGainedVsInstant > 0 ? (
            <p className="dash-pill dash-pill-positive">
              Your optimiser is beating the instant strategy.
            </p>
          ) : (
            <p className="dash-pill dash-pill-neutral">
              No gain yet. Funds might still be waiting for a better window.
            </p>
          )}
        </article>
      </div>

      {/* status + errors */}
      {(statusMessage || errorMessage) && (
        <div className="dash-status-row">
          {statusMessage && <p className="dash-status">{statusMessage}</p>}
          {errorMessage && <p className="dash-error">{errorMessage}</p>}
        </div>
      )}
    </div>
  )
}
