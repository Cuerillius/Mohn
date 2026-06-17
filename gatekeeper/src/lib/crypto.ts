const PREFIX = 'enc:'

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptApiKey(plaintext: string, secret: string): Promise<string> {
  if (!plaintext) return plaintext
  const key = await getKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  const ivB64 = btoa(String.fromCharCode(...iv))
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  return `${PREFIX}${ivB64}.${ctB64}`
}

export async function decryptApiKey(stored: string, secret: string): Promise<string> {
  if (!stored || !stored.startsWith(PREFIX)) return stored
  const key = await getKey(secret)
  const [ivB64, ctB64] = stored.slice(PREFIX.length).split('.')
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
  const ciphertext = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0))
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
