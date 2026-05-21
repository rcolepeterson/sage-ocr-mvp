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
import { Logo } from "@/components/ui/Logo";
import type { User as FirebaseUser } from "firebase/auth";
import Link from "next/link";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatCustomerName(displayName?: string | null): string {
  if (!displayName) return "Customer";
  const parts = displayName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

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
    <div className="bg-white rounded-2xl p-6 shadow max-w-2xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-swansons-navy">
          Staff Accounts
        </h2>
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
            <tr className="bg-swansons-cream text-xs font-body uppercase tracking-wide text-swansons-muted">
              <th className="p-3 text-left">Avatar</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.uid}
                className="border-b text-xs font-body hover:bg-swansons-cream/50"
              >
                <td className="p-3">
                  <div className="w-8 h-8 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-base">
                    {u.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                </td>
                <td className="p-3 font-body font-medium text-swansons-navy">
                  {u.displayName}
                </td>
                <td className="p-3 font-body text-swansons-text">{u.email}</td>
                <td className="p-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="p-3 font-body">
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

/* ─── Sidebar — icon only ───────────────────────────────────────────────── */
type SidebarProps = {
  user: AppUser | FirebaseUser | null;
  onTab: (tab: number) => void;
  tab: number;
};

const NAV_ICONS = [
  {
    label: "Thread Queue",
    svg: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Staff Workload",
    svg: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Send Notifications",
    svg: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Staff Accounts",
    svg: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Settings",
    disabled: true,
    svg: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

function Sidebar({ user, onTab, tab }: SidebarProps) {
  const photoURL = (user as any)?.photoURL;
  const displayName = user?.displayName;

  return (
    <aside className="hidden md:flex flex-col items-center w-20 bg-swansons-navy min-h-screen py-6 gap-6 shrink-0">
      {/* Logo */}
      <div className="mb-2">
        <Logo width={44} height={44} />
      </div>

      {/* Profile photo */}
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-swansons-green-muted flex items-center justify-center">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName || "Admin"}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-swansons-green-dark font-heading font-bold text-lg">
              {displayName?.[0]?.toUpperCase() || "A"}
            </span>
          )}
        </div>
        {/* Online dot */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-swansons-green rounded-full border-2 border-swansons-navy" />
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {NAV_ICONS.map(({ label, svg, disabled }, i) => (
          <button
            key={label}
            onClick={() => !disabled && onTab(i)}
            disabled={disabled}
            title={label}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              disabled
                ? "opacity-30 cursor-not-allowed text-white/50"
                : tab === i
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {svg}
          </button>
        ))}
      </nav>
    </aside>
  );
}

/* ─── StatCard — coloured bottom bar ────────────────────────────────────── */
type StatCardProps = {
  label: string;
  value: number | string;
  barColor: string;
};

function StatCard({ label, value, barColor }: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden max-w-[200px] flex flex-col">
      <div className="flex-1 flex items-center justify-center py-6 px-4">
        <span
          className="font-heading text-swansons-navy"
          style={{ fontSize: "3rem", lineHeight: 1 }}
        >
          {value}
        </span>
      </div>
      <div className={`${barColor} py-2 px-4 text-center`}>
        <span className="text-white font-body font-semibold text-xs uppercase tracking-widest">
          {label}
        </span>
      </div>
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
        className="px-3 py-1.5 rounded-full border border-swansons-navy text-xs font-body text-swansons-navy hover:bg-swansons-navy hover:text-white transition"
        onClick={() => setOpen((v) => !v)}
      >
        {thread.assignedTo ? "Reassign" : "Assign"}
      </button>
      {open && (
        <div className="absolute z-10 bg-white border rounded-xl shadow-lg mt-1 w-48 overflow-hidden">
          {staffUsers.map((u) => (
            <button
              key={u.uid}
              className="block w-full text-left px-4 py-2.5 hover:bg-swansons-green-muted text-xs font-body text-swansons-text"
              onClick={() => {
                onAssign(thread.id, u.uid);
                setOpen(false);
              }}
            >
              {u.displayName} {u.specialty ? `(${u.specialty})` : ""}
            </button>
          ))}
          <button
            className="block w-full text-left px-4 py-2.5 hover:bg-red-50 text-xs font-body text-red-500 border-t"
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
  { key: "unassigned", label: "Unassigned" },
  { key: "needs-followup", label: "Needs Followup" },
  { key: "waiting-on-customer", label: "Waiting on Customer" },
  { key: "closed", label: "Closed" },
];

/* ─── ThreadQueueTab ────────────────────────────────────────────────────── */
type ThreadQueueTabProps = {
  threads: Thread[];
  staffUsers: AppUser[];
  allUsers: AppUser[];
  onAssign: (threadId: string, staffUid: string | null) => Promise<void>;
  onUrgent: (threadId: string, urgent: boolean) => Promise<void>;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
};

function ThreadQueueTab({
  threads,
  staffUsers,
  allUsers,
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
    if (!open.length) return "0";
    return Math.round(
      open.reduce(
        (sum, t) =>
          sum + (now - ((t.createdAt as any)?.toMillis?.() || 0)) / 3600000,
        0,
      ) / open.length,
    ).toString();
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
      {/* Stat Cards */}
      <div className="flex flex-wrap gap-4 mb-8">
        <StatCard
          label="Unassigned"
          value={unassigned.length}
          barColor="bg-orange-400"
        />
        <StatCard
          label="Active Threads"
          value={open.length}
          barColor="bg-teal-400"
        />
        <StatCard label="Urgent" value={urgent.length} barColor="bg-red-400" />
        <StatCard
          label="Avg Wait (Hrs)"
          value={avgResponseTime}
          barColor="bg-swansons-navy"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`px-4 py-1.5 rounded-full border text-xs font-body font-medium transition-all ${
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs font-body uppercase tracking-wide text-swansons-muted border-b">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Plant</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Urgent</th>
              <th className="px-4 py-3 text-left">Wait (hrs)</th>
              <th className="px-4 py-3 text-left">Assigned</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const waitHrs = Math.round(
                (now - ((t.createdAt as any)?.toMillis?.() || 0)) / 3600000,
              );
              const assigned = staffUsers.find((u) => u.uid === t.assignedTo);
              const customer = allUsers.find((u) => u.uid === t.userId);
              const customerName = formatCustomerName(customer?.displayName);

              return (
                <tr
                  key={t.id}
                  className="border-b last:border-0 text-sm font-body hover:bg-swansons-cream/40 transition"
                >
                  <td className="px-4 py-3 text-swansons-text font-medium">
                    {customerName}
                  </td>
                  <td className="px-4 py-3 text-swansons-muted max-w-[140px] truncate">
                    {t.plantName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-body font-medium ${
                        t.status === "new"
                          ? "bg-orange-400"
                          : t.status === "assigned"
                            ? "bg-swansons-navy"
                            : t.status === "waiting-on-customer"
                              ? "bg-teal-400"
                              : t.status === "needs-followup"
                                ? "bg-orange-500"
                                : t.status === "closed"
                                  ? "bg-swansons-muted"
                                  : "bg-swansons-muted"
                      }`}
                    >
                      {t.status === "new"
                        ? "Unassigned"
                        : t.status === "assigned"
                          ? "Assigned"
                          : t.status === "waiting-on-customer"
                            ? "Waiting on Customer"
                            : t.status === "needs-followup"
                              ? "Needs Followup"
                              : t.status === "closed"
                                ? "Closed"
                                : t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-body font-medium transition ${
                        t.urgent
                          ? "bg-orange-500 text-white"
                          : "border border-swansons-navy text-swansons-navy hover:bg-swansons-navy hover:text-white"
                      }`}
                      onClick={() => onUrgent(t.id, !t.urgent)}
                    >
                      {t.urgent ? "Urgent" : "Mark Urgent"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-swansons-text">{waitHrs}</td>
                  <td className="px-4 py-3 text-swansons-text">
                    {assigned ? assigned.displayName : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AssignDropdown
                        thread={t}
                        staffUsers={staffUsers}
                        onAssign={onAssign}
                      />
                      {/* Eye icon — view thread */}
                      <Link
                        href={`/admin/inbox`}
                        className="w-9 h-9 bg-swansons-navy rounded-full flex items-center justify-center text-white hover:opacity-90 transition shrink-0"
                        title="View thread"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-swansons-muted font-body">
            No threads found.
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex justify-center py-4 border-t">
            <button className="font-body text-sm text-swansons-navy underline underline-offset-2">
              Load More
            </button>
          </div>
        )}
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
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-lg shrink-0">
              {u.displayName?.[0] || "S"}
            </div>
            <div className="flex-1">
              <div className="font-heading font-semibold text-swansons-navy">
                {u.displayName}
              </div>
              <div className="text-xs text-swansons-muted font-body mb-2">
                {u.specialty || <span className="italic">No specialty</span>}
              </div>
              <input
                className="input text-xs w-40 font-body"
                placeholder="Edit specialty"
                defaultValue={u.specialty}
                onBlur={(e) => onSpecialty(u.uid, e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-2 bg-swansons-cream rounded-full overflow-hidden">
                <div
                  className="bg-swansons-green h-2 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="text-xs font-mono text-swansons-text shrink-0">
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
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center">
      <div className="text-3xl mb-4">🔔</div>
      <div className="font-heading font-bold text-xl mb-2 text-swansons-navy">
        Send Notifications
      </div>
      <div className="text-swansons-muted font-body mb-6">Coming Soon</div>
      <div className="w-full max-w-md">
        <label className="block text-xs text-swansons-muted font-body mb-2 uppercase tracking-wide">
          Filter by plant tags
        </label>
        <div className="flex flex-wrap gap-2 mb-6">
          {tagList.map((tag: string) => (
            <span
              key={tag}
              className="bg-swansons-green-muted text-swansons-green-dark rounded-full px-2 py-0.5 text-xs font-body font-medium border border-swansons-green opacity-60 cursor-not-allowed"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          className="w-full bg-swansons-green text-white py-3 rounded-full opacity-60 cursor-not-allowed font-body font-semibold"
          disabled
        >
          Create Notification →
        </button>
      </div>
    </div>
  );
}

/* ─── AdminDashboardPage ────────────────────────────────────────────────── */
const TABS = [
  "Thread Queue",
  "Staff Workload",
  "Send Notifications",
  "Staff Accounts",
];

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
        <Sidebar user={user} onTab={setTab} tab={tab} />
        <main className="flex-1 p-6 md:p-10 overflow-x-auto">
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-1">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`flex-1 py-2 rounded-full text-xs font-body whitespace-nowrap px-3 ${
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
              allUsers={allUsers}
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
