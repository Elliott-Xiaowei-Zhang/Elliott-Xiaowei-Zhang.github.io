import { Buffer } from 'node:buffer';
import { brotliDecompressSync } from 'node:zlib';
import { Reader } from 'mmdb-lib';
import { compressedCountryDatabase } from './country-data.mjs';

// Decode the bundled public dataset once per isolate, without a network request.
const database = new Reader(brotliDecompressSync(Buffer.from(compressedCountryDatabase, 'base64')));

// Supabase documents the first X-Forwarded-For address as the client's address.
// Use it in memory only; never persist, log, return or send it to another service.
export function countryFromGateway(request) {
  const address = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!address || address.length > 45 || !/^[0-9a-fA-F:.]+$/.test(address)) return 'ZZ';
  try {
    const country = database.get(address)?.country_code;
    return country && /^[A-Z]{2}$/.test(country) && !['XX', 'ZZ'].includes(country) ? country : 'ZZ';
  } catch { return 'ZZ'; }
}
