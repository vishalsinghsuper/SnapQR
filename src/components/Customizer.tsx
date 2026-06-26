/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Trash2, Sliders, Type, Smile, Frame, Calendar, RefreshCw, ChevronRight, Layout, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventConfig, PhotoStripSettings, Sticker } from '../types';

interface CustomizerProps {
  photos: string[];
  config: EventConfig;
  onGenerate: (dataUrl: string, settings: PhotoStripSettings) => void;
  onBack: () => void;
}

// Predefined frames/themes centered on Pink & Cherry Red
const STYLING_THEMES = [
  { id: 'cherry-blossom', name: 'Cherry Blossom 🌸', frameColor: '#fff1f2', textColor: '#be123c' },
  { id: 'cherry-red', name: 'Cherry Red 🍒', frameColor: '#9f1239', textColor: '#ffe4e6' },
  { id: 'cotton-candy', name: 'Cotton Candy 🍬', frameColor: '#fdf2f8', textColor: '#db2777' },
  { id: 'classic-dark', name: 'Classic Dark 🖤', frameColor: '#121212', textColor: '#ffffff' },
  { id: 'minimal-white', name: 'Minimal White 🤍', frameColor: '#fafafa', textColor: '#171717' },
  { id: 'cyber-neon', name: 'Cyber Pink ⚡', frameColor: '#0c0014', textColor: '#ff007f' },
];

// Predefined layout options
const LAYOUTS = [
  { id: '4-cut-vertical', name: '4-Cut Vertical Filmstrip', cols: 1, rows: 4, width: 720, height: 3000, desc: 'Classic stacked filmstrip' },
  { id: '3-cut-vertical', name: '3-Cut Vertical Filmstrip', cols: 1, rows: 3, width: 720, height: 2320, desc: 'Elegant shorter strip' },
  { id: '2x2-grid', name: '2x2 Retro Grid Block', cols: 2, rows: 2, width: 1000, height: 1150, desc: 'Vintage square block' },
  { id: '1-cut-single', name: 'Single Hero Frame', cols: 1, rows: 1, width: 800, height: 950, desc: 'One large showcase photo' },
];

// Predefined typography fonts
const FONTS = [
  { id: 'sans', name: 'Modern Sans', css: '"Inter", sans-serif' },
  { id: 'display', name: 'Retro Display', css: '"Space Grotesk", sans-serif' },
  { id: 'serif', name: 'Elegant Serif', css: '"Playfair Display", Georgia, serif' },
  { id: 'hand', name: 'Cute Cursive', css: '"Pacifico", cursive' },
  { id: 'mono', name: 'Retro Mono', css: '"JetBrains Mono", monospace' },
];

