import { type ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
}

/**
 * AppShell - The foundational layout component for the entire H.A.L. Console.
 * 
 * This is deliberately simple and flexible on purpose.
 * All future layout evolution (collapsible sidebar, command palette, multi-pane, etc.)
 * should be handled by composing or replacing this component, not by scattering
 * layout logic throughout features.
 */
export function AppShell({ children, header, sidebar }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Command Bar */}
      {header && (
        <header className="border-b border-hal-border bg-hal-bg-1/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto">
            {header}
          </div>
        </header>
      )}

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar / Navigation */}
        {sidebar && (
          <aside className="w-64 border-r border-hal-border bg-hal-bg-1/50 p-4 hidden lg:block">
            {sidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
