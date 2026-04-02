"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    const mediaStream = video?.srcObject;

    if (mediaStream instanceof MediaStream && video) {
      mediaStream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }

      setIsCameraOpen(true);
    } catch {
      setCameraError("Camera access failed. Please allow permission and try again.");
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Unable to capture frame. Try reopening the camera.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Canvas is not available in this browser.");
      return;
    }

    // Draw the current video frame and convert it to an image file for API upload.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture image data.");
          return;
        }

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);
        onCapture(file, previewUrl);
        stopCamera();
        setIsCameraOpen(false);
      },
      "image/jpeg",
      0.95
    );
  }, [onCapture, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!isCameraOpen) {
    return (
      <button
        type="button"
        onClick={startCamera}
        disabled={disabled}
        className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Open Camera
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-sky-100 bg-sky-50/40 p-3">
      <video
        ref={videoRef}
        className="w-full rounded-lg border border-sky-100 bg-black/90"
        playsInline
        muted
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={captureFrame}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Capture
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setIsCameraOpen(false);
          }}
          className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
        >
          Close Camera
        </button>
      </div>

      {cameraError ? (
        <p className="mt-3 text-sm text-red-600">{cameraError}</p>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
