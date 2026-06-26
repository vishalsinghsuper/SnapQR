/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, CheckCircle, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CameraSetupProps {
  onCameraReady: (stream: MediaStream, deviceId: string) => void;
  onBack: () => void;
}

export default function CameraSetup({ onCameraReady, onBack }: CameraSetupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find camera devices
  const getCameraDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  // Start video stream
  const startCamera = async (deviceId: string) => {
    setPermissionState('loading');
    setErrorMsg('');
    
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user' },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      await getCameraDevices();
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setPermissionState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg("Camera access was denied. Please update your browser permissions to allow camera access.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg("No camera device was found on your system. Please connect a webcam.");
      } else {
        setErrorMsg(`Camera error: ${err.message || 'Unknown error. please check configuration'}`);
      }
    }
  };

  useEffect(() => {
    startCamera(selectedDeviceId);
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  const handleProceed = () => {
    if (stream && videoRef.current) {
      onCameraReady(stream, selectedDeviceId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-[80vh] justify-between relative">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <Camera className="text-cyan-400 w-7 h-7" />
          Camera Preview Setup
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Adjust your angle and ensure your lighting is bright.
        </p>
      </div>

      {/* Main Preview Block */}
      <div className="flex-1 flex flex-col justify-center items-center my-4">
        <div className="relative w-full aspect-video md:aspect-[4/3] max-w-xl glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
          {permissionState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 z-10">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-slate-400 text-sm">Requesting camera access...</p>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-10">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Camera Access Blocked</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                {errorMsg}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => startCamera(selectedDeviceId)}
                  id="retry-camera-btn"
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
                >
                  Retry Setup
                </button>
                <button
                  onClick={onBack}
                  id="cancel-setup-btn"
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-sm hover:text-white transition cursor-pointer"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Video Stream Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]" // Mirrored preview for natural selfie alignment
          />

          {/* Quick Stats Overlay */}
          {permissionState === 'granted' && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 pointer-events-none select-none transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">Camera Online</span>
              </div>
              <div className="text-slate-500 text-[10px] font-mono">
                {devices.find(d => d.deviceId === selectedDeviceId)?.label.substring(0, 24) || "Webcam Input"}
              </div>
            </div>
          )}
        </div>

        {/* Camera Switching Controls */}
        {permissionState === 'granted' && devices.length > 1 && (
          <button
            onClick={switchCamera}
            id="switch-camera-btn"
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Switch Camera Source
          </button>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/5 pt-6 mt-6">
        <button
          onClick={onBack}
          id="back-btn"
          className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer text-center border border-white/5 hover:border-white/10"
        >
          Go Back
        </button>

        <button
          onClick={handleProceed}
          disabled={permissionState !== 'granted'}
          id="ready-btn"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-8 py-3 btn-primary disabled:bg-white/5 disabled:border-white/5 disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer"
        >
          <span>I'm Ready, Strike a Pose!</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
