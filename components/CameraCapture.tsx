"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const getCameraErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) {
      return "Camera access failed. Please allow permission and try again.";
    }

    if (error.name === "NotAllowedError") {
      return "Camera permission denied. Allow camera access in your browser settings.";
    }
    if (error.name === "NotFoundError") {
      return "No camera device was found on this system.";
    }
    if (error.name === "NotReadableError") {
      return "Camera is already in use by another app. Close other camera apps and retry.";
    }
    if (error.name === "OverconstrainedError") {
      return "Requested camera constraints are not supported on this device.";
    }
    if (error.name === "SecurityError") {
      return "Camera access blocked due to browser security restrictions.";
    }

    return `Camera error: ${error.message}`;
  };

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    streamRef.current = null;
    setIsVideoReady(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) {
      return;
    }

    video.srcObject = stream;
    const playPromise = video.play();
    if (playPromise) {
      await playPromise.catch(() => {
        // Some browsers wait for metadata before allowing play.
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsVideoReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not support camera access.");
        return;
      }

      if (!window.isSecureContext) {
        setCameraError("Camera requires a secure context. Use https:// or localhost.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
      await attachStreamToVideo();
    } catch (error) {
      setCameraError(getCameraErrorMessage(error));
      stopCamera();
      setIsCameraOpen(false);
    }
  }, [attachStreamToVideo, stopCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is still loading. Please wait a moment and capture again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Canvas is not available in this browser.");
      return;
    }

    // Draw current frame and convert it into an upload-ready image.
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

  useEffect(() => {
    if (!isCameraOpen) {
      return;
    }
    void attachStreamToVideo();
  }, [attachStreamToVideo, isCameraOpen]);

  if (!isCameraOpen) {
    return (
      <div className="w-full sm:w-auto">
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled}
          className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
        >
          Open Camera
        </button>

        {cameraError ? <p className="mt-2 text-sm text-red-600">{cameraError}</p> : null}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-sky-100 bg-sky-50/40 p-3">
      <video
        ref={videoRef}
        className="aspect-video w-full rounded-lg border border-sky-100 bg-black/90 object-cover"
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => setIsVideoReady(true)}
        onCanPlay={() => setIsVideoReady(true)}
      />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={captureFrame}
          disabled={!isVideoReady}
          className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
        >
          Capture
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setIsCameraOpen(false);
          }}
          className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 sm:w-auto sm:py-2"
        >
          Close Camera
        </button>
      </div>

      {!isVideoReady ? (
        <p className="mt-2 text-sm text-slate-500">Starting camera...</p>
      ) : null}

      {cameraError ? <p className="mt-3 text-sm text-red-600">{cameraError}</p> : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
