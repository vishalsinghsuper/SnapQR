/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, Share2, AlertTriangle, RefreshCw, Calendar, Sparkles, Check, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { EventConfig } from '../types';

interface ShareScreenProps {
  photoId: string;
}

export default function ShareScreen({ photoId }: ShareScreenProps) {
  const [photoData, setPhotoData] = useState<{
    id: string;
    createdAt: string;
    imageUrl: string;
    frameId: string;
    themeId: string;
    scanCount: number;
    downloadCount: number;
  } | null>(null);

  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<'none' | 'expired' | 'notfound' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  // Fetch photo and config on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorType('none');

        // Fetch photo metadata
        const photoRes = await fetch(`/api/photos/${photoId}`);
        if (photoRes.status === 410) {
          setErrorType('expired');
          setLoading(false);
          return;
        } else if (photoRes.status === 404) {
          setErrorType('notfound');
          setLoading(false);
          return;
        } else if (!photoRes.ok) {
          throw new Error("Failed to load photo metadata");
        }

        const pData = await photoRes.json();
        setPhotoData(pData);

        // Track a scan increment
        await fetch(`/api/photos/${photoId}/scan`, { method: 'POST' });

        // Fetch event config
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const cfg = await configRes.json();
          setEventConfig(cfg.config);
        }
      } catch (err: any) {
        console.error("Error loading share screen:", err);
        setErrorType('error');
        setErrorMessage(err.message || "Failed to reach servers. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [photoId]);

  // Trigger download action
  const handleDownload = async () => {
    if (!photoData) return;
    try {
      // Trigger analytics download increment
      await fetch(`/api/photos/${photoId}/download`, { method: 'POST' });
      
      // Fetch image blob
      const imageRes = await fetch(photoData.imageUrl);
      const blob = await imageRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a virtual anchor to download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SnapQR_${photoId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open raw image in new tab if direct download block occurs
      window.open(photoData.imageUrl, '_blank');
    }
  };

  // Trigger Native Mobile Sharing Sheet
  const handleShare = async () => {
    if (!photoData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: eventConfig?.eventName || 'My SnapQR Photo Strip',
          text: `Check out our photo strip from ${eventConfig?.eventName || 'the event'}! Taken at SnapQR Photo Booth.`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback copy link
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        alert("Sharing link copied to clipboard!");
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      console.warn("Share API cancelled or error occurred:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-transparent text-white relative z-10">
        <RefreshCw className="w-10 h-10 text-pink-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold font-sans">Retrieving Photo Strip...</h3>
        <p className="text-slate-400 text-xs mt-1">Please wait while we query and fetch your high-resolution film strip.</p>
      </div>
    );
  }

  if (errorType === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-transparent text-white relative z-10">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 mb-6">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black font-display mb-2">This photo has expired</h1>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
          Photos automatically expire and self-delete 24 hours after capture to respect privacy and maintain server database storage. We're sorry!
        </p>
        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
          SNAPQR_EXPIRED_CODE_410
        </span>
      </div>
    );
  }

  if (errorType === 'notfound') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-transparent text-white relative z-10">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20 mb-6">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black font-display mb-2">Photo Strip Not Found</h1>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
          The requested photo strip ID does not exist or has already been cleaned up from our database files.
        </p>
        <a
          href="/"
          className="px-6 py-3 btn-secondary text-slate-300 rounded-xl text-xs font-bold"
        >
          Back to Photo Booth Home
        </a>
      </div>
    );
  }

  if (errorType === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-transparent text-white relative z-10">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 mb-6">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black font-display mb-2">Something Went Wrong</h1>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 btn-primary text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white py-8 px-4 flex flex-col justify-between relative z-10">
      {/* Upper Brand Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/25 text-pink-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-pink-400" />
          <span>{eventConfig?.eventName || 'Campus Event'}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight select-none font-display">
          <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-rose-600 bg-clip-text text-transparent">
            SnapQR Memories
          </span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Captured on {photoData ? new Date(photoData.createdAt).toLocaleDateString() : 'Today'}
        </p>
      </div>

      {/* Main Strip Image Display Container */}
      <div className="flex-1 flex justify-center items-center my-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-[280px] sm:w-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-white/10 group"
        >
          {photoData && (
            <img
              src={photoData.imageUrl}
              alt="My Event Photo Strip"
              className="w-full h-auto object-contain select-none pointer-events-none"
            />
          )}
        </motion.div>
      </div>

      {/* Mobile-First Interactive Sharing Actions */}
      <div className="max-w-sm mx-auto w-full space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            id="mobile-download-btn"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 btn-primary text-white text-sm font-bold rounded-2xl shadow-lg transition-all cursor-pointer select-none"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Strip</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            id="mobile-share-btn"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 btn-secondary text-white text-sm font-bold rounded-2xl transition-all cursor-pointer select-none"
          >
            {shareSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-300" />
                <span>Share Post</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white/3 p-4 border border-white/10 rounded-2xl text-center space-y-1 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] text-pink-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Permanent Cloud Storage</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto font-sans">
            This photo strip is hosted permanently! You can scan, share, download, and access your memories at this link whenever you want.
          </p>
        </div>

        {/* Footer Brand Credit */}
        <div className="text-center text-[10px] text-slate-500 pt-4 flex flex-col items-center gap-1">
          <span>SnapQR Photo Booth Systems</span>
          <span className="font-mono text-[9px]">ID: {photoId}</span>
        </div>
      </div>
    </div>
  );
}
