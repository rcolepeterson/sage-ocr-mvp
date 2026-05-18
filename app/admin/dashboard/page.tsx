/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import type { Thread } from "@/lib/firebase/threads";
import {
  subscribeToAllThreadsAdmin,
  updateThreadAssignment,
  updateThreadUrgent,
} from "@/lib/firebase/threads";
import {
  getStaffUsers,
  updateUserSpecialty,
  getAllUsers,
  updateUserRole,
  UserRole,
  AppUser,
} from "@/lib/firebase/users";
import { PlantSchema } from "@/lib/llm/schema";
import type { User as FirebaseUser } from "firebase/auth";

/* ─── RoleBadge ─────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const color =
    role === "admin"
      ? "bg-swansons-green/10 text-swansons-green-dark border-swansons-green"
      : role === "staff"
        ? "bg-swansons-navy/10 text-swansons-navy border-swansons-navy"
        : "bg-swansons-muted/10 text-swansons-muted border-swansons-muted";
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-xs font-body font-medium ${color}`}
    >
      {role}
    </span>
  );
}

/* ─── StaffAccountsTab ──────────────────────────────────────────────────── */
function StaffAccountsTab({
  users,
  currentUid,
  onRoleChange,
}: {
  users: AppUser[];
  currentUid: string;
  onRoleChange: (uid: string, role: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [successUid, setSuccessUid] = useState<string | null>(null);
  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="bg-white rounded p-6 shadow max-w-2xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Staff Accounts</h2>
        <input
          className="input w-full sm:w-64 text-sm font-body"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow font-body">
          <thead>
            <tr className="bg-swansons-cream text-xs font-body">
              <th className="p-2">Avatar</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.uid} className="border-b text-xs font-body">
                <td className="p-2">
                  <div className="w-8 h-8 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-base">
                    {u.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                </td>
                <td className="p-2 font-body font-medium">{u.displayName}</td>
                <td className="p-2 font-body">{u.email}</td>
                <td className="p-2">
                  <RoleBadge role={u.role} />
                </td>
                <td className="p-2 font-body">
                  <select
                    className="input text-xs font-body"
                    value={u.role}
                    disabled={u.uid === currentUid}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      await onRoleChange(u.uid, newRole);
                      setSuccessUid(u.uid);
                      setTimeout(() => setSuccessUid(null), 1200);
                    }}
                  >
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                  {successUid === u.uid && (
                    <span className="ml-2 text-swansons-green text-xs">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────────── */
const TABS = [
  "Thread Queue",
  "Staff Workload",
  "Send Notifications",
  "Staff Accounts",
];

type SidebarProps = {
  user: AppUser | FirebaseUser | null;
  counts: { open: number; unassigned: number; urgent: number; closed: number };
  onTab: (tab: number) => void;
  tab: number;
};

function Sidebar({ user, counts, onTab, tab }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r min-h-screen p-6">
      <div className="mb-8">
        <div className="text-2xl font-heading font-bold mb-1 text-swansons-navy">
          Sage
        </div>
        <div className="text-sm font-body mb-2 text-swansons-muted">
          Swansons Nursery
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold">
            {user?.displayName?.[0] || "A"}
          </div>
          <div>
            <div className="font-heading font-semibold text-swansons-navy">
              {user?.displayName}
            </div>
            <div className="text-xs text-swansons-green font-body">Admin</div>
          </div>
        </div>
      </div>
      <div className="mb-8 space-y-2">
        {[
          { label: "All Open", value: counts.open, className: "" },
          { label: "Unassigned", value: counts.unassigned, className: "" },
          { label: "Urgent", value: counts.urgent, className: "text-red-500" },
          { label: "Closed", value: counts.closed, className: "" },
        ].map(({ label, value, className }) => (
          <div
            key={label}
            className="flex items-center justify-between font-body text-swansons-text"
          >
            <span>{label}</span>
            <span className={`font-mono ${className}`}>{value}</span>
          </div>
        ))}
      </div>
      <nav className="flex flex-col gap-2 mt-4">
        {[
          { icon: "📨", label: "Thread Queue" },
          { icon: "👥", label: "Staff Workload" },
          { icon: "🔔", label: "Send Notifications" },
          { icon: "👤", label: "Staff Accounts" },
        ].map(({ icon, label }, i) => (
          <button
            key={label}
            className={`text-left font-body cursor-pointer ${tab === i ? "font-bold underline text-swansons-green" : "text-swansons-navy"}`}
            onClick={() => onTab(i)}
          >
            {icon} {label}
          </button>
        ))}
        <button className="text-left opacity-60 cursor-not-allowed font-body text-swansons-muted">
          ⚙️ Settings
        </button>
      </nav>
    </aside>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────────── */
type StatCardProps = {
  label: string;
  value: number | string;
  color: string;
  icon: string;
};

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div
      className={`flex-1 bg-white rounded p-4 shadow flex flex-col items-center border-t-4 ${color} min-w-[120px]`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-heading font-bold text-swansons-navy">
        {value}
      </div>
      <div className="text-xs text-swansons-muted mt-1 font-body">{label}</div>
    </div>
  );
}

/* ─── AssignDropdown ────────────────────────────────────────────────────── */
type AssignDropdownProps = {
  thread: Thread;
  staffUsers: AppUser[];
  onAssign: (threadId: string, staffUid: string | null) => Promise<void>;
};

function AssignDropdown({ thread, staffUsers, onAssign }: AssignDropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="px-2 py-1 bg-swansons-cream rounded border border-swansons-muted text-xs font-body text-swansons-text"
        onClick={() => setOpen((v) => !v)}
      >
        {thread.assignedTo ? "Reassign" : "Assign"}
      </button>
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow mt-1 w-40">
          {staffUsers.map((u) => (
            <button
              key={u.uid}
              className="block w-full text-left px-3 py-2 hover:bg-swansons-green-muted text-xs font-body text-swansons-text"
              onClick={() => {
                onAssign(thread.id, u.uid);
                setOpen(false);
              }}
            >
              {u.displayName} {u.specialty ? `(${u.specialty})` : ""}
            </button>
          ))}
          <button
            className="block w-full text-left px-3 py-2 hover:bg-red-50 text-xs font-body text-red-500"
            onClick={() => {
              onAssign(thread.id, null);
              setOpen(false);
            }}
          >
            Unassign
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── FILTERS ───────────────────────────────────────────────────────────── */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned (New)" },
  { key: "needs-followup", label: "Needs Follow-Up" },
  { key: "waiting-on-customer", label: "Waiting on Customer" },
  { key: "closed", label: "Closed" },
];

/* ─── ThreadQueueTab ────────────────────────────────────────────────────── */
type ThreadQueueTabProps = {
  threads: Thread[];
  staffUsers: AppUser[];
  onAssign: (threadId: string, staffUid: string | null) => Promise<void>;
  onUrgent: (threadId: string, urgent: boolean) => Promise<void>;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
};

function ThreadQueueTab({
  threads,
  staffUsers,
  onAssign,
  onUrgent,
  filters,
  setFilters,
}: ThreadQueueTabProps) {
  const unassigned = threads.filter((t) => !t.assignedTo && t.status === "new");
  const urgent = threads.filter((t) => t.urgent && t.status !== "closed");
  const open = threads.filter((t) => t.status !== "closed");
  const now = Date.now();

  const avgResponseTime = useMemo(() => {
    if (!open.length) return "0.0";
    return (
      open.reduce(
        (sum, t) =>
          sum + (now - ((t.createdAt as any)?.toMillis?.() || 0)) / 3600000,
        0,
      ) / open.length
    ).toFixed(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  let filtered = threads;
  if (!filters.includes("all")) {
    filtered = filtered.filter((t) => {
      let match = false;
      if (filters.includes("unassigned") && t.status === "new" && !t.assignedTo)
        match = true;
      if (filters.includes("urgent") && t.urgent) match = true;
      if (filters.includes("needs-followup") && t.status === "needs-followup")
        match = true;
      if (
        filters.includes("waiting-on-customer") &&
        t.status === "waiting-on-customer"
      )
        match = true;
      if (filters.includes("closed") && t.status === "closed") match = true;
      return match;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`px-3 py-1 rounded-full border text-xs font-body font-medium transition-all ${
              filters.includes(f.key)
                ? "bg-swansons-navy text-white border-swansons-navy"
                : "bg-white text-swansons-navy border-swansons-navy"
            }`}
            onClick={() => {
              if (f.key === "all") {
                setFilters(["all"]);
              } else {
                setFilters((prev) => {
                  let next = prev.filter((k) => k !== "all");
                  if (prev.includes(f.key)) {
                    next = next.filter((k) => k !== f.key);
                  } else {
                    next = [...next, f.key];
                  }
                  return next.length === 0 ? ["all"] : next;
                });
              }
            }}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-2 text-xs text-swansons-muted font-body">
          {filtered.length} thread{filtered.length === 1 ? "" : "s"} shown
        </span>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          label="Unassigned (New)"
          value={unassigned.length}
          color="border-orange-400"
          icon="🆕"
        />
        <StatCard
          label="Urgent"
          value={urgent.length}
          color="border-red-500"
          icon="🚨"
        />
        <StatCard
          label="Open"
          value={open.length}
          color="border-swansons-green"
          icon="📬"
        />
        <StatCard
          label="Avg Wait (hrs)"
          value={avgResponseTime}
          color="border-swansons-navy"
          icon="⏱️"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-swansons-cream text-xs font-body">
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-left">Plant</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Urgent</th>
              <th className="p-2 text-left">Wait (hrs)</th>
              <th className="p-2 text-left">Assigned</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const waitHrs = (
                (now - ((t.createdAt as any)?.toMillis?.() || 0)) /
                3600000
              ).toFixed(1);
              const assigned = staffUsers.find((u) => u.uid === t.assignedTo);
              return (
                <tr key={t.id} className="border-b text-xs font-body">
                  <td className="p-2 text-swansons-text">{t.userId}</td>
                  <td className="p-2 text-swansons-text">
                    {t.plantName || "—"}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        t.status === "new"
                          ? "bg-orange-400"
                          : t.status === "assigned"
                            ? "bg-swansons-navy"
                            : t.status === "waiting-on-customer"
                              ? "bg-swansons-green"
                              : t.status === "needs-followup"
                                ? "bg-orange-500"
                                : t.status === "closed"
                                  ? "bg-swansons-green-dark"
                                  : "bg-swansons-muted"
                      }`}
                    >
                      {t.status === "new"
                        ? "🆕 New"
                        : t.status === "assigned"
                          ? "👤 Assigned"
                          : t.status === "waiting-on-customer"
                            ? "⏳ Waiting on Customer"
                            : t.status === "needs-followup"
                              ? "🔁 Needs Follow-Up"
                              : t.status === "closed"
                                ? "✅ Closed"
                                : t.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      className={`px-2 py-1 rounded text-xs font-body ${
                        t.urgent
                          ? "bg-red-500 text-white"
                          : "bg-swansons-cream text-swansons-text border border-swansons-muted"
                      }`}
                      onClick={() => onUrgent(t.id, !t.urgent)}
                    >
                      {t.urgent ? "Urgent" : "Mark Urgent"}
                    </button>
                  </td>
                  <td className="p-2 text-swansons-text">{waitHrs}</td>
                  <td className="p-2 text-swansons-text">
                    {assigned ? assigned.displayName : "—"}
                  </td>
                  <td className="p-2">
                    <AssignDropdown
                      thread={t}
                      staffUsers={staffUsers}
                      onAssign={onAssign}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── StaffWorkloadTab ──────────────────────────────────────────────────── */
type StaffWorkloadTabProps = {
  staffUsers: AppUser[];
  threads: Thread[];
  onSpecialty: (uid: string, specialty: string) => Promise<void>;
};

function StaffWorkloadTab({
  staffUsers,
  threads,
  onSpecialty,
}: StaffWorkloadTabProps) {
  const maxCount = Math.max(
    ...staffUsers.map(
      (u) => threads.filter((t) => t.assignedTo === u.uid).length,
    ),
    1,
  );
  return (
    <div className="space-y-4">
      {staffUsers.map((u) => {
        const count = threads.filter((t) => t.assignedTo === u.uid).length;
        return (
          <div
            key={u.uid}
            className="bg-white rounded p-4 shadow flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-lg">
              {u.displayName?.[0] || "S"}
            </div>
            <div className="flex-1">
              <div className="font-heading font-semibold text-swansons-navy">
                {u.displayName}
              </div>
              <div className="text-xs text-swansons-muted font-body mb-1">
                {u.specialty || <span className="italic">No specialty</span>}
              </div>
              <input
                className="input text-xs w-40 font-body"
                placeholder="Edit specialty"
                defaultValue={u.specialty}
                onBlur={(e) => onSpecialty(u.uid, e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-32 h-3 bg-swansons-cream rounded-full overflow-hidden">
                <div
                  className="bg-swansons-green h-3 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="text-xs font-mono text-swansons-text">
                {count} threads
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SendNotificationsTab ──────────────────────────────────────────────── */
function SendNotificationsTab() {
  const tagList = PlantSchema.shape.tags.unwrap().element.options;
  return (
    <div className="bg-white rounded p-8 shadow flex flex-col items-center">
      <div className="text-2xl mb-4">🔔</div>
      <div className="font-heading font-bold text-lg mb-2 text-swansons-navy">
        Send Notifications
      </div>
      <div className="text-swansons-muted font-body mb-6">Coming Soon</div>
      <div className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-xs text-swansons-muted font-body mb-1">
            Filter by plant tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag: string) => (
              <span
                key={tag}
                className="bg-swansons-green-muted text-swansons-green-dark rounded-full px-2 py-0.5 text-xs font-body font-medium border border-swansons-green opacity-60 cursor-not-allowed"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          className="w-full bg-swansons-green text-white py-2 rounded mt-4 opacity-60 cursor-not-allowed font-body"
          disabled
        >
          Create Notification →
        </button>
      </div>
    </div>
  );
}

/* ─── AdminDashboardPage ────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);
  const [counts, setCounts] = useState({
    open: 0,
    unassigned: 0,
    urgent: 0,
    closed: 0,
  });
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAllThreadsAdmin((allThreads) => {
      setThreads(allThreads);
      setCounts({
        open: allThreads.filter((t) => t.status !== "closed").length,
        unassigned: allThreads.filter(
          (t) => !t.assignedTo && t.status === "new",
        ).length,
        urgent: allThreads.filter((t) => t.urgent && t.status !== "closed")
          .length,
        closed: allThreads.filter((t) => t.status === "closed").length,
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    getStaffUsers().then(setStaffUsers);
    getAllUsers().then(setAllUsers);
  }, []);

  async function handleAssign(threadId: string, staffUid: string | null) {
    await updateThreadAssignment(threadId, staffUid);
  }

  async function handleUrgent(threadId: string, urgent: boolean) {
    await updateThreadUrgent(threadId, urgent);
  }

  async function handleSpecialty(uid: string, specialty: string) {
    await updateUserSpecialty(uid, specialty);
    setStaffUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, specialty } : u)),
    );
  }

  async function handleRoleChange(uid: string, role: string) {
    await updateUserRole(uid, role as UserRole);
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: role as UserRole } : u)),
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex min-h-screen bg-swansons-cream">
        <Sidebar user={user} counts={counts} onTab={setTab} tab={tab} />
        <main className="flex-1 p-4 md:p-8">
          <div className="md:hidden flex gap-2 mb-4 overflow-x-auto">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`flex-1 py-2 rounded text-xs font-body whitespace-nowrap ${
                  tab === i
                    ? "bg-swansons-navy text-white"
                    : "bg-white text-swansons-navy border border-swansons-navy"
                }`}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === 0 && (
            <ThreadQueueTab
              threads={threads}
              staffUsers={staffUsers}
              onAssign={handleAssign}
              onUrgent={handleUrgent}
              filters={filters}
              setFilters={setFilters}
            />
          )}
          {tab === 1 && (
            <StaffWorkloadTab
              staffUsers={staffUsers}
              threads={threads}
              onSpecialty={handleSpecialty}
            />
          )}
          {tab === 2 && <SendNotificationsTab />}
          {tab === 3 && (
            <StaffAccountsTab
              users={allUsers}
              currentUid={user?.uid ?? ""}
              onRoleChange={handleRoleChange}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