// Predefined filters mapping
const FILTERS = [
  { id: 'none', name: 'No Filter', css: '' },
  { id: 'grayscale', name: 'Monochrome', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Vintage Sepia', css: 'sepia(80%)' },
  { id: 'warm', name: 'Warm Sun', css: 'sepia(20%) saturate(140%) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool Slate', css: 'contrast(110%) brightness(95%) saturate(80%) hue-rotate(15deg)' },
  { id: 'vintage', name: 'Retro Fade', css: 'contrast(90%) brightness(105%) saturate(110%) sepia(15%)' },
];

const STICKER_CATEGORIES = [
  {
    name: 'Festival 🎉',
    items: ['🎉', '✨', '🎸', '🎡', '🌟', '🎪', '🔥', '🎟️', '🎈', '🍾']
  },
  {
    name: 'Love ❤️',
    items: ['❤️', '💖', '🥰', '🌸', '🍭', '🎀', '🧸', '🦄', '💐', '🍓']
  },
  {
    name: 'Props 🕶️',
    items: ['🕶️', '👑', '🎩', '🍕', '🍻', '👽', '✌️', '🤠', '💄', '💅']
  }
];

export default function Customizer({ photos, config, onGenerate, onBack }: CustomizerProps) {
  const [layoutId, setLayoutId] = useState<string>('4-cut-vertical');
  const [frameColor, setFrameColor] = useState<string>('#fff1f2');
  const [textColor, setTextColor] = useState<string>('#be123c');
  const [themeId, setThemeId] = useState<string>('cherry-blossom');
  const [filterId, setFilterId] = useState<string>('none');
  const [fontId, setFontId] = useState<string>('sans');
  const [customText, setCustomText] = useState<string>('Open Day GGITS 2026');
  const [showDateTime, setShowDateTime] = useState<boolean>(true);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync custom signature with actual event details if needed
  useEffect(() => {
    // Keep theme matched to Cherry Blossom initially
    applyTheme(STYLING_THEMES[0]);
  }, []);

  // Apply predefined theme
  const applyTheme = (theme: typeof STYLING_THEMES[0]) => {
    setThemeId(theme.id);
    setFrameColor(theme.frameColor);
    setTextColor(theme.textColor);
  };

  // Add emoji sticker
  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'emoji',
      content: emoji,
      x: 50, // Center X
      y: 10 + Math.random() * 60, // Sane starting Y
      scale: 1.2,
      rotation: 0,
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const activeSticker = stickers.find(s => s.id === selectedStickerId);

  // Generate high resolution photo strip
  const handleGenerateStrip = async () => {
    setIsGenerating(true);
    // Let the loader render first
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const canvas = document.createElement('canvas');
      
      // Determine layout specifics
      const activeLayout = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
      const W = activeLayout.width;
      const H = activeLayout.height;
      canvas.width = W;
      canvas.height = H;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not acquire 2D context");

      // 1. Draw Frame Background
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, W, H);

      // Filter settings
      const filterObj = FILTERS.find(f => f.id === filterId);
      const canvasFilter = filterObj?.css || 'none';

      // 2. Load and Draw Photos (Async drawing)
      if (layoutId === '4-cut-vertical') {
        const margin = 60;
        const topPadding = 60;
        const gap = 40;
        const photoSize = 600;
        for (let i = 0; i < 4; i++) {
          const photoY = topPadding + i * (photoSize + gap);
          const img = new Image();
          img.src = photos[i] || photos[0];
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          ctx.save();
          ctx.filter = canvasFilter;
          ctx.drawImage(img, margin, photoY, photoSize, photoSize);
          ctx.restore();
        }
      } else if (layoutId === '3-cut-vertical') {
        const margin = 60;
        const topPadding = 60;
        const gap = 40;
        const photoSize = 600;
        for (let i = 0; i < 3; i++) {
          const photoY = topPadding + i * (photoSize + gap);
          const img = new Image();
          img.src = photos[i] || photos[0];
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          ctx.save();
          ctx.filter = canvasFilter;
          ctx.drawImage(img, margin, photoY, photoSize, photoSize);
          ctx.restore();
        }
      } else if (layoutId === '2x2-grid') {
        const margin = 60;
        const topPadding = 60;
        const gap = 40;
        const photoSize = 420;
        const coords = [
          { x: margin, y: topPadding },
          { x: margin + photoSize + gap, y: topPadding },
          { x: margin, y: topPadding + photoSize + gap },
          { x: margin + photoSize + gap, y: topPadding + photoSize + gap }
        ];
        for (let i = 0; i < 4; i++) {
          const img = new Image();
          img.src = photos[i] || photos[0];
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          ctx.save();
          ctx.filter = canvasFilter;
          ctx.drawImage(img, coords[i].x, coords[i].y, photoSize, photoSize);
          ctx.restore();
        }
      } else if (layoutId === '1-cut-single') {
        const margin = 80;
        const topPadding = 80;
        const photoSize = 640;
        const img = new Image();
        img.src = photos[0] || photos[0];
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        ctx.save();
        ctx.filter = canvasFilter;
        ctx.drawImage(img, margin, topPadding, photoSize, photoSize);
        ctx.restore();
      }

      // 3. Draw Stickers
      stickers.forEach(sticker => {
        ctx.save();
        // Map percentage coordinate space (0-100) to actual canvas dimensions
        const absoluteX = (sticker.x / 100) * W;
        const absoluteY = (sticker.y / 100) * H;
        const fontSize = Math.round(54 * sticker.scale);

        ctx.translate(absoluteX, absoluteY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.font = `${fontSize}px "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.content, 0, 0);
        ctx.restore();
      });

      // 4. Draw Footer Text & Signatures (Determine starting position)
      let footerStartY = 0;
      if (layoutId === '4-cut-vertical') {
        footerStartY = 60 + 4 * (600 + 40) + 40; // 2660
      } else if (layoutId === '3-cut-vertical') {
        footerStartY = 60 + 3 * (600 + 40) + 40; // 1980
      } else if (layoutId === '2x2-grid') {
        footerStartY = 60 + 2 * (420 + 40) + 40; // 1020
      } else if (layoutId === '1-cut-single') {
        footerStartY = 80 + 640 + 40; // 760
      }

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';

      // Custom Font selection
      const activeFont = FONTS.find(f => f.id === fontId) || FONTS[0];

      // Custom signature
      if (customText.trim()) {
        ctx.font = `bold 44px ${activeFont.css}`;
        ctx.fillText(customText, W / 2, footerStartY);
      }

      // Event Name (Only draw if it doesn't match customText to avoid repetition)
      let eventNameY = footerStartY;
      const isDuplicate = config.eventName && config.eventName.trim() === customText.trim();
      if (config.eventName && !isDuplicate) {
        ctx.font = `600 32px ${activeFont.css}`;
        eventNameY = footerStartY + 80;
        ctx.fillText(config.eventName, W / 2, eventNameY);
      }

      // Watermark & Date
      ctx.font = `500 24px ${activeFont.css}`;
      ctx.fillStyle = textColor + 'aa'; // Semi-transparent
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const watermarkText = config.customWatermark || 'Open Day GGITS 2026 📸';
      const watermarkY = eventNameY + (config.eventName && !isDuplicate ? 70 : 80);
      if (showDateTime) {
        ctx.fillText(`${dateStr}  |  ${watermarkText}`, W / 2, watermarkY);
      } else {
        ctx.fillText(watermarkText, W / 2, watermarkY);
      }

      const compositeDataUrl = canvas.toDataURL('image/png');
      
      onGenerate(compositeDataUrl, {
        frameColor,
        themeId,
        stickers,
        customText,
        textColor,
        showDateTime,
        filterId,
        layoutId,
        fontId
      });
    } catch (err) {
      console.error("Failed to compile photo strip:", err);
      alert("Something went wrong while compiling the photo strip. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to resolve font CSS class for preview
  const getPreviewFontFamily = () => {
    const activeFont = FONTS.find(f => f.id === fontId);
    return activeFont ? activeFont.css : 'sans-serif';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Dynamic Loader */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 text-center p-6"
          >
            <RefreshCw className="w-12 h-12 text-pink-500 animate-spin" />
            <h3 className="text-2xl font-bold text-white">Generating Your Photo Strip</h3>
            <p className="text-neutral-400 text-sm max-w-sm">
              We are stitching your photos, applying vintage filters, and rendering high-quality decorative sticker layers...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Real-Time Strip Preview Layout (4/12 width) */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
          <h3 className="text-sm font-extrabold text-neutral-400 uppercase tracking-widest mb-4">
            Live Strip Preview
          </h3>

          {/* Scaled Responsive Photo Strip Container */}
          <div
            ref={previewRef}
            id="strip-preview"
            style={{ backgroundColor: frameColor }}
            className="w-[280px] sm:w-[320px] shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 relative select-none overflow-hidden transition-all border border-neutral-800"
          >
            {/* If vertical filmstrip */}
            {(layoutId === '4-cut-vertical' || layoutId === '3-cut-vertical') && (
              <div className="flex flex-col gap-2.5">
                {photos.slice(0, layoutId === '4-cut-vertical' ? 4 : 3).map((src, i) => (
                  <div
                    key={i}
                    className="w-full aspect-square bg-zinc-900 rounded overflow-hidden relative"
                  >
                    <img
                      src={src}
                      alt={`Shot ${i + 1}`}
                      style={{ filter: FILTERS.find(f => f.id === filterId)?.css }}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* If 2x2 grid */}
            {layoutId === '2x2-grid' && (
              <div className="grid grid-cols-2 gap-2.5">
                {photos.slice(0, 4).map((src, i) => (
                  <div
                    key={i}
                    className="w-full aspect-square bg-zinc-900 rounded overflow-hidden relative"
                  >
                    <img
                      src={src}
                      alt={`Shot ${i + 1}`}
                      style={{ filter: FILTERS.find(f => f.id === filterId)?.css }}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* If single frame */}
            {layoutId === '1-cut-single' && (
              <div className="w-full aspect-square bg-zinc-900 rounded overflow-hidden relative">
                <img
                  src={photos[0]}
                  alt="Shot 1"
                  style={{ filter: FILTERS.find(f => f.id === filterId)?.css }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
            )}

            {/* Sticker Layer (Absolute coords on preview) */}
            <div className="absolute inset-0 pointer-events-none">
              {stickers.map(sticker => (
                <div
                  key={sticker.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStickerId(sticker.id);
                  }}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                  }}
                  className={`absolute pointer-events-auto text-4xl cursor-pointer select-none ${
                    selectedStickerId === sticker.id
                      ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-neutral-900 rounded bg-white/20 p-0.5'
                      : ''
                  }`}
                >
                  {sticker.content}
                </div>
              ))}
            </div>

            {/* Footer Segment */}
            <div className="mt-4 flex flex-col items-center justify-center text-center gap-1.5 pb-2">
              <input
                type="text"
                value={customText}
                maxLength={32}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Click to edit text..."
                style={{ color: textColor, fontFamily: getPreviewFontFamily() }}
                className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-pink-500/40 text-center text-sm font-bold tracking-tight px-1 focus:outline-none transition-all placeholder:text-neutral-500"
              />
              {config.eventName && config.eventName.trim() !== customText.trim() && (
                <h4
                  style={{ color: textColor, fontFamily: getPreviewFontFamily() }}
                  className="text-[10px] font-bold uppercase tracking-widest leading-none mt-1 opacity-90"
                >
                  {config.eventName}
                </h4>
              )}
              {showDateTime && (
                <p
                  style={{ color: textColor, fontFamily: getPreviewFontFamily() }}
                  className="text-[8px] font-medium font-mono uppercase tracking-wider opacity-60 leading-none"
                >
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-neutral-500 mt-3 text-center max-w-xs leading-relaxed">
            💡 <strong>Direct Editing:</strong> You can click and type directly on the footnote text in the preview above! Click on any added sticker to adjust its scale, rotation, or position.
          </p>
        </div>

        {/* Right Side: Tabbed Interactive Control Panels (8/12 width) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
          
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Sparkles className="text-pink-400 w-6 h-6" />
              Customize Photo Strip
            </h2>
            <p className="text-slate-300 text-xs mb-6">
              Polish your captured memories exactly like a retro photobooth. Change layout templates, frames, film filters, and fonts!
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Layout Selection */}
              <div className="space-y-4 lg:col-span-2 border-b border-white/5 pb-6">
                <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layout className="w-4 h-4 text-pink-400" />
                  1. Choose Layout Template
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LAYOUTS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setLayoutId(layout.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        layoutId === layout.id
                          ? 'bg-gradient-to-tr from-pink-500/20 to-rose-600/20 border-pink-500 text-white shadow-lg'
                          : 'bg-white/3 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg mb-1">
                        {layout.id === '4-cut-vertical' ? '🎞️' : layout.id === '3-cut-vertical' ? '🎞️' : layout.id === '2x2-grid' ? '⊞' : '🖼️'}
                      </span>
                      <span className="font-bold text-center text-[11px] leading-tight">{layout.name.split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-500 text-center mt-1 scale-90">{layout.cols}x{layout.rows}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box 2: Frames & Themes */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Frame className="w-4 h-4 text-pink-400" />
                  2. Frames & Backdrops
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {STYLING_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                        themeId === theme.id
                          ? 'bg-white/10 text-white border-pink-400'
                          : 'bg-white/3 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-4.5 h-4.5 rounded-full border border-white/10 block shrink-0"
                        style={{ backgroundColor: theme.frameColor }}
                      />
                      <span className="truncate text-[11px]">{theme.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Color Pickers */}
                <div className="flex gap-4 pt-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Custom Frame
                    </label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <input
                        type="color"
                        value={frameColor}
                        onChange={(e) => {
                          setThemeId('custom');
                          setFrameColor(e.target.value);
                        }}
                        className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-medium text-slate-300">{frameColor.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Custom Text
                    </label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => {
                          setThemeId('custom');
                          setTextColor(e.target.value);
                        }}
                        className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-medium text-slate-300">{textColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Retro Filters & Fonts */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-pink-400" />
                  3. Filters & Styling
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterId(filter.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                        filterId === filter.id
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600 border-pink-400 text-white shadow-md'
                          : 'bg-white/3 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>

                {/* Footnote typography selector */}
                <div className="pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-pink-400" /> Font Typography
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(font => (
                      <button
                        key={font.id}
                        onClick={() => setFontId(font.id)}
                        className={`px-2 py-2 rounded-lg border text-[11px] font-semibold text-center transition cursor-pointer ${
                          fontId === font.id
                            ? 'bg-white/10 border-pink-500 text-white'
                            : 'bg-white/3 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                        style={{ fontFamily: font.css }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 4: Footer Text input */}
              <div className="space-y-1.5 lg:col-span-2 border-t border-white/5 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-pink-400" />
                  Footnote Signature (Bottom Text)
                </label>
                <input
                  type="text"
                  value={customText}
                  maxLength={32}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter short custom text..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-sm rounded-xl focus:outline-none focus:border-pink-400 text-white placeholder-slate-600 transition"
                />
                
                <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                  <input
                    type="checkbox"
                    checked={showDateTime}
                    onChange={(e) => setShowDateTime(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-pink-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Include Date & Time Stamp
                  </span>
                </label>
              </div>

            </div>

            {/* Sticker Pack Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                <Smile className="w-4 h-4 text-pink-400" />
                Emoji Decorative Sticker Packs
              </h3>

              <div className="flex flex-col gap-4">
                {STICKER_CATEGORIES.map(category => (
                  <div key={category.name} className="flex flex-col gap-2 bg-white/3 border border-white/5 rounded-xl p-3">
                    <span className="text-xs font-bold text-slate-400">{category.name}</span>
                    <div className="flex flex-wrap gap-2.5">
                      {category.items.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addSticker(emoji)}
                          className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-2xl hover:scale-110 active:scale-95 hover:bg-white/10 hover:border-pink-400 transition-all cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjust Sticker Layer Controller */}
              <AnimatePresence>
                {selectedStickerId && activeSticker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3 pb-1 border-b border-white/5">
                      <span className="text-xs font-extrabold text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
                        Selected Sticker: <span className="text-lg">{activeSticker.content}</span>
                      </span>
                      <button
                        onClick={() => deleteSticker(activeSticker.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded border border-red-500/20 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* X and Y coordinates */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Horizontal (X) Position</span>
                            <span>{Math.round(activeSticker.x)}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            step="0.5"
                            value={activeSticker.x}
                            onChange={(e) => updateSticker(activeSticker.id, { x: parseFloat(e.target.value) })}
                            className="w-full accent-pink-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Vertical (Y) Position</span>
                            <span>{Math.round(activeSticker.y)}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="98"
                            step="0.5"
                            value={activeSticker.y}
                            onChange={(e) => updateSticker(activeSticker.id, { y: parseFloat(e.target.value) })}
                            className="w-full accent-pink-500"
                          />
                        </div>
                      </div>

                      {/* Scale and Rotation */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Sticker Scale</span>
                            <span>{activeSticker.scale.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={activeSticker.scale}
                            onChange={(e) => updateSticker(activeSticker.id, { scale: parseFloat(e.target.value) })}
                            className="w-full accent-pink-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Rotation Degrees</span>
                            <span>{activeSticker.rotation}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={activeSticker.rotation}
                            onChange={(e) => updateSticker(activeSticker.id, { rotation: parseInt(e.target.value) })}
                            className="w-full accent-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Core Customizer Actions Footer */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/3 p-4 border border-white/10 rounded-2xl">
            <button
              onClick={onBack}
              id="back-shoot-btn"
              className="w-full sm:w-auto px-6 py-3 btn-secondary text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer text-center"
            >
              Back to Shoot
            </button>

            <button
              onClick={handleGenerateStrip}
              id="compile-strip-btn"
              className="w-full sm:w-auto flex items-center justify-center gap-1 px-8 py-3 btn-primary text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer animate-pulse"
            >
              <span>Compile Photo Strip</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
