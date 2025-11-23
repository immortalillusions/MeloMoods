"use client";
import * as faceapi from "face-api.js";
import { JSX, useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

const FACEAPI_MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

const EMOTION_LABELS = [
  "neutral",
  "happiness",
  "surprise",
  "sadness",
  "anger",
  "disgust",
  "fear",
  "contempt",
];

export default function EmotionDetector({
  onMoodBlock,
}: {
  onMoodBlock?: (m: { expression: string; confidence: number }[]) => void;
}): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastLabelRef = useRef<string | null>(null);
const lastLabelTimeRef = useRef<number>(0);

  const blockBufferRef = useRef<
    {
      timestamp: number;
      expressions: { expression: string; confidence: number }[];
    }[]
  >([]);
  const blockStartRef = useRef<number>(Date.now());

  // Load face-api and ONNX model
  useEffect(() => {
    let mounted = true;
    async function load() {
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_MODEL_URL);
      sessionRef.current = await ort.InferenceSession.create(
        "/models/emotion-ferplus-8.onnx",
        { executionProviders: ["wasm"] }
      );
      console.log(sessionRef.current!.inputNames);
      console.log(sessionRef.current.inputNames);
console.log(sessionRef.current.outputNames);
console.log(sessionRef.current.inputMetadata);
console.log(sessionRef.current.outputMetadata);

      if (mounted) setIsReady(true);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Start camera
  useEffect(() => {
    if (!isReady) return;
    let stream: MediaStream | null = null;

    async function startCamera() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isReady]);

  // Periodic detection
  useEffect(() => {
    if (!isReady) return;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function syncCanvasSize() {
      if (!video.videoWidth || !video.videoHeight) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const tickInterval = 200;
    const timer = setInterval(async () => {
      if (!video || video.readyState < 2) return;
      syncCanvasSize();

      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!detection) {
        if (lastLabelRef.current && Date.now() - lastLabelTimeRef.current < 1500) {
          ctx.font = "70px Arial";
          ctx.fillStyle = "yellow";
          ctx.fillText(lastLabelRef.current, 20, 40); 
        }
        return;
      }

      const dims = faceapi.matchDimensions(canvas, video, true);
      const resized = faceapi.resizeResults(detection, dims);
      faceapi.draw.drawDetections(canvas, resized);

      const box = resized.box;
      const inputTensor = cropAndPreprocess(
        video,
        box.x,
        box.y,
        box.width,
        box.height
      );

      const session = sessionRef.current!;

      const inputName = session.inputNames[0]; 
      
      const feeds: Record<string, ort.Tensor> = {};
      feeds[inputName] = inputTensor;

      const outMap = await session.run(feeds);
      const outputName = session.outputNames[0];
      const raw = outMap[outputName].data as Float32Array;
      
      // console.log("AI Logits:", raw); 

      const probs = softmax(Array.from(raw), 0.5);
      const sorted = probs
        .map((p, i) => ({ expression: EMOTION_LABELS[i], confidence: p }))
        .sort((a, b) => b.confidence - a.confidence);
      const top = sorted[0];

      lastLabelRef.current = `${top.expression} (${(top.confidence * 100).toFixed(1)}%)`;
      lastLabelTimeRef.current = Date.now();

      ctx.font = "20px Arial";
      ctx.fillStyle = "yellow";
      ctx.fillText(lastLabelRef.current, resized.box.x, resized.box.y - 10);
      const now = Date.now();
      const blockStart = blockStartRef.current;
      if (now - blockStart >= 10_000) {
        const averaged = computeBlockWeightedAverage(
          blockBufferRef.current,
          blockStart,
          now
        );
        onMoodBlock?.(averaged);
        console.log("Mood Block Result:", averaged);
        blockBufferRef.current = [];
        blockStartRef.current = now;
      }

      blockBufferRef.current.push({ timestamp: now, expressions: sorted });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isReady, onMoodBlock]);


 function cropAndPreprocess(
    video: HTMLVideoElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const tmp = document.createElement("canvas");
    const SIZE = 64;
    tmp.width = SIZE;
    tmp.height = SIZE;
    const tctx = tmp.getContext("2d")!;
    
    const sx = Math.max(0, x);
    const sy = Math.max(0, y);
    const sw = Math.max(1, Math.min(w, video.videoWidth - sx));
    const sh = Math.max(1, Math.min(h, video.videoHeight - sy));

    tctx.drawImage(video, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
    const img = tctx.getImageData(0, 0, SIZE, SIZE);
    
    const floatData = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = img.data[i * 4 + 0]; 
      const g = img.data[i * 4 + 1]; 
      const b = img.data[i * 4 + 2]; 
      
      floatData[i] = 0.2989 * r + 0.587 * g + 0.114 * b;
    }

    return new ort.Tensor("float32", floatData, [1, 1, SIZE, SIZE]);
  }

  function softmax(arr: number[], temperature = 0.5) {
    const max = Math.max(...arr);
    const exps = arr.map((v) => Math.exp((v - max)/temperature));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  }

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

  return (
    <div className="relative w-full max-w-xs mx-auto overflow-hidden rounded-lg border border-gray-700">
      <div className="relative w-full h-48 bg-black overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}