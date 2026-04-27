'use client'

import { DEMO_STORAGE_KEY } from './config'
import { getInitialDemoData, type DemoData } from './seed'

// Store global du mode demo : charge depuis localStorage ou initialise depuis le seed.
// Toutes les operations passent ici.

type Listener = () => void

class DemoStore {
  private data: DemoData
  private listeners = new Set<Listener>()

  constructor() {
    this.data = this.load()
  }

  private load(): DemoData {
    if (typeof window === 'undefined') return getInitialDemoData()
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY)
      if (!raw) {
        const initial = getInitialDemoData()
        this.persist(initial)
        return initial
      }
      return JSON.parse(raw) as DemoData
    } catch {
      const initial = getInitialDemoData()
      this.persist(initial)
      return initial
    }
  }

  private persist(d: DemoData) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(d)) } catch {}
  }

  reset() {
    this.data = getInitialDemoData()
    this.persist(this.data)
    this.notify()
  }

  notify() { this.listeners.forEach(l => l()) }
  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l) }

  // Acces direct (lecture seule)
  get<K extends keyof DemoData>(key: K): DemoData[K] { return this.data[key] }

  // Mutation generique
  update<K extends keyof DemoData>(key: K, updater: (current: DemoData[K]) => DemoData[K]) {
    this.data = { ...this.data, [key]: updater(this.data[key]) }
    this.persist(this.data)
    this.notify()
  }
}

let _store: DemoStore | null = null
export function getDemoStore(): DemoStore {
  if (!_store) _store = new DemoStore()
  return _store
}

export function resetDemo() {
  getDemoStore().reset()
}
