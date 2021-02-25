// Get closest EC point based on an arbitrary BigNumber.

import {generateSecureRandom} from 'react-native-securerandom';
import BN from 'bn.js';

const secp256k1_p_a = BNTwo.pow(BN.fromNumber(256));

const secp256k1_p_b = BNTwo.pow(BN.fromNumber(32));
const secp256k1_p_c = BN.fromNumber(977);
const secp256k1_p = secp256k1_p_a.sub(secp256k1_p_b).sub(secp256k1_p_c);

const secp256k1_n = BN.fromString(
  'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
  16);

const powm = (a, b, m) => a.toRed(BN.red(m)).redPow(b).fromRed();

const legendre_symbol = (a, p) => {
  const _a = a.clone();
  const _b = p.add(BN.Minus1).div(BNTwo);
  const _c = p.clone();

  const ls = powm(_a, _b, _c);

  const cnd1 = ls.eq(p.add(BN.Minus1));

  return cnd1 ? BN.Minus1 : ls;
};

const process_range = (r, t, m, p) => {
  const _r = [...Array(r).keys()];
  for (const _m of _r) {
    if (t.eq(BN.One)) {
      break;
    }
    t = powm(t, BNTwo, p);
    m = _m;
  }
  return [t, m];
};

const modular_sqrt = (a, p) => {
  if (legendre_symbol(a, p).eq(BN.One) === false) {
    return 0;
  } else if (a.eq(BN.Zero)) {
    return 0;
  } else if (p.eq(BNTwo)) {
    return p;
  } else if (p.mod(BN.fromNumber(4)).eq(BN.fromNumber(3))) {
    return powm(a, p.add(BN.One).div(BN.fromNumber(4)), p);
  }

  let s = p.sub(BN.One);
  let e = BN.Zero;
  while (s.mod(BNTwo).eq(BN.Zero)) {
    s = s.div(BNTwo);
    e = e.add(BN.One);
  }

  let n = BNTwo;
  while (legendre_symbol(n, p).eq(BN.Minus1) === false) {
    n = BN.fromNumber(n).add(BN.One);
  }

  let x = powm(a, s.add(BN.One).div(BNTwo), p);
  let b = powm(a, s, p);
  let g = powm(n, s, p);

  let r = e;

  while (1) {
    let t = b;
    let m = 0;

    [t, m] = process_range(r, t, m, p);

    if (m.eq(BN.Zero)) {
      return x;
    }

    const gs = powm(g, BNTwo.pow(r.sub(m).sub(BN.One)), p);
    g = gs.mul(gs).mod(p);
    x = x.mul(gs).mod(p);
    b = b.mul(g).mod(p);
    r = m;
  }
};



const getClosestECPoint = (
  start,
  ecOpts = {a: BN.Zero, b: BN.fromNumber(7), p: secp256k1_p},
) => {
  const {a, b, p} = ecOpts;

  let x = start.clone();
  let count = BN.Zero.clone();

  while (true) {
    const val_a = x.mul(x).mul(x);
    const val_b = a.mul(x);
    const val_c = b;
    const val = val_a.add(val_b).add(val_c).mod(p);

    const rtn = legendre_symbol(val, p);

    if (rtn.eq(BN.One)) {
      const res = modular_sqrt(val, p);
      console.log({res});
      console.log(x.toString(), res.toString());
      return {x, y: res};
    }

    count = count.add(BN.One);
    x = x.add(BN.One);
    if (count.gt(BN.fromNumber(20))) {
      return null;
    }

    if (x.sub(start).gt(BN.fromNumber(200))) {
      return null;
    }
  }
};

BN.random = async (min, max) => {
  if (max.cmp(min) <= 0) {
    throw new Error('Illegal parameter value: max <= min');
  }
  const modulus = max.sub(min);
  const bytes = modulus.byteLength();
  // Using a while loop is necessary to avoid bias introduced by the mod operation.
  // However, we request 64 extra random bits so that the bias is negligible.
  // Section B.1.1 here: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf
  const r = new BN(await generateSecureRandom(bytes + 8));
  return r.mod(modulus).add(min);
};

const ecies_getRandomNumber = async () => {
  return BN.random(BN.One, secp256k1_n.sub(BN.One));
};