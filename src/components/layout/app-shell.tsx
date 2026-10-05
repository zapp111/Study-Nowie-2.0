'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import * as React from 'react';
import { SidebarContent, type SidebarAccount } from './sidebar';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';

export function AppShell({
  children,
  isAdmin,
  account,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  account?: SidebarAccount | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <SidebarContent isAdmin={isAdmin} account={account} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 py-3 backdrop-blur lg:px-8">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[272px] border-r border-[var(--border)] bg-[var(--surface)] shadow-xl lg:hidden">
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close menu" className="absolute top-3 right-2">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
                <SidebarContent onNavigate={() => setOpen(false)} isAdmin={isAdmin} account={account} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <span className="text-sm font-medium lg:hidden">Study Nowie</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
