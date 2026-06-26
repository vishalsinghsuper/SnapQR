/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, QrCode, Sparkles, Settings, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { EventConfig } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
  onOpenAdmin: () => void;
  config: EventConfig;
}

export default function WelcomeScreen({ onStart, onOpenAdmin, config }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-8 relative">
      {/* Admin Quick Link */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onOpenAdmin}
          id="admin-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full text-xs font-medium transition-all border border-white/10 backdrop-blur-md cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-pink-400" />
          <span>Config Panel</span>
        </button>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl w-full"
      >
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{config.eventName || "Campus Photo Booth"}</span>
        </div>

        {/* Brand Typography */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 select-none leading-none">
          <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-rose-600 bg-clip-text text-transparent">
            SnapQR
          </span>
        </h1>
        
        <p className="text-slate-300 text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed font-sans">
          The ultimate digital photo booth experience. Strike a pose, customize your vertical strip, and scan to take it home instantly!
        </p>

        {/* Interactive Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 text-left">
          <div className="p-5 rounded-2xl glass-card transition-all hover:border-white/15">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1.5">1. Take 4 Shots</h3>
            <p className="text-slate-400 text-xs leading-normal">
              Live interactive camera with customized count-down timer flashes.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card transition-all hover:border-white/15">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1.5">2. Custom Style</h3>
            <p className="text-slate-400 text-xs leading-normal">
              Choose frame colors, retro filters, stickers, custom signatures, and stamps.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card transition-all hover:border-white/15">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1.5">3. Scan & Share</h3>
            <p className="text-slate-400 text-xs leading-normal">
              Instantly download high-quality strips on your mobile via permanent secure QR code.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            id="start-btn"
            className="group relative px-10 py-4.5 btn-primary text-white font-bold text-lg rounded-2xl transition-all transform hover:-translate-y-1 cursor-pointer overflow-hidden active:translate-y-0"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="flex items-center gap-2">
              Start Photo Booth
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </span>
          </button>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
            <Heart className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>Perfect for exhibitions, festivals, and house parties</span>
          </div>
        </div>
      </motion.div>

      {/* Decorative Mockup Floating Elements */}
      <div className="absolute left-[5%] bottom-[10%] hidden lg:block opacity-25 pointer-events-none">
        <div className="w-24 h-48 bg-white/5 border border-white/10 rounded-2xl shadow-2xl rotate-12 flex flex-col p-1 gap-1 backdrop-blur-sm">
          <div className="bg-slate-800/60 flex-1 rounded-lg" />
          <div className="bg-slate-800/60 flex-1 rounded-lg" />
          <div className="bg-slate-800/60 flex-1 rounded-lg" />
          <div className="bg-slate-800/60 flex-1 rounded-lg" />
          <div className="h-6 flex items-center justify-center text-[7px] text-white font-bold font-mono">SnapQR</div>
        </div>
      </div>

      <div className="absolute right-[5%] bottom-[10%] hidden lg:block opacity-25 pointer-events-none">
        <div className="w-24 h-48 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl shadow-2xl -rotate-12 flex flex-col p-1 gap-1 backdrop-blur-sm">
          <div className="bg-slate-800/40 flex-1 rounded-lg" />
          <div className="bg-slate-800/40 flex-1 rounded-lg" />
          <div className="bg-slate-800/40 flex-1 rounded-lg" />
          <div className="bg-slate-800/40 flex-1 rounded-lg" />
          <div className="h-6 flex items-center justify-center text-[7px] text-cyan-400 font-bold font-mono">FESTIVAL</div>
        </div>
      </div>
    </div>
  );
}
