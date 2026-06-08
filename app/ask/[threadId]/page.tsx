/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState, useRef } from "react";
import { subscribeToThread, addReply } from "@/lib/firebase/threads";
import { uploadThreadPhoto } from "@/lib/firebase/storage";
import { useParams } from "next/navigation";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { getUser } from "@/lib/firebase/users";
import { auth } from "@/lib/firebase/auth";

function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}hrs ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function ThreadDetailPage() {
  const { user, loading } = useAuth();
  const { threadId } = useParams() as { threadId: string };
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [staffPhotos, setStaffPhotos] = useState<
    Record<string, string | undefined>
  >({});
  const [staffSpecialties, setStaffSpecialties] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThread(threadId, setThread);
    return () => unsub();
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.replies]);

  useEffect(() => {
    if (!thread?.replies?.length) return;
    const fetchStaffData = async () => {
      const uniqueIds: string[] = Array.from(
        new Set(
          thread.replies
            .filter((r: any) => r.isStaff)
            .map((r: any) => String(r.authorId)),
        ),
      );
      const names: Record<string, string> = {};
      const photos: Record<string, string | undefined> = {};
      const specialties: Record<string, string> = {};
      await Promise.all(
        uniqueIds.map(async (uid) => {
          try {
            const data = await getUser(uid);
            if (data?.displayName) names[uid] = data.displayName;
            if ((data as any)?.photoURL) photos[uid] = (data as any).photoURL;
            if ((data as any)?.specialty)
              specialties[uid] = (data as any).specialty;
          } catch {
            /* fallback */
          }
        }),
      );
      setStaffNames((prev) => ({ ...prev, ...names }));
      setStaffPhotos((prev) => ({ ...prev, ...photos }));
      setStaffSpecialties((prev) => ({ ...prev, ...specialties }));
    };
    fetchStaffData();
  }, [thread?.replies]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!reply.trim() && !photoFile) || !user) return;
    setSubmitting(true);
    setUploading(false);
    setUploadProgress(0);
    let photoURL = "";
    try {
      if (photoFile) {
        setUploading(true);
        photoURL = await uploadThreadPhoto(user.uid, threadId, photoFile, (p) =>
          setUploadProgress(p),
        );
        setUploading(false);
      }
      await addReply(
        threadId,
        user.uid,
        reply.trim(),
        false,
        photoURL || undefined,
      );
      setReply("");
      setReply("");
      // reset textarea height
      const textarea = document.querySelector("textarea");
      if (textarea) textarea.style.height = "auto";
      setPhotoFile(null);
      setPhotoPreview("");
      setUploadProgress(0);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
    setUploading(false);
  };

  if (loading || !thread) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <main
        data-lenis-prevent
        className="fixed inset-0 flex flex-col bg-swansons-navy z-10"
      >
        <div className="flex flex-col h-full max-w-lg mx-auto w-full">
          {/* ── Scrollable messages ── */}
          <div className="flex-1 overflow-y-auto px-4 pt-20 pb-6 space-y-6">
            {/* Initial question */}
            <div>
              <div className="border-l-4 border-orange-400 pl-4">
                <p className="font-body text-white text-base leading-relaxed">
                  {thread.question}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3 pl-5">
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-orange-400/20">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-heading font-bold text-orange-300 text-xs">
                      {user?.displayName?.[0]?.toUpperCase() || "Y"}
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-white/50">
                  You · {formatTimeAgo(thread.createdAt)}
                </p>
              </div>
            </div>

            {/* Replies */}
            {thread.replies?.length > 0 ? (
              thread.replies.map((r: any) => {
                const isStaff = r.isStaff;
                const fullName = staffNames[r.authorId];
                const firstName = fullName ? fullName.split(" ")[0] : null;
                const specialty =
                  staffSpecialties[r.authorId] || "Swansons Expert";
                const staffPhoto =
                  staffPhotos[r.authorId] ||
                  (r.authorId === auth.currentUser?.uid
                    ? (auth.currentUser?.photoURL ?? undefined)
                    : undefined);

                return (
                  <div key={r.id}>
                    {/* Border ONLY on the text */}
                    <div
                      className={`border-l-4 pl-4 ${isStaff ? "border-swansons-green" : "border-orange-400"}`}
                    >
                      <p className="font-body text-white text-base leading-relaxed">
                        {r.message}
                      </p>
                      {r.photoURL && (
                        <a
                          href={r.photoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={r.photoURL}
                            alt="Attached"
                            className="rounded-xl mt-3 max-h-48 object-cover"
                          />
                        </a>
                      )}
                    </div>

                    {/* Avatar + name — SIBLING div, below the border */}
                    <div className="flex items-center gap-2 mt-3 pl-5">
                      <div
                        className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${isStaff ? "bg-swansons-green-muted" : "bg-orange-400/20"}`}
                      >
                        {isStaff ? (
                          staffPhoto ? (
                            <img
                              src={staffPhoto}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-heading font-bold text-swansons-green-dark text-xs">
                              {firstName?.[0]?.toUpperCase() || "S"}
                            </span>
                          )
                        ) : user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="font-heading font-bold text-orange-300 text-xs">
                            {user?.displayName?.[0]?.toUpperCase() || "Y"}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-white/50">
                        {isStaff
                          ? `${firstName || "Swansons Expert"} · ${specialty} · ${formatTimeAgo(r.createdAt)}`
                          : `You · ${formatTimeAgo(r.createdAt)}`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="font-body text-center text-white/50 text-sm mt-8">
                No replies yet. A Swansons expert will respond soon. 🌿
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Reply input ── */}
          <div className="shrink-0 px-4 py-4 bg-white border-t border-gray-100">
            <form onSubmit={handleReply}>
              <div className="border border-gray-200 rounded-2xl p-4">
                <textarea
                  className="w-full font-body text-swansons-text placeholder:text-swansons-muted text-base resize-none focus:outline-none bg-transparent"
                  placeholder="Send a reply"
                  value={reply}
                  rows={2}
                  onChange={(e) => {
                    setReply(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e as any);
                    }
                  }}
                  disabled={submitting || uploading}
                />
                <div className="flex items-center justify-between mt-2">
                  <PhotoPicker
                    onFile={(file) => {
                      setPhotoFile(file);
                      setPhotoPreview(URL.createObjectURL(file));
                    }}
                    disabled={submitting || uploading}
                  >
                    <button
                      type="button"
                      disabled={submitting || uploading}
                      className="w-9 h-9 rounded-full border-2 border-swansons-navy flex items-center justify-center text-swansons-navy hover:bg-swansons-navy hover:text-white transition"
                    >
                      <span className="text-4xl leading-none">+</span>
                    </button>
                  </PhotoPicker>
                  <button
                    type="submit"
                    disabled={
                      submitting || uploading || (!reply.trim() && !photoFile)
                    }
                    className="w-9 h-9 rounded-full bg-swansons-navy flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 19V5M5 12l7-7 7 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {photoPreview && (
                <div className="mt-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="rounded-xl max-h-32 object-cover"
                  />
                  <button
                    type="button"
                    className="text-xs font-body text-red-400 mt-1 block"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview("");
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              )}
              {uploading && (
                <p className="text-xs font-body text-swansons-green mt-2">
                  Uploading... {uploadProgress.toFixed(0)}%
                </p>
              )}
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
