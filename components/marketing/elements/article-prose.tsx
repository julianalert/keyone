import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

// Long-form reading typography (Medium-like measure and rhythm) for rendered
// Markdown. Extends the kit's <Document> styles with larger body text, tables,
// code and callouts (<p class="callout">, emitted by the guides renderer for
// paragraphs that are entirely bold).
export function ArticleProse({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'text-lg/8 text-olive-800 sm:text-xl/9 dark:text-olive-300',
        '[&>*+*]:mt-7',
        // Headings
        '[&_h2]:mt-16 [&_h2]:font-display [&_h2]:text-3xl/10 [&_h2]:tracking-tight [&_h2]:text-balance [&_h2]:text-olive-950 sm:[&_h2]:text-4xl/12 dark:[&_h2]:text-white',
        '[&_h3]:mt-10 [&_h3]:text-xl/8 [&_h3]:font-semibold [&_h3]:text-olive-950 dark:[&_h3]:text-white',
        '[&_h2+*]:mt-5 [&_h3+*]:mt-3',
        // Inline
        '[&_strong]:font-semibold [&_strong]:text-olive-950 dark:[&_strong]:text-white',
        '[&_a]:font-medium [&_a]:text-olive-950 [&_a]:underline [&_a]:decoration-brand-lime [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:decoration-brand-green dark:[&_a]:text-white',
        '[&_code]:rounded-sm [&_code]:bg-olive-950/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-olive-950 dark:[&_code]:bg-white/10 dark:[&_code]:text-white',
        // Code blocks
        '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-olive-950 [&_pre]:p-5 [&_pre]:text-sm/6 [&_pre]:text-[#c0dd97] dark:[&_pre]:ring-1 dark:[&_pre]:ring-white/10',
        '[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[1em] [&_pre_code]:text-inherit dark:[&_pre_code]:bg-transparent',
        // Lists
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:pl-2 [&_li+li]:mt-3 [&_li]:marker:text-olive-400',
        // Checklists (<ul class="checklist">, from Markdown task lists)
        '[&_ul.checklist]:list-none [&_ul.checklist]:pl-0 [&_.checklist>li]:flex [&_.checklist>li]:items-start [&_.checklist>li]:gap-3 [&_.checklist>li]:pl-0',
        '[&_.checklist_input]:mt-[0.4em] [&_.checklist_input]:size-[1.1em] [&_.checklist_input]:shrink-0 [&_.checklist_input]:appearance-none [&_.checklist_input]:rounded-[0.3em] [&_.checklist_input]:border-2 [&_.checklist_input]:border-olive-950/25 [&_.checklist_input]:bg-white dark:[&_.checklist_input]:border-white/25 dark:[&_.checklist_input]:bg-transparent',
        '[&_.checklist_input:checked]:border-brand-green [&_.checklist_input:checked]:bg-brand-green',
        // Callouts: paragraphs that are a single bold run (key takeaways, formulas)
        '[&>p.callout]:rounded-lg [&>p.callout]:border-l-4 [&>p.callout]:border-brand-lime [&>p.callout]:bg-olive-950/2.5 [&>p.callout]:px-6 [&>p.callout]:py-5 dark:[&>p.callout]:bg-white/5',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-olive-950/20 [&_blockquote]:pl-6 [&_blockquote]:italic dark:[&_blockquote]:border-white/20',
        '[&_hr]:my-14 [&_hr]:border-olive-950/10 dark:[&_hr]:border-white/10',
        // Tables: a bordered card with a tinted header, hairline grid and a highlighted totals row
        '[&_.table-wrap]:overflow-x-auto [&_.table-wrap]:rounded-xl [&_.table-wrap]:bg-white [&_.table-wrap]:ring-1 [&_.table-wrap]:ring-olive-950/10 dark:[&_.table-wrap]:bg-white/5 dark:[&_.table-wrap]:ring-white/10',
        '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm/6 sm:[&_table]:text-base/7',
        '[&_th]:bg-olive-950/2.5 [&_th]:px-4 [&_th]:py-3 [&_th]:text-sm/6 [&_th]:font-semibold [&_th]:text-olive-950 [&_th:not([align])]:text-left dark:[&_th]:bg-white/5 dark:[&_th]:text-white',
        '[&_td]:px-4 [&_td]:py-3 [&_td]:align-top',
        '[&_th+th]:border-l [&_td+td]:border-l [&_th]:border-olive-950/10 [&_td]:border-olive-950/10 dark:[&_th]:border-white/10 dark:[&_td]:border-white/10',
        '[&_tbody_tr]:border-t [&_tbody_tr]:border-olive-950/10 dark:[&_tbody_tr]:border-white/10',
        '[&_td:first-child]:font-medium [&_td:first-child]:text-olive-950 dark:[&_td:first-child]:text-white',
        '[&_td_code]:whitespace-nowrap [&_td_code]:text-[0.8em]',
        '[&_td[align=right]]:tabular-nums [&_td[align=right]]:whitespace-nowrap [&_th[align=right]]:whitespace-nowrap',
        // A row whose first cell is bold (e.g. **Total**) is the totals row
        '[&_tr:has(>td:first-child>strong)]:bg-brand-lime/10 dark:[&_tr:has(>td:first-child>strong)]:bg-brand-lime/5',
        className,
      )}
      {...props}
    />
  )
}
