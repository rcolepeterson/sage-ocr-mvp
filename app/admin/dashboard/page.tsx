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
import {
  onBroadcastsSnapshot,
  getRecipientCount,
  type Broadcast,
} from "@/lib/firebase/broadcasts";
import { Logo } from "@/components/ui/Logo";
import { auth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/Button";
import type { User as FirebaseUser } from "firebase/auth";
import Link from "next/link";
import React from "react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatCustomerName(displayName?: string | null): string {
  if (!displayName) return "Customer";
  const parts = displayName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function formatTimeAgo(createdAt: any): string {
  const diffMs = Date.now() - (createdAt?.toMillis?.() || 0);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
      className={`px-3 py-1 rounded-full border text-xs font-body font-medium capitalize ${color}`}
    >
      {role}
    </span>
  );
}

/* ─── ThreadPreviewModal ────────────────────────────────────────────────── */
function ThreadPreviewModal({
  thread,
  allUsers,
  onClose,
}: {
  thread: Thread;
  allUsers: AppUser[];
  onClose: () => void;
}) {
  const customer = allUsers.find((u) => u.uid === thread.userId);
  const customerName = formatCustomerName(customer?.displayName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-body font-semibold text-swansons-navy">
              {customerName}
            </span>
            <span className="text-swansons-muted font-body text-sm">·</span>
            <span className="text-swansons-muted font-body text-sm">
              {formatTimeAgo(thread.createdAt)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-body text-sm text-swansons-navy underline underline-offset-2"
          >
            Close
          </button>
        </div>
        <p className="font-body text-swansons-text text-sm leading-relaxed mb-6">
          {thread.question}
        </p>
        <Link href={`/admin/inbox?threadId=${thread.id}`}>
          <Button variant="primary" className="rounded-full">
            Open Thread
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── StaffEditModal ────────────────────────────────────────────────────── */
function StaffEditModal({
  user: staffUser,
  currentUid,
  onRoleChange,
  onSpecialty,
  onClose,
}: {
  user: AppUser;
  currentUid: string;
  onRoleChange: (uid: string, role: string) => Promise<void>;
  onSpecialty: (uid: string, specialty: string) => Promise<void>;
  onClose: () => void;
}) {
  const [role, setRole] = useState(staffUser.role);
  const [specialty, setSpecialty] = useState(staffUser.specialty || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onRoleChange(staffUser.uid, role);
    await onSpecialty(staffUser.uid, specialty);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-lg text-swansons-navy">
            Edit Staff
          </h2>
          <button
            onClick={onClose}
            className="font-body text-sm text-swansons-navy underline underline-offset-2"
          >
            Close
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-xl shrink-0">
            {staffUser.displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-heading font-semibold text-swansons-navy">
              {staffUser.displayName}
            </p>
            <p className="font-body text-xs text-swansons-muted">
              {staffUser.email}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-xs font-body font-semibold uppercase tracking-wide text-swansons-muted mb-2">
            Role
          </label>
          <select
            className="input w-full font-body text-sm"
            value={role}
            disabled={staffUser.uid === currentUid}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          {staffUser.uid === currentUid && (
            <p className="text-xs text-swansons-muted font-body mt-1">
              You cannot change your own role.
            </p>
          )}
        </div>

        {/* Specialty */}
        <div className="mb-6">
          <label className="block text-xs font-body font-semibold uppercase tracking-wide text-swansons-muted mb-2">
            Specialty
          </label>
          <input
            className="input w-full font-body text-sm"
            placeholder="e.g. Perennials, Trees & Shrubs"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            className="flex-1 rounded-full whitespace-nowrap"
          >
            {success ? "Saved ✓" : saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1 rounded-full whitespace-nowrap"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── AddStaffModal ─────────────────────────────────────────────────────── */
function AddStaffModal({
  allUsers,
  currentStaffUids,
  onRoleChange,
  onClose,
}: {
  allUsers: AppUser[];
  currentStaffUids: string[];
  onRoleChange: (uid: string, role: string) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [successUid, setSuccessUid] = useState<string | null>(null);

  const results = allUsers.filter(
    (u) =>
      u.role === "customer" &&
      !currentStaffUids.includes(u.uid) &&
      search.length > 0 &&
      (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const handlePromote = async (u: AppUser) => {
    setSaving(true);
    await onRoleChange(u.uid, "staff");
    setSaving(false);
    setSuccessUid(u.uid);
    setTimeout(() => {
      setSuccessUid(null);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-lg text-swansons-navy">
            Add Staff
          </h2>
          <button
            onClick={onClose}
            className="font-body text-sm text-swansons-navy underline underline-offset-2"
          >
            Close
          </button>
        </div>
        <p className="font-body text-swansons-muted text-sm mb-4">
          Search for an existing user and promote them to Staff.
        </p>
        <input
          className="input w-full font-body text-sm mb-4"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {search.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            {results.length === 0 ? (
              <p className="font-body text-swansons-muted text-sm p-4 text-center">
                No customers found.
              </p>
            ) : (
              results.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between px-4 py-3 hover:bg-swansons-cream/50 border-b last:border-0"
                >
                  <div>
                    <p className="font-body font-medium text-swansons-navy text-sm">
                      {u.displayName}
                    </p>
                    <p className="font-body text-swansons-muted text-xs">
                      {u.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePromote(u)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-full bg-swansons-navy text-white text-xs font-body hover:opacity-90 transition disabled:opacity-50"
                  >
                    {successUid === u.uid ? "Done ✓" : "Make Staff"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── StaffManagementTab ────────────────────────────────────────────────── */
type StaffManagementTabProps = {
  staffUsers: AppUser[];
  allUsers: AppUser[];
  threads: Thread[];
  currentUid: string;
  onSpecialty: (uid: string, specialty: string) => Promise<void>;
  onRoleChange: (uid: string, role: string) => Promise<void>;
};

function StaffManagementTab({
  staffUsers,
  allUsers,
  threads,
  currentUid,
  onSpecialty,
  onRoleChange,
}: StaffManagementTabProps) {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const currentStaffUids = staffUsers.map((u) => u.uid);

  const maxCount = Math.max(
    ...staffUsers.map(
      (u) =>
        threads.filter((t) => t.assignedTo === u.uid && t.status !== "closed")
          .length,
    ),
    1,
  );

  const filtered = staffUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="font-heading font-bold text-swansons-navy"
          style={{ fontSize: "2.5rem" }}
        >
          Staff Management
        </h1>
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm px-4 py-2 w-72">
          <input
            className="flex-1 font-body text-sm text-swansons-text placeholder:text-swansons-muted focus:outline-none bg-transparent"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="w-8 h-8 bg-swansons-navy rounded-lg flex items-center justify-center shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs font-body uppercase tracking-wide text-swansons-muted border-b">
              <th className="px-6 py-4 text-left">Avatar</th>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">Workload</th>
              <th className="px-6 py-4 text-left">Threads Closed</th>
              <th className="px-6 py-4 text-right pr-6"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const activeCount = threads.filter(
                (t) => t.assignedTo === u.uid && t.status !== "closed",
              ).length;
              const closedCount = threads.filter(
                (t) => t.assignedTo === u.uid && t.status === "closed",
              ).length;
              return (
                <tr
                  key={u.uid}
                  className="border-b last:border-0 hover:bg-swansons-cream/30 transition"
                >
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-swansons-green-muted text-swansons-green-dark flex items-center justify-center font-heading font-bold text-base overflow-hidden shrink-0">
                      {u.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body font-medium text-swansons-navy">
                    {u.displayName}
                  </td>
                  <td className="px-6 py-4 font-body text-swansons-muted text-sm">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-body font-semibold text-swansons-navy text-sm w-4 shrink-0">
                        {activeCount}
                      </span>
                      <div className="w-32 h-2 bg-swansons-cream rounded-full overflow-hidden">
                        <div
                          className="bg-swansons-navy h-2 rounded-full transition-all"
                          style={{
                            width: `${(activeCount / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-heading font-bold text-swansons-navy text-xl">
                    {closedCount}
                  </td>
                  <td className="px-6 py-4 pr-6 text-right">
                    <button
                      onClick={() => setEditUser(u)}
                      className="w-9 h-9 bg-swansons-navy rounded-full flex items-center justify-center text-white hover:opacity-90 transition ml-auto"
                      title="Edit staff member"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Staff */}
      <div className="flex flex-col items-center mt-8 gap-2">
        <button
          onClick={() => setShowAddStaff(true)}
          className="w-12 h-12 bg-swansons-navy rounded-full flex items-center justify-center text-white hover:opacity-90 transition"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="font-body font-semibold text-swansons-navy text-sm underline underline-offset-2">
          Add Staff
        </span>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <StaffEditModal
          user={editUser}
          currentUid={currentUid}
          onRoleChange={onRoleChange}
          onSpecialty={onSpecialty}
          onClose={() => setEditUser(null)}
        />
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <AddStaffModal
          allUsers={allUsers}
          currentStaffUids={currentStaffUids}
          onRoleChange={onRoleChange}
          onClose={() => setShowAddStaff(false)}
        />
      )}
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
    label: "Staff Management",
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
      <div className="mb-2">
        <Logo width={44} height={44} />
      </div>
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
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-swansons-green rounded-full border-2 border-swansons-navy" />
      </div>
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

/* ─── StatCard ──────────────────────────────────────────────────────────── */
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
  const [openUpward, setOpenUpward] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 150);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        className="px-3 py-1.5 rounded-full border border-swansons-navy text-xs font-body text-swansons-navy hover:bg-swansons-navy hover:text-white transition"
        onClick={handleToggle}
      >
        {thread.assignedTo ? "Reassign" : "Assign"}
      </button>
      {open && (
        <div
          className={`absolute z-50 bg-white border rounded-xl shadow-lg w-48 overflow-hidden ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
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
  const [previewThread, setPreviewThread] = useState<Thread | null>(null);
  const [sortBy, setSortBy] = useState<"assigned" | "urgent" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: "assigned" | "urgent") => {
    if (sortBy === col) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortBy(null);
        setSortDir("asc");
      }
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

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

  // Sort
  const sorted = [...filtered];
  if (sortBy === "assigned") {
    sorted.sort((a, b) => {
      const nameA =
        staffUsers.find((u) => u.uid === a.assignedTo)?.displayName ?? "";
      const nameB =
        staffUsers.find((u) => u.uid === b.assignedTo)?.displayName ?? "";
      return sortDir === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  } else if (sortBy === "urgent") {
    sorted.sort((a, b) => {
      if (sortDir === "asc") return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
      return (a.urgent ? 1 : 0) - (b.urgent ? 1 : 0);
    });
  }

  return (
    <div>
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-xs font-body uppercase tracking-wide text-swansons-black">
              <th className="px-4 py-3 text-left text-swansons-black">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-swansons-black">Plant</th>
              <th className="px-4 py-3 text-left text-swansons-black">
                Status
              </th>
              <th className="px-4 py-3 text-left text-swansons-black">
                <button
                  onClick={() => handleSort("urgent")}
                  className="flex items-center gap-1 font-body text-xs uppercase tracking-wide text-swansons-black hover:text-swansons-navy transition"
                >
                  Urgent
                  <span className="text-swansons-muted">
                    {sortBy === "urgent"
                      ? sortDir === "asc"
                        ? "↓"
                        : "↑"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-swansons-black">
                Wait (hrs)
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("assigned")}
                  className="flex items-center gap-1 font-body text-xs uppercase tracking-wide text-swansons-black hover:text-swansons-navy transition"
                >
                  Assigned
                  <span className="text-swansons-muted">
                    {sortBy === "assigned"
                      ? sortDir === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-swansons-black ">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const waitHrs = Math.round(
                (now - ((t.createdAt as any)?.toMillis?.() || 0)) / 3600000,
              );
              const assigned = staffUsers.find((u) => u.uid === t.assignedTo);
              const customer = allUsers.find((u) => u.uid === t.userId);
              const customerName = formatCustomerName(customer?.displayName);

              return (
                <tr
                  key={t.id}
                  className="bg-white text-sm font-body hover:opacity-90 transition"
                >
                  <td className="px-4 py-3 text-swansons-text font-medium rounded-l-xl ">
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
                  <td className="px-4 py-3 pr-4 w-48 rounded-r-xl">
                    <div className="flex items-center justify-between gap-2">
                      <AssignDropdown
                        thread={t}
                        staffUsers={staffUsers}
                        onAssign={onAssign}
                      />
                      <button
                        onClick={() => setPreviewThread(t)}
                        className="w-9 h-9 bg-swansons-navy rounded-full flex items-center justify-center text-white hover:opacity-90 transition shrink-0"
                        title="Preview thread"
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
                      </button>
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
      </div>

      {previewThread && (
        <ThreadPreviewModal
          thread={previewThread}
          allUsers={allUsers}
          onClose={() => setPreviewThread(null)}
        />
      )}
    </div>
  );
}

/* ─── SendNotificationsTab ──────────────────────────────────────────────── */

const TAG_CATEGORIES: Record<string, string[]> = {
  "Plant Type": [
    "fruit-tree",
    "ornamental-tree",
    "evergreen-tree",
    "deciduous-shrub",
    "evergreen-shrub",
    "flowering-shrub",
    "shade-perennial",
    "sun-perennial",
    "ornamental-grass",
    "ground-cover",
    "climbing-vine",
    "annual-flower",
    "tropical-annual",
    "bulb",
    "fern",
    "hosta",
    "rose",
    "rhododendron",
    "azalea",
    "hydrangea",
    "lavender",
    "herb",
    "vegetable-starts",
    "tomato",
    "berry-bush",
    "succulent",
    "houseplant",
    "bonsai",
    "water-plant",
    "edible-flower",
  ],
  Light: [
    "full-sun-plant",
    "part-shade-plant",
    "full-shade-plant",
    "adaptable-light",
  ],
  Water: ["drought-tolerant", "moderate-water", "high-water", "moisture-lover"],
  Seasonal: [
    "spring-bloomer",
    "summer-bloomer",
    "fall-bloomer",
    "winter-interest",
    "spring-ephemeral",
    "deciduous",
    "evergreen",
  ],
  "Care Complexity": ["beginner-friendly", "intermediate-care", "expert-care"],
  "Pest & Disease": [
    "slug-risk",
    "aphid-risk",
    "powdery-mildew-risk",
    "deer-risk",
    "root-rot-risk",
    "virus-risk",
    "scale-risk",
  ],
  Container: [
    "container-friendly",
    "needs-ground-space",
    "raised-bed-ideal",
    "hanging-basket",
  ],
  "PNW Specific": [
    "pnw-native",
    "pnw-adapted",
    "rain-tolerant",
    "heat-sensitive",
    "frost-tender",
    "winter-hardy",
  ],
  Upsell: [
    "needs-fertilizer-spring",
    "needs-fertilizer-fall",
    "needs-pruning-tools",
    "needs-support-structure",
    "needs-soil-amendment",
    "needs-pest-control",
    "needs-mulch",
    "pot-upgrade-candidate",
    "companion-planting-opportunity",
  ],
};

function SendNotificationsTab() {
  const { user } = useAuth();

  // Form state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState("Plant Type");

  // UI state
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Broadcast history
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  // Subscribe to broadcast history log
  useEffect(() => {
    const unsub = onBroadcastsSnapshot(setBroadcasts);
    return () => unsub();
  }, []);

  // Live recipient count — refetch whenever tags or sendToAll changes
  useEffect(() => {
    if (!sendToAll && selectedTags.length === 0) {
      setRecipientCount(null);
      return;
    }
    setIsLoadingCount(true);
    getRecipientCount(selectedTags, sendToAll)
      .then(setRecipientCount)
      .catch(() => setRecipientCount(null))
      .finally(() => setIsLoadingCount(false));
  }, [selectedTags, sendToAll]);

  const toggleTag = (tag: string) => {
    if (sendToAll) return;
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSendClick = () => {
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    if (!user) return;
    setError(null);
    setIsSending(true);
    setShowConfirm(false);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags: selectedTags,
          sendToAll,
          sentBy: user.uid,
          sentByName: user.displayName || "Admin",
          ...(ctaUrl.trim() ? { ctaUrl: ctaUrl.trim() } : {}),
          ...(ctaLabel.trim() ? { ctaLabel: ctaLabel.trim() } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send notification");

      setSuccessMessage(
        `Notification sent to ${data.recipientCount} customer${data.recipientCount !== 1 ? "s" : ""} ✓`,
      );
      setTitle("");
      setBody("");
      setCtaLabel("");
      setCtaUrl("");
      setSelectedTags([]);
      setSendToAll(false);
      setRecipientCount(null);
      setStep(1);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send notification. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  /* ── Step indicator ── */
  const STEP_LABELS = [
    "Build Audience",
    "Create Notification",
    "Add CTA / Link",
  ];
  function StepIndicator() {
    return (
      <div className="max-w-5xl mb-10">
        <div className="relative">
          {/* Line behind pills — masked by pill background */}
          <div className="absolute top-4 left-0 right-0 border-t border-swansons-muted/30" />
          <div className="grid grid-cols-3">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const isActive = step >= num;

              return (
                <div key={num} className={`flex flex-col items-start`}>
                  {/* bg-swansons-cream masks the line behind the pill */}
                  <div className="relative z-10 bg-swansons-cream">
                    <div
                      className={`px-5 py-2 rounded-full text-xs font-body font-bold tracking-wide whitespace-nowrap text-white ${
                        isActive ? "bg-swansons-navy" : "bg-swansons-muted"
                      }`}
                    >
                      STEP {num}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-body font-semibold mt-2 ${
                      isActive ? "text-swansons-navy" : "text-swansons-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8">
        <h1
          className="font-heading font-bold text-swansons-navy"
          style={{ fontSize: "2.5rem" }}
        >
          Customer Notifications
        </h1>
      </div>

      {/* ── Success / error banners ── */}
      {successMessage && (
        <div className="mb-6 px-4 py-3 rounded-full bg-swansons-green/10 border border-swansons-green text-swansons-green-dark font-body text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-4 text-swansons-green-dark hover:opacity-70 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-full bg-red-50 border border-red-200 text-red-600 font-body text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:opacity-70 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Wizard card ── */}
      <div>
        <div className="mb-8">
          <StepIndicator />

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              {/* Controls row — category under STEP 1, toggle under STEP 2, audience under STEP 3 */}
              {/* Controls row — aligned to step columns */}
              <div className="max-w-5xl grid grid-cols-3 items-center mb-6">
                {/* Col 1 — under STEP 1 */}
                <div className="relative w-64">
                  <select
                    className="w-full border-2 border-swansons-navy text-swansons-navy font-body font-semibold py-3 rounded-full text-sm bg-transparent px-5 appearance-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {Object.keys(TAG_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-swansons-navy pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>

                {/* Col 2 — under STEP 2 */}
                <div className="flex items-center justify-start gap-3">
                  <span className="font-body text-sm text-swansons-navy font-semibold whitespace-nowrap">
                    Send to All
                  </span>
                  <button
                    onClick={() => {
                      setSendToAll((v) => !v);
                      setSelectedTags([]);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${sendToAll ? "bg-swansons-green" : "bg-swansons-muted/30"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform ${sendToAll ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>

                {/* Col 3 — under STEP 3 */}
                <div className="flex flex-col items-start">
                  <p className="text-xs font-body font-bold uppercase tracking-wide text-swansons-black ">
                    Audience Size:
                  </p>
                  {isLoadingCount ? (
                    <p className="font-body text-swansons-muted text-sm">
                      Calculating…
                    </p>
                  ) : (
                    <p className="font-heading font-bold text-swansons-navy text-4xl leading-none">
                      {recipientCount !== null
                        ? recipientCount.toLocaleString()
                        : "—"}
                    </p>
                  )}
                </div>
              </div>

              {/* Tag pills */}
              <div
                className={`flex flex-wrap gap-2 transition-opacity max-w-6xl ${
                  sendToAll ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {(TAG_CATEGORIES[selectedCategory] ?? []).map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={sendToAll}
                      className={`rounded-full px-3 py-1 text-xs font-body border transition-all ${
                        isSelected
                          ? "bg-swansons-green text-white border-swansons-green"
                          : "bg-white border-swansons-navy border-2 text-swansons-navy"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <Button
                  variant={
                    sendToAll || selectedTags.length > 0
                      ? "primary"
                      : "disabled"
                  }
                  disabled={!sendToAll && selectedTags.length === 0}
                  onClick={() => setStep(2)}
                  className="rounded-full"
                >
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              {/* Headline */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-swansons-muted font-body uppercase tracking-wide">
                    Headline
                  </label>
                  <span className="text-xs font-body text-swansons-muted">
                    50 characters max
                  </span>
                </div>
                <input
                  className="input w-full font-body text-sm"
                  placeholder="Enter headline here"
                  value={title}
                  maxLength={50}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-swansons-muted font-body mt-1 text-right">
                  {title.length}/50
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-swansons-muted font-body uppercase tracking-wide">
                    Description
                  </label>
                  <span className="text-xs font-body text-swansons-muted">
                    160 characters max
                  </span>
                </div>
                <textarea
                  className="input w-full font-body text-sm resize-none"
                  placeholder="Enter description here"
                  value={body}
                  maxLength={160}
                  rows={4}
                  onChange={(e) => setBody(e.target.value)}
                />
                <p className="text-xs text-swansons-muted font-body mt-1 text-right">
                  {body.length}/160
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="rounded-full"
                >
                  Back
                </Button>
                <Button
                  variant={title.trim() && body.trim() ? "primary" : "disabled"}
                  disabled={!title.trim() || !body.trim()}
                  onClick={() => setStep(3)}
                  className="rounded-full"
                >
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div>
              {/* CTA copy */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-swansons-muted font-body uppercase tracking-wide">
                    CTA Copy (optional)
                  </label>
                  <span className="text-xs font-body text-swansons-muted">
                    35 characters max
                  </span>
                </div>
                <input
                  className="input w-full font-body text-sm"
                  placeholder="Enter CTA copy here"
                  value={ctaLabel}
                  maxLength={35}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>

              {/* URL */}
              <div className="mb-6">
                <label className="block text-xs text-swansons-muted font-body uppercase tracking-wide mb-1.5">
                  URL / Link (optional)
                </label>
                <input
                  className="input w-full font-body text-sm"
                  placeholder="Enter url/link here"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="rounded-full"
                >
                  Back
                </Button>
                <Button
                  variant={isSending ? "disabled" : "primary"}
                  disabled={isSending}
                  onClick={handleSendClick}
                  className="rounded-full"
                >
                  {isSending ? "Sending..." : "Send Notification →"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Broadcast history ── */}
      {/* <h2 className="font-heading font-bold text-swansons-navy text-2xl mb-4 mt-10">
          Past Broadcasts
        </h2> */}
      {broadcasts.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-swansons-muted font-body text-sm">
          No broadcasts sent yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Column headers */}
          <div className="flex items-center gap-6 px-5">
            <span className="w-28 shrink-0 text-xs font-bold font-body uppercase tracking-widest text-swansons-black">
              Date
            </span>
            <span className="w-120 shrink-0 text-xs font-body font-bold  uppercase tracking-widest text-swansons-black">
              Notification
            </span>
            <span className="flex-1 text-xs font-body font-bold  uppercase tracking-widest text-swansons-black">
              Tags
            </span>
            <div className="w-32 shrink-0 flex justify-start">
              <span className="text-xs font-bold font-body uppercase tracking-widest text-swansons-black">
                Audience
              </span>
            </div>
          </div>
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-6"
            >
              {/* DATE */}
              <div className="w-28 shrink-0">
                <p className="font-body text-swansons-muted text-sm">
                  {b.createdAt
                    ? new Date(b.createdAt.toMillis())
                        .toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                        .replace(/\//g, ".")
                    : "—"}
                </p>
              </div>

              {/* NOTIFICATION */}
              <div className="w-120 shrink-0 min-w-0">
                <p className="font-body font-semibold text-swansons-navy text-sm">
                  {b.title}
                </p>
                <p className="font-body text-swansons-muted text-sm mt-1 line-clamp-2">
                  {b.body}
                </p>
                {b.ctaUrl && (
                  <a
                    href={b.ctaUrl}
                    className="font-body text-sm text-swansons-navy underline underline-offset-2 mt-1 inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {b.ctaLabel || b.ctaUrl}
                  </a>
                )}
              </div>

              {/* TAGS */}
              <div className="flex-1 flex flex-wrap gap-1">
                {b.sendToAll || b.tags.length === 0 ? (
                  <span className="bg-swansons-navy/10 text-swansons-navy rounded-full px-3 py-1 text-xs font-body font-medium">
                    All customers
                  </span>
                ) : (
                  b.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-swansons-green-muted text-swansons-green-dark rounded-full px-3 py-1 text-xs font-body font-medium"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>

              {/* AUDIENCE */}
              <div className="w-32 shrink-0 flex justify-start items-start">
                <span className="font-heading font-bold text-swansons-navy text-4xl leading-none">
                  {(b.recipientCount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirmation dialog ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-bold text-lg text-swansons-navy mb-2">
              Confirm Broadcast
            </h2>
            <p className="font-body text-swansons-muted text-sm mb-6">
              This will send a notification to the following users. This cannot
              be undone.
            </p>

            <div className="bg-swansons-cream rounded-xl p-4 mb-6 flex flex-col gap-4">
              <div>
                <p className="text-xs font-body uppercase tracking-wide text-swansons-muted mb-1">
                  Recipients
                </p>
                <p className="font-body font-semibold text-swansons-navy text-sm">
                  {sendToAll
                    ? "All customers"
                    : `${recipientCount ?? 0} customer${recipientCount !== 1 ? "s" : ""}`}
                </p>
              </div>

              {!sendToAll && selectedTags.length > 0 && (
                <div>
                  <p className="text-xs font-body uppercase tracking-wide text-swansons-muted mb-1">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-swansons-green-muted text-swansons-green-dark rounded-full px-2 py-0.5 text-xs font-body"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-body uppercase tracking-wide text-swansons-muted mb-1">
                  Title
                </p>
                <p className="font-body font-semibold text-swansons-navy text-sm">
                  {title}
                </p>
              </div>

              <div>
                <p className="text-xs font-body uppercase tracking-wide text-swansons-muted mb-1">
                  Message
                </p>
                <p className="font-body text-swansons-navy text-sm">{body}</p>
              </div>

              {ctaUrl.trim() && (
                <div>
                  <p className="text-xs font-body uppercase tracking-wide text-swansons-muted mb-1">
                    Button
                  </p>
                  <p className="font-body text-swansons-navy text-sm">
                    {ctaLabel.trim() || "Learn more →"}{" "}
                    <span className="text-swansons-muted">
                      ({ctaUrl.trim()})
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmSend}
                variant="primary"
                className="flex-1 rounded-full"
              >
                Confirm Send
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                variant="secondary"
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AdminDashboardPage ────────────────────────────────────────────────── */
const TABS = ["Thread Queue", "Staff Management", "Send Notifications"];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAllThreadsAdmin((allThreads) => {
      setThreads(allThreads);
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
    setStaffUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: role as UserRole } : u)),
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex min-h-screen bg-swansons-cream relative">
        {/* Botanical background — bottom right */}
        <div
          className="fixed bottom-0 right-0 w-80 pointer-events-none select-none"
          style={{ zIndex: 0 }}
        >
          <img src="/images/TestPlants5.png" alt="" className="w-full h-auto" />
        </div>

        <Sidebar user={user} onTab={setTab} tab={tab} />
        <main
          className="flex-1 p-6 md:p-10 overflow-x-auto"
          style={{ position: "relative", zIndex: 1 }}
        >
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
            <StaffManagementTab
              staffUsers={staffUsers}
              allUsers={allUsers}
              threads={threads}
              currentUid={user?.uid ?? ""}
              onSpecialty={handleSpecialty}
              onRoleChange={handleRoleChange}
            />
          )}
          {tab === 2 && <SendNotificationsTab />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
