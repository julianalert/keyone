import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/marketing/icons/banknotes-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { XIcon } from '@/components/marketing/icons/social/x-icon'
import {
  FooterCategory,
  FooterLink,
  FooterWithNewsletterFormCategoriesAndSocialIcons,
  SocialLink,
} from '@/components/marketing/sections/footer-with-newsletter-form-categories-and-social-icons'
import {
  NavbarDropdown,
  NavbarDropdownItem,
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/marketing/sections/navbar-with-links-actions-and-centered-logo'
import { getAllGuides } from './guides/guides'
import { productPages } from './product/pages'

/* Navbar and footer shared by every marketing page (see layout.tsx). */

// Icon names a guide can set in its frontmatter (`icon:`)
const guideIcons: Record<string, React.ReactNode> = {
  chart: <ChartLineIcon />,
  banknotes: <BanknotesIcon />,
  key: <KeyIcon />,
  document: <DocumentIcon />,
}

const dropdownFooterLink =
  'inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 hover:text-olive-700 dark:text-white dark:hover:text-olive-300'

export function SiteNavbar() {
  const guides = getAllGuides()

  return (
    <NavbarWithLinksActionsAndCenteredLogo
      id="navbar"
      links={
        <>
          <NavbarDropdown
            href="/product"
            label="Product"
            eyebrow="What keyone does"
            mobileLinks={productPages.map(page => ({ href: `/product/${page.slug}`, label: page.name }))}
            footer={
              <a href="/product" className={dropdownFooterLink}>
                Product overview <ArrowNarrowRightIcon />
              </a>
            }
          >
            {productPages.map(page => (
              <NavbarDropdownItem
                key={page.slug}
                href={`/product/${page.slug}`}
                title={page.name}
                description={page.tagline}
                icon={page.icon}
              />
            ))}
          </NavbarDropdown>
          <NavbarLink href="/catalog">Catalog</NavbarLink>
          <NavbarLink href="/pricing">Pricing</NavbarLink>
          <NavbarDropdown
            href="/guides"
            label="Guides"
            eyebrow="Guides for agencies"
            footer={
              <a href="/guides" className={dropdownFooterLink}>
                All guides <ArrowNarrowRightIcon />
              </a>
            }
          >
            {guides.map(guide => (
              <NavbarDropdownItem
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                title={guide.title.split(':')[0]}
                icon={guideIcons[guide.icon ?? ''] ?? guideIcons.document}
              />
            ))}
          </NavbarDropdown>
          <NavbarLink href="/login" className="sm:hidden">
            Sign in
          </NavbarLink>
        </>
      }
      logo={
        <NavbarLogo href="/" aria-label="keyone home">
          <span className="font-display text-3xl/none tracking-tight text-olive-950 dark:text-white">keyone</span>
        </NavbarLogo>
      }
      actions={
        <>
          <PlainButtonLink href="/login" className="max-sm:hidden">
            Sign in
          </PlainButtonLink>
          <ButtonLink href="/signup">Start free</ButtonLink>
        </>
      }
    />
  )
}

export function SiteFooter() {
  const guides = getAllGuides()

  return (
    <FooterWithNewsletterFormCategoriesAndSocialIcons
      id="footer"
      // The kit's Homepage 01 footer, with a brand block where the newsletter form would be
      cta={
        <div className="flex max-w-sm flex-col gap-4">
          <a href="/" aria-label="keyone home" className="self-start">
            <span className="font-display text-3xl/none tracking-tight text-olive-950 dark:text-white">keyone</span>
          </a>
          <p className="text-olive-700 dark:text-olive-400">
            Run every client’s AI through one agency account. See what each one spends, set its budget, and rebill
            with a clear breakdown.
          </p>
          <ButtonLink href="/signup" className="self-start">
            Start with one client project <ArrowNarrowRightIcon />
          </ButtonLink>
        </div>
      }
      links={
        <>
          <FooterCategory title="Product">
            {productPages.map(page => (
              <FooterLink key={page.slug} href={`/product/${page.slug}`}>
                {page.name}
              </FooterLink>
            ))}
            <FooterLink href="/catalog">Catalog</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
          </FooterCategory>
          <FooterCategory title="Guides">
            {guides.map(guide => (
              <FooterLink key={guide.slug} href={`/guides/${guide.slug}`}>
                {(guide.seoTitle ?? guide.title).replace(/^How to /, '').replace(/^./, c => c.toUpperCase())}
              </FooterLink>
            ))}
            <FooterLink href="/guides">All guides</FooterLink>
          </FooterCategory>
          <FooterCategory title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/careers">Careers</FooterLink>
            <FooterLink href="/docs">For developers</FooterLink>
            <FooterLink href="/login">Sign in</FooterLink>
            <FooterLink href="/signup">Start free</FooterLink>
          </FooterCategory>
        </>
      }
      fineprint={<>© {new Date().getFullYear()} keyone · API keys and AI spend for agencies, organized by client.</>}
      // Bottom row, right side: legal links, then the social icons
      socialLinks={
        <>
          <a href="/privacy" className="text-olive-600 hover:text-olive-950 dark:text-olive-500 dark:hover:text-white">
            Privacy Policy
          </a>
          <a href="/terms" className="text-olive-600 hover:text-olive-950 dark:text-olive-500 dark:hover:text-white">
            Terms & Conditions
          </a>
          <SocialLink href="https://x.com/notanothermrktr" name="X">
            <XIcon />
          </SocialLink>
        </>
      }
    />
  )
}
