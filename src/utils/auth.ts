export interface User {
  id: string
  username: string
}

interface StoredUser {
  id: string
  username: string
  passwordHash: string
  salt: string
  recoveryCodes: string[]
}

const DB_NAME = 'vidyalaya-auth'
const DB_VERSION = 2
const STORE_NAME = 'users'

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 60_000
const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_WINDOW_MS = 3_600_000

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxAttempts) return false
  entry.count++
  return true
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('username', 'username', { unique: true })
      } else {
        const tx = request.transaction!
        const store = tx.objectStore(STORE_NAME)
        if (!store.indexNames.contains('username')) {
          store.createIndex('username', 'username', { unique: true })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 600_000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 8; i++) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const code = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{4}/g)!.join('-')
    codes.push(code)
  }
  return codes
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function validateUsername(username: string): string | null {
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 30) return 'Username must be at most 30 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and hyphens'
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 128) return 'Password must be at most 128 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit'
  return null
}

export async function register(username: string, password: string): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
  const usernameError = validateUsername(username)
  if (usernameError) return { success: false, error: usernameError }

  const passwordError = validatePassword(password)
  if (passwordError) return { success: false, error: passwordError }

  const db = await openDB()

  const checkUsername = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const index = tx.objectStore(STORE_NAME).index('username')
      const req = index.get(username)
      req.onsuccess = () => resolve(!!req.result)
      req.onerror = () => resolve(false)
    })
  }

  if (await checkUsername()) {
    db.close()
    return { success: false, error: 'Username already taken' }
  }

  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  const recoveryCodes = generateRecoveryCodes()
  const codeHashes = await Promise.all(recoveryCodes.map(code => hashPassword(code, salt)))

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      salt,
      recoveryCodes: codeHashes
    }
    tx.oncomplete = () => {
      db.close()
      sessionStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username }))
      resolve({ success: true, recoveryCodes })
    }
    tx.onerror = () => {
      db.close()
      resolve({ success: false, error: 'Registration failed' })
    }
    store.put(user)
  })
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  const rateKey = `login:${username}`
  if (!checkRateLimit(rateKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return { success: false, error: 'Too many attempts. Please try again in 1 minute.' }
  }

  const db = await openDB()

  const fetchUser = (): Promise<StoredUser | undefined> => {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const index = tx.objectStore(STORE_NAME).index('username')
      const req = index.get(username)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })
  }

  const stored = await fetchUser()
  db.close()

  if (!stored) {
    return { success: false, error: 'Invalid credentials' }
  }

  const hash = await hashPassword(password, stored.salt)
  if (timingSafeEqual(hash, stored.passwordHash)) {
    rateLimitStore.delete(rateKey)
    const user = { id: stored.id, username: stored.username }
    sessionStorage.setItem('currentUser', JSON.stringify(user))
    return { success: true, user }
  }

  return { success: false, error: 'Invalid credentials' }
}

export async function resetPassword(username: string, recoveryCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const passwordError = validatePassword(newPassword)
  if (passwordError) return { success: false, error: passwordError }

  const rateKey = `recovery:${username}`
  if (!checkRateLimit(rateKey, MAX_RECOVERY_ATTEMPTS, RECOVERY_WINDOW_MS)) {
    return { success: false, error: 'Too many attempts. Please try again in 1 hour.' }
  }

  const db = await openDB()

  const fetchUser = (): Promise<StoredUser | undefined> => {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const index = tx.objectStore(STORE_NAME).index('username')
      const req = index.get(username)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })
  }

  const stored = await fetchUser()
  if (!stored) {
    db.close()
    return { success: false, error: 'User not found' }
  }

  const codeHash = await hashPassword(recoveryCode, stored.salt)
  const codeIndex = stored.recoveryCodes.findIndex((c: string) => timingSafeEqual(c, codeHash))
  if (codeIndex === -1) {
    db.close()
    return { success: false, error: 'Invalid recovery code' }
  }

  const newHash = await hashPassword(newPassword, stored.salt)
  stored.recoveryCodes.splice(codeIndex, 1)
  stored.passwordHash = newHash

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    tx.oncomplete = () => {
      db.close()
      rateLimitStore.delete(rateKey)
      resolve({ success: true })
    }
    tx.onerror = () => {
      db.close()
      resolve({ success: false, error: 'Reset failed' })
    }
    store.put(stored)
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const stored = sessionStorage.getItem('currentUser')
  if (!stored) return null
  try {
    const user = JSON.parse(stored)
    if (!user || !user.id || !user.username) return null
    return user
  } catch {
    return null
  }
}

export function logout() {
  sessionStorage.removeItem('currentUser')
}
