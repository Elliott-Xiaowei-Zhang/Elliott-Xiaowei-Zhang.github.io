import { createVisitorHandler } from './handler.mjs';
import { countryFromGateway } from './country.mjs';

// Supabase injects these server-side. No database key is placed in the homepage.
const url = Deno.env.get('SUPABASE_URL');
const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const key = keys.default || Object.values(keys)[0] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function rpc(name: string, body = {}) {
  if (!url || !key) throw new Error('Database is not configured');
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: String(key), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3500),
  });
  if (!response.ok) throw new Error('Database request failed');
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(createVisitorHandler({
  totals: () => rpc('homepage_visitor_totals'),
  previousCountry: (id: string) => rpc('homepage_visitor_country', { p_id: id }),
  record: (id: string, country: string) => rpc('homepage_record_visitor', { p_id: id, p_country: country }),
  resolveCountry: countryFromGateway,
}));
