// src/app/(receptionist)/layout.tsx
import Link from "next/link";

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-light-grey">
      <aside className="w-64 bg-navy text-white p-6 flex flex-col gap-8">
        <div className="text-xl font-black tracking-tighter">
          BIZLUME <span className="text-cyan text-[10px] tracking-widest">STAFF</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavLink href="/registeration" label="Patient Intake" icon="👤" />
          <NavLink href="/appointments" label="Appointments" icon="📅" />
          <NavLink href="/billings" label="Billing Hub" icon="💳" />
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string, label: string, icon: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all font-bold text-sm">
      <span>{icon}</span> {label}
    </Link>
  );
}