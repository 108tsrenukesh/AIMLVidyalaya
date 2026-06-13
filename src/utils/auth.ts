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
const DB_VERSION = 1
const STORE_NAME = 'users'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 8; i++) {
    const array = new Uint8Array(4)
    crypto.getRandomValues(array)
    const code = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{4}/g)!.join('-')
    codes.push(code)
  }
  return codes
}

export async function register(username: string, password: string): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const getAll = store.getAll()
    getAll.onsuccess = () => {
      const existing = getAll.result.find((u: StoredUser) => u.username === username)
      if (existing) {
        resolve({ success: false, error: 'Username already taken' })
        return
      }

      const salt = generateSalt()
      hashPassword(password, salt).then((passwordHash) => {
        const recoveryCodes = generateRecoveryCodes()
        const hashedRecoveryCodes = Promise.all(recoveryCodes.map(code => hashPassword(code, salt)))

        hashedRecoveryCodes.then((codeHashes) => {
          const user: StoredUser = {
            id: crypto.randomUUID(),
            username,
            passwordHash,
            salt,
            recoveryCodes: codeHashes
          }
          store.put(user)
          tx.oncomplete = () => {
            db.close()
            sessionStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username }))
            resolve({ success: true, recoveryCodes })
          }
        })
      })
    }
  })
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const getAll = store.getAll()
    getAll.onsuccess = () => {
      const stored = getAll.result.find((u: StoredUser) => u.username === username)
      if (!stored) {
        resolve({ success: false, error: 'Invalid credentials' })
        return
      }
      hashPassword(password, stored.salt).then((hash) => {
        if (hash === stored.passwordHash) {
          const user = { id: stored.id, username: stored.username }
          sessionStorage.setItem('currentUser', JSON.stringify(user))
          resolve({ success: true, user })
        } else {
          resolve({ success: false, error: 'Invalid credentials' })
        }
      })
    }
  })
}

export async function resetPassword(username: string, recoveryCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const getAll = store.getAll()
    getAll.onsuccess = () => {
      const stored = getAll.result.find((u: StoredUser) => u.username === username)
      if (!stored) {
        resolve({ success: false, error: 'User not found' })
        return
      }

      hashPassword(recoveryCode, stored.salt).then((codeHash) => {
        const codeIndex = stored.recoveryCodes.indexOf(codeHash)
        if (codeIndex === -1) {
          resolve({ success: false, error: 'Invalid recovery code' })
          return
        }

        hashPassword(newPassword, stored.salt).then((newHash) => {
          stored.recoveryCodes.splice(codeIndex, 1)
          stored.passwordHash = newHash
          store.put(stored)
          tx.oncomplete = () => {
            db.close()
            resolve({ success: true })
          }
        })
      })
    }
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const stored = sessionStorage.getItem('currentUser')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function logout() {
  sessionStorage.removeItem('currentUser')
}
