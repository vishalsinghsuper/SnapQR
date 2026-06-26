/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Save, RotateCcw, Image, Heart, ShieldAlert, Sparkles, Sliders, ToggleLeft, ToggleRight, X, Download, Eye, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { EventConfig, AnalyticsData } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  config: EventConfig;
  analytics: AnalyticsData;
  onUpdateConfig: (newConfig: EventConfig) => void;
  onRefreshData: () => Promise<void>;
}

export default function AdminPanel({ onClose, config, analytics, onUpdateConfig, onRefreshData }: AdminPanelProps) {
  const [eventName, setEventName] = useState<string>(config.eventName);
  const [eventDate, setEventDate] = useState<string>(config.eventDate);
  const [customWatermark, setCustomWatermark] = useState<string>(config.customWatermark);
  const [logoBase64, setLogoBase64] = useState<string>(config.eventLogo || '');
  const [enabledFrames, setEnabledFrames] = useState<boolean>(config.enabledCustomizations.frames);
  const [enabledStickers, setEnabledStickers] = useState<boolean>(config.enabledCustomizations.stickers);
  const [enabledText, setEnabledText] = useState<boolean>(config.enabledCustomizations.text);
  const [enabledFilters, setEnabledFilters] = useState<boolean>(config.enabledCustomizations.filters);

  const [activeTab, setActiveTab] = useState<'config' | 'analytics'>('config');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    onRefreshData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updated: EventConfig = {
      eventName,
      eventDate,
      eventLogo: logoBase64,
      customWatermark,
      enabledCustomizations: {
        frames: enabledFrames,
        stickers: enabledStickers,
        text: enabledText,
        filters: enabledFilters
      }
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        onUpdateConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAnalytics = async () => {
    if (!window.confirm("Are you absolutely sure you want to reset all analytics tracking records? This cannot be undone.")) {
      return;
    }
    
    setIsResetting(true);
    try {
      const res = await fetch('/api/config/reset-analytics', { method: 'POST' });
      if (res.ok) {
        await onRefreshData();
        alert("Analytics metrics successfully cleared!");
      }
    } catch (err) {
      console.error("Failed to reset analytics:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Convert custom logo to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Safe maximum calculations for frames/themes usage
  const getTopItem = (usageObj: Record<string, number>, fallback: string): string => {
    const entries = Object.entries(usageObj);
    if (entries.length === 0) return fallback;
    return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0];
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight font-display">SnapQR Event Configuration</h2>
          </div>
          <button
            onClick={onClose}
            id="close-admin-btn"
            className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-white/5 bg-white/[0.02] flex gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Settings & Permissions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Live Analytics Dashboard
          </button>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Event Branding Segment */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Event Details & Branding
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Event Title Name</label>
                    <input
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Strip Watermark Text Signature</label>
                    <input
                      type="text"
                      required
                      value={customWatermark}
                      onChange={(e) => setCustomWatermark(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Custom Event Logo (Optional)</label>
                    <div className="flex items-center gap-3">
                      <label className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer select-none">
                        <span>Browse File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logoBase64 ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logoBase64}
                            alt="Logo preview"
                            className="w-10 h-10 object-contain rounded bg-slate-950/60 p-1 border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoBase64('')}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">No logo uploaded yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customization Permissions Toggles */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Enable / Disable Customization Modules
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Frames toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">Frame/Theme Customization</h4>
                      <p className="text-slate-400 text-[10px]">Allow guests to select frame templates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnabledFrames(!enabledFrames)}
                      className="cursor-pointer"
                    >
                      {enabledFrames ? (
                        <ToggleRight className="w-8 h-8 text-cyan-400 fill-cyan-400/10" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Stickers toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">Emoji Stickers</h4>
                      <p className="text-slate-400 text-[10px]">Allow guests to decorate with props.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnabledStickers(!enabledStickers)}
                      className="cursor-pointer"
                    >
                      {enabledStickers ? (
                        <ToggleRight className="w-8 h-8 text-cyan-400 fill-cyan-400/10" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Text toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">Custom Footnote text</h4>
                      <p className="text-slate-400 text-[10px]">Allow guests to write signatures on strips.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnabledText(!enabledText)}
                      className="cursor-pointer"
                    >
                      {enabledText ? (
                        <ToggleRight className="w-8 h-8 text-cyan-400 fill-cyan-400/10" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Filters toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">Retro Film Filters</h4>
                      <p className="text-slate-400 text-[10px]">Allow guests to apply aesthetic overlays.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnabledFilters(!enabledFilters)}
                      className="cursor-pointer"
                    >
                      {enabledFilters ? (
                        <ToggleRight className="w-8 h-8 text-cyan-400 fill-cyan-400/10" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold self-center mr-2">
                    ✓ Configuration saved successfully!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  id="save-config-btn"
                  className="flex items-center gap-1.5 px-6 py-2.5 btn-primary text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Config Options"}
                </button>
              </div>

            </form>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Primary Bento Cards stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Photos Captured</span>
                    <Image className="w-4 h-4 text-pink-400" />
                  </div>
                  <h4 className="text-3xl font-black text-white">{analytics.totalPhotosTaken || 0}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Total physical photo strips compiled</p>
                </div>

                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">QR Code Scans</span>
                    <QrCode className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="text-3xl font-black text-white">{analytics.totalQrScans || 0}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Total unique mobile QR scans</p>
                </div>

                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Downloads</span>
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-3xl font-black text-white">{analytics.totalDownloads || 0}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Direct strip save counts</p>
                </div>
              </div>

              {/* Popular layouts usage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Popular Themes / Frames</h4>
                  
                  {Object.keys(analytics.frameUsage || {}).length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-bold capitalize">
                          🥇 Top: {getTopItem(analytics.frameUsage, 'classic')}
                        </span>
                        <span className="text-xs text-cyan-400 font-mono font-semibold">
                          {analytics.frameUsage[getTopItem(analytics.frameUsage, 'classic')]} selections
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 pt-2">
                        {Object.entries(analytics.frameUsage).map(([name, count]) => (
                          <div key={name} className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="capitalize font-medium">{name} Theme</span>
                            <span className="font-mono">{count} times</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No layout style sessions processed yet</p>
                  )}
                </div>

                <div className="p-5 bg-white/3 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Conversion Metrics</h4>
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span>QR Scan rate:</span>
                      <span className="font-bold text-white font-mono">
                        {analytics.totalPhotosTaken > 0 
                          ? `${Math.round((analytics.totalQrScans / analytics.totalPhotosTaken) * 100)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span>Download conversion:</span>
                      <span className="font-bold text-white font-mono">
                        {analytics.totalQrScans > 0 
                          ? `${Math.round((analytics.totalDownloads / analytics.totalQrScans) * 100)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Warning / Reset */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Permanent Action Guard</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetAnalytics}
                      disabled={isResetting}
                      id="reset-analytics-btn"
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {isResetting ? "Clearing..." : "Reset All Metrics"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            id="admin-close-btn"
            className="px-5 py-2.5 btn-secondary text-white rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
