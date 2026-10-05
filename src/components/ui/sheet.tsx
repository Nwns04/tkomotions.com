'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('grid gap-2', className)} {...props} />,
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-base font-semibold', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

type SheetContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: 'left' | 'right';
};

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="site-sheet-overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn('site-sheet-content', `site-sheet-${side}`, className)}
      {...props}
    />
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';