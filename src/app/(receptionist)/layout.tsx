"use client";

// src/app/(receptionist)/layout.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-light-grey">
      <aside className="w-64 bg-navy text-white p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="text-xl font-black tracking-tighter">
            BIZLUME <span className="text-cyan text-[10px] tracking-widest">STAFF</span>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink href="/registeration" label="Patient Intake" icon="👤" active={pathname === "/registeration"} />
            <NavLink href="/appointments" label="Appointments" icon="📅" active={pathname === "/appointments"} />
            <NavLink href="/queue" label="Patient Queue" icon="🔢" active={pathname === "/queue"} />
            <NavLink href="/billings" label="Billing Hub" icon="💳" active={pathname === "/billings"} />
          </nav>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-white/5 text-xs text-grey">
            <p className="font-bold text-white">Reception Portal</p>
            <p className="mt-1">Role-based access active</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-status-red/20 text-status-red transition-all font-bold text-sm border border-status-red/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
    >
      <span>{icon}</span> {label}
    </Link>
  );
}