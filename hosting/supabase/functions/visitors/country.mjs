// Supabase's hosted Cloudflare gateway supplies coarse country metadata.
// This application never reads client IP headers or calls an IP lookup service.
export function countryFromGateway(request) {
  const country = request.headers.get('cf-ipcountry');
  return country && /^[A-Z]{2}$/.test(country) && !['XX', 'ZZ'].includes(country) ? country : 'ZZ';
}
