/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AlertCircle, Play, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaptureProcessProps {
  stream: MediaStream;
  onPhotosCaptured: (photos: string[]) => void;
  onCancel: () => void;
}

export default function CaptureProcess({ stream, onPhotosCaptured, onCancel }: CaptureProcessProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Synthesize camera shutter sound using Web Audio API (cross-platform, fast, no asset loads)
  const playShutterSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // White noise for shutter snap
      const bufferSize = ctx.sampleRate * 0.1; // 100ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
    } catch (e) {
      console.warn("Failed to play shutter sound:", e);
    }
  };

  // Capture current frame from <video> to standard square canvas
  const captureFrame = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Set a high quality square resolution for each strip cell
    canvas.width = 600;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Source Dimensions
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    
    // Crop center square
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    // Mirror image for final output so it aligns with what the user saw on screen!
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw video frame cropped as square
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

    // Get Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    // Add to captured list
    setCapturedPhotos(prev => {
      const next = [...prev, dataUrl];
      // Play shutter and flash effect
      playShutterSound();
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 200);

      return next;
    });
  };

  // Core capture sequence loop
  const startCaptureSequence = async () => {
    setSessionStarted(true);
    setCapturedPhotos([]);
    setCurrentPhotoIndex(0);
    setIsCapturing(true);

    for (let i = 0; i < 4; i++) {
      setCurrentPhotoIndex(i);
      
      // Count down 3, 2, 1
      for (let count = 3; count > 0; count--) {
        setCountdown(count);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Clear countdown text, show "Smile! 📸" briefly
      setCountdown(0);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture
      captureFrame();
      setCountdown(null);
      
      // Wait 1.5 seconds between photos for alignment adjustment
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    setIsCapturing(false);
  };

  // Reset capturing process
  const handleRetake = () => {
    setCapturedPhotos([]);
    setSessionStarted(false);
    setIsCapturing(false);
    setCountdown(null);
  };

  // Complete and proceed
  const handleDone = () => {
    if (capturedPhotos.length === 4) {
      onPhotosCaptured(capturedPhotos);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Visual Flash Element */}
      <AnimatePresence>
        {isFlashActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Real-time Camera Preview Frame */}
        <div className="lg:col-span-3 flex flex-col items-center">
          
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Camera className="text-cyan-400 w-6 h-6 animate-pulse" />
              {isCapturing 
                ? `Capturing Pose ${currentPhotoIndex + 1} of 4` 
                : capturedPhotos.length === 4 
                  ? "All Poses Complete!" 
                  : "Start Capture Session"
              }
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {isCapturing 
                ? "Get ready, strike a different pose for each countdown!" 
                : capturedPhotos.length === 4 
                  ? "Review your captures below or hit next to customize frame styling" 
                  : "Position yourself comfortably in the frame, then hit Start."
              }
            </p>
          </div>

          {/* Active Camera Viewport */}
          <div className="relative w-full aspect-square max-w-lg glass-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Live Countdown Overlay */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  key={countdown}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-md z-20 pointer-events-none"
                >
                  <span className="text-8xl md:text-9xl font-black text-white tracking-widest drop-shadow-[0_4px_24px_rgba(34,211,238,0.5)]">
                    {countdown === 0 ? "📸" : countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt to Start Session */}
            {!sessionStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xl z-15 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                  <Flame className="w-9 h-9" />
                </div>
                <h4 className="text-white font-bold text-xl mb-1">Ready for the Shoot?</h4>
                <p className="text-slate-400 text-xs max-w-xs mb-6">
                  You will take 4 consecutive poses. Adjust your framing and look at the camera, not the screen!
                </p>
                <button
                  onClick={startCaptureSequence}
                  id="start-capture-btn"
                  className="flex items-center gap-2 px-8 py-3.5 btn-primary text-white text-sm font-extrabold rounded-xl transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  Start Session (4 Shots)
                </button>
              </div>
            )}
          </div>

          {/* Bottom Progress Tracker */}
          {sessionStarted && (
            <div className="w-full max-w-lg mt-4 flex items-center justify-between px-3">
              <div className="flex gap-1.5 flex-1 max-w-[280px]">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`h-2.5 flex-1 rounded-full transition-all ${
                      idx < capturedPhotos.length
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : idx === currentPhotoIndex && isCapturing
                          ? 'bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50'
                          : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider ml-4">
                {capturedPhotos.length === 4 ? "Finished" : `Shot ${capturedPhotos.length}/4`}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Active Film Strip Preview (Bento Grid Sidebar) */}
        <div className="flex flex-col h-full glass-card border border-white/10 rounded-2xl p-4 min-h-[450px]">
          <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-3 text-center border-b border-white/5 pb-2">
            Active Strip
          </h4>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-2.5 py-2">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className="w-24 aspect-square bg-[#1e293b] rounded-xl border border-white/5 overflow-hidden relative flex items-center justify-center group shadow-md"
              >
                {capturedPhotos[idx] ? (
                  <img
                    src={capturedPhotos[idx]}
                    alt={`Pose ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 select-none">
                    <span className="text-lg font-bold font-mono">#{idx + 1}</span>
                  </div>
                )}
                {/* Visual Shot Identifier Badge */}
                {capturedPhotos[idx] && (
                  <span className="absolute bottom-1 right-1 bg-slate-950/80 border border-white/5 px-1.5 rounded text-[8px] font-mono font-bold text-slate-400">
                    Shot {idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Captures Actions */}
          {sessionStarted && !isCapturing && (
            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleRetake}
                id="retake-all-btn"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Retake Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-8 pt-6 border-t border-white/5">
        <button
          onClick={onCancel}
          disabled={isCapturing}
          id="cancel-capture-btn"
          className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition cursor-pointer text-center border border-white/5"
        >
          Cancel Shoot
        </button>

        {capturedPhotos.length === 4 && (
          <button
            onClick={handleDone}
            id="proceed-customizer-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-8 py-3 btn-primary text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer"
          >
            <span>Proceed to Customizer</span>
          </button>
        )}
      </div>
    </div>
  );
}
