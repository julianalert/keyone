import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMetadata } from '../../seo'
import { UseCasePage } from '../use-case-page'
import { getUseCase, useCases } from '../use-cases'

// Use-case pages are defined in ../use-cases.tsx and generated at build time
export const dynamicParams = false

export function generateStaticParams() {
  return useCases.map(page => ({ slug: page.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getUseCase(params.slug)
  if (!page) return {}
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/use-cases/${page.slug}` })
}

export default function Page({ params }: { params: { slug: string } }) {
  const page = getUseCase(params.slug)
  if (!page) notFound()
  return <UseCasePage page={page} />
}
