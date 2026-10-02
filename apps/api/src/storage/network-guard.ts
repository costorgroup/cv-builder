import { lookup } from 'node:dns/promises';

export const isLocalHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

/**
 * Names and addresses inside our own network. Our server sends requests to
 * the endpoint a customer gives, so these would let them probe it (SSRF).
 */
export const isPrivateHost = (host: string) => {
  const name = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    isLocalHost(host) ||
    name === '::1' ||
    name.endsWith('.localhost') ||
    name.endsWith('.internal')
  ) {
    return true;
  }
  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
    .exec(name.replace(/^::ffff:/, ''))
    ?.slice(1)
    .map(Number);
  if (ipv4) {
    const [a = 0, b = 0] = ipv4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  return name.includes(':') && /^(::|fc|fd|fe80)/.test(name);
};

/** Local addresses are only for trying it out in development. */
export const allowsLocalEndpoints = () => process.env.NODE_ENV !== 'production';

/**
 * Refuses a host that is, or resolves to, a private address: a public name
 * can point inside our network too. Localhost passes in development only.
 * (A name could still change what it resolves to between this check and the
 * connection; the window is small, and the request is to a bucket API.)
 */
export const assertPublicHost = async (host: string) => {
  if (isLocalHost(host) && allowsLocalEndpoints()) return;
  if (isPrivateHost(host)) {
    throw new Error(`${host} is a private address`);
  }
  const addresses = await lookup(host.replace(/^\[|\]$/g, ''), {
    all: true,
  });
  const inside = addresses.find(({ address }) => isPrivateHost(address));
  if (inside) {
    throw new Error(`${host} points to a private address (${inside.address})`);
  }
};
