export interface User {
  id: string
  email: string
  stripe_customer_id: string | null
  created_at: string
}

export interface Agency {
  id: string
  name: string
  owner_user_id: string
  stripe_customer_id: string | null
  created_at: string
}

export interface Wallet {
  id: string
  agency_id: string
  balance_usd: number
  updated_at: string
}

export interface Client {
  id: string
  agency_id: string
  name: string
  rebill_markup_pct: number
  monthly_budget_usd: number | null
  is_active: boolean
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  agency_id: string
  name: string
  monthly_budget_usd: number | null
  max_cost_per_call_usd: number | null
  allowed_apis: string[] | null
  allowed_models: string[] | null
  is_active: boolean
  created_at: string
}

export interface ProjectKey {
  id: string
  project_id: string
  agency_id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface CatalogApi {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  base_url: string
  provider: string
  pricing_model: 'per_call' | 'per_result' | 'per_token'
  execution_mode: 'sync' | 'async'
  cost_per_call: number | null
  price_per_call: number | null
  price_per_result: number | null
  auth_config: Record<string, unknown> | null
  icon: string | null
  is_active: boolean
}

export interface ApiCall {
  id: string
  agency_id: string
  client_id: string
  project_id: string
  project_key_id: string | null
  catalog_api_id: string
  endpoint: string
  request_payload: Record<string, unknown> | null
  response_status: number | null
  cost_usd: number
  duration_ms: number | null
  input_tokens: number | null
  output_tokens: number | null
  model: string | null
  status: 'pending' | 'completed' | 'failed' | 'blocked'
  blocked_reason: string | null
  external_run_id: string | null
  created_at: string
}

export interface WalletTransaction {
  id: string
  agency_id: string
  type: 'topup' | 'deduction'
  amount_usd: number
  description: string | null
  stripe_payment_intent_id: string | null
  api_call_id: string | null
  created_at: string
}
