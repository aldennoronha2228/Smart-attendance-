"use client";

import type { ChangeEvent } from "react";

interface ImageUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export function ImageUploader({
  onImageSelected,
  disabled = false,
}: ImageUploaderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const preview = URL.createObjectURL(file);
    onImageSelected(file, preview);
    event.target.value = "";
  };

  return (
    <label className="inline-flex cursor-pointer items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50">
      Upload Image
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
