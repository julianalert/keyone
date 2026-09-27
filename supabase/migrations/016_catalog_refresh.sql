-- ============================================================
-- Migration 016: Catalog refresh + multi-unit pricing
-- Run in the Supabase SQL Editor after 015.
--
--  * model_prices learns about images, audio, characters, minutes and
--    per-request fees, so OpenAI image generation / TTS / transcription /
--    embeddings and Perplexity's Agent + Search APIs bill correctly.
--  * Catalog: providers that aren't wired to real accounts are hidden,
--    descriptions say what is actually available, icons become provider
--    ids (rendered as logos in the app).
--  * Perplexity moves to the Agent API (its chat-completions endpoint
--    retired on 2026-09-27) and is billed per token from the cost
--    Perplexity reports on every response.
-- ============================================================

alter table public.model_prices
  add column if not exists kind text not null default 'chat',          -- chat | image | embedding | speech | transcription | audio | moderation | search | tool | legacy
  add column if not exists unit text not null default 'token',         -- token | character | minute | request | image
  add column if not exists per_unit numeric(10,6),                     -- price per single unit when unit is minute / request / image
  add column if not exists image_input_per_million numeric(10,4),
  add column if not exists image_output_per_million numeric(10,4),
  add column if not exists audio_input_per_million numeric(10,4),
  add column if not exists audio_output_per_million numeric(10,4);

-- Per-call detail beyond text tokens (image tokens, minutes, characters, tool calls, reported cost)
alter table public.api_calls add column if not exists usage_detail jsonb;

-- ------------------------------------------------------------
-- Catalog
-- ------------------------------------------------------------
update public.catalog_apis set is_active = false where slug in ('apify-google-maps', 'dataforseo');

update public.catalog_apis set
  name = 'OpenAI',
  description = 'Every OpenAI model: GPT-6, GPT-5.x, o-series, image generation, embeddings, text-to-speech, transcription and audio chat. Drop-in for the OpenAI SDK (Chat Completions and Responses).',
  icon = 'openai'
where slug = 'openai';

update public.catalog_apis set
  name = 'Anthropic',
  description = 'Every Claude model: Fable 5.1, Opus 5.5, Sonnet 5, Haiku 4.5 and the whole 4.x line. Drop-in for the Anthropic SDK, with prompt caching, thinking and web search priced as Anthropic bills them.',
  icon = 'anthropic'
where slug = 'anthropic';

update public.catalog_apis set
  name = 'Perplexity',
  category = 'search',
  description = 'Perplexity Agent API and Search API: Sonar plus GPT, Claude, Gemini and Grok with live web search, billed at exactly what Perplexity charges per response.',
  base_url = 'https://api.perplexity.ai/v1/agent',
  pricing_model = 'per_token',
  cost_per_call = null,
  price_per_call = null,
  icon = 'perplexity'
where slug = 'perplexity';

-- ------------------------------------------------------------
-- Prices. Wholesale list prices, standard tier, read 2026-09-27 from
-- developers.openai.com/api/docs/pricing, platform.claude.com/docs/en/about-claude/pricing
-- and docs.perplexity.ai/docs/getting-started/pricing.
-- ------------------------------------------------------------
insert into public.model_prices
  (provider, model, kind, unit, input_per_million, output_per_million, cached_input_per_million, per_unit,
   image_input_per_million, image_output_per_million, audio_input_per_million, audio_output_per_million, notes)
