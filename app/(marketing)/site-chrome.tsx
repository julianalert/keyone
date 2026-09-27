import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/marketing/icons/banknotes-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { XIcon } from '@/components/marketing/icons/social/x-icon'
import {
  FooterLink,
  FooterWithLinksAndSocialIcons,
  SocialLink,
} from '@/components/marketing/sections/footer-with-links-and-social-icons'
import {
  NavbarDropdown,
  NavbarDropdownItem,
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/marketing/sections/navbar-with-links-actions-and-centered-logo'
import { getAllGuides } from './guides/guides'

/* Navbar and footer shared by every marketing page (see layout.tsx). */

// Icon names a guide can set in its frontmatter (`icon:`)
const guideIcons: Record<string, React.ReactNode> = {
  chart: <ChartLineIcon />,
  banknotes: <BanknotesIcon />,
  key: <KeyIcon />,
  document: <DocumentIcon />,
}

export function SiteNavbar() {
  const guides = getAllGuides()

  return (
    <NavbarWithLinksActionsAndCenteredLogo
      id="navbar"
      links={
        <>
          <NavbarDropdown
            href="/guides"
            label="Guides"
            eyebrow="Guides for agencies"
            footer={
              <a
                href="/guides"
                className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 hover:text-olive-700 dark:text-white dark:hover:text-olive-300"
              >
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
  return (
    <FooterWithLinksAndSocialIcons
      id="footer"
      links={
        <>
          <FooterLink href="/pricing">Pricing</FooterLink>
          <FooterLink href="/guides">Guides</FooterLink>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
          <FooterLink href="/signup">Start free</FooterLink>
        </>
      }
      socialLinks={
        <SocialLink href="https://x.com/notanothermrktr" name="X">
          <XIcon />
        </SocialLink>
      }
      fineprint={
        <>
          © {new Date().getFullYear()} keyone · API keys and AI spend for agencies, organized by client.
          <span className="mt-1 flex justify-center gap-3 text-xs text-olive-400 dark:text-olive-600">
            <a href="/privacy" className="hover:text-olive-700 dark:hover:text-olive-400">
              Privacy
            </a>
            <a href="/terms" className="hover:text-olive-700 dark:hover:text-olive-400">
              Terms
            </a>
          </span>
        </>
      }
    />
  )
}
