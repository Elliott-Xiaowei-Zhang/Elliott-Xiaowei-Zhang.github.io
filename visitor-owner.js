const pendingKey = 'xz-recent-visits-request';
const curve = { name: 'ECDH', namedCurve: 'P-256' };
const maxAge = 10 * 60 * 1000;

function decode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}

export async function startOwnerVisitSignIn(endpoint, storage) {
  const pair = await crypto.subtle.generateKey(curve, true, ['deriveKey']);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const state = crypto.randomUUID();
  const url = new URL(endpoint);
  url.searchParams.set('state', state);
  url.searchParams.set('key', btoa(String.fromCharCode(...publicKey))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  storage.setItem(pendingKey, JSON.stringify({
    state, issuedAt: Date.now(), key: await crypto.subtle.exportKey('jwk', pair.privateKey),
  }));
  return url.href;
}

export async function readOwnerVisitReturn(result, storage) {
  const saved = storage.getItem(pendingKey);
  storage.removeItem(pendingKey);
  const pending = JSON.parse(saved ?? 'null');
  const [state, peer, iv, ciphertext, extra] = result.split('.');
  if (!pending || state !== pending.state || Date.now() - pending.issuedAt > maxAge) {
    throw new Error('Your sign-in expired. Please try again.');
  }
  if (peer === 'owner-required') throw new Error('Sign in with the site owner’s account.');
  if (peer === 'unavailable') throw new Error('Could not load recent visits. Please try again.');
  if (extra !== undefined || !/^[A-Za-z0-9_-]{87}$/.test(peer) ||
      !/^[A-Za-z0-9_-]{16}$/.test(iv) || !/^[A-Za-z0-9_-]{23,2048}$/.test(ciphertext)) {
    throw new Error('Invalid visit response');
  }

  const privateKey = await crypto.subtle.importKey('jwk', pending.key, curve, false, ['deriveKey']);
  const publicKey = await crypto.subtle.importKey('raw', decode(peer), curve, false, []);
  const key = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey }, privateKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  const data = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decode(iv), additionalData: new TextEncoder().encode(state) }, key, decode(ciphertext),
  );
  const visits = JSON.parse(new TextDecoder().decode(data));
  if (!Array.isArray(visits) || visits.length > 12) throw new Error('Invalid visits');
  return visits.map(({ country, first_seen }) => {
    if (!/^[A-Z]{2}$/.test(country) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(first_seen) ||
        !Number.isFinite(Date.parse(first_seen))) throw new Error('Invalid visit');
    return { country, first_seen };
  });
}
