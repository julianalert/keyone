import * as El from '@tailwindplus/elements/react'
import type { ComponentProps } from 'react'

type ElProps = ComponentProps<typeof El.ElDialog>

// The kit targets React 19. React 18 writes `className` on custom elements as a
// literal `classname` attribute, so these wrappers pass it through as `class`.
// Drop this file and import from '@tailwindplus/elements/react' once on React 19.
function withClass(Component: (props: ElProps) => React.ReactNode) {
  return function WithClass({ className, ...props }: ElProps) {
    return <Component {...props} {...({ class: className } as ElProps)} />
  }
}

export const ElCopyable = withClass(El.ElCopyable)
export const ElDialog = withClass(El.ElDialog)
export const ElDialogPanel = withClass(El.ElDialogPanel)
export const ElDisclosure = withClass(El.ElDisclosure)
export const ElTabGroup = withClass(El.ElTabGroup)
export const ElTabList = withClass(El.ElTabList)
export const ElTabPanels = withClass(El.ElTabPanels)
