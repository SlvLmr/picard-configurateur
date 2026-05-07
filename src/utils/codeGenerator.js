// Alphabet without ambiguous characters (no O/0, I/1, L)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode(length = 6) {
  const values = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i += 1) {
      values[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[values[i] % ALPHABET.length];
  }
  return code;
}
