/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useContext } from "react";
import { motion } from "motion/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { compressImage } from "@/lib/utils/imageCompression";
import { uploadUserAvatar } from "@/lib/firebase/storage";
import {
  updateUserPhotoURL,
  updateUserDisplayName,
  updateUserSpecialty,
} from "@/lib/firebase/users";

function SettingsPageContent() {
  const { user, role } = useAuth();
  const authCtx = useContext(AuthContext);

  /* Avatar state */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* Display Name state */
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* Specialty state */
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [savingSpecialty, setSavingSpecialty] = useState(false);
  const [specialtyMessage, setSpecialtyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* Avatar upload */
  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImage(file);
      const downloadURL = await uploadUserAvatar(
        user.uid,
        compressed,
        (progress) => setUploadProgress(progress),
      );
      await updateUserPhotoURL(user.uid, downloadURL);

      // Update AuthContext immediately
      if (authCtx && typeof authCtx.setUser === "function") {
        authCtx.setUser({ ...user, photoURL: downloadURL });
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* Display Name save */
  const handleSaveDisplayName = async () => {
    if (!user || !displayName.trim()) return;

    setSavingName(true);
    setNameMessage(null);
    try {
      await updateUserDisplayName(user.uid, displayName.trim());
      // Update AuthContext immediately
      if (authCtx && typeof authCtx.setUser === "function") {
        authCtx.setUser({ ...user, displayName: displayName.trim() });
      }
      setNameMessage({ type: "success", text: "Display name updated!" });
      setTimeout(() => setNameMessage(null), 2000);
    } catch (err) {
      console.error("Display name update failed:", err);
      setNameMessage({ type: "error", text: "Failed to update display name." });
    } finally {
      setSavingName(false);
    }
  };

  /* Specialty save */
  const handleSaveSpecialty = async () => {
    if (!user || !specialty.trim()) return;

    setSavingSpecialty(true);
    setSpecialtyMessage(null);
    try {
      await updateUserSpecialty(user.uid, specialty.trim());
      // Update AuthContext immediately
      if (authCtx && typeof authCtx.setUser === "function") {
        authCtx.setUser({ ...user, specialty: specialty.trim() });
      }
      setSpecialtyMessage({ type: "success", text: "Specialty updated!" });
      setTimeout(() => setSpecialtyMessage(null), 2000);
    } catch (err) {
      console.error("Specialty update failed:", err);
      setSpecialtyMessage({
        type: "error",
        text: "Failed to update specialty.",
      });
    } finally {
      setSavingSpecialty(false);
    }
  };

  /* Generate avatar initials */
  const getInitial = () => {
    if (!user) return "?";
    const name = user.displayName || user.email || "";
    return name.charAt(0).toUpperCase();
  };

  const isStaffOrAdmin = role === "staff" || role === "admin";

  return (
    <div className="min-h-screen bg-swansons-cream px-4 py-4">
      {/* Logo at top */}
      <div className="flex justify-center mb-8">
        <Logo width={100} height={50} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <h1 className="text-3xl font-heading font-bold text-swansons-navy text-center mb-8">
          Settings
        </h1>

        {/* Section 1 — Avatar */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-6">
            {/* Left side — Text */}
            <div className="flex-1">
              <h2 className="text-xl font-heading font-semibold text-swansons-navy mb-2">
                Avatar
              </h2>
              <p className="text-sm font-body text-swansons-muted">
                Click your avatar to upload a custom photo.
              </p>
            </div>

            {/* Right side — Avatar */}
            <div className="shrink-0">
              <PhotoPicker onFile={handleAvatarUpload} disabled={uploading}>
                <div className="relative cursor-pointer group">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-swansons-green"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-swansons-green-muted flex items-center justify-center border-2 border-swansons-green">
                      <span className="text-2xl font-heading font-bold text-swansons-navy">
                        {getInitial()}
                      </span>
                    </div>
                  )}

                  {/* Upload overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-body font-semibold">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  {!uploading && (
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-body font-semibold">
                        Edit
                      </span>
                    </div>
                  )}
                </div>
              </PhotoPicker>
            </div>
          </div>

          {/* Note below */}
          <p className="text-xs font-body text-swansons-muted mt-4 italic">
            An avatar is optional but strongly recommended.
          </p>
        </div>

        {/* Section 2 — Display Name */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-swansons-navy mb-2">
            Display Name
          </h2>
          <p className="text-sm font-body text-swansons-muted mb-4">
            Enter your full name or a name you&apos;re comfortable with.
          </p>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                className="w-full px-4 py-3 font-body border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-swansons-green focus:border-transparent"
                placeholder="Your name"
                disabled={savingName}
              />
              <span className="absolute right-3 top-3 text-xs font-body text-swansons-muted">
                {displayName.length}/40
              </span>
            </div>

            <button
              onClick={handleSaveDisplayName}
              disabled={savingName || !displayName.trim()}
              className="w-full py-3 font-body font-semibold text-white bg-swansons-navy rounded-full hover:bg-swansons-green-dark transition-colors disabled:bg-swansons-navy/30 disabled:cursor-not-allowed"
            >
              {savingName ? "Saving..." : "Save Display Name"}
            </button>

            {/* Success/Error message */}
            {nameMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-body text-center py-2 px-4 rounded-lg ${
                  nameMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {nameMessage.text}
              </motion.div>
            )}
          </div>
        </div>

        {/* Section 3 — Specialty (staff/admin only) */}
        {isStaffOrAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-heading font-semibold text-swansons-navy mb-2">
              Specialty
            </h2>
            <p className="text-sm font-body text-swansons-muted mb-4">
              Shown when you reply to customer threads. e.g. Perennials, Trees
              &amp; Shrubs
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 font-body border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-swansons-green focus:border-transparent"
                placeholder="e.g. Perennials, Native Plants"
                disabled={savingSpecialty}
              />

              <button
                onClick={handleSaveSpecialty}
                disabled={savingSpecialty || !specialty.trim()}
                className="w-full py-3 font-body font-semibold text-white bg-swansons-navy rounded-full hover:bg-swansons-green-dark transition-colors disabled:bg-swansons-navy/30 disabled:cursor-not-allowed"
              >
                {savingSpecialty ? "Saving..." : "Save Specialty"}
              </button>

              {/* Success/Error message */}
              {specialtyMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-body text-center py-2 px-4 rounded-lg ${
                    specialtyMessage.type === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {specialtyMessage.text}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
