"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileText,
  Database,
  Settings,
  LogOut,
  Car,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/pratiche", label: "Pratiche", icon: FileText },
  { href: "/dataset", label: "Dataset", icon: Database },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

interface SidebarProps {
  autoscuolaNome: string;
  operatoreNome: string;
}

export function Sidebar({ autoscuolaNome, operatoreNome }: SidebarProps) {
  const pathname = usePathname();
  const initials = operatoreNome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5">
        <Link href="/pratiche" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-soft-sm group-hover:shadow-soft transition-shadow duration-200">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm tracking-tight leading-tight">
              ConvertoPatenti
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {autoscuolaNome}
            </p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-soft-xs"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${
                  active
                    ? "text-brand-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
                strokeWidth={active ? 2 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4">
        <div className="bg-slate-50/80 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shadow-soft-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-700 truncate leading-tight">
                {operatoreNome}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Operatore</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
