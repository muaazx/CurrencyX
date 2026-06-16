/**
 * CurrencyX — Real-Time Currency Converter
 * Powered by ExchangeRate-API v6
 */

// ── API Configuration ──────────────────────────────────
// In production (Vercel) all requests are proxied through /api/exchange
// so the real API key never reaches the browser.
// On localhost we fall back to a direct call using the dev key.
// Detect local / dev environment:
// — any explicit port (3456, 64332, 8080…) means a dev server is running
// — "localhost" / "127.0.0.1" covers plain hostname checks
// — file: protocol covers opening the HTML directly from disk
// Production Vercel URLs always use HTTPS on port 443 → location.port === ''
const IS_LOCAL = location.port !== ''
              || location.hostname === 'localhost'
              || location.hostname === '127.0.0.1'
              || location.protocol === 'file:';
const DEV_KEY  = 'a403e5d1310f59369abe2c1c'; // only used locally

/**
 * Fetch an exchange rate (and optional conversion) from the proxy or direct API.
 * @param {string} from   - Base currency code (e.g. 'USD')
 * @param {string} to     - Target currency code (e.g. 'EUR')
 * @param {number|null} amount - Optional amount to convert
 * @returns {Promise<object>} ExchangeRate-API response JSON
 */
async function fetchRate(from, to, amount = null) {
  let url;
  if (IS_LOCAL) {
    // Direct call — key visible in devtools, acceptable for local dev
    url = amount
      ? `https://v6.exchangerate-api.com/v6/${DEV_KEY}/pair/${from}/${to}/${amount}`
      : `https://v6.exchangerate-api.com/v6/${DEV_KEY}/pair/${from}/${to}`;
  } else {
    // Proxied through Vercel serverless function — key stays server-side
    url = amount
      ? `/api/exchange?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`
      : `/api/exchange?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Popular quick-view pairs
const QUICK_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'USD', to: 'GBP' },
  { from: 'USD', to: 'JPY' },
  { from: 'USD', to: 'GHS' },
  { from: 'EUR', to: 'USD' },
  { from: 'GBP', to: 'USD' },
  { from: 'USD', to: 'NGN' },
  { from: 'USD', to: 'INR' },
];

// Currency symbols map for common currencies
const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
  KRW: '₩', THB: '฿', RUB: '₽', TRY: '₺', BRL: 'R$', MXN: '$',
  CAD: '$', AUD: '$', NZD: '$', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', PLN: 'zł', HUF: 'Ft', CZK: 'Kč', NGN: '₦', GHS: '₵',
  ZAR: 'R', AED: 'د.إ', SAR: '﷼', PKR: '₨', IDR: 'Rp', HKD: '$',
  SGD: '$', MYR: 'RM', PHP: '₱', ILS: '₪', UAH: '₴',
};

// ── DOM refs ─────────────────────────────────────────
const amountInput    = document.getElementById('amount-input');
const fromSelect     = document.getElementById('from-currency');
const toSelect       = document.getElementById('to-currency');
const swapBtn        = document.getElementById('swap-btn');
const convertBtn     = document.getElementById('convert-btn');
const resultPanel    = document.getElementById('result-panel');
const resultAmount   = document.getElementById('result-amount');
const resultRate     = document.getElementById('result-rate');
const resultTimestamp = document.getElementById('result-timestamp');
const errorPanel     = document.getElementById('error-panel');
const errorMessage   = document.getElementById('error-message');
const baseSymbol     = document.getElementById('base-symbol');
const quickGrid      = document.getElementById('quick-grid');

// ── State ─────────────────────────────────────────────
let currencyCodes = {};
let lastConvertedFrom = null;

// ── Initialization ─────────────────────────────────────
async function init() {
  try {
    const res = await fetch('currency_codes.json');
    currencyCodes = await res.json();
    populateSelects();
    loadQuickRates();
  } catch (err) {
    console.error('Failed to load currency codes:', err);
    showError('Failed to load currency list. Please refresh the page.');
  }
}

function populateSelects() {
  const sorted = Object.entries(currencyCodes).sort((a, b) => a[0].localeCompare(b[0]));

  [fromSelect, toSelect].forEach(sel => {
    sel.innerHTML = '';
    sorted.forEach(([code, name]) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = `${code} — ${name}`;
      sel.appendChild(opt);
    });
  });

  // Sensible defaults
  fromSelect.value = 'USD';
  toSelect.value   = 'EUR';
  updateSymbol();
}

function updateSymbol() {
  const code = fromSelect.value;
  baseSymbol.textContent = CURRENCY_SYMBOLS[code] || code.charAt(0);
}

// ── Event Listeners ────────────────────────────────────
fromSelect.addEventListener('change', () => {
  updateSymbol();
  clearResult();
});

toSelect.addEventListener('change', clearResult);
amountInput.addEventListener('input', clearResult);

swapBtn.addEventListener('click', () => {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value   = tmp;
  updateSymbol();
  clearResult();
  swapBtn.style.transition = 'none'; // reset handled by CSS hover
});

convertBtn.addEventListener('click', handleConvert);

amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleConvert();
});

// ── Conversion Logic ───────────────────────────────────
async function handleConvert() {
  const amount = parseFloat(amountInput.value);
  const from   = fromSelect.value;
  const to     = toSelect.value;

  clearResult();
  hideError();

  if (!amount || amount <= 0) {
    showError('Please enter a valid amount greater than zero.');
    return;
  }
  if (!from || !to) {
    showError('Please select both currencies.');
    return;
  }

  setLoading(true);

  try {
    const data = await fetchRate(from, to, amount);

    if (data.result === 'success') {
      const converted = data.conversion_result;
      const rate      = data.conversion_rate;
      const symbol    = CURRENCY_SYMBOLS[to] || '';
      const updateTime = new Date(data.time_last_update_utc);

      resultAmount.textContent   = `${formatAmount(converted)} ${to}`;
      resultRate.textContent     = `1 ${from} = ${rate} ${to}`;
      resultTimestamp.textContent = `Rates updated: ${formatDate(updateTime)}`;
      showResult();
      lastConvertedFrom = from;
    } else {
      const errType = data['error-type'] || 'unknown';
      showError(getApiError(errType));
    }
  } catch (err) {
    console.error(err);
    showError('Network error. Please check your internet connection and try again.');
  } finally {
    setLoading(false);
  }
}

// ── Quick Rates ────────────────────────────────────────
async function loadQuickRates() {
  quickGrid.innerHTML = '';

  QUICK_PAIRS.forEach(({ from, to }) => {
    const card = document.createElement('div');
    card.className = 'quick-card loading-rate';
    card.dataset.from = from;
    card.dataset.to   = to;
    card.innerHTML = `
      <span class="quick-pair">${from} → ${to}</span>
      <span class="quick-rate">—</span>
      <span class="quick-label">1 ${from} in ${to}</span>
    `;
    card.addEventListener('click', () => {
      fromSelect.value = from;
      toSelect.value   = to;
      amountInput.value = '1';
      updateSymbol();
      clearResult();
      handleConvert();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    quickGrid.appendChild(card);
  });

  // Fetch rates in parallel
  await Promise.allSettled(
    QUICK_PAIRS.map(async ({ from, to }, i) => {
      try {
        const data = await fetchRate(from, to);
        const card = quickGrid.children[i];
        if (data.result === 'success') {
          card.querySelector('.quick-rate').textContent = formatAmount(data.conversion_rate);
          card.classList.remove('loading-rate');
        }
      } catch (_) {
        // Silently fail individual cards
      }
    })
  );
}

// ── Helpers ────────────────────────────────────────────
function formatAmount(num) {
  if (typeof num !== 'number') return '—';
  // Show up to 6 significant decimals, remove trailing zeros
  return parseFloat(num.toPrecision(7)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatDate(date) {
  try {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  } catch { return date.toUTCString(); }
}

function getApiError(errType) {
  const map = {
    'unsupported-code':  'One of the currency codes is not supported.',
    'malformed-request': 'Malformed request. Please check the input.',
    'invalid-key':       'Invalid API key. Please check your configuration.',
    'inactive-account':  'API account is inactive. Please check your plan.',
    'quota-reached':     'API request limit reached. Please try again later.',
  };
  return map[errType] || `API error: ${errType}`;
}

function setLoading(flag) {
  convertBtn.classList.toggle('loading', flag);
  convertBtn.disabled = flag;
}

function showResult() {
  resultPanel.classList.add('visible');
}

function clearResult() {
  resultPanel.classList.remove('visible');
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorPanel.classList.add('visible');
}

function hideError() {
  errorPanel.classList.remove('visible');
}

// ── Boot ───────────────────────────────────────────────
init();
