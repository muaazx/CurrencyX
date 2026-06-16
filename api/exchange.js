/**
 * Vercel Serverless Function: /api/exchange
 * Proxies requests to ExchangeRate-API so the API key never
 * reaches the browser. The key lives only in Vercel env vars.
 *
 * Query params:
 *   from   {string} base currency code  e.g. USD
 *   to     {string} target currency     e.g. EUR
 *   amount {number} optional amount for conversion result
 *
 * GET /api/exchange?from=USD&to=EUR          → rate only
 * GET /api/exchange?from=USD&to=EUR&amount=5 → rate + converted amount
 */
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to, amount } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required params: from, to' });
  }

  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  if (!API_KEY) {
    console.error('EXCHANGE_RATE_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const upstream = amount
    ? `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}/${amount}`
    : `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}`;

  try {
    const upstreamRes = await fetch(upstream);
    const data = await upstreamRes.json();

    // Cache successful rate responses for 1 hour at the CDN edge
    if (data.result === 'success') {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    }

    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    console.error('Upstream fetch failed:', err);
    return res.status(502).json({ error: 'Failed to reach exchange rate service' });
  }
}
