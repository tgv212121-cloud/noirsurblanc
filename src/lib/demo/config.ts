// Flag global pour le mode demo. Active des que NEXT_PUBLIC_DEMO_MODE=true dans Vercel.
export const IS_DEMO_MODE: boolean =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Cle racine pour le localStorage du mode demo
export const DEMO_STORAGE_KEY = 'nsb-demo-v1'

// Identifiants fake utilises pour le auth
export const DEMO_ADMIN_ID = 'demo-admin-id'
export const DEMO_CLIENTS_IDS = ['demo-client-marie', 'demo-client-karim', 'demo-client-sophie']
