"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export type SidebarItem =
  | { type: "link"; label: string; href: string; icon: string }
  | { type: "divider" }
  | { type: "logout" };

interface PortalShellProps {
  role: string;
  roleLabel: string;
  roleGroup: string;
  userName: string;
  items: SidebarItem[];
  children: ReactNode;
}

export function PortalShell({ role, roleLabel, roleGroup, userName, items, children }: PortalShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-line bg-white">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <Image
            src="/government-logo.png"
            alt="Republic of Nauru crest"
            width={36}
            height={38}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-brand-accent">
              {roleGroup}
            </p>
            <p className="truncate text-sm font-bold text-brand leading-tight">{roleLabel}</p>
          </div>
        </div>

        {/* User identity */}
        <div className="border-b border-line px-5 py-3">
          <Link 
            href={`/portal/${role}/profile`} 
            className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-panel-strong group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white group-hover:bg-[#013a58]">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">{userName}</p>
              <p className="truncate text-[10px] text-slate-500 uppercase tracking-wide">{roleLabel}</p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {items.map((item, i) => {
              if (item.type === "divider") {
                return <li key={i} className="my-2 border-t border-line" />;
              }
              if (item.type === "logout") {
                return null; // rendered in footer
              }
              const isActive = pathname === item.href || (item.href !== `/portal/${role}` && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand text-white"
                        : "text-slate-700 hover:bg-panel-strong hover:text-brand"
                    }`}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-line px-4 py-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-panel-strong hover:text-brand"
          >
            <span className="text-base">🏠</span>
            <span>Home</span>
          </Link>
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-white px-6">
          <p className="text-xs font-semibold text-slate-500">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search…"
                className="h-8 w-48 rounded-full border border-line bg-panel-strong pl-3 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-panel-strong" title="Notifications">
              🔔
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
