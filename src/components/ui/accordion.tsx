'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '@/lib/utils';

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = AccordionPrimitive.Item;
export const AccordionTrigger = AccordionPrimitive.Trigger;
export const AccordionContent = AccordionPrimitive.Content;

export function AccordionItemShell({
  value,
  question,
  answer,
}: {
  value: string;
  question: string;
  answer: string;
}) {
  return (
    <AccordionPrimitive.Item value={value} className="border-b border-kh-rule">
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-6 text-left text-lg font-medium tracking-[-0.02em] hover:no-underline md:text-xl">
          <span className="flex gap-4">
            <span className="font-mono text-[9px] font-normal tracking-[0.055em] text-kh-muted">
              {String(Number(value.replace('faq-', '')) + 1).padStart(2, '0')}
            </span>
            {question}
          </span>
          <span className="font-mono text-[18px] text-kh-green transition-transform duration-200 group-data-[state=open]:rotate-45">
            +
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className={cn('overflow-hidden pb-6 text-base leading-relaxed text-kh-muted md:pl-9')}>
        {answer}
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
