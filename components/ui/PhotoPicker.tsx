"use client";
import { useRef, useState } from "react";

interface PhotoPickerProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  children: React.ReactNode; // the trigger button
}

export function PhotoPicker({ onFile, disabled, children }: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [showSheet, setShowSheet] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  return (
    <>
      {/* Trigger */}
      <div onClick={() => !disabled && setShowSheet(true)}>{children}</div>

      {/* Action sheet */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowSheet(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-6 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowSheet(false);
                cameraInputRef.current?.click();
              }}
              className="w-full py-4 font-body font-semibold text-swansons-navy border-2 border-swansons-navy rounded-full"
            >
              📷 Take Photo
            </button>
            <button
              onClick={() => {
                setShowSheet(false);
                libraryInputRef.current?.click();
              }}
              className="w-full py-4 font-body font-semibold text-swansons-navy border-2 border-swansons-navy rounded-full"
            >
              🖼️ Choose from Library
            </button>
            <button
              onClick={() => setShowSheet(false)}
              className="w-full py-3 font-body text-swansons-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleChange}
        disabled={disabled}
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={libraryInputRef}
        onChange={handleChange}
        disabled={disabled}
      />
    </>
  );
}
