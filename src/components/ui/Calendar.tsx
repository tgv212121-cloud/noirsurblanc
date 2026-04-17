// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) — 2026-04-17 -->
// Source : https://ui.shadcn.com/docs/components/calendar
// Library : shadcn (react-day-picker v9)
'use client'

import { DayPicker } from 'react-day-picker'
import { fr } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { cn } from '@/lib/utils'

type Props = React.ComponentProps<typeof DayPicker>

export default function Calendar({ className, classNames, ...props }: Props) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays
      className={cn('rdp-enzo', className)}
      classNames={{
        root: 'text-blanc',
        months: 'flex flex-col gap-4',
        month: 'space-y-3',
        month_caption: 'flex justify-center pt-1 relative items-center h-8',
        caption_label: 'text-sm font-medium text-blanc capitalize',
        nav: 'flex items-center justify-between absolute inset-x-0 top-1 px-1 pointer-events-none',
        button_previous: 'h-7 w-7 bg-white/5 hover:bg-white/10 rounded-md inline-flex items-center justify-center text-blanc-muted hover:text-blanc transition-colors pointer-events-auto cursor-pointer',
        button_next: 'h-7 w-7 bg-white/5 hover:bg-white/10 rounded-md inline-flex items-center justify-center text-blanc-muted hover:text-blanc transition-colors pointer-events-auto cursor-pointer',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-blanc-muted/60 w-9 font-normal text-[0.72rem] uppercase tracking-wider py-2',
        week: 'flex w-full mt-1',
        day: 'h-9 w-9 text-center text-sm relative p-0',
        day_button: 'h-9 w-9 p-0 font-normal rounded-md text-blanc hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent inline-flex items-center justify-center',
        selected: '[&>button]:!bg-[#ca8a04] [&>button]:!text-noir [&>button]:!font-semibold [&>button:hover]:!bg-[#eab308]',
        today: '[&>button]:ring-1 [&>button]:ring-[#ca8a04]/40',
        outside: '[&>button]:text-blanc-muted/25',
        disabled: '[&>button]:!text-blanc-muted/20 [&>button]:!cursor-not-allowed [&>button:hover]:!bg-transparent',
        hidden: 'invisible',
        chevron: 'w-4 h-4 fill-current',
        ...classNames,
      }}
      {...props}
    />
  )
}
