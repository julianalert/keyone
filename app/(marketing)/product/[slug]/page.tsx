import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMetadata } from '../../seo'
import { getProductPage, productPages } from '../pages'
import { ProductPage } from '../product-page'

// Product pages are defined in ../pages.tsx and generated at build time
export const dynamicParams = false

export function generateStaticParams() {
  return productPages.map(page => ({ slug: page.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getProductPage(params.slug)
  if (!page) return {}
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/product/${page.slug}` })
}

export default function Page({ params }: { params: { slug: string } }) {
  const page = getProductPage(params.slug)
  if (!page) notFound()
  return <ProductPage page={page} />
}
