import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';
import { ChevronLeft, ChevronRight, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ResponsiveEditorLayoutProps {
  /** Left panel content (tools, library) */
  leftPanel?: ReactNode;
  leftPanelTitle?: string;
  /** Main canvas/workspace */
  children: ReactNode;
  /** Right panel content (settings, properties) */
  rightPanel?: ReactNode;
  rightPanelTitle?: string;
  /** Bottom toolbar for mobile */
  bottomToolbar?: ReactNode;
  /** Header content */
  header?: ReactNode;
  className?: string;
}

/**
 * Responsive editor layout with collapsible panels
 * - Desktop: 3-column layout with sidebars
 * - Mobile: Full canvas with bottom toolbar and sheet panels
 */
export function ResponsiveEditorLayout({
  leftPanel,
  leftPanelTitle = 'Tools',
  children,
  rightPanel,
  rightPanelTitle = 'Settings',
  bottomToolbar,
  header,
  className,
}: ResponsiveEditorLayoutProps) {
  const { isLaptopOrDesktop } = useResponsive();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Desktop layout
  if (isLaptopOrDesktop) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        {header && (
          <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
            {header}
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          {leftPanel && (
            <aside
              className={cn(
                'flex-shrink-0 border-r border-border bg-card/30 transition-all duration-300 overflow-hidden',
                leftCollapsed ? 'w-12' : 'w-64 xl:w-72'
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  {!leftCollapsed && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {leftPanelTitle}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLeftCollapsed(!leftCollapsed)}
                  >
                    {leftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </div>
                {!leftCollapsed && (
                  <div className="flex-1 overflow-y-auto p-3">{leftPanel}</div>
                )}
              </div>
            </aside>
          )}

          {/* Main Canvas */}
          <main className="flex-1 overflow-auto bg-background">{children}</main>

          {/* Right Panel */}
          {rightPanel && (
            <aside
              className={cn(
                'flex-shrink-0 border-l border-border bg-card/30 transition-all duration-300 overflow-hidden',
                rightCollapsed ? 'w-12' : 'w-72 xl:w-80'
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setRightCollapsed(!rightCollapsed)}
                  >
                    {rightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  {!rightCollapsed && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {rightPanelTitle}
                    </span>
                  )}
                </div>
                {!rightCollapsed && (
                  <div className="flex-1 overflow-y-auto p-3">{rightPanel}</div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {header && (
        <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          {header}
        </div>
      )}

      {/* Main Canvas */}
      <main className="flex-1 overflow-auto bg-background relative">{children}</main>

      {/* Bottom Toolbar */}
      {(bottomToolbar || leftPanel || rightPanel) && (
        <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-xl safe-area-pb">
          <div className="flex items-center justify-between px-2 py-2 gap-2">
            {/* Left panel trigger */}
            {leftPanel && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">{leftPanelTitle}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm">
                  <SheetHeader>
                    <SheetTitle>{leftPanelTitle}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[80vh]">{leftPanel}</div>
                </SheetContent>
              </Sheet>
            )}

            {/* Center toolbar */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {bottomToolbar}
            </div>

            {/* Right panel trigger */}
            {rightPanel && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{rightPanelTitle}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm">
                  <SheetHeader>
                    <SheetTitle>{rightPanelTitle}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[80vh]">{rightPanel}</div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
