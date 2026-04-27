'use client'

import { getDemoStore } from './store'
import type { DemoData } from './seed'

// Mock minimaliste de supabase-js pour le mode demo.
// Implemente uniquement la chaine d'API utilisee par notre app.
// Tout est synchronise avec le DemoStore (localStorage).

const TABLE_TO_KEY: Record<string, keyof DemoData | null> = {
  clients: 'clients',
  posts: 'posts',
  metrics: 'metrics',
  messages: 'messages',
  appointments: 'appointments',
  post_annotations: 'annotations',
  post_versions: 'postVersions',
  reminders: 'reminders',
  notification_emails: 'notificationEmails',
  availability_rules: 'availabilityRules',
  onboarding_answers: 'onboardingAnswers',
  google_tokens: null,
  profiles: null,
  push_subscriptions: null,
}

type Filter = (row: any) => boolean
type Order = { column: string; ascending: boolean }

class QueryBuilder {
  private table: string
  private filters: Filter[] = []
  private orders: Order[] = []
  private limitN: number | null = null
  private singleMode: 'single' | 'maybeSingle' | null = null
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: any = null
  private matchAll: Record<string, any> = {}
  private rawColumns = '*'

  constructor(table: string) { this.table = table }

  select(cols?: string) { this.rawColumns = cols || '*'; this.mode = 'select'; return this }

  eq(col: string, val: any) { this.filters.push((r) => r[col] === val); return this }
  is(col: string, val: any) { this.filters.push((r) => (val === null ? r[col] == null : r[col] === val)); return this }
  in(col: string, vals: any[]) { this.filters.push((r) => vals.includes(r[col])); return this }
  gte(col: string, val: any) { this.filters.push((r) => r[col] >= val); return this }
  lte(col: string, val: any) { this.filters.push((r) => r[col] <= val); return this }
  gt(col: string, val: any) { this.filters.push((r) => r[col] > val); return this }
  lt(col: string, val: any) { this.filters.push((r) => r[col] < val); return this }
  not(col: string, op: string, val: any) {
    this.filters.push((r) => {
      if (op === 'is') return val === null ? r[col] != null : r[col] !== val
      return r[col] !== val
    })
    return this
  }
  match(obj: Record<string, any>) { Object.assign(this.matchAll, obj); return this }
  order(col: string, opt?: { ascending?: boolean }) { this.orders.push({ column: col, ascending: opt?.ascending !== false }); return this }
  limit(n: number) { this.limitN = n; return this }
  maybeSingle() { this.singleMode = 'maybeSingle'; return this.run() }
  single() { this.singleMode = 'single'; return this.run() }

  insert(payload: any) { this.mode = 'insert'; this.payload = payload; return this }
  update(payload: any, _opts?: { count?: 'exact' }) { this.mode = 'update'; this.payload = payload; return this }
  delete() { this.mode = 'delete'; return this }
  upsert(payload: any, _opts?: { onConflict?: string }) { this.mode = 'insert'; this.payload = payload; return this }

  // Permet `.then()` (await direct)
  then<T = any>(onfulfilled?: (v: any) => T): Promise<T> {
    return this.run().then(onfulfilled as any)
  }

  private getRows(): any[] {
    const key = TABLE_TO_KEY[this.table]
    if (!key) return []
    const arr = getDemoStore().get(key) as any[]
    return Array.isArray(arr) ? arr : []
  }

  private writeRows(updater: (rows: any[]) => any[]) {
    const key = TABLE_TO_KEY[this.table]
    if (!key) return
    getDemoStore().update(key, ((rows: any) => updater(rows as any[])) as any)
  }

  private filtered(rows: any[]): any[] {
    let out = rows
    for (const [k, v] of Object.entries(this.matchAll)) out = out.filter(r => r[k] === v)
    for (const f of this.filters) out = out.filter(f)
    return out
  }

  private async run(): Promise<{ data: any; error: any; count?: number }> {
    const rows = this.getRows()
    if (this.mode === 'select') {
      let data = this.filtered(rows)
      for (const o of this.orders) {
        data = data.slice().sort((a, b) => {
          const av = a[o.column]; const bv = b[o.column]
          if (av === bv) return 0
          return (av < bv ? -1 : 1) * (o.ascending ? 1 : -1)
        })
      }
      if (this.limitN != null) data = data.slice(0, this.limitN)
      if (this.singleMode === 'single') {
        if (data.length === 0) return { data: null, error: { message: 'Not found' } }
        return { data: data[0], error: null }
      }
      if (this.singleMode === 'maybeSingle') {
        return { data: data[0] || null, error: null }
      }
      return { data, error: null }
    }
    if (this.mode === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted: any[] = []
      this.writeRows((cur) => {
        const next = cur.slice()
        for (const it of items) {
          const row = { id: it.id || cryptoId(), ...it, created_at: it.created_at || new Date().toISOString() }
          next.push(row)
          inserted.push(row)
        }
        return next
      })
      if (this.singleMode === 'single' || this.singleMode === 'maybeSingle') {
        return { data: inserted[0], error: null }
      }
      return { data: inserted, error: null }
    }
    if (this.mode === 'update') {
      const matched: any[] = []
      let count = 0
      this.writeRows((cur) => {
        return cur.map((r) => {
          if (this.filtered([r]).length > 0) {
            const next = { ...r, ...this.payload }
            matched.push(next)
            count++
            return next
          }
          return r
        })
      })
      return { data: matched, error: null, count }
    }
    if (this.mode === 'delete') {
      let data: any[] = []
      this.writeRows((cur) => {
        data = this.filtered(cur)
        const ids = new Set(data.map(d => d.id))
        return cur.filter(r => !ids.has(r.id))
      })
      return { data, error: null }
    }
    return { data: null, error: { message: 'unknown mode' } }
  }
}

function cryptoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'demo-' + Math.random().toString(36).slice(2)
}

// API top-level
function from(table: string) { return new QueryBuilder(table) }

// Channel mock chainable : .on().on().on().subscribe() doit marcher
type MockChannel = {
  on: (..._args: any[]) => MockChannel
  subscribe: (..._args: any[]) => MockChannel
  unsubscribe: () => void
}
function makeChannel(): MockChannel {
  const ch: MockChannel = {
    on: () => ch,
    subscribe: () => ch,
    unsubscribe: () => {},
  }
  return ch
}
const channel = (_name: string) => makeChannel()

const removeChannel = (_c: any) => {}

const auth = {
  getSession: async () => ({
    data: { session: { access_token: 'demo-token', user: { id: 'demo-current-user' } } },
    error: null,
  }),
  getUser: async () => ({ data: { user: { id: 'demo-current-user' } }, error: null }),
  signInWithPassword: async () => ({ data: { user: { id: 'demo-current-user' } }, error: null }),
  signUp: async () => ({ data: { user: { id: 'demo-' + cryptoId() } }, error: null }),
  signOut: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
  exchangeCodeForSession: async () => ({ error: null }),
  updateUser: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ error: null }),
}

const storage = {
  from: (_bucket: string) => ({
    upload: async (_path: string, _file: any) => ({ data: { path: 'demo-fake-path' }, error: null }),
    getPublicUrl: (_path: string) => ({ data: { publicUrl: 'https://placehold.co/600x400/ca8a04/0a0a0a?text=Demo+File' } }),
  }),
}

export const mockSupabase = {
  from,
  channel,
  removeChannel,
  auth,
  storage,
}
