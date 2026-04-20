/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  subscribeToAllThreadsAdmin,
  updateThreadAssignment,
  updateThreadUrgent,
} from "@/lib/firebase/threads";
import { getStaffUsers, updateUserSpecialty } from "@/lib/firebase/users";
import { PlantSchema } from "@/lib/llm/schema";
import { Button } from "@/components/ui/Button";
import { UserRole, AppUser } from "@/lib/firebase/users";

const TABS = ["Thread Queue", "Staff Workload", "Send Notifications"];

function Sidebar({ user, counts, onTab, tab }: any) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-swansons-green-dark text-white min-h-screen p-6">
      <div className="mb-8">
        <div className="text-2xl font-bold mb-1">Sage</div>
        <div className="text-sm mb-2">Swansons Nursery</div>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-green-200 text-green-900 flex items-center justify-center font-bold">
            {user?.displayName?.[0] || "A"}
          </div>
          <div>
            <div className="font-semibold">{user?.displayName}</div>
            <div className="text-xs text-green-100">Admin</div>
          </div>
        </div>
      </div>
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between">
          <span>All Open</span>
          <span className="font-mono">{counts.open}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Unassigned</span>
          <span className="font-mono">{counts.unassigned}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Urgent</span>
          <span className="font-mono text-red-400">{counts.urgent}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Closed</span>
          <span className="font-mono">{counts.closed}</span>
        </div>
      </div>
      <nav className="flex flex-col gap-2 mt-4">
        <button
          className={`text-left ${tab === 0 ? "font-bold underline" : ""}`}
          onClick={() => onTab(0)}
        >
          📨 Thread Queue
        </button>
        <button
          className={`text-left ${tab === 1 ? "font-bold underline" : ""}`}
          onClick={() => onTab(1)}
        >
          👥 Staff Workload
        </button>
        <button
          className={`text-left ${tab === 2 ? "font-bold underline" : ""}`}
          onClick={() => onTab(2)}
        >
          🔔 Send Notifications
        </button>
        <button className="text-left opacity-60 cursor-not-allowed">
          ⚙️ Settings
        </button>
      </nav>
    </aside>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <div
      className={`flex-1 bg-white rounded p-4 shadow flex flex-col items-center border-t-4 ${color} min-w-[120px]`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ThreadQueueTab({ threads, staffUsers, onAssign, onUrgent }: any) {
  // Calculate stats
  const unassigned = threads.filter(
    (t: any) => !t.assignedTo && t.status !== "answered",
  );
  const urgent = threads.filter(
    (t: any) => t.urgent && t.status !== "answered",
  );
  const open = threads.filter((t: any) => t.status !== "answered");
  const avgResponse = open.length
    ? (
        open.reduce(
          (sum: number, t: any) =>
            sum + (Date.now() - (t.createdAt?.toMillis?.() || 0)) / 3600000,
          0,
        ) / open.length
      ).toFixed(1)
    : "-";

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          label="Unassigned"
          value={unassigned.length}
          color="border-yellow-400"
          icon="❓"
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
          color="border-green-500"
          icon="📬"
        />
        <StatCard
          label="Avg Wait (hrs)"
          value={avgResponse}
          color="border-blue-400"
          icon="⏱️"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50 text-xs">
              <th className="p-2">Customer</th>
              <th className="p-2">Plant</th>
              <th className="p-2">Status</th>
              <th className="p-2">Urgent</th>
              <th className="p-2">Wait (hrs)</th>
              <th className="p-2">Assigned</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((t: any) => {
              const waitHrs = (
                (Date.now() - (t.createdAt?.toMillis?.() || 0)) /
                3600000
              ).toFixed(1);
              const assigned = staffUsers.find(
                (u: any) => u.uid === t.assignedTo,
              );
              return (
                <tr key={t.id} className="border-b text-xs">
                  <td className="p-2">{t.customerName || t.userId}</td>
                  <td className="p-2">{t.plantName || "-"}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${t.status === "pending" ? "bg-yellow-500" : t.status === "answered" ? "bg-green-500" : "bg-blue-500"}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      className={`px-2 py-1 rounded text-xs ${t.urgent ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"}`}
                      onClick={() => onUrgent(t.id, !t.urgent)}
                    >
                      {t.urgent ? "Urgent" : "Mark Urgent"}
                    </button>
                  </td>
                  <td className="p-2">{waitHrs}</td>
                  <td className="p-2">
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

function AssignDropdown({ thread, staffUsers, onAssign }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="px-2 py-1 bg-gray-100 rounded border text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        {thread.assignedTo ? "Reassign" : "Assign"}
      </button>
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow mt-1 w-40">
          {staffUsers.map((u: any) => (
            <button
              key={u.uid}
              className="block w-full text-left px-3 py-2 hover:bg-green-100 text-xs"
              onClick={() => {
                onAssign(thread.id, u.uid);
                setOpen(false);
              }}
            >
              {u.displayName} {u.specialty ? `(${u.specialty})` : ""}
            </button>
          ))}
          <button
            className="block w-full text-left px-3 py-2 hover:bg-red-100 text-xs text-red-600"
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

function StaffWorkloadTab({ staffUsers, threads, onSpecialty }: any) {
  const maxCount = Math.max(
    ...staffUsers.map(
      (u: any) => threads.filter((t: any) => t.assignedTo === u.uid).length,
    ),
    1,
  );
  return (
    <div className="space-y-4">
      {staffUsers.map((u: any) => {
        const count = threads.filter((t: any) => t.assignedTo === u.uid).length;
        return (
          <div
            key={u.uid}
            className="bg-white rounded p-4 shadow flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-900 flex items-center justify-center font-bold text-lg">
              {u.displayName?.[0] || "S"}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{u.displayName}</div>
              <div className="text-xs text-gray-500 mb-1">
                {u.specialty || <span className="italic">No specialty</span>}
              </div>
              <input
                className="input text-xs w-40"
                placeholder="Edit specialty"
                defaultValue={u.specialty}
                onBlur={(e) => onSpecialty(u.uid, e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs font-mono">{count} threads</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SendNotificationsTab() {
  // Get tag list from PlantSchema
  const tagList = PlantSchema.shape.tags._def.type.values;
  return (
    <div className="bg-white rounded p-8 shadow flex flex-col items-center">
      <div className="text-2xl mb-4">🔔</div>
      <div className="font-bold text-lg mb-2">Send Notifications</div>
      <div className="text-gray-500 mb-6">Coming Soon</div>
      <div className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">
            Filter by plant tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag: string) => (
              <span
                key={tag}
                className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs font-medium border border-green-200 opacity-60 cursor-not-allowed"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          className="w-full bg-green-400 text-white py-2 rounded mt-4 opacity-60 cursor-not-allowed"
          disabled
        >
          Create Notification →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [threads, setThreads] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);
  const [counts, setCounts] = useState({
    open: 0,
    unassigned: 0,
    urgent: 0,
    closed: 0,
  });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAllThreadsAdmin((allThreads) => {
      setThreads(allThreads);
      setCounts({
        open: allThreads.filter((t) => t.status !== "answered").length,
        unassigned: allThreads.filter(
          (t) => !t.assignedTo && t.status !== "answered",
        ).length,
        urgent: allThreads.filter((t) => t.urgent && t.status !== "answered")
          .length,
        closed: allThreads.filter((t) => t.status === "answered").length,
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    getStaffUsers().then(setStaffUsers);
  }, []);

  // Assign staff to thread
  async function handleAssign(threadId: string, staffUid: string | null) {
    await updateThreadAssignment(threadId, staffUid);
  }
  // Toggle urgent
  async function handleUrgent(threadId: string, urgent: boolean) {
    await updateThreadUrgent(threadId, urgent);
  }
  // Update specialty
  async function handleSpecialty(uid: string, specialty: string) {
    await updateUserSpecialty(uid, specialty);
    setStaffUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, specialty } : u)),
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex min-h-screen bg-swansons-cream">
        <Sidebar user={user} counts={counts} onTab={setTab} tab={tab} />
        <main className="flex-1 p-4 md:p-8">
          <div className="md:hidden flex gap-2 mb-4">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`flex-1 py-2 rounded ${tab === i ? "bg-green-700 text-white" : "bg-white text-green-700 border"}`}
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
