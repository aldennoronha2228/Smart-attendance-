"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RecognizedFace } from "@/utils/types";

interface FaceOverlayProps {
  imageUrl: string;
  faces: RecognizedFace[];
}

interface Size {
  width: number;
  height: number;
}

export function FaceOverlay({ imageUrl, faces }: FaceOverlayProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [displaySize, setDisplaySize] = useState<Size>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const updateDisplaySize = () => {
      const rect = image.getBoundingClientRect();
      setDisplaySize({ width: rect.width, height: rect.height });
    };

    updateDisplaySize();
    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(image);

    return () => observer.disconnect();
  }, [imageUrl]);

  const scaledFaces = useMemo(() => {
    if (
      naturalSize.width === 0 ||
      naturalSize.height === 0 ||
      displaySize.width === 0 ||
      displaySize.height === 0
    ) {
      return [];
    }

    const scaleX = displaySize.width / naturalSize.width;
    const scaleY = displaySize.height / naturalSize.height;

    // Backend boxes are in original image pixels, so we scale them to the preview size.
    return faces.map((face) => {
      const [x, y, width, height] = face.box;

      return {
        ...face,
        left: x * scaleX,
        top: y * scaleY,
        width: width * scaleX,
        height: height * scaleY,
      };
    });
  }, [faces, displaySize, naturalSize]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Attendance preview"
        className="block h-auto w-full"
        onLoad={(event) => {
          setNaturalSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          });
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        {scaledFaces.map((face, index) => (
          <div
            key={`${face.name}-${index}-${face.confidence}`}
            className="absolute border-2 border-blue-600"
            style={{
              left: `${face.left}px`,
              top: `${face.top}px`,
              width: `${face.width}px`,
              height: `${face.height}px`,
            }}
          >
            <span className="absolute -top-6 left-0 max-w-[9rem] truncate rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:-top-7 sm:max-w-none sm:px-2 sm:py-1 sm:text-xs">
              {face.name} ({face.confidence.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
