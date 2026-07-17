"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface QueuePatient {
  queueEntryId: string;
  position: number | null;
  status: "WAITING" | "IN_PROGRESS" | "DEFERRED" | "COMPLETED" | "CANCELLED";
  queueScore: number;
  manualAdjustment: number;
  receptionistNote: string | null;
  checkInTime: string;
  waitingLabel: string;
  visitId: string;
  critical: string;
  scheduledTime: string | null;
  visitType: "appointment" | "walkin";
  patientId: string;
  patientCode: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup: string | null;
}

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  availableNow: boolean;
}

interface QueueData {
  active: QueuePatient[];
  deferred: QueuePatient[];
  total: number;
  lastRefreshed: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function SeverityBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    high:   { bg: "bg-red-50 border-red-200",    text: "text-red-700",    dot: "bg-red-500" },
    medium: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700",  dot: "bg-amber-400" },
    low:    { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  };
  const c = cfg[level] || cfg.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level}
    </span>
  );
}

function TypeBadge({ type, scheduledTime }: { type: string; scheduledTime: string | null }) {
  if (type === "appointment" && scheduledTime) {
    const t = new Date(scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return <span className="text-[10px] font-bold text-cyan bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-md">📅 {t}</span>;
  }
  return <span className="text-[10px] font-bold text-grey bg-grey/10 border border-grey/20 px-2 py-0.5 rounded-md">🚶 Walk-in</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    WAITING:     "bg-blue-50 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200 animate-pulse",
    DEFERRED:    "bg-gray-50 text-gray-500 border-gray-200",
  };
  const label: Record<string, string> = {
    WAITING: "Waiting", IN_PROGRESS: "▶ Consulting", DEFERRED: "⏸ Deferred",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg[status] || ""}`}>
      {label[status] || status}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function QueueManagerPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Fetch doctor list once on mount
  useEffect(() => {
    fetch("/api/doctors/available")
      .then((r) => r.json())
      .then((d) => {
        const list = d.doctors || [];
        setDoctors(list);
        if (list.length > 0) setSelectedDoctorId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Fetch queue for selected doctor
  const fetchQueue = useCallback(async () => {
    if (!selectedDoctorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/queue?doctorProfileId=${selectedDoctorId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueData(data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);

  // Initial fetch + 30-second poll
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Perform an action on a queue entry
  const doAction = async (queueEntryId: string, action: string, note?: string) => {
    setActionLoading(queueEntryId + action);
    try {
      const res = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueEntryId, action, note }),
      });
      if (res.ok) await fetchQueue();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const allActive = queueData?.active ?? [];
  const deferred = queueData?.deferred ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Patient Queue</h1>
          <p className="text-grey text-sm font-medium mt-0.5">
            Live priority queue · Auto-refreshes every 30s
            {lastRefreshed && <span className="ml-2 text-xs text-grey/60">· Last: {lastRefreshed}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-soft-blue bg-white text-navy hover:bg-light-grey transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "↺ Refresh"}
          </button>
        </div>
      </header>

      {/* ── Doctor Selector ── */}
      <div className="bg-white rounded-2xl border border-soft-blue p-5 shadow-sm">
        <p className="text-xs font-bold text-grey uppercase tracking-wider mb-3">Select Doctor</p>
        <div className="flex flex-wrap gap-3">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctorId(doc.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                selectedDoctorId === doc.id
                  ? "bg-navy text-white border-navy shadow-md"
                  : "bg-light-grey text-navy border-soft-blue hover:border-navy/30"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${doc.availableNow ? "bg-emerald-400" : "bg-grey/40"}`} />
              {doc.fullName}
              <span className={`text-[10px] font-normal ${selectedDoctorId === doc.id ? "text-white/70" : "text-grey"}`}>
                {doc.specialization}
              </span>
            </button>
          ))}
          {doctors.length === 0 && (
            <p className="text-sm text-grey italic">No doctors have set up their profiles yet.</p>
          )}
        </div>
      </div>

      {/* ── Stats Strip ── */}
      {selectedDoctor && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "In Queue", value: allActive.filter((p) => p.status === "WAITING").length, color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "Consulting", value: allActive.filter((p) => p.status === "IN_PROGRESS").length, color: "text-violet-600 bg-violet-50 border-violet-200" },
            { label: "Deferred", value: deferred.length, color: "text-grey bg-light-grey border-soft-blue" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Queue Table ── */}
      {selectedDoctorId && (
        <div className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-soft-blue flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-navy">
                Active Queue — {selectedDoctor?.fullName ?? ""}
              </h2>
              <p className="text-xs text-grey mt-0.5">Sorted by priority score · Higher = called first</p>
            </div>
          </div>

          {loading && !queueData ? (
            <div className="py-12 text-center text-sm text-grey">Loading queue…</div>
          ) : allActive.length === 0 ? (
            <div className="py-12 text-center text-sm text-grey">No patients in queue for this doctor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-light-grey text-[11px] font-bold text-grey uppercase tracking-wider">
                    <th className="px-4 py-2.5 w-12">#</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Severity</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Waiting</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-blue/40">
                  {allActive.map((p) => {
                    const isConsulting = p.status === "IN_PROGRESS";
                    return (
                      <tr
                        key={p.queueEntryId}
                        className={`transition-colors ${isConsulting ? "bg-violet-50/50" : "hover:bg-light-grey/50"}`}
                      >
                        {/* Position */}
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            p.position === 1 ? "bg-cyan text-white shadow-md shadow-cyan/30" :
                            p.position === 2 ? "bg-navy/10 text-navy" : "bg-light-grey text-grey"
                          }`}>
                            {p.position ?? "—"}
                          </span>
                        </td>

                        {/* Patient info */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-navy text-sm">{p.name}</p>
                          <p className="text-xs text-grey font-mono">{p.patientCode} · {p.gender} · {p.age}y</p>
                        </td>

                        {/* Severity */}
                        <td className="px-4 py-3"><SeverityBadge level={p.critical} /></td>

                        {/* Visit type */}
                        <td className="px-4 py-3"><TypeBadge type={p.visitType} scheduledTime={p.scheduledTime} /></td>

                        {/* Wait time */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-grey">{p.waitingLabel}</span>
                          <p className="text-[10px] text-grey/50">score: {p.queueScore}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {p.status === "WAITING" && (
                              <>
                                <ActionBtn
                                  label="▲"
                                  title="Bump Up (+30)"
                                  color="blue"
                                  loading={actionLoading === p.queueEntryId + "BUMP_UP"}
                                  onClick={() => doAction(p.queueEntryId, "BUMP_UP")}
                                />
                                <ActionBtn
                                  label="▼"
                                  title="Bump Down (-30)"
                                  color="grey"
                                  loading={actionLoading === p.queueEntryId + "BUMP_DOWN"}
                                  onClick={() => doAction(p.queueEntryId, "BUMP_DOWN")}
                                />
                                <ActionBtn
                                  label="🔴 Urgent"
                                  title="Mark as urgent (instant top)"
                                  color="red"
                                  loading={actionLoading === p.queueEntryId + "URGENT"}
                                  onClick={() => doAction(p.queueEntryId, "URGENT")}
                                />
                                <ActionBtn
                                  label="⏸ Defer"
                                  title="Defer patient (stepped out, etc.)"
                                  color="amber"
                                  loading={actionLoading === p.queueEntryId + "DEFER"}
                                  onClick={() => doAction(p.queueEntryId, "DEFER")}
                                />
                                <ActionBtn
                                  label="▶ Call"
                                  title="Call this patient"
                                  color="cyan"
                                  loading={actionLoading === p.queueEntryId + "IN_PROGRESS"}
                                  onClick={() => doAction(p.queueEntryId, "IN_PROGRESS")}
                                />
                              </>
                            )}
                            {p.status === "IN_PROGRESS" && (
                              <ActionBtn
                                label="✓ Done"
                                title="Mark consultation complete"
                                color="green"
                                loading={actionLoading === p.queueEntryId + "COMPLETE"}
                                onClick={() => doAction(p.queueEntryId, "COMPLETE")}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Deferred Section ── */}
      {deferred.length > 0 && (
        <div className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-soft-blue bg-light-grey/50">
            <h2 className="text-sm font-black text-grey">⏸ Deferred Patients ({deferred.length})</h2>
            <p className="text-xs text-grey/60 mt-0.5">Patients who stepped out. Resume to re-add to queue.</p>
          </div>
          <div className="divide-y divide-soft-blue/40">
            {deferred.map((p) => (
              <div key={p.queueEntryId} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex items-center gap-4">
                  <SeverityBadge level={p.critical} />
                  <div>
                    <p className="text-sm font-bold text-navy">{p.name}</p>
                    <p className="text-xs font-mono text-grey">{p.patientCode} · waited {p.waitingLabel}</p>
                  </div>
                </div>
                <ActionBtn
                  label="▶ Resume"
                  title="Return to active queue"
                  color="cyan"
                  loading={actionLoading === p.queueEntryId + "RESUME"}
                  onClick={() => doAction(p.queueEntryId, "RESUME")}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Action Button Sub-component ──────────────────────────────────────────────
function ActionBtn({
  label, title, color, loading, onClick,
}: {
  label: string; title: string;
  color: "blue" | "grey" | "red" | "amber" | "cyan" | "green";
  loading: boolean; onClick: () => void;
}) {
  const colors: Record<string, string> = {
    blue:  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    grey:  "bg-light-grey text-grey border-soft-blue hover:bg-soft-blue",
    red:   "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    cyan:  "bg-cyan text-white border-cyan hover:bg-navy shadow-sm shadow-cyan/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap ${colors[color]}`}
    >
      {loading ? "…" : label}
    </button>
  );
}
