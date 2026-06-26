/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, QrCode, Settings, RefreshCw, LogIn, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WelcomeScreen from './components/WelcomeScreen';
import CameraSetup from './components/CameraSetup';
import CaptureProcess from './components/CaptureProcess';
import Customizer from './components/Customizer';
import FinalPreview from './components/FinalPreview';
import AdminPanel from './components/AdminPanel';
import ShareScreen from './components/ShareScreen';
import { EventConfig, AnalyticsData, PhotoStripSettings } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'camera-setup' | 'capture' | 'customize' | 'preview' | 'share'>('welcome');
  const [photoId, setPhotoId] = useState<string>('');
  
  // App-wide photo and camera states
  const [photos, setPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  
  // Completed photo-strip data and settings
  const [stripDataUrl, setStripDataUrl] = useState<string>('');
  const [stripSettings, setStripSettings] = useState<PhotoStripSettings | null>(null);

  // Administrative overlays and system states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    eventName: "Open Day GGITS 2026",
    eventDate: "2026-06-26",
    eventLogo: "",
    customWatermark: "Open Day GGITS 2026 📸",
    enabledCustomizations: {
      frames: true,
      stickers: true,
      text: true,
      filters: true
    }
  });

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPhotosTaken: 0,
    totalQrScans: 0,
    totalDownloads: 0,
    frameUsage: {},
    themeUsage: {}
  });

  // Client Routing check and initial API fetch on mount
  useEffect(() => {
    // Check if URL matches a share route (either via pathname /share/:id, or via query parameter ?share=id or ?id=id)
    const urlParams = new URLSearchParams(window.location.search);
    const queryShareId = urlParams.get('share') || urlParams.get('id');
    const shareMatch = window.location.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/);
    const matchedPhotoId = queryShareId || (shareMatch && shareMatch[1]);

    if (matchedPhotoId) {
      setPhotoId(matchedPhotoId);
      setCurrentScreen('share');
      setLoadingConfig(false);
    } else {
      fetchConfigAndAnalytics();
    }
  }, []);

  const fetchConfigAndAnalytics = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setEventConfig(data.config);
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to fetch server config:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Safe camera track cleanup helper
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Handlers for screen switching
  const handleStartBooth = () => {
    setCurrentScreen('camera-setup');
  };

  const handleCameraReady = (activeStream: MediaStream, selectedId: string) => {
    setStream(activeStream);
    setDeviceId(selectedId);
    setCurrentScreen('capture');
  };

  const handlePhotosCaptured = (captured: string[]) => {
    setPhotos(captured);
    stopCameraStream(); // Stop stream once capture is successful to save battery & processing
    setCurrentScreen('customize');
  };

  const handleStripGenerated = (compositeUrl: string, settings: PhotoStripSettings) => {
    setStripDataUrl(compositeUrl);
    setStripSettings(settings);
    setCurrentScreen('preview');
  };

  const handleResetSession = () => {
    stopCameraStream();
    setPhotos([]);
    setStripDataUrl('');
    setStripSettings(null);
    fetchConfigAndAnalytics(); // Refresh analytics metrics
    setCurrentScreen('welcome');
  };

  const handleCancelShoot = () => {
    stopCameraStream();
    setCurrentScreen('welcome');
  };

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-[#0d0104] text-white relative">
        <div className="mesh-gradient" />
        <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <h3 className="text-xl font-bold font-sans">Bootstrapping SnapQR...</h3>
        <p className="text-slate-400 text-xs mt-1">Initializing layout engines, local cache databases, and assets configurations.</p>
      </div>
    );
  }

  // Render direct mobile share viewport
  if (currentScreen === 'share') {
    return (
      <div className="min-h-screen bg-[#0d0104] relative">
        <div className="mesh-gradient" />
        <ShareScreen photoId={photoId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans flex flex-col justify-between selection:bg-pink-500 selection:text-white overflow-x-hidden relative">
      {/* Absolute Ambient Background Mesh Gradient */}
      <div className="mesh-gradient" />

      {/* Decorative Theme Confetti / Gem elements in background margins */}
      <div className="absolute top-[10%] left-[5%] w-2.5 h-2.5 bg-pink-400 rotate-45 opacity-40 pointer-events-none hidden md:block" />
      <div className="absolute top-[15%] right-[12%] w-2 h-2 bg-rose-400 rotate-12 opacity-35 pointer-events-none hidden md:block" />
      <div className="absolute bottom-[20%] left-[8%] w-3 h-3 bg-pink-500 rotate-[80deg] opacity-30 pointer-events-none hidden md:block" />

      {/* Global Interactive Header */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl px-6 py-4.5 flex items-center justify-between sticky top-0 z-30 select-none">
        <div onClick={handleResetSession} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-400 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:rotate-12 transition-transform duration-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">
              SnapQR
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-pink-400 font-bold mt-0.5">
              Photo Booth
            </span>
          </div>
        </div>

        {/* Center Event Branding */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 font-medium">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          {eventConfig.eventLogo && (
            <img
              src={eventConfig.eventLogo}
              alt="Logo"
              className="w-4 h-4 object-contain rounded-full"
            />
          )}
          <span className="truncate max-w-[200px]">{eventConfig.eventName}</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-[10px] text-pink-400 font-bold">{new Date(eventConfig.eventDate).toLocaleDateString()}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsAdminOpen(true)}
          id="header-config-btn"
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden md:inline">Dashboard</span>
        </button>
      </header>

      {/* Main Core View Area */}
      <main className="flex-1 relative flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full"
          >
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onStart={handleStartBooth}
                onOpenAdmin={() => setIsAdminOpen(true)}
                config={eventConfig}
              />
            )}

            {currentScreen === 'camera-setup' && (
              <CameraSetup
                onCameraReady={handleCameraReady}
                onBack={() => setCurrentScreen('welcome')}
              />
            )}

            {currentScreen === 'capture' && stream && (
              <CaptureProcess
                stream={stream}
                onPhotosCaptured={handlePhotosCaptured}
                onCancel={handleCancelShoot}
              />
            )}

            {currentScreen === 'customize' && (
              <Customizer
                photos={photos}
                config={eventConfig}
                onGenerate={handleStripGenerated}
                onBack={() => setCurrentScreen('welcome')}
              />
            )}

            {currentScreen === 'preview' && stripSettings && (
              <FinalPreview
                stripDataUrl={stripDataUrl}
                settings={stripSettings}
                onReset={handleResetSession}
                onBackToEdit={() => setCurrentScreen('customize')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Config/Admin Overlay panel */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          config={eventConfig}
          analytics={analytics}
          onUpdateConfig={(updated) => setEventConfig(updated)}
          onRefreshData={fetchConfigAndAnalytics}
        />
      )}

      {/* Sleek human design Page Margins footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/15 py-4 px-6 text-center text-xs text-neutral-600 flex flex-col sm:flex-row justify-between items-center gap-2 select-none">
        <p className="flex items-center gap-1 justify-center">
          <span>SnapQR © 2026</span>
          <span className="text-neutral-800">•</span>
          <span>College Festivals, Exhibitions & Party Photo Booth</span>
        </p>
        <p className="flex items-center gap-1 justify-center text-neutral-700">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-pink-600/70" />
          <span>for premium memories sharing</span>
        </p>
      </footer>
    </div>
  );
}
