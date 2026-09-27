'use client'

import { useEffect } from 'react'

// Closes a dialog when a link inside it is clicked, so in-page anchors
// (e.g. "#features") in the mobile menu don't leave the menu open.
export function CloseDialogOnLinkClick({ dialogId }: { dialogId: string }) {
  useEffect(() => {
    const dialog = document.getElementById(dialogId) as HTMLDialogElement | null
    if (!dialog) return

    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest('a')) dialog.close()
    }
    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [dialogId])

  return null
}
