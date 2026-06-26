/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, QrCode, Download, Share2, ArrowRight, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { PhotoStripSettings } from '../types';

interface FinalPreviewProps {
  stripDataUrl: string;
  settings: PhotoStripSettings;
  onReset: () => void;
  onBackToEdit: () => void;
}

export default function FinalPreview({ stripDataUrl, settings, onReset, onBackToEdit }: FinalPreviewProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [photoId, setPhotoId] = useState<string>('');

  // Fire celebratory confetti burst
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleUploadAndShare = async () => {
    setUploadState('uploading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: stripDataUrl,
          frameId: settings.themeId,
          themeId: settings.themeId
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with error during upload");
      }

      const data = await response.json();
      if (data.success) {
        // Construct a highly robust public share URL using the browser's own location
        let currentOrigin = window.location.origin;
        if (currentOrigin.includes('ais-dev-')) {
          currentOrigin = currentOrigin.replace('ais-dev-', 'ais-pre-');
        }
        const clientShareUrl = `${currentOrigin}/share/${data.id}`;
        
        setShareUrl(clientShareUrl);
        setPhotoId(data.id);
        
        // Generate QR code representation for the public share URL
        const qrUrl = await QRCode.toDataURL(clientShareUrl, {
          width: 350,
          margin: 1.5,
          color: {
            dark: '#1e1b4b', // Indigo dark
            light: '#ffffff'
          }
        });

        setQrCodeDataUrl(qrUrl);
        setUploadState('success');
        triggerConfetti();
      } else {
        throw new Error(data.error || "Failed to parse upload credentials");
      }
    } catch (err: any) {
      console.error("Failed to share photo strip:", err);
      setUploadState('error');
      setErrorMessage(err.message || "Failed to reach the sharing network server. Please check your network and try again.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Upper Progress */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <CheckCircle className="text-emerald-500 w-7 h-7" />
          Review & Share Strip
        </h2>
        <p className="text-neutral-400 text-sm mt-1">
          {uploadState === 'success' 
            ? "Your photo strip is live! Scan the QR code to fetch it on your phone."
            : "Review your completed photo strip. If you like it, tap 'Confirm & Get QR' below."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left column: Strip Preview Panel (4/12 width) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-[280px] sm:w-[300px] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
            <img
              src={stripDataUrl}
              alt="Compiled high-res photo strip"
              className="w-full h-auto object-cover"
            />
            {uploadState === 'success' && (
              <span className="absolute top-3 right-3 bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow border border-emerald-400 animate-bounce">
                LIVE ON CLOUD
              </span>
            )}
          </div>
        </div>

        {/* Right column: Upload and Share Logic Board (7/12 width) */}
        <div className="md:col-span-7 flex flex-col justify-center">
          
          {uploadState === 'idle' && (
            <div className="glass-card border border-white/10 rounded-2xl p-6 text-center space-y-6 flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <QrCode className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Generate Shareable QR Code</h3>
                <p className="text-slate-300 text-xs max-w-sm mx-auto leading-relaxed">
                  Ready to display? Click the button below to upload your photo strip to our secure temporary cloud storage. A unique download QR code will generate instantly!
                </p>
              </div>

              <div className="flex gap-4 w-full max-w-sm justify-center">
                <button
                  onClick={onBackToEdit}
                  id="re-edit-btn"
                  className="flex-1 px-4 py-3 btn-secondary text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Edit Strip Again
                </button>
                <button
                  onClick={handleUploadAndShare}
                  id="confirm-share-btn"
                  className="flex-1 px-4 py-3 btn-primary text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Confirm & Get QR
                </button>
              </div>
            </div>
          )}

          {uploadState === 'uploading' && (
            <div className="glass-card border border-white/10 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
              <h3 className="text-xl font-bold text-white">Uploading Your Memories</h3>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Stitching composite frame buffers, packaging high-res PNG vectors, and syncing with SnapQR's event cloud databases...
              </p>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="glass-card border border-white/10 rounded-2xl p-6 text-center space-y-6 flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Upload Interrupted</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="flex gap-4 w-full max-w-sm justify-center">
                <button
                  onClick={onBackToEdit}
                  id="error-back-btn"
                  className="flex-1 px-4 py-3 btn-secondary text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Edit Again
                </button>
                <button
                  onClick={handleUploadAndShare}
                  id="retry-upload-btn"
                  className="flex-1 px-4 py-3 btn-primary text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Retry Upload
                </button>
              </div>
            </div>
          )}

          {uploadState === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="glass-card border border-white/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center"
            >
              <div className="flex flex-col lg:flex-row gap-6 items-center w-full justify-around">
                
                {/* QR Code Container card */}
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white p-4 rounded-2xl shadow-xl shrink-0 w-[220px] h-[220px] flex items-center justify-center select-none">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Share QR Code Link"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 animate-pulse text-[10px] font-mono">
                        Generating...
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 mt-1">
                    🔓 Public Access QR
                  </span>
                </div>

                {/* Shared Instructions panel */}
                <div className="text-left space-y-4 max-w-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    🎉 Upload Complete
                  </span>
                  
                  <h3 className="text-xl font-black text-white leading-tight">
                    Scan to Download!
                  </h3>
                  
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    Point your smartphone camera at the QR code on the screen to instantly preview, download, and share your customized photo strip!
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-[10px] font-mono text-slate-300 truncate select-all flex-1">
                      {shareUrl}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      id="copy-url-btn"
                      className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded transition cursor-pointer"
                      title="Copy sharing link"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[10px] text-pink-400 font-bold tracking-tight">
                    ✨ Notice: Saved permanently on SnapQR Cloud! Scan or copy URL anytime.
                  </p>
                </div>

              </div>

              {/* Start a new booth capture action */}
              <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
                <button
                  onClick={triggerConfetti}
                  id="celebrate-btn"
                  className="w-full sm:w-auto px-4 py-2 btn-secondary text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  🎉 Celeb Confetti!
                </button>

                <button
                  onClick={onReset}
                  id="new-session-btn"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 btn-primary text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  <span>Start New Session</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