values
  -- OpenAI: text models not yet in the table
  ('openai', 'gpt-5.5-cyber',          'chat', 'token', 12.50, 75.00, 1.25, null, null, null, null, null, null),
  ('openai', 'gpt-rosalind-research',  'chat', 'token',  5.00, 25.00, 0.50, null, null, null, null, null, 'OpenAI starts billing this model on 2026-10-05'),
  ('openai', 'gpt-5-search-api',       'chat', 'token',  1.25, 10.00, 0.125, null, null, null, null, null, null),
  ('openai', 'gpt-4o-2024-05-13',      'legacy', 'token', 5.00, 15.00, null, null, null, null, null, null, 'legacy snapshot, priced above gpt-4o'),
  ('openai', 'gpt-3.5-turbo-1106',     'legacy', 'token', 1.00,  2.00, null, null, null, null, null, null, null),
  ('openai', 'gpt-3.5-turbo-instruct', 'legacy', 'token', 1.50,  2.00, null, null, null, null, null, null, null),
  ('openai', 'davinci-002',            'legacy', 'token', 2.00,  2.00, null, null, null, null, null, null, null),
  ('openai', 'babbage-002',            'legacy', 'token', 0.40,  0.40, null, null, null, null, null, null, null),

  -- OpenAI: image generation (text tokens in the base columns, image tokens in image_*)
  ('openai', 'gpt-image-2.5-sunburst', 'image', 'token', 5.00,  0.00, 1.25, null,  8.00, 30.00, null, null, null),
  ('openai', 'gpt-image-2.5-flare',    'image', 'token', 5.00,  0.00, 1.25, null,  8.00, 30.00, null, null, null),
  ('openai', 'gpt-image-2',            'image', 'token', 5.00,  0.00, 1.25, null,  8.00, 30.00, null, null, null),
  ('openai', 'gpt-image-1.5',          'image', 'token', 5.00, 10.00, 1.25, null,  8.00, 32.00, null, null, null),
  ('openai', 'gpt-image-1-mini',       'image', 'token', 2.00,  0.00, 0.20, null,  2.50,  8.00, null, null, null),
  ('openai', 'gpt-image-1',            'image', 'token', 5.00,  0.00, 1.25, null, 10.00, 40.00, null, null, null),
  ('openai', 'chatgpt-image-latest',   'image', 'token', 5.00, 10.00, 1.25, null,  8.00, 32.00, null, null, null),
  ('openai', 'dall-e-3',               'image', 'image', 0.00,  0.00, null, 0.040, null, null, null, null, 'per image at 1024x1024 standard; HD and wide sizes cost 2-3x'),
  ('openai', 'dall-e-2',               'image', 'image', 0.00,  0.00, null, 0.020, null, null, null, null, 'per image at 1024x1024; smaller sizes slightly less'),

  -- OpenAI: embeddings (input only)
  ('openai', 'text-embedding-3-small', 'embedding', 'token', 0.02, 0.00, null, null, null, null, null, null, null),
  ('openai', 'text-embedding-3-large', 'embedding', 'token', 0.13, 0.00, null, null, null, null, null, null, null),
  ('openai', 'text-embedding-ada-002', 'embedding', 'token', 0.10, 0.00, null, null, null, null, null, null, null),

  -- OpenAI: text-to-speech, billed per character of input (the response carries no usage)
  ('openai', 'tts-1',                  'speech', 'character', 15.00, 0.00, null, null, null, null, null, null, 'USD per 1M input characters'),
  ('openai', 'tts-1-hd',               'speech', 'character', 30.00, 0.00, null, null, null, null, null, null, 'USD per 1M input characters'),
  ('openai', 'gpt-4o-mini-tts',        'speech', 'character', 17.00, 0.00, null, null, null, null, null, null, 'USD per 1M input characters, derived from OpenAI''s $0.015 per minute of audio'),

  -- OpenAI: transcription. whisper-1 and gpt-transcribe report duration; the gpt-4o family reports audio tokens.
  ('openai', 'whisper-1',                 'transcription', 'minute', 0.00, 0.00, null, 0.006,  null, null, null,  null, 'per minute of audio'),
  ('openai', 'gpt-transcribe',            'transcription', 'minute', 0.00, 0.00, null, 0.0045, null, null, null,  null, 'per minute of audio (1,000 audio tokens = 1 minute when only tokens are reported)'),
  ('openai', 'gpt-4o-transcribe',         'transcription', 'token',  2.50, 10.00, null, null, null, null, 6.00, null, null),
  ('openai', 'gpt-4o-transcribe-diarize', 'transcription', 'token',  2.50, 10.00, null, null, null, null, 6.00, null, null),
  ('openai', 'gpt-4o-mini-transcribe',    'transcription', 'token',  1.25,  5.00, null, null, null, null, 3.00, null, null),

  -- OpenAI: audio chat (Chat Completions with audio modalities)
  ('openai', 'gpt-audio',              'audio', 'token', 2.50, 10.00, null, null, null, null, 32.00, 64.00, null),
  ('openai', 'gpt-audio-1.5',          'audio', 'token', 2.50, 10.00, null, null, null, null, 32.00, 64.00, null),
  ('openai', 'gpt-audio-mini',         'audio', 'token', 0.60,  2.40, null, null, null, null, 10.00, 20.00, null),

  -- OpenAI: moderation is free
  ('openai', 'omni-moderation-latest', 'moderation', 'token', 0.00, 0.00, null, null, null, null, null, null, 'free'),

  -- OpenAI: hosted tool fees, counted from the response (Responses API output items)
  ('openai', 'tool:web_search',        'tool', 'request', 0.00, 0.00, null, 0.0100, null, null, null, null, '$10 per 1K web search calls'),
  ('openai', 'tool:file_search',       'tool', 'request', 0.00, 0.00, null, 0.0025, null, null, null, null, '$2.50 per 1K file search calls'),

  -- Anthropic: hosted tool fees
  ('anthropic', 'tool:web_search',     'tool', 'request', 0.00, 0.00, null, 0.0100, null, null, null, null, '$10 per 1K searches'),

  -- Perplexity Agent API. Perplexity returns the exact cost in usage.cost.total_cost and that is what
  -- gets billed; these rows drive estimates, shortcuts and the catalog. Tiered models list the base tier.
  ('perplexity', 'perplexity/sonar',                        'chat', 'token', 0.25,  2.50, 0.0625, null, null, null, null, null, null),
  ('perplexity', 'perplexity/glm-5.3',                      'chat', 'token', 1.40,  4.40, 0.26,   null, null, null, null, null, null),
  ('perplexity', 'perplexity/kimi-k3',                      'chat', 'token', 3.00, 15.00, 0.30,   null, null, null, null, null, null),
  ('perplexity', 'perplexity/nemotron-3-ultra-550b-a55b',   'chat', 'token', 0.25,  2.50, 0.25,   null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-fable-5-1',              'chat', 'token', 10.00, 50.00, 0.25,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-fable-5',                'chat', 'token', 10.00, 50.00, 1.00,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-5-5',               'chat', 'token',  4.00, 20.00, 0.20,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-5',                 'chat', 'token',  5.00, 25.00, 0.50,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-4-8',               'chat', 'token',  5.00, 25.00, 0.50,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-4-7',               'chat', 'token',  5.00, 25.00, 0.50,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-4-6',               'chat', 'token',  5.00, 25.00, 0.50,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-opus-4-5',               'chat', 'token',  5.00, 25.00, 0.50,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-sonnet-5',               'chat', 'token',  2.00, 10.00, 0.20,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-sonnet-4-6',             'chat', 'token',  3.00, 15.00, 0.30,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-sonnet-4-5',             'chat', 'token',  3.00, 15.00, 0.30,  null, null, null, null, null, null),
  ('perplexity', 'anthropic/claude-haiku-4-5',              'chat', 'token',  1.00,  5.00, 0.10,  null, null, null, null, null, null),
  ('perplexity', 'openai/gpt-6-sol',                        'chat', 'token',  2.00, 10.00, 0.20,  null, null, null, null, null, 'tiered: higher rates above a per-request token threshold'),
  ('perplexity', 'openai/gpt-6-luna',                       'chat', 'token',  0.10,  0.50, 0.01,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'openai/gpt-5.6-sol',                      'chat', 'token',  4.00, 20.00, 0.40,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'openai/gpt-5.6-terra',                    'chat', 'token',  2.00, 12.00, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'openai/gpt-5.6-luna',                     'chat', 'token',  0.20,  1.20, 0.02,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'openai/gpt-5.5',                          'chat', 'token',  5.00, 30.00, 0.50,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'google/gemini-3.1-pro-preview',           'chat', 'token',  2.00, 12.00, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'google/gemini-3.1-flash-lite',            'chat', 'token',  0.25,  1.50, 0.025, null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3.5-flash',                 'chat', 'token',  1.50,  9.00, 0.15,  null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3.5-flash-lite',            'chat', 'token',  0.30,  2.50, 0.03,  null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3.6-flash',                 'chat', 'token',  1.50,  7.50, 0.15,  null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3.7-flash',                 'chat', 'token',  0.75,  3.75, 0.075, null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3.8-flash',                 'chat', 'token',  0.75,  3.75, 0.075, null, null, null, null, null, null),
  ('perplexity', 'google/gemini-3-flash-preview',           'chat', 'token',  0.50,  3.00, 0.05,  null, null, null, null, null, null),
  ('perplexity', 'xai/grok-4.7',                            'chat', 'token',  2.00,  6.00, 0.50,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.6',                            'chat', 'token',  2.00,  6.00, 0.50,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.5',                            'chat', 'token',  2.00,  6.00, 0.30,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.3',                            'chat', 'token',  1.25,  2.50, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.20-reasoning',                 'chat', 'token',  1.25,  2.50, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.20-non-reasoning',             'chat', 'token',  1.25,  2.50, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'xai/grok-4.20-multi-agent',               'chat', 'token',  1.25,  2.50, 0.20,  null, null, null, null, null, 'tiered'),
  ('perplexity', 'tool:web_search',     'tool', 'request', 0.00, 0.00, null, 0.0025, null, null, null, null, 'per web search'),
  ('perplexity', 'tool:fetch_url',      'tool', 'request', 0.00, 0.00, null, 0.0005, null, null, null, null, 'per URL fetched'),
  ('perplexity', 'tool:people_search',  'tool', 'request', 0.00, 0.00, null, 0.0050, null, null, null, null, 'per people search'),
  ('perplexity', 'tool:finance_search', 'tool', 'request', 0.00, 0.00, null, 0.0050, null, null, null, null, 'per finance search'),
  -- Perplexity Search API (POST /search), per request
  ('perplexity', 'search',              'search', 'request', 0.00, 0.00, null, 0.0050, null, null, null, null, 'Search API, per request'),
  ('perplexity', 'search:fast',         'search', 'request', 0.00, 0.00, null, 0.0010, null, null, null, null, 'Search API fast mode, per request'),
  -- Legacy Sonar chat-completions models (endpoint retired 2026-09-27); kept so old calls still price
  ('perplexity', 'sonar',               'legacy', 'token', 1.00,  1.00, null, null, null, null, null, null, 'legacy chat completions, retired 2026-09-27; use perplexity/sonar on the Agent API'),
  ('perplexity', 'sonar-pro',           'legacy', 'token', 3.00, 15.00, null, null, null, null, null, null, 'legacy chat completions, retired 2026-09-27'),
  ('perplexity', 'sonar-reasoning-pro', 'legacy', 'token', 2.00,  8.00, null, null, null, null, null, null, 'legacy chat completions, retired 2026-09-27'),
  ('perplexity', 'sonar-deep-research', 'legacy', 'token', 2.00,  8.00, null, null, null, null, null, null, 'legacy chat completions, retired 2026-09-27'),
  ('perplexity', '*',                   'chat', 'token', 10.00, 50.00, null, null, null, null, null, null, 'fallback for unknown Perplexity models; actual billing uses the cost Perplexity reports')
on conflict (provider, model) do update set
  kind = excluded.kind,
  unit = excluded.unit,
  input_per_million = excluded.input_per_million,
  output_per_million = excluded.output_per_million,
  cached_input_per_million = excluded.cached_input_per_million,
  per_unit = excluded.per_unit,
  image_input_per_million = excluded.image_input_per_million,
  image_output_per_million = excluded.image_output_per_million,
  audio_input_per_million = excluded.audio_input_per_million,
  audio_output_per_million = excluded.audio_output_per_million,
  notes = excluded.notes,
  is_active = true,
  updated_at = now();

-- Existing text rows keep kind = 'chat'; mark the retired ones as legacy
update public.model_prices set kind = 'legacy'
where (provider = 'openai' and model in ('gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-pro'))
   or (provider = 'anthropic' and model in ('claude-opus-4-1', 'claude-opus-4-0', 'claude-sonnet-4-0'));

-- Reconciliation must include every priced call, not only per_token catalog rows
create or replace function public.reconcile_our_side(p_from date, p_to date)
returns table (provider text, day date, model text, calls bigint, input_tokens bigint, output_tokens bigint, provider_cost_usd numeric, price_usd numeric)
language sql stable security definer set search_path = public as $$
  select
    a.provider,
    (c.created_at at time zone 'utc')::date as day,
    coalesce(regexp_replace(c.model, '-\d{8}$|-\d{4}-\d{2}-\d{2}$', ''), '(none)') as model,
    count(*),
    coalesce(sum(c.input_tokens), 0) + coalesce(sum(c.cached_input_tokens), 0),
    coalesce(sum(c.output_tokens), 0),
    coalesce(sum(c.provider_cost_usd), 0),
    coalesce(sum(c.cost_usd), 0)
  from public.api_calls c
  join public.catalog_apis a on a.id = c.catalog_api_id
  where c.status = 'completed'
    and (c.created_at at time zone 'utc')::date >= p_from
    and (c.created_at at time zone 'utc')::date <= p_to
  group by 1, 2, 3
$$;
