"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/clients", label: "Clients" },
  { href: "/payments", label: "Payments" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar({ email }: { email: string }) {
  const pathname = usePathname();

  async function signOut() {
    await createClient().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4">
        <span className="whitespace-nowrap py-3 text-sm font-bold">
          Kadex Auto DZ
        </span>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${
                  active
                    ? "border-blue-600 font-medium text-blue-700"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden text-xs text-gray-400 md:block">{email}</span>
        <button
          onClick={signOut}
          className="whitespace-nowrap text-sm text-gray-500 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
