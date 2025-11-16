import { useEffect, useState } from 'react';
import './CrossPayDashboard.css';
import { getJson, postJson } from '../api';

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
};

export default function CrossPayDashboard() {
  const [routingState, setRoutingState] = useState(emptyRoutingState);

  const [salaryInput, setSalaryInput] = useState(1000);
  const [instantPercent, setInstantPercent] = useState(33);
  const [maxWaitHours, setMaxWaitHours] = useState(72);
  const [fxRateDeposit, setFxRateDeposit] = useState(1.06);

  const [marketCondition, setMarketCondition] = useState('GOOD');
  const [currentFxRate, setCurrentFxRate] = useState(1.02);

  const [walletInfo, setWalletInfo] = useState({
    walletSetId: null,
    walletId: null,
    address: null,
    blockchain: null,
  });

  const [status, setStatus] = useState('');
  const [optimStatus, setOptimStatus] = useState('');
  const [walletStatus, setWalletStatus] = useState('');

  // Load initial state and wallet on mount
  useEffect(() => {
    async function init() {
      try {
        const s = await getJson('/api/state');
        setRoutingState((prev) => ({ ...prev, ...s }));
      } catch (err) {
        console.error('Error loading initial state', err);
      }

      try {
        const w = await getJson('/api/circle/wallet');
        setWalletInfo(w);
      } catch (err) {
        console.warn('No wallet info yet', err);
      }
    }

    init();
  }, []);

  // Handlers

  const handleDepositSalary = async () => {
    setStatus('Depositing salary...');
    try {
      const body = {
        amount: Number(salaryInput),
        fx_rate_at_deposit: Number(fxRateDeposit),
        instant_percent: Number(instantPercent) / 100,
        max_wait_seconds: Number(maxWaitHours) * 3600,
      };

      console.log('POST /api/salary/deposit', body);

      const resp = await postJson('/api/salary/deposit', body);
      console.log('Deposit response', resp);
      setRoutingState(resp);
      setStatus(`Deposit sent: ${body.amount.toFixed(2)} USDC`);
    } catch (err) {
      console.error('Deposit error', err);
      setStatus('Deposit failed. Check backend logs.');
    }
  };

  const handleRunOptimisation = async () => {
    setOptimStatus('Running optimisation tick...');
    try {
      const body = {
        market_condition: marketCondition,
        current_fx_rate: Number(currentFxRate),
      };

      console.log('POST /api/optimisation/tick', body);

      const resp = await postJson('/api/optimisation/tick', body);
      console.log('Optimisation response', resp);
      setRoutingState(resp);
      setOptimStatus(`Converted this run: ${resp.converted_this_run.toFixed(2)} USDC`);
    } catch (err) {
      console.error('Optimisation error', err);
      setOptimStatus('Optimisation call failed. Check the optimisation routes.');
    }
  };

  const handleConvertAllNow = async () => {
    setOptimStatus('Converting all now...');
    try {
      console.log('POST /api/optimisation/convert-now');
      const resp = await postJson('/api/optimisation/convert-now', {});
      console.log('Convert-now response', resp);
      setRoutingState(resp);
      setOptimStatus(`Converted this run: ${resp.converted_this_run.toFixed(2)} USDC`);
    } catch (err) {
      console.error('Convert-now error', err);
      setOptimStatus('Convert-all call failed.');
    }
  };

  const handleRefreshWallet = async () => {
    setWalletStatus('Refreshing wallet...');
    try {
      const resp = await getJson('/api/circle/wallet');
      console.log('Wallet response', resp);
      setWalletInfo(resp);
      setWalletStatus('Wallet refreshed from backend.');
    } catch (err) {
      console.error('Wallet error', err);
      setWalletStatus('Wallet refresh failed.');
    }
  };

  // Helpers for percentages
  const totalBuckets =
    routingState.rentBucket + routingState.savingsBucket + routingState.investingBucket || 0.00001;

  const rentPct = (routingState.rentBucket / totalBuckets) * 100;
  const savingsPct = (routingState.savingsBucket / totalBuckets) * 100;
  const investingPct = (routingState.investingBucket / totalBuckets) * 100;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>CrossPay live engine</h2>
          <p className="dashboard__header-meta">
            This section is wired to your FastAPI backend and Python routing_service.
          </p>
        </div>
      </header>

      <div className="dashboard__grid">
        {/* 1. Salary deposit */}
        <section className="panel panel--salary">
          <h3>1. Salary deposit</h3>
          <p className="panel__sub">
            Choose salary, instant slice, and max wait. Then send it into the CrossPay engine.
          </p>

          <label className="field">
            <span>Salary amount (USDC)</span>
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Instant percentage</span>
            <input
              type="range"
              min="0"
              max="100"
              value={instantPercent}
              onChange={(e) => setInstantPercent(e.target.value)}
            />
            <small>{instantPercent}% goes straight to instant lane.</small>
          </label>

          <label className="field">
            <span>Max wait time</span>
            <select
              value={maxWaitHours}
              onChange={(e) => setMaxWaitHours(e.target.value)}
            >
              <option value={0}>0 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>

          <label className="field">
            <span>FX at deposit</span>
            <input
              type="number"
              step="0.01"
              value={fxRateDeposit}
              onChange={(e) => setFxRateDeposit(e.target.value)}
            />
            <small>Used for the baseline "what if we converted instantly" comparison.</small>
          </label>

          <button className="primary ripple" type="button" onClick={handleDepositSalary}>
            Deposit salary
          </button>

          <p className="panel__meta">
            Last deposit recorded: {routingState.deposited.toFixed(2)} USDC
          </p>
          <p className="panel__status">{status}</p>
        </section>

        {/* 2. Balances */}
        <section className="panel panel--balances">
          <h3>2. Balances</h3>
          <p className="panel__sub">
            Live view of instant balance vs optimised queue and bucket totals.
          </p>

          <div className="balances-row">
            <div>
              <p>Instant available</p>
              <h2>{routingState.instantAvailable.toFixed(2)}</h2>
              <span>USDC</span>
            </div>
            <div>
              <p>Optimised pending</p>
              <h2>{routingState.optimisedPending.toFixed(2)}</h2>
              <span>USDC</span>
            </div>
          </div>

          <div className="buckets-row">
            <div>
              <h4>Instant</h4>
              <p>Rent</p>
              <strong>{routingState.rentBucket.toFixed(2)} USDC</strong>
              <small>{rentPct.toFixed(0)}% of buckets</small>
            </div>
            <div>
              <h4>Optimised</h4>
              <p>Savings</p>
              <strong>{routingState.savingsBucket.toFixed(2)} USDC</strong>
              <small>{savingsPct.toFixed(0)}% of buckets</small>
            </div>
            <div>
              <h4>Optimised</h4>
              <p>Investing</p>
              <strong>{routingState.investingBucket.toFixed(2)} USDC</strong>
              <small>{investingPct.toFixed(0)}% of buckets</small>
            </div>
          </div>

          <p className="panel__meta">
            Total salary processed: {routingState.totalSalaryReceived.toFixed(2)} USDC
          </p>
        </section>

        {/* 3. Circle wallet */}
        <section className="panel panel--wallet">
          <h3>3. Circle wallet on Arc</h3>
          <p className="panel__sub">
            This is pulled from the Circle Wallets integration you wired in the backend.
          </p>

          <button className="ghost" type="button" onClick={handleRefreshWallet}>
            Refresh wallet
          </button>

          {walletInfo.walletId ? (
            <div className="wallet-info">
              <p>Wallet set id: {walletInfo.walletSetId}</p>
              <p>Wallet id: {walletInfo.walletId}</p>
              <p>Address: {walletInfo.address}</p>
              <p>Chain: {walletInfo.blockchain}</p>
            </div>
          ) : (
            <p className="panel__meta">
              No wallet info yet. Hit "Refresh wallet" to query the backend.
            </p>
          )}

          <p className="panel__status">{walletStatus}</p>
        </section>
      </div>

      <div className="dashboard__grid">
        {/* 4. Optimisation engine */}
        <section className="panel panel--optim">
          <h3>4. Optimisation engine</h3>
          <p className="panel__sub">
            This drives your Python routing_service logic. It decides how much of the queue to convert.
          </p>

          <label className="field">
            <span>Market condition</span>
            <select
              value={marketCondition}
              onChange={(e) => setMarketCondition(e.target.value)}
            >
              <option value="GOOD">Good market</option>
              <option value="OK">Normal market</option>
              <option value="BAD">Bad market</option>
            </select>
          </label>

          <label className="field">
            <span>Current FX rate</span>
            <input
              type="number"
              step="0.01"
              value={currentFxRate}
              onChange={(e) => setCurrentFxRate(e.target.value)}
            />
          </label>

          <button
            className="primary ripple"
            type="button"
            onClick={handleRunOptimisation}
          >
            Run optimisation tick
          </button>

          <button className="ghost" type="button" onClick={handleConvertAllNow}>
            Convert all now
          </button>

          <p className="panel__meta">
            Last converted this run: {routingState.converted_this_run.toFixed(2)} USDC
          </p>
          <p className="panel__status">{optimStatus}</p>
        </section>

        {/* 5. Extra value vs instant */}
        <section className="panel panel--extra">
          <h3>5. Extra value vs instant</h3>
          <p className="panel__sub">
            Compares your smart routing to a naive strategy that always converts at deposit time.
          </p>

          <div className="extra-main">
            <h1>{routingState.extraGainedVsInstant.toFixed(2)} USDC</h1>
            <p>Extra value gained so far compared with converting everything instantly.</p>
          </div>

          <p className="panel__meta">
            Baseline FX at deposit: {routingState.baselineFxRate.toFixed(4)}
          </p>

          {routingState.extraGainedVsInstant > 0 ? (
            <p className="hint hint--good">
              Nice. Your routing has already beaten the naive instant strategy.
            </p>
          ) : (
            <p className="hint">
              No gain yet. Funds might still be waiting for a better window.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
