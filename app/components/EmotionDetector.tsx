"use client";
import * as faceapi from "face-api.js";
import { JSX, useEffect, useRef, useState } from "react";
import { Music, Volume2, Plus, X, Sparkles } from "lucide-react";

const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

export default function EmotionDetector({
  onMoodBlock,
}: {
  onMoodBlock?: (moods: { expression: string; confidence: number }[]) => void;
}): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const blockBufferRef = useRef<
    {
      timestamp: number;
      expressions: { expression: string; confidence: number }[];
    }[]
  >([]);

  const blockStartRef = useRef<number>(Date.now());

  function computeBlockWeightedAverage(
    samples: {
      timestamp: number;
      expressions: { expression: string; confidence: number }[];
    }[],
    blockStart: number,
    blockEnd: number
  ) {
    if (samples.length === 0) return [];

    const allExpressions = new Set<string>();
    samples.forEach((s) =>
      s.expressions.forEach((e) => allExpressions.add(e.expression))
    );

    const duration = blockEnd - blockStart;
    const weightedTotal: Record<string, number> = {};
    const weightSum: Record<string, number> = {};

    for (const expr of allExpressions) {
      weightedTotal[expr] = 0;
      weightSum[expr] = 0;
    }

    for (const sample of samples) {
      const pos = (sample.timestamp - blockStart) / duration;
      const w = Math.max(0, Math.min(1, pos));

      for (const { expression, confidence } of sample.expressions) {
        weightedTotal[expression] += confidence * w;
        weightSum[expression] += w;
      }
    }

    return Object.entries(weightedTotal)
      .map(([expression, total]) => ({
        expression,
        confidence:
          weightSum[expression] > 0 ? total / weightSum[expression] : 0,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      if (mounted) setIsModelsLoaded(true);
    }
    loadModels();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isModelsLoaded) return;
    let stream: MediaStream | null = null;

    async function startCamera() {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    }
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setIsStreaming(false);
    };
  }, [isModelsLoaded]);

  useEffect(() => {
    if (!isStreaming || !isModelsLoaded) return;

    const video = videoRef.current!;
    const canvas = canvasRef.current!;

    detectionIntervalRef.current = window.setInterval(async () => {
      const detection = new faceapi.DetectSingleFaceTask(
        video,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      const result = await detection.run();
      const expressions = result?.expressions;

      if (expressions) {
        const arr = expressions.asSortedArray().map((e) => ({
          expression: e.expression,
          confidence: e.probability,
        }));

        const now = Date.now();
        const blockStart = blockStartRef.current;

        if (now - blockStart >= 10_000) {
          const averaged = computeBlockWeightedAverage(
            blockBufferRef.current,
            blockStart,
            now
          );

          if (onMoodBlock) onMoodBlock(averaged);

          blockBufferRef.current = [];
          blockStartRef.current = now;
        }

        blockBufferRef.current.push({ timestamp: now, expressions: arr });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (result) {
          const resized = faceapi.resizeResults(result, {
            width: video.videoWidth,
            height: video.videoHeight,
          });
          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceExpressions(canvas, resized);
        }
      }
    }, 250);

    return () => {
      if (detectionIntervalRef.current)
        clearInterval(detectionIntervalRef.current);
    };
  }, [isModelsLoaded, isStreaming]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <div className="w-full h-48 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl flex items-center justify-center border border-white/10">
          <div className="text-center">
            <video ref={videoRef} className="rounded-lg w-full bg-black" />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
