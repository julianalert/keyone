import { ElDialog, ElDialogPanel } from '../elements/tailwindplus-elements'
import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { CloseDialogOnLinkClick } from '../elements/close-dialog-on-link-click'
import { ChevronIcon } from '../icons/chevron-icon'

export function NavbarLink({
  children,
  href,
  className,
  ...props
}: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <a
      href={href}
      className={clsx(
        'group inline-flex items-center justify-between gap-2 text-3xl/10 font-medium text-olive-950 lg:text-sm/7 dark:text-white',
        className,
      )}
      {...props}
    >
      {children}
      <span className="inline-flex p-1.5 opacity-0 group-hover:opacity-100 lg:hidden" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </a>
  )
}

// A navbar link with a menu that opens on hover or keyboard focus (desktop).
// In the mobile menu it renders as a plain link.
export function NavbarDropdown({
  href,
  label,
  eyebrow,
  children,
  footer,
  mobileLinks,
}: {
  href: string
  label: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  // Shown under the label in the mobile menu, where there is no hover panel
  mobileLinks?: { href: string; label: ReactNode }[]
}) {
  return (
    <div className="group/dropdown relative">
      <NavbarLink href={href} aria-haspopup="true">
        <span className="inline-flex items-center gap-2">
          {label}
          <ChevronIcon className="rotate-90 text-olive-500 transition-transform max-lg:hidden lg:group-focus-within/dropdown:-rotate-90 lg:group-hover/dropdown:-rotate-90" />
        </span>
      </NavbarLink>
      {mobileLinks && (
        <ul className="mt-3 flex flex-col gap-2 border-l border-olive-950/10 pl-4 lg:hidden dark:border-white/10">
          {mobileLinks.map(link => (
            <li key={link.href}>
              <a href={link.href} className="text-lg/8 text-olive-700 dark:text-olive-400">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="invisible absolute top-full -left-4 z-20 translate-y-1 pt-3 opacity-0 transition duration-150 max-lg:hidden group-focus-within/dropdown:visible group-focus-within/dropdown:translate-y-0 group-focus-within/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 group-hover/dropdown:opacity-100">
        <div className="w-88 overflow-hidden rounded-xl bg-white shadow-xl ring-1 shadow-olive-950/10 ring-olive-950/5 dark:bg-olive-900 dark:ring-white/10">
          <div className="h-1 bg-linear-to-r from-brand-green to-brand-lime" />
          {eyebrow && (
            <p className="px-5 pt-4 pb-1 text-xs/5 font-semibold tracking-wide text-olive-950 uppercase dark:text-white">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-col divide-y divide-olive-950/5 px-2 pb-2 dark:divide-white/5">{children}</div>
          {footer && (
            <div className="border-t border-olive-950/10 bg-olive-950/2.5 px-5 py-3 dark:border-white/10 dark:bg-white/5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function NavbarDropdownItem({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
}) {
  return (
    <a
      href={href}
      className="group/item flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-brand-lime/10"
    >
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-lime/20 text-brand-green transition-colors group-hover/item:bg-brand-green group-hover/item:text-white dark:bg-brand-lime/15 dark:text-brand-lime dark:group-hover/item:bg-brand-lime dark:group-hover/item:text-olive-950">
          {icon}
        </span>
      )}
      <span className="flex flex-col">
        <span className="text-sm/6 font-medium text-olive-950 dark:text-white">{title}</span>
        {description && <span className="text-xs/5 text-olive-600 dark:text-olive-400">{description}</span>}
      </span>
    </a>
  )
}

export function NavbarLogo({ className, href, ...props }: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return <a href={href} {...props} className={clsx('inline-flex items-stretch', className)} />
}

export function NavbarWithLogoActionsAndLeftAlignedLinks({
  links,
  logo,
  actions,
  className,
  ...props
}: {
  links: ReactNode
  logo: ReactNode
  actions: ReactNode
} & ComponentProps<'header'>) {
  return (
    <header className={clsx('sticky top-0 z-10 bg-olive-100 dark:bg-olive-950', className)} {...props}>
      <style>{`:root { --scroll-padding-top: 5.25rem }`}</style>
      <nav>
        <div className="mx-auto flex h-(--scroll-padding-top) max-w-7xl items-center gap-4 px-6 lg:px-10">
          <div className="flex flex-1 items-center gap-12">
            <div className="flex items-center">{logo}</div>
            <div className="flex gap-8 max-lg:hidden">{links}</div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="flex shrink-0 items-center gap-5">{actions}</div>

            <button
              command="show-modal"
              commandfor="mobile-menu"
              aria-label="Toggle menu"
              className="inline-flex rounded-full p-1.5 text-olive-950 hover:bg-olive-950/10 lg:hidden dark:text-white dark:hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path
                  fillRule="evenodd"
                  d="M3.748 8.248a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.748 15.75a.75.75 0 0 1 .75-.751h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <ElDialog className="lg:hidden">
          <dialog id="mobile-menu" className="backdrop:bg-transparent">
            <ElDialogPanel className="fixed inset-0 bg-olive-100 px-6 py-6 lg:px-10 dark:bg-olive-950">
              <div className="flex justify-end">
                <button
                  command="close"
                  commandfor="mobile-menu"
                  aria-label="Toggle menu"
                  className="inline-flex rounded-full p-1.5 text-olive-950 hover:bg-olive-950/10 dark:text-white dark:hover:bg-white/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-6">{links}</div>
            </ElDialogPanel>
          </dialog>
          <CloseDialogOnLinkClick dialogId="mobile-menu" />
        </ElDialog>
      </nav>
    </header>
  )
}
