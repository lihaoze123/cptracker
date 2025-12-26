import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Github, Heart } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar, navItems } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentNav = navItems.find((item) => item.url === currentPath);
  const pageTitle = currentNav?.title ?? "Page";

  // Fullscreen routes without sidebar
  const isFullscreenRoute = currentPath === "/year-review";

  if (isFullscreenRoute) {
    return (
      <NuqsAdapter>
        <TooltipProvider>
          <Outlet />
          <Toaster />
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </TooltipProvider>
      </NuqsAdapter>
    );
  }

  return (
    <NuqsAdapter>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="flex items-center justify-center gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                Made with <Heart className="size-4 fill-red-500 text-red-500" /> for Competitive Programmers by chumeng
              </span>
              <a
                href="https://github.com/lihaoze123/cptracker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </NuqsAdapter>
  );
}
