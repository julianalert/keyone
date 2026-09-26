-- ============================================================
-- Migration 002: Async provider support
-- Run this in the Supabase SQL Editor after 001_initial.sql
-- ============================================================

-- Add execution_mode to catalog_apis
-- 'sync'  → provider returns results in the same request (OpenAI, Anthropic, Perplexity, DataForSEO)
-- 'async' → provider starts a job and returns a runId; results polled separately (Apify)
alter table public.catalog_apis
  add column if not exists execution_mode text not null default 'sync';

-- Add async tracking columns to api_calls
-- status: 'pending' while async run is in-flight; 'completed' or 'failed' once resolved
alter table public.api_calls
  add column if not exists status text not null default 'completed';

-- external_run_id: the provider's run/job ID (e.g. Apify runId) for async tracking
alter table public.api_calls
  add column if not exists external_run_id text;

-- Index for polling lookups (poll endpoint looks up by external_run_id)
create index if not exists idx_api_calls_external_run_id
  on public.api_calls(external_run_id)
  where external_run_id is not null;

-- ============================================================
-- Update Apify catalog entry
-- Switch from the blocking run-sync endpoint to the async runs endpoint,
-- and mark it as async execution mode.
-- ============================================================
update public.catalog_apis
set
  execution_mode = 'async',
  base_url = 'https://api.apify.com/v2/acts/compass~crawler-google-places/runs'
where slug = 'apify-google-maps';
