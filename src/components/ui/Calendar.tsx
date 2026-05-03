// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) — 2026-04-17 -->
// Source : https://ui.shadcn.com/docs/components/calendar — restyle custom or
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
        month: 'space-y-4',
        month_caption: 'flex justify-start items-center h-9 relative',
        caption_label: 'text-[15px] font-semibold text-blanc capitalize tracking-tight',
        nav: 'flex items-center gap-1 absolute right-0 top-0 pointer-events-none',
        button_previous: 'h-8 w-8 bg-white/5 hover:bg-[#ca8a04]/20 rounded-md inline-flex items-center justify-center text-blanc-muted hover:text-[#ca8a04] transition-colors pointer-events-auto cursor-pointer',
        button_next: 'h-8 w-8 bg-white/5 hover:bg-[#ca8a04]/20 rounded-md inline-flex items-center justify-center text-blanc-muted hover:text-[#ca8a04] transition-colors pointer-events-auto cursor-pointer',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex gap-2.5',
        weekday: 'text-blanc-muted/50 flex-1 font-normal text-[10px] uppercase tracking-[0.18em] py-3 text-center',
        week: 'flex w-full mt-3 gap-2.5',
        day: 'flex-1 aspect-square text-center text-[14px] relative p-0',
        day_button: 'w-full h-full font-medium rounded-md text-blanc hover:bg-[#ca8a04]/15 transition-all cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center',
        selected: '[&>button]:!bg-noir [&>button]:!text-[#ca8a04] [&>button]:!font-bold [&>button]:!ring-2 [&>button]:!ring-[#ca8a04] [&>button:hover]:!bg-noir',
        today: '[&>button]:underline [&>button]:underline-offset-4 [&>button]:decoration-[#ca8a04]/60',
        outside: '[&>button]:text-blanc-muted/20',
        disabled: '[&>button]:!bg-transparent [&>button]:!text-blanc-muted/20 [&>button]:!cursor-not-allowed [&>button:hover]:!bg-transparent',
        hidden: 'invisible',
        chevron: 'w-4 h-4 fill-current',
        ...classNames,
      }}
      modifiersClassNames={{
        available: '[&>button]:bg-[#ca8a04]/15 [&>button]:text-[#ca8a04] [&>button]:ring-1 [&>button]:ring-[#ca8a04]/25 [&>button:hover]:bg-[#ca8a04]/25',
        ...(props.modifiersClassNames || {}),
      }}
      {...props}
    />
  )
}
