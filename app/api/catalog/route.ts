import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/catalog?category=ai&q=openai
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')

  let query = supabase
    .from('catalog_apis')
    .select('id, name, slug, category, description, provider, pricing_model, price_per_call, price_per_result, icon')
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (category) {
    query = query.eq('category', category)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
