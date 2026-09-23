import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Type,
  Smile,
  Layers,
  LayoutGrid,
  SlidersHorizontal,
  Save,
  ShoppingCart,
  Check,
  Trash2,
  Move,
  Grid,
  Crop,
  Eye,
  Box,
  Ban,
  Info,
  Monitor,
  Smartphone,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Shapes,
  FlipHorizontal2
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import {
  ACRYLIC_SHAPES,
  AcrylicShapeOption,
  FRAME_OPTIONS,
  ACRYLIC_BORDER_WIDTHS,
  ACRYLIC_BORDER_COLORS
} from '../data/acrylicCustomizerData';
import { optimizeImageFile } from '../utils/imageOptimizer';

// ============================================================================
// 1. CONSTANTS & CANVAS-ONLY DATA DEFINITIONS
// ============================================================================

type ToolbarTab =
  | 'PRODUCTS'
  | 'UPLOAD'
  | 'SELECT SIZE'
  | 'LAYOUTS & DESIGNS'
  | 'SHAPE'
  | 'WRAP & BORDER'
  | 'HARDWARE & FINISH'
  | 'OPTIONS';

const TOOLBAR_ITEMS: { id: ToolbarTab; label: string; icon: React.ElementType }[] = [
  { id: 'PRODUCTS', label: 'PRODUCTS', icon: LayoutGrid },
  { id: 'UPLOAD', label: 'UPLOAD', icon: UploadCloud },
  { id: 'SELECT SIZE', label: 'SELECT SIZE', icon: Grid },
  { id: 'LAYOUTS & DESIGNS', label: 'LAYOUTS & DESIGNS', icon: Layers },
  { id: 'SHAPE', label: 'SHAPE', icon: Shapes },
  { id: 'WRAP & BORDER', label: 'WRAP & BORDER', icon: Crop },
  { id: 'HARDWARE & FINISH', label: 'HARDWARE & FINISH', icon: SlidersHorizontal },
  { id: 'OPTIONS', label: 'OPTIONS', icon: SlidersHorizontal }
];

const SHAPE_FILTER_TABS: { id: 'ALL' | 'BASIC' | 'SPECIAL' | 'DECORATIVE'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'BASIC', label: 'Basic' },
  { id: 'SPECIAL', label: 'Special' },
  { id: 'DECORATIVE', label: 'Decorative' }
];

const CANVAS_BORDER_WIDTH_PRICES: Record<string, number> = { none: 0, thin: 49, medium: 89, thick: 149 };

type ColorFilterType = 'original' | 'sepia' | 'grayscale';
type SizeCategory = 'RECOMMENDED' | 'SQUARE' | 'PANORAMIC' | 'LARGE' | 'SMALL';

interface CanvasProductType {
  id: string;
  name: string;
  startingPrice: number;
  iconType: 'block' | 'panel' | 'wall' | 'print' | 'collage' | 'split' | 'signage';
  panelsCount: number;
  description: string;
  defaultSizeOptionId: string;
}

// Strictly Canvas-only products (no acrylic, wood, or metal)
const CANVAS_PRODUCT_TYPES: CanvasProductType[] = [
  {
    id: 'canvas-classic',
    name: 'Classic Canvas Print',
    startingPrice: 499.0,
    iconType: 'panel',
    panelsCount: 1,
    description: 'Stretched 380 GSM cotton canvas on a solid pine frame.',
    defaultSizeOptionId: 'classic-8x10'
  },
  {
    id: 'canvas-wall-art',
    name: 'Canvas Wall Art',
    startingPrice: 1999.0,
    iconType: 'wall',
    panelsCount: 3,
    description: 'Multi-panel gallery wall display for striking home and office focal points.',
    defaultSizeOptionId: 'wd-3p-12x18-10x8'
  },
  {
    id: 'canvas-split',
    name: 'Canvas Split Panel',
    startingPrice: 1850.0,
    iconType: 'split',
    panelsCount: 3,
    description: 'Panoramic photograph split seamlessly across 3 triptych panels.',
    defaultSizeOptionId: 'split-3p-36x24'
  },
  {
    id: 'canvas-collage',
    name: 'Canvas Collage',
    startingPrice: 850.0,
    iconType: 'collage',
    panelsCount: 4,
    description: 'Multiple cherished photographs printed together on one canvas.',
    defaultSizeOptionId: 'col-4p-12x12'
  },
  {
    id: 'canvas-panoramic',
    name: 'Panoramic Canvas Print',
    startingPrice: 1499.0,
    iconType: 'print',
    panelsCount: 1,
    description: 'Wide-format panoramic canvas for landscapes and skylines.',
    defaultSizeOptionId: 'pano-30x12'
  }
];

interface SizeOption {
  id: string;
  productTypeId: string;
  label: string;
  dimensionsSummary: string;
  price: number;
  categories: SizeCategory[];
  panels: Array<{
    id: string;
    label: string;
    dimension: string;
    widthRatio: number;
    heightRatio: number;
  }>;
}

const SIZE_OPTIONS: SizeOption[] = [
  // Canvas Wall Art (3-Piece Layout)
  {
    id: 'wd-3p-12x18-10x8',
    productTypeId: 'canvas-wall-art',
    label: '3-piece (1) 12"x18", (2) 10"x8"',
    dimensionsSummary: '(1) 12"x18", (2) 10"x8"',
    price: 1999.0,
    categories: ['RECOMMENDED', 'LARGE'],
    panels: [
      { id: 'p0', label: 'Panel 1 (Top)', dimension: '12" × 18"', widthRatio: 18, heightRatio: 12 },
      { id: 'p1', label: 'Panel 2 (Left)', dimension: '10" × 8"', widthRatio: 8, heightRatio: 10 },
      { id: 'p2', label: 'Panel 3 (Right)', dimension: '10" × 8"', widthRatio: 8, heightRatio: 10 }
    ]
  },
  {
    id: 'wd-4p-12x12-8x8',
    productTypeId: 'canvas-wall-art',
    label: '4-piece (2) 12"x12", (2) 8"x8"',
    dimensionsSummary: '(2) 12"x12", (2) 8"x8"',
    price: 2490.0,
    categories: ['RECOMMENDED', 'LARGE'],
    panels: [
      { id: 'p0', label: 'Panel 1', dimension: '12" × 12"', widthRatio: 12, heightRatio: 12 },
      { id: 'p1', label: 'Panel 2', dimension: '12" × 12"', widthRatio: 12, heightRatio: 12 },
      { id: 'p2', label: 'Panel 3', dimension: '8" × 8"', widthRatio: 8, heightRatio: 8 },
      { id: 'p3', label: 'Panel 4', dimension: '8" × 8"', widthRatio: 8, heightRatio: 8 }
    ]
  },
  // Classic Canvas Print
  {
    id: 'classic-8x10',
    productTypeId: 'canvas-classic',
    label: 'Canvas: 8" × 10"',
    dimensionsSummary: '8" × 10"',
    price: 499.0,
    categories: ['RECOMMENDED', 'SMALL'],
    panels: [{ id: 'p0', label: 'Canvas', dimension: '8" × 10"', widthRatio: 8, heightRatio: 10 }]
  },
  {
    id: 'classic-12x18',
    productTypeId: 'canvas-classic',
    label: 'Canvas: 12" × 18"',
    dimensionsSummary: '12" × 18"',
    price: 899.0,
    categories: ['RECOMMENDED'],
    panels: [{ id: 'p0', label: 'Canvas', dimension: '12" × 18"', widthRatio: 18, heightRatio: 12 }]
  },
  {
    id: 'classic-16x24',
    productTypeId: 'canvas-classic',
    label: 'Canvas: 16" × 24"',
    dimensionsSummary: '16" × 24"',
    price: 1499.0,
    categories: ['RECOMMENDED', 'LARGE'],
    panels: [{ id: 'p0', label: 'Canvas', dimension: '16" × 24"', widthRatio: 24, heightRatio: 16 }]
  },
  {
    id: 'classic-24x36',
    productTypeId: 'canvas-classic',
    label: 'Canvas: 24" × 36"',
    dimensionsSummary: '24" × 36"',
    price: 2299.0,
    categories: ['RECOMMENDED', 'LARGE'],
    panels: [{ id: 'p0', label: 'Canvas', dimension: '24" × 36"', widthRatio: 36, heightRatio: 24 }]
  },
  // Panoramic Canvas Print
  {
    id: 'pano-30x12',
    productTypeId: 'canvas-panoramic',
    label: 'Panoramic: 30" × 12"',
    dimensionsSummary: '30" × 12"',
    price: 1499.0,
    categories: ['RECOMMENDED', 'PANORAMIC'],
    panels: [{ id: 'p0', label: 'Panoramic Canvas', dimension: '30" × 12"', widthRatio: 30, heightRatio: 12 }]
  },
  {
    id: 'pano-40x16',
    productTypeId: 'canvas-panoramic',
    label: 'Panoramic: 40" × 16"',
    dimensionsSummary: '40" × 16"',
    price: 1999.0,
    categories: ['RECOMMENDED', 'PANORAMIC', 'LARGE'],
    panels: [{ id: 'p0', label: 'Panoramic Canvas', dimension: '40" × 16"', widthRatio: 40, heightRatio: 16 }]
  },
  // Canvas Split Panel
  {
    id: 'split-3p-36x24',
    productTypeId: 'canvas-split',
    label: '3-Panel Triptych: 36" × 24" total',
    dimensionsSummary: '(3) 12" × 24"',
    price: 1850.0,
    categories: ['RECOMMENDED', 'LARGE'],
    panels: [
      { id: 'p0', label: 'Panel 1 (Left)', dimension: '12" × 24"', widthRatio: 12, heightRatio: 24 },
      { id: 'p1', label: 'Panel 2 (Center)', dimension: '12" × 24"', widthRatio: 12, heightRatio: 24 },
      { id: 'p2', label: 'Panel 3 (Right)', dimension: '12" × 24"', widthRatio: 12, heightRatio: 24 }
    ]
  },
  // Canvas Collage
  {
    id: 'col-2p-16x8',
    productTypeId: 'canvas-collage',
    label: '2-Photo Grid: 16" × 8"',
    dimensionsSummary: '2 Photos (8" × 8" ea)',
    price: 549.0,
    categories: ['RECOMMENDED'],
    panels: [
      { id: 'p0', label: 'Slot 1', dimension: '8" × 8"', widthRatio: 8, heightRatio: 8 },
      { id: 'p1', label: 'Slot 2', dimension: '8" × 8"', widthRatio: 8, heightRatio: 8 }
    ]
  },
  {
    id: 'col-3p-18x12',
    productTypeId: 'canvas-collage',
    label: '3-Photo Grid: 18" × 12"',
    dimensionsSummary: '3 Photos (6" × 12" ea)',
    price: 699.0,
    categories: ['RECOMMENDED'],
    panels: [
      { id: 'p0', label: 'Slot 1', dimension: '6" × 12"', widthRatio: 6, heightRatio: 12 },
      { id: 'p1', label: 'Slot 2', dimension: '6" × 12"', widthRatio: 6, heightRatio: 12 },
      { id: 'p2', label: 'Slot 3', dimension: '6" × 12"', widthRatio: 6, heightRatio: 12 }
    ]
  },
  {
    id: 'col-4p-12x12',
    productTypeId: 'canvas-collage',
    label: '4-Photo Grid: 12" × 12"',
    dimensionsSummary: '4 Photos (6" × 6" ea)',
    price: 850.0,
    categories: ['RECOMMENDED', 'SQUARE'],
    panels: [
      { id: 'p0', label: 'Slot 1', dimension: '6" × 6"', widthRatio: 6, heightRatio: 6 },
      { id: 'p1', label: 'Slot 2', dimension: '6" × 6"', widthRatio: 6, heightRatio: 6 },
      { id: 'p2', label: 'Slot 3', dimension: '6" × 6"', widthRatio: 6, heightRatio: 6 },
      { id: 'p3', label: 'Slot 4', dimension: '6" × 6"', widthRatio: 6, heightRatio: 6 }
    ]
  }
];

const CUSTOM_SIZE_STEPS = [6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 40, 48];

type LayoutArrangement = 'single' | 'grid2' | 'grid3' | 'grid4' | 'split3' | 'wall3';

interface LayoutPreset {
  id: string;
  label: string;
  productTypeId: string;
  sizeId: string;
  arrangement: LayoutArrangement;
}

// Universal layout picker: always shown, works from any product — picking one
// switches to the matching product type + size so the panel count actually changes.
const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'layout-1', label: '1 Photo', productTypeId: 'canvas-classic', sizeId: 'classic-12x18', arrangement: 'single' },
  { id: 'layout-2', label: '2 Photos', productTypeId: 'canvas-collage', sizeId: 'col-2p-16x8', arrangement: 'grid2' },
  { id: 'layout-3', label: '3 Photos', productTypeId: 'canvas-collage', sizeId: 'col-3p-18x12', arrangement: 'grid3' },
  { id: 'layout-4', label: '4 Photos', productTypeId: 'canvas-collage', sizeId: 'col-4p-12x12', arrangement: 'grid4' },
  { id: 'layout-split', label: '3-Panel Split', productTypeId: 'canvas-split', sizeId: 'split-3p-36x24', arrangement: 'split3' },
  { id: 'layout-wall', label: '3-Piece Wall Display', productTypeId: 'canvas-wall-art', sizeId: 'wd-3p-12x18-10x8', arrangement: 'wall3' }
];

type DecorType = 'confetti' | 'ribbon' | 'floral' | 'hearts' | 'necktie' | 'balloons';

interface DesignTemplate {
  id: string;
  category: string;
  name: string;
  textPreset: string;
  decor: DecorType;
  accent: string;
  swatchClass: string;
}

const DESIGN_TEMPLATE_CATEGORIES = ["Father's Day", 'Birthday', 'Wedding', 'Anniversary'];

const DESIGN_TEMPLATES: DesignTemplate[] = [
  { id: 'tpl-fd-1', category: "Father's Day", name: 'Love You Dad', textPreset: 'Love You Dad', decor: 'necktie', accent: '#0f172a', swatchClass: 'bg-stone-900 text-white' },
  { id: 'tpl-fd-2', category: "Father's Day", name: "Happy Father's Day", textPreset: "Happy Father's Day", decor: 'ribbon', accent: '#0284c7', swatchClass: 'bg-sky-100 text-sky-900' },
  { id: 'tpl-fd-3', category: "Father's Day", name: 'Dad, The Hero', textPreset: 'Dad, The Hero', decor: 'confetti', accent: '#f59e0b', swatchClass: 'bg-emerald-50 text-emerald-900' },
  { id: 'tpl-bd-1', category: 'Birthday', name: 'Happy Birthday', textPreset: 'Happy Birthday!', decor: 'balloons', accent: '#e11d48', swatchClass: 'bg-rose-100 text-rose-900' },
  { id: 'tpl-bd-2', category: 'Birthday', name: 'Another Year Wiser', textPreset: 'Another Year Wiser', decor: 'confetti', accent: '#d97706', swatchClass: 'bg-amber-100 text-amber-900' },
  { id: 'tpl-wd-1', category: 'Wedding', name: 'Mr & Mrs', textPreset: 'Mr & Mrs', decor: 'floral', accent: '#be123c', swatchClass: 'bg-rose-50 text-rose-900' },
  { id: 'tpl-wd-2', category: 'Wedding', name: 'Forever & Always', textPreset: 'Forever & Always', decor: 'floral', accent: '#78716c', swatchClass: 'bg-white text-stone-900 border border-stone-200' },
  { id: 'tpl-an-1', category: 'Anniversary', name: 'Happy Anniversary', textPreset: 'Happy Anniversary', decor: 'hearts', accent: '#dc2626', swatchClass: 'bg-red-50 text-red-900' },
  { id: 'tpl-an-2', category: 'Anniversary', name: 'Together Forever', textPreset: 'Together Forever', decor: 'hearts', accent: '#4338ca', swatchClass: 'bg-indigo-50 text-indigo-900' }
];

// Hand-drawn vector decorations used by design templates (no external images/emoji).
const renderDecorSvg = (decor: DecorType, accent: string, className = 'absolute inset-0 w-full h-full pointer-events-none') => {
  if (decor === 'confetti') {
    const bits = [
      [6, 8, 0], [15, 5, 30], [93, 6, 15], [86, 13, 60],
      [4, 88, 10], [11, 94, 50], [95, 90, 20], [88, 96, 80],
      [50, 5, 0], [50, 95, 0], [5, 50, 0], [95, 50, 0]
    ];
    const palette = [accent, '#f59e0b', '#38bdf8', '#f43f5e'];
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
        {bits.map(([x, y, r], i) => (
          <rect key={i} x={x - 2} y={y - 2} width={4} height={4} rx={0.5} fill={palette[i % palette.length]} opacity={0.85} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </svg>
    );
  }
  if (decor === 'ribbon') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
        <path
          d="M0,8 L100,8 L100,20 L91,14 L83,20 L75,14 L67,20 L59,14 L51,20 L43,14 L35,20 L27,14 L19,20 L11,14 L3,20 L0,14 Z"
          fill={accent}
          opacity={0.9}
        />
      </svg>
    );
  }
  if (decor === 'floral') {
    const leaf = (
      <g fill={accent}>
        <path d="M4,4 C16,4 22,12 22,20 C12,20 4,15 4,4 Z" opacity={0.45} />
        <path d="M4,4 C4,16 9,22 20,22 C20,12 15,4 4,4 Z" opacity={0.3} />
        <circle cx="9" cy="9" r="2.4" opacity={0.6} />
      </g>
    );
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
        {leaf}
        <g transform="translate(100,0) scale(-1,1)">{leaf}</g>
        <g transform="translate(0,100) scale(1,-1)">{leaf}</g>
        <g transform="translate(100,100) scale(-1,-1)">{leaf}</g>
      </svg>
    );
  }
  if (decor === 'hearts') {
    const heart = 'M0,3.4 C-1.6,0.6 -5,0.4 -5,3 C-5,5.6 -1.8,7.4 0,9.6 C1.8,7.4 5,5.6 5,3 C5,0.4 1.6,0.6 0,3.4 Z';
    const points = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      return { x: 50 + Math.cos(angle) * 44, y: 50 + Math.sin(angle) * 44 };
    });
    return (
      <svg viewBox="0 0 100 100" className={className}>
        {points.map((p, i) => (
          <path key={i} d={heart} fill={accent} opacity={0.55} transform={`translate(${p.x} ${p.y}) scale(1.3)`} />
        ))}
      </svg>
    );
  }
  if (decor === 'necktie') {
    const stripes = Array.from({ length: 6 }, (_, i) => i * 9 - 20);
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
        <polygon points="0,0 40,0 0,40" fill="#f8fafc" opacity={0.06} />
        {stripes.map((offset, i) => (
          <rect key={i} x={offset} y={-6} width={6} height={60} fill={accent} opacity={0.85} transform="rotate(45 0 0)" />
        ))}
      </svg>
    );
  }
  // balloons
  const colors = [accent, '#f59e0b', '#38bdf8'];
  const positions = [
    { cx: 28, cy: 14 },
    { cx: 50, cy: 9 },
    { cx: 72, cy: 14 }
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
      {positions.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.cx} cy={p.cy} rx={7} ry={9} fill={colors[i]} opacity={0.9} />
          <path d={`M${p.cx},${p.cy + 9} C${p.cx - 2},${p.cy + 16} ${p.cx + 2},${p.cy + 20} ${p.cx},${p.cy + 26}`} stroke={colors[i]} strokeWidth={0.6} fill="none" opacity={0.7} />
        </g>
      ))}
    </svg>
  );
};

const WRAP_OPTIONS = [
  { id: 'canvas-lite', label: 'Canvas Lite', depth: '0.5"', depthPx: 6, price: 0 },
  { id: 'thin-gallery', label: 'Thin Gallery Wrap', depth: '0.75"', depthPx: 10, price: 130, badge: 'Recommended' },
  { id: 'thick-gallery', label: 'Thick Gallery Wrap', depth: '1.5"', depthPx: 18, price: 155, badge: 'Museum Quality' },
  { id: 'hanging-canvas', label: 'Hanging Canvas', depth: '', depthPx: 4, price: 85 }
];

const HARDWARE_OPTIONS = [
  { id: 'hooks-hanging', label: 'Hooks for Hanging', price: 0 },
  { id: 'ready-to-hang', label: 'Ready to Hang', price: 0 },
  { id: 'no-hooks', label: 'No Hooks', price: 0 },
  { id: 'sawtooth-hanger', label: 'Sawtooth Hanger', price: 25 },
  { id: 'easel-back', label: 'Easel Back', price: 49 },
  { id: 'nail-free-hook', label: 'Nail Free Hook', price: 49 }
];

const DISPLAY_OPTIONS = [
  { id: 'open-back', label: 'Open Back', price: 0 },
  { id: 'dust-cover', label: 'Dust Cover', price: 49 }
];

const COLOR_FINISH_OPTIONS: { id: ColorFilterType; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'grayscale', label: 'GrayScale' }
];

const LAMINATION_OPTIONS = [
  { id: 'none', label: 'No', price: 0 },
  { id: 'standard', label: 'Standard', price: 149 },
  { id: 'premium', label: 'Premium', price: 249 }
];

const RETOUCH_CHECKS = [
  { id: 'red-eye', label: 'Red Eye Removal' },
  { id: 'dust-scratch', label: 'Dust/Scratch Removal' },
  { id: 'enhance-color', label: 'Enhance Color' },
  { id: 'date-stamp', label: 'Date Stamp Removal' },
  { id: 'lighten-darken', label: 'Lighten/Darken Image' }
];

const MATERIAL_VARIANTS = [
  { id: 'standard-cotton', name: 'Standard 280 GSM Cotton Canvas', tag: 'Standard', desc: 'Durable poly-cotton blend canvas for everyday prints.' },
  { id: 'premium-cotton', name: 'Premium 380 GSM Cotton Canvas', tag: '+₹250', desc: '100% cotton museum-grade canvas with rich texture.' },
  { id: 'archival-cotton', name: 'Archival Museum Canvas', tag: '+₹450', desc: 'Acid-free archival canvas rated for 100+ years of fade resistance.' }
];

const CLIPART_ITEMS = [
  '❤️', '⭐', '🎉', '🎁', '✨', '🌸', '😊', '🌿', '💎', '🎂', '💍', '🏆',
  '🌹', '🦋', '🌈', '☀️', '🌙', '🎈', '🕉️', '🪔', '🐾', '🎓', '🏡', '👑'
];

const FONT_OPTIONS = [
  { id: 'manrope', label: 'Modern', family: 'Manrope, sans-serif' },
  { id: 'playfair', label: 'Elegant', family: '"Playfair Display", serif' },
  { id: 'cormorant', label: 'Classic', family: '"Cormorant Garamond", serif' },
  { id: 'cinzel', label: 'Roman', family: 'Cinzel, serif' },
  { id: 'bodoni', label: 'Fashion', family: '"Bodoni Moda", serif' },
  { id: 'dancing', label: 'Script', family: '"Dancing Script", cursive' },
  { id: 'pacifico', label: 'Playful', family: 'Pacifico, cursive' },
  { id: 'bebas', label: 'Poster', family: '"Bebas Neue", Impact, sans-serif' },
  { id: 'mono', label: 'Typewriter', family: '"Courier New", monospace' }
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#D4AF37', '#0E4A93', '#E8752A', '#DC2626', '#059669', '#7C3AED'];

const getFilterCss = (filter?: string): string => {
  if (filter === 'sepia') return 'sepia(0.8) contrast(1.05)';
  if (filter === 'grayscale') return 'grayscale(1) contrast(1.1)';
  return 'none';
};

interface TextItem {
  id: string;
  text: string;
  fontId: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  x: number; // % of the print area (0-100)
  y: number;
}

interface ClipItem {
  id: string;
  emoji: string;
  size: number;
  x: number;
  y: number;
}

type SelectedItem = { type: 'text' | 'clip'; id: string } | null;

// Gallery: sample photographs bundled with the site
const GALLERY_PHOTOS = [
  { url: '/assets/acrylic/acrylic-family-print.jpg', label: 'Family' },
  { url: '/assets/acrylic/acrylic-abstract-art.jpg', label: 'Abstract' },
  { url: '/assets/acrylic/acrylic-custom-wall-art.jpg', label: 'Wall art' },
  { url: '/assets/acrylic/acrylic-inspirational-print.jpg', label: 'Quote' },
  { url: '/assets/acrylic/acrylic-poster.jpg', label: 'Poster' },
  { url: '/assets/acrylic/acrylic-gift.jpg', label: 'Gift' },
  { url: '/assets/acrylic/acrylic-decorative-panel.jpg', label: 'Decor' },
  { url: '/assets/acrylic/acrylic-photo-panel.jpg', label: 'Portrait' }
];

// Procedural artwork from a text prompt (deterministic: same words -> same art). Not an AI model.
const generateArtwork = (prompt: string, variant: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  let h = 2166136261 + variant * 977;
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
  const hue = Math.floor(rand() * 360);
  const grad = ctx.createLinearGradient(0, 0, 1200, 900);
  grad.addColorStop(0, `hsl(${hue}, 70%, 22%)`);
  grad.addColorStop(0.55, `hsl(${(hue + 40) % 360}, 65%, 45%)`);
  grad.addColorStop(1, `hsl(${(hue + 90) % 360}, 75%, 68%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 900);
  for (let i = 0; i < 26; i++) {
    const x = rand() * 1200;
    const y = rand() * 900;
    const r = 40 + rand() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const hh = (hue + rand() * 140) % 360;
    g.addColorStop(0, `hsla(${hh}, 85%, 65%, ${0.25 + rand() * 0.35})`);
    g.addColorStop(1, `hsla(${hh}, 85%, 65%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = `hsla(${(hue + i * 25) % 360}, 90%, 85%, 0.35)`;
    ctx.beginPath();
    ctx.moveTo(0, rand() * 900);
    ctx.bezierCurveTo(400, rand() * 900, 800, rand() * 900, 1200, rand() * 900);
    ctx.stroke();
  }
  return canvas.toDataURL('image/jpeg', 0.9);
};

interface PanelImageState {
  imageUrl: string | null;
  panX: number;
  panY: number;
  scale: number;
  rotation: number;
  filter: ColorFilterType;
}

const createDefaultPanel = (): PanelImageState => ({
  imageUrl: null,
  panX: 0,
  panY: 0,
  scale: 1,
  rotation: 0,
  filter: 'original'
});

// Helper renderers for 3D isometric wraps (CanvasChamp style) & hardware icons
const renderWrapPreview = (id: string) => {
  if (id === 'hanging-canvas') {
    return (
      <div className="w-16 h-14 mx-auto relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xs">
          <rect x="20" y="24" width="60" height="6" fill="#b45309" rx="1.5" />
          <path d="M50 12 L32 24 M50 12 L68 24" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="12" r="2.5" fill="#78350f" />
          <rect x="23" y="30" width="54" height="40" fill="#fde047" opacity="0.9" />
          <path d="M23 45 Q 50 35 77 50 L 77 70 L 23 70 Z" fill="#eab308" opacity="0.8" />
          <rect x="20" y="70" width="60" height="6" fill="#b45309" rx="1.5" />
        </svg>
      </div>
    );
  }

  const depthValue = id === 'canvas-lite' ? '0.5"' : id === 'thin-gallery' ? '0.75"' : '1.5"';
  const sideWidth = id === 'canvas-lite' ? 12 : id === 'thin-gallery' ? 20 : 30;

  return (
    <div className="w-20 h-16 mx-auto relative flex items-center justify-center">
      <svg viewBox="0 0 120 90" className="w-full h-full drop-shadow-xs">
        <rect x="4" y="4" width="112" height="82" fill="#f8fafc" rx="6" stroke="#e2e8f0" strokeWidth="1" />
        <g transform="translate(18, 10)">
          <polygon points="8,22 60,6 60,52 8,68" fill="#ea580c" />
          <polygon points="8,22 60,6 60,30 8,46" fill="#f97316" opacity="0.85" />
          <polygon points={`60,6 ${60 + sideWidth},14 ${60 + sideWidth},60 60,52`} fill="#9a3412" />
          <polygon points={`8,22 60,6 ${60 + sideWidth},14 ${8 + sideWidth},30`} fill="#ffedd5" opacity="0.9" />
          <line x1={60 + sideWidth / 2} y1="62" x2={60 + sideWidth / 2} y2="72" stroke="#475569" strokeWidth="1.5" strokeDasharray="2,2" />
          <text x={60 + sideWidth / 2} y="80" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            {depthValue}
          </text>
        </g>
      </svg>
    </div>
  );
};

const renderHardwareIcon = (id: string) => {
  if (id === 'hooks-hanging') {
    return (
      <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="15" y="12" width="10" height="14" fill="#94a3b8" rx="2" />
        <circle cx="20" cy="17" r="2.5" fill="#334155" />
        <path d="M15 26 A 7 7 0 0 0 25 26" fill="none" stroke="#475569" strokeWidth="2.5" />
        <rect x="35" y="12" width="10" height="14" fill="#94a3b8" rx="2" />
        <circle cx="40" cy="17" r="2.5" fill="#334155" />
        <path d="M35 26 A 7 7 0 0 0 45 26" fill="none" stroke="#475569" strokeWidth="2.5" />
      </svg>
    );
  }
  if (id === 'ready-to-hang') {
    return (
      <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M12 28 Q 30 14 48 28" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <rect x="10" y="26" width="6" height="10" fill="#64748b" rx="1" />
        <rect x="44" y="26" width="6" height="10" fill="#64748b" rx="1" />
      </svg>
    );
  }
  if (id === 'sawtooth-hanger') {
    return (
      <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M12 20 L12 28 L16 28 L18 24 L20 28 L22 24 L24 28 L26 24 L28 28 L30 24 L32 28 L34 24 L36 28 L38 24 L40 28 L42 24 L44 28 L48 28 L48 20 Z" fill="#d97706" />
        <circle cx="15" cy="24" r="1.5" fill="#78350f" />
        <circle cx="45" cy="24" r="1.5" fill="#78350f" />
      </svg>
    );
  }
  if (id === 'easel-back') {
    return (
      <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
        <polygon points="22,10 38,10 44,42 16,42" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <polygon points="26,10 34,10 38,42 30,42" fill="#64748b" />
        <line x1="20" y1="32" x2="40" y2="32" stroke="#475569" strokeWidth="2" />
      </svg>
    );
  }
  if (id === 'nail-free-hook') {
    return (
      <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="18" y="10" width="24" height="30" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" rx="3" />
        <path d="M30 18 L30 32 C30 37 37 37 37 32" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 50" className="w-12 h-10 mx-auto">
      <rect x="2" y="2" width="56" height="46" fill="#f1f5f9" rx="6" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="16" y="12" width="28" height="26" fill="#ffffff" stroke="#94a3b8" strokeDasharray="3 3" rx="4" />
      <line x1="22" y1="18" x2="38" y2="32" stroke="#cbd5e1" strokeWidth="2" />
    </svg>
  );
};

// ============================================================================
// 2. MAIN CANVAS CUSTOMIZER COMPONENT
// ============================================================================

export const CanvasCustomizerPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { allProducts, onAddToCartCustomized } = useShop();

  // Matched product from catalog
  const catalogProduct = useMemo(() => {
    return (
      allProducts.find((p) => (p.id === productId || p.slug === productId) && p.categorySlug === 'canvas') ||
      allProducts.find((p) => p.categorySlug === 'canvas') ||
      allProducts[0]
    );
  }, [allProducts, productId]);

  // Active step in the left toolbar
  const [activeTab, setActiveTab] = useState<ToolbarTab>('PRODUCTS');
  const activeTabIndex = TOOLBAR_ITEMS.findIndex((t) => t.id === activeTab);
  const prevTab = TOOLBAR_ITEMS[Math.max(0, activeTabIndex - 1)];
  const nextTab = TOOLBAR_ITEMS[Math.min(TOOLBAR_ITEMS.length - 1, activeTabIndex + 1)];

  // Selected Canvas Product Type
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>(() => {
    const key = (catalogProduct?.slug || catalogProduct?.id || catalogProduct?.name || '').toLowerCase();
    if (key.includes('wall') || key.includes('display')) return 'canvas-wall-art';
    if (key.includes('collage')) return 'canvas-collage';
    if (key.includes('split')) return 'canvas-split';
    if (key.includes('panoramic') || key.includes('landscape')) return 'canvas-panoramic';
    return 'canvas-classic';
  });

  const selectedProductType = useMemo(() => {
    return CANVAS_PRODUCT_TYPES.find((pt) => pt.id === selectedProductTypeId) || CANVAS_PRODUCT_TYPES[0];
  }, [selectedProductTypeId]);

  // Available size options for the current product type
  const availableSizeOptions = useMemo(() => {
    const list = SIZE_OPTIONS.filter((s) => s.productTypeId === selectedProductTypeId);
    if (list.length > 0) return list;
    return SIZE_OPTIONS.filter((s) => s.productTypeId === 'canvas-classic');
  }, [selectedProductTypeId]);

  // SELECT SIZE tab: category filter

  // Selected Size Option
  const [selectedSizeId, setSelectedSizeId] = useState<string>(() => availableSizeOptions[0]?.id || 'classic-8x10');

  useEffect(() => {
    if (!availableSizeOptions.some((s) => s.id === selectedSizeId)) {
      setSelectedSizeId(availableSizeOptions[0]?.id || 'classic-8x10');
    }
  }, [availableSizeOptions, selectedSizeId]);

  const currentSizeOption = useMemo(() => {
    return availableSizeOptions.find((s) => s.id === selectedSizeId) || availableSizeOptions[0] || SIZE_OPTIONS[0];
  }, [availableSizeOptions, selectedSizeId]);

  // Custom Size (only meaningful for single-panel products)
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number>(8);
  const [customHeight, setCustomHeight] = useState<number>(8);
  const customSizePrice = useMemo(() => Math.max(99, Math.round(customWidth * customHeight * 4.2)), [customWidth, customHeight]);

  const canUseCustomSize = currentSizeOption.panels.length === 1;

  // Panels for the current size layout
  const panels = currentSizeOption.panels;

  // Shapes, borders and outer frames only apply to single-panel canvases
  // (multi-panel collage / split / wall-art layouts stay rectangular slots).
  const shapeApplies = panels.length === 1;

  // Panel Images State
  const [panelImages, setPanelImages] = useState<Record<number, PanelImageState>>({
    0: createDefaultPanel(),
    1: createDefaultPanel(),
    2: createDefaultPanel(),
    3: createDefaultPanel()
  });

  // Currently Active Panel Slot for drag/transform/upload targeting
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);

  // Uploaded photo collection (all photos uploaded in this session)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // UPLOAD tab: source sub-tab (visual, only "Computer" is wired to the file picker)
  const [uploadSource, setUploadSource] = useState<'computer' | 'phone' | 'gallery' | 'ai'>('computer');

  // LAYOUTS & DESIGNS tab
  const [layoutSubTab, setLayoutSubTab] = useState<'DESIGNS' | 'LAYOUTS'>('LAYOUTS');
  const [designCategory, setDesignCategory] = useState<string>(DESIGN_TEMPLATE_CATEGORIES[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [expandedLayoutId, setExpandedLayoutId] = useState<string | null>('layout-1');

  // SHAPE tab
  const [selectedShapeId, setSelectedShapeId] = useState<string>('shape-rectangle');
  const [shapeFilterCategory, setShapeFilterCategory] = useState<'ALL' | 'BASIC' | 'SPECIAL' | 'DECORATIVE'>('ALL');

  const currentShape = useMemo<AcrylicShapeOption>(() => {
    return ACRYLIC_SHAPES.find((s) => s.id === selectedShapeId) || ACRYLIC_SHAPES[0];
  }, [selectedShapeId]);

  const filteredShapes = useMemo(() => {
    if (shapeFilterCategory === 'ALL') return ACRYLIC_SHAPES;
    return ACRYLIC_SHAPES.filter((s) => s.category.toUpperCase() === shapeFilterCategory);
  }, [shapeFilterCategory]);

  // WRAP & BORDER tab
  const [selectedWrapId, setSelectedWrapId] = useState<string>('canvas-lite');
  const [mirrorImage, setMirrorImage] = useState<boolean>(false);
  const [selectedBorderWidthId, setSelectedBorderWidthId] = useState<string>('none');
  const [selectedBorderColor, setSelectedBorderColor] = useState<string>('#FFFFFF');
  const [selectedFrameId, setSelectedFrameId] = useState<string>('no-frame');

  // HARDWARE & FINISH tab
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('hooks-hanging');
  const [selectedDisplayOptionId, setSelectedDisplayOptionId] = useState<string>('open-back');

  // OPTIONS tab
  const [selectedLaminationId, setSelectedLaminationId] = useState<string>('standard');
  const [retouchChecks, setRetouchChecks] = useState<Record<string, boolean>>({});
  const [majorRetouchText, setMajorRetouchText] = useState<string>('');
  const [proofRequested, setProofRequested] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);

  // Material Variant (from Change Material modal)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('standard-cotton');
  const [materialModalOpen, setMaterialModalOpen] = useState<boolean>(false);

  // Creative Tools State
  // Free-form text + clipart: any number of items, each draggable anywhere on the print
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [clipItems, setClipItems] = useState<ClipItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showTextPopover, setShowTextPopover] = useState<boolean>(false);
  const [showClipartPopover, setShowClipartPopover] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; w: number; h: number } | null>(null);

  const selectedTextItem = selectedItem?.type === 'text' ? textItems.find((t) => t.id === selectedItem.id) || null : null;
  const selectedClipItem = selectedItem?.type === 'clip' ? clipItems.find((c) => c.id === selectedItem.id) || null : null;
  const customText = textItems.map((t) => t.text).join(' | ');

  // Upload: which frame a picked/dropped file goes to, and which frame is being dragged over
  const uploadTargetRef = useRef<number>(0);
  const [dragOverPanel, setDragOverPanel] = useState<number | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResults, setAiResults] = useState<string[]>([]);

  // Modals & Drawers
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [pricePopoverOpen, setPricePopoverOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Room / 3D / 360 viewer
  const [viewerMode, setViewerMode] = useState<'room' | '3d' | '360' | null>(null);
  const [roomBackdrop, setRoomBackdrop] = useState<'living' | 'office' | 'bedroom'>('living');
  const [viewerRotation, setViewerRotation] = useState<number>(-22);
  const [viewerAutoRotate, setViewerAutoRotate] = useState<boolean>(false);
  const viewerDragRef = useRef<{ x: number; startRotation: number } | null>(null);

  // Dragging state for the active panel image
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number }>({
    x: 0,
    y: 0,
    initialPanX: 0,
    initialPanY: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LocalStorage Key
  const storageKey = `ci_customization_${catalogProduct.id || catalogProduct.slug || 'canvas-custom'}`;

  // Restore saved state on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedProductTypeId) setSelectedProductTypeId(data.selectedProductTypeId);
        if (data.selectedSizeId) setSelectedSizeId(data.selectedSizeId);
        if (data.selectedShapeId) setSelectedShapeId(data.selectedShapeId);
        if (data.selectedWrapId) setSelectedWrapId(data.selectedWrapId);
        if (data.selectedBorderWidthId) setSelectedBorderWidthId(data.selectedBorderWidthId);
        if (data.selectedBorderColor) setSelectedBorderColor(data.selectedBorderColor);
        if (data.selectedFrameId) setSelectedFrameId(data.selectedFrameId);
        if (typeof data.mirrorImage === 'boolean') setMirrorImage(data.mirrorImage);
        if (data.selectedHardwareId) setSelectedHardwareId(data.selectedHardwareId);
        if (data.selectedDisplayOptionId) setSelectedDisplayOptionId(data.selectedDisplayOptionId);
        if (data.selectedLaminationId) setSelectedLaminationId(data.selectedLaminationId);
        if (data.selectedMaterialId) setSelectedMaterialId(data.selectedMaterialId);
        if (data.quantity) setQuantity(data.quantity);
        if (Array.isArray(data.textItems)) setTextItems(data.textItems);
        if (Array.isArray(data.clipItems)) setClipItems(data.clipItems);
        if (data.panelImages) setPanelImages(data.panelImages);
        if (data.uploadedPhotos) setUploadedPhotos(data.uploadedPhotos);
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save current design state to localStorage
  const handleSaveDesign = () => {
    try {
      const stateToSave = {
        selectedProductTypeId,
        selectedSizeId,
        selectedShapeId,
        selectedWrapId,
        selectedBorderWidthId,
        selectedBorderColor,
        selectedFrameId,
        mirrorImage,
        selectedHardwareId,
        selectedDisplayOptionId,
        selectedLaminationId,
        selectedMaterialId,
        quantity,
        textItems,
        clipItems,
        panelImages,
        uploadedPhotos,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      setSaveToast('Design saved successfully! Your project is stored locally.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast('Notice: Could not save to localStorage.');
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  // Dynamic Price Calculation
  const sizePrice = isCustomSize && canUseCustomSize ? customSizePrice : currentSizeOption.price;

  const unitPrice = useMemo(() => {
    let price = sizePrice;

    if (shapeApplies && currentShape.priceAddon) price += currentShape.priceAddon;

    const wrap = WRAP_OPTIONS.find((w) => w.id === selectedWrapId);
    if (wrap) price += wrap.price;

    if (shapeApplies) {
      price += CANVAS_BORDER_WIDTH_PRICES[selectedBorderWidthId] || 0;
      const frame = FRAME_OPTIONS.find((f) => f.id === selectedFrameId);
      if (frame) price += frame.price;
    }

    const hardware = HARDWARE_OPTIONS.find((h) => h.id === selectedHardwareId);
    if (hardware) price += hardware.price;

    const display = DISPLAY_OPTIONS.find((d) => d.id === selectedDisplayOptionId);
    if (display) price += display.price;

    const lamination = LAMINATION_OPTIONS.find((l) => l.id === selectedLaminationId);
    if (lamination) price += lamination.price;

    if (selectedMaterialId === 'premium-cotton') price += 250;
    else if (selectedMaterialId === 'archival-cotton') price += 450;

    return price;
  }, [
    sizePrice,
    shapeApplies,
    currentShape,
    selectedWrapId,
    selectedBorderWidthId,
    selectedFrameId,
    selectedHardwareId,
    selectedDisplayOptionId,
    selectedLaminationId,
    selectedMaterialId
  ]);

  const totalPrice = unitPrice * quantity;

  // Validation: at least one uploaded photo
  const filledPanelsCount = useMemo(() => {
    return panels.filter((_, idx) => Boolean(panelImages[idx]?.imageUrl)).length;
  }, [panels, panelImages]);

  const isComplete = filledPanelsCount >= 1;

  // File Upload Handler
  // Files go to the frame that asked for them; extra files fill the following frames, the rest just join the uploads tray.
  const handleFilesUpload = async (files: FileList | File[] | null, startIdx: number = uploadTargetRef.current) => {
    if (!files || files.length === 0) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 25MB limit.`);
        continue;
      }
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i)) {
        alert(`File ${file.name} is not a supported format (JPG, PNG, WEBP, BMP).`);
        continue;
      }

      try {
        const target = startIdx + i;
        const result = await optimizeImageFile(file);
        if (result) {
          setUploadedPhotos((prev) => [result, ...prev]);
          if (i === 0 || target < panels.length) {
            const idx = target < panels.length ? target : startIdx;
            setPanelImages((prev) => ({ ...prev, [idx]: { ...createDefaultPanel(), imageUrl: result } }));
            setActivePanelIndex(idx);
          }
        }
      } catch (err) {
        console.error('Failed to process image file:', err);
      }
    }
  };


  const handleAssignPhotoToPanel = (photoUrl: string, panelIdx: number) => {
    setPanelImages((prev) => ({
      ...prev,
      [panelIdx]: { ...createDefaultPanel(), imageUrl: photoUrl }
    }));
    setActivePanelIndex(panelIdx);
  };

  // Frame click: empty frame opens the file picker for that frame, filled frame just selects it
  const handlePanelClick = (panelIdx: number) => {
    setActivePanelIndex(panelIdx);
    if (!panelImages[panelIdx]?.imageUrl) {
      uploadTargetRef.current = panelIdx;
      fileInputRef.current?.click();
    }
  };

  // Drag a thumbnail (upload tray / gallery) or a file from the desktop onto any frame
  const handlePanelDrop = (e: React.DragEvent, panelIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPanel(null);
    const trayIdx = e.dataTransfer.getData('application/x-ci-tray');
    if (trayIdx !== '') {
      const url = uploadedPhotos[Number(trayIdx)];
      if (url) handleAssignPhotoToPanel(url, panelIdx);
      return;
    }
    const galleryUrl = e.dataTransfer.getData('application/x-ci-url');
    if (galleryUrl) {
      handleAssignPhotoToPanel(galleryUrl, panelIdx);
      setUploadedPhotos((prev) => (prev.includes(galleryUrl) ? prev : [galleryUrl, ...prev]));
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files, panelIdx);
    }
  };

  // Spread onto any frame element: click, drag-image-to-pan, and drop targets
  const panelHandlers = (panelIdx: number) => ({
    onClick: () => handlePanelClick(panelIdx),
    onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, panelIdx),
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (dragOverPanel !== panelIdx) setDragOverPanel(panelIdx);
    },
    onDragLeave: () => setDragOverPanel((cur) => (cur === panelIdx ? null : cur)),
    onDrop: (e: React.DragEvent) => handlePanelDrop(e, panelIdx)
  });

  // AI-style art generator (procedural, runs in the browser)
  const handleGenerateArt = () => {
    const prompt = aiPrompt.trim() || 'abstract colour';
    const results = [0, 1, 2, 3].map((v) => generateArtwork(prompt, v)).filter(Boolean);
    setAiResults(results);
  };

  // --- Text & clipart items (freely movable) ---
  const addTextItem = (text = 'Your text') => {
    const id = `txt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const item: TextItem = { id, text, fontId: 'playfair', size: 32, color: '#FFFFFF', bold: false, italic: false, x: 50, y: 50 };
    setTextItems((prev) => [...prev, item]);
    setSelectedItem({ type: 'text', id });
    setShowTextPopover(true);
    setShowClipartPopover(false);
  };
  const updateTextItem = (id: string, patch: Partial<TextItem>) => setTextItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const addClipItem = (emoji: string) => {
    const id = `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setClipItems((prev) => [...prev, { id, emoji, size: 56, x: 50, y: 50 }]);
    setSelectedItem({ type: 'clip', id });
  };
  const updateClipItem = (id: string, patch: Partial<ClipItem>) => setClipItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeSelectedItem = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'text') setTextItems((prev) => prev.filter((t) => t.id !== selectedItem.id));
    else setClipItems((prev) => prev.filter((c) => c.id !== selectedItem.id));
    setSelectedItem(null);
  };

  const startItemDrag = (e: React.PointerEvent, type: 'text' | 'clip', id: string, x: number, y: number) => {
    e.stopPropagation();
    setSelectedItem({ type, id });
    if (type === 'text') setShowTextPopover(true);
    else setShowClipartPopover(true);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    itemDragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y, w: rect.width, h: rect.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveItemDrag = (e: React.PointerEvent, type: 'text' | 'clip', id: string) => {
    const d = itemDragRef.current;
    if (!d) return;
    const nx = Math.max(0, Math.min(100, d.origX + ((e.clientX - d.startX) / d.w) * 100));
    const ny = Math.max(0, Math.min(100, d.origY + ((e.clientY - d.startY) / d.h) * 100));
    if (type === 'text') updateTextItem(id, { x: nx, y: ny });
    else updateClipItem(id, { x: nx, y: ny });
  };
  const endItemDrag = () => {
    itemDragRef.current = null;
  };

  const updateActivePanelTransform = (updater: (curr: PanelImageState) => Partial<PanelImageState>) => {
    setPanelImages((prev) => {
      const curr = prev[activePanelIndex] || createDefaultPanel();
      return { ...prev, [activePanelIndex]: { ...curr, ...updater(curr) } };
    });
  };

  const handleZoomIn = () => updateActivePanelTransform((curr) => ({ scale: Math.min(3, curr.scale + 0.15) }));
  const handleZoomOut = () => updateActivePanelTransform((curr) => ({ scale: Math.max(0.6, curr.scale - 0.15) }));
  const handleRotate90 = () => updateActivePanelTransform((curr) => ({ rotation: (curr.rotation + 90) % 360 }));
  const handleFit = () => updateActivePanelTransform(() => ({ scale: 1, panX: 0, panY: 0 }));
  const handleReset = () => updateActivePanelTransform(() => ({ scale: 1, panX: 0, panY: 0, rotation: 0 }));
  const handleApplyFilter = (filter: ColorFilterType) => updateActivePanelTransform(() => ({ filter }));

  // 360° auto-rotate loop
  useEffect(() => {
    if (!viewerAutoRotate || viewerMode !== '360') return;
    const id = window.setInterval(() => {
      setViewerRotation((r) => (r + 1.2) % 360);
    }, 30);
    return () => window.clearInterval(id);
  }, [viewerAutoRotate, viewerMode]);

  // Drag-to-spin handlers for the 3D / 360 viewer
  const handleViewerPointerDown = (e: React.PointerEvent) => {
    setViewerAutoRotate(false);
    viewerDragRef.current = { x: e.clientX, startRotation: viewerRotation };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleViewerPointerMove = (e: React.PointerEvent) => {
    if (!viewerDragRef.current) return;
    const delta = e.clientX - viewerDragRef.current.x;
    setViewerRotation(viewerDragRef.current.startRotation + delta * 0.5);
  };
  const handleViewerPointerUp = () => {
    viewerDragRef.current = null;
  };

  // Mouse/Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent, panelIdx: number) => {
    setActivePanelIndex(panelIdx);
    const curr = panelImages[panelIdx];
    if (!curr?.imageUrl) return;

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialPanX: curr.panX, initialPanY: curr.panY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    updateActivePanelTransform(() => ({
      panX: Math.max(-120, Math.min(120, dragStartRef.current.initialPanX + deltaX)),
      panY: Math.max(-120, Math.min(120, dragStartRef.current.initialPanY + deltaY))
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // Apply a design template: sets a canned caption + the template's vector decoration
  const handleApplyTemplate = (tpl: DesignTemplate) => {
    setSelectedTemplateId(tpl.id);
    // The caption is a normal text item (id "tpl-text"): one per template, movable and editable like any other
    setTextItems((prev) => {
      const rest = prev.filter((t) => t.id !== 'tpl-text');
      return [...rest, { id: 'tpl-text', text: tpl.textPreset, fontId: 'playfair', size: 34, color: '#FFFFFF', bold: true, italic: false, x: 50, y: 86 }];
    });
    setSelectedItem({ type: 'text', id: 'tpl-text' });
  };

  const activeTemplate = useMemo(() => DESIGN_TEMPLATES.find((t) => t.id === selectedTemplateId) || null, [selectedTemplateId]);

  // Width / height ratio of the print: fixed for symmetric shapes (circle, heart...), otherwise follows the chosen size.
  const printAspect = useMemo(() => {
    if (shapeApplies && currentShape.isSingleDimension) return 1;
    if (isCustomSize && canUseCustomSize) return customWidth / customHeight;
    const p = panels[0];
    return p ? p.widthRatio / p.heightRatio : 1;
  }, [shapeApplies, currentShape, isCustomSize, canUseCustomSize, customWidth, customHeight, panels]);

  // Select a layout preset: switches product type + size so panel count actually changes
  const handleSelectLayoutPreset = (preset: LayoutPreset) => {
    setExpandedLayoutId(preset.id);
    setSelectedProductTypeId(preset.productTypeId);
    setSelectedSizeId(preset.sizeId);
    setIsCustomSize(false);
    setActivePanelIndex(0);
  };

  // Small mockup thumbnail matching each layout's real panel arrangement
  const renderLayoutThumbnail = (arrangement: LayoutArrangement) => {
    const cell = <div className="bg-stone-300 rounded" />;
    if (arrangement === 'single') return <div className="h-16 bg-stone-300 rounded" />;
    if (arrangement === 'grid2') return <div className="h-16 grid grid-cols-2 gap-1">{cell}{cell}</div>;
    if (arrangement === 'grid3') return <div className="h-16 grid grid-cols-3 gap-1">{cell}{cell}{cell}</div>;
    if (arrangement === 'grid4') return <div className="h-16 grid grid-cols-2 grid-rows-2 gap-1">{cell}{cell}{cell}{cell}</div>;
    if (arrangement === 'split3') return <div className="h-16 grid grid-cols-3 gap-0.5">{cell}{cell}{cell}</div>;
    // wall3: one wide panel on top, two smaller squares below
    return (
      <div className="h-16 flex flex-col gap-1">
        <div className="flex-[1.4] bg-stone-300 rounded" />
        <div className="flex-1 grid grid-cols-2 gap-1">{cell}{cell}</div>
      </div>
    );
  };

  // Back-of-frame hanging hardware, shown on the flipped-around 3D/360 back face
  // and as a wall bracket above the print in Room View.
  const renderHardwareGraphic = (hardwareId: string, forWall: boolean) => {
    if (hardwareId === 'no-hooks') return null;
    if (hardwareId === 'easel-back') {
      return forWall ? null : (
        <svg viewBox="0 0 100 60" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-8 pointer-events-none">
          <path d="M50,4 L20,56 M50,4 L80,56" stroke="#a8a29e" strokeWidth={4} strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    // Standard hanging bracket: brass plate with a sawtooth zigzag + two screw holes
    return (
      <svg viewBox="0 0 100 26" className={forWall ? 'w-16 h-4' : 'absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 pointer-events-none'}>
        <rect x={2} y={2} width={96} height={22} rx={3} fill="#c9a24b" stroke="#8a6d2f" strokeWidth={1} />
        <circle cx={10} cy={13} r={3} fill="#5c4a20" />
        <circle cx={90} cy={13} r={3} fill="#5c4a20" />
        <path d="M22,20 L30,6 L38,20 L46,6 L54,20 L62,6 L70,20 L78,6" fill="none" stroke="#5c4a20" strokeWidth={2} />
      </svg>
    );
  };

  // Flat-illustration room scenes (no external images) so Room View shows a real, recognizable room.
  const renderRoomScene = (room: 'living' | 'office' | 'bedroom') => {
    const accent = '#f87171';
    if (room === 'bedroom') {
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
          <rect x={0} y={0} width={400} height={220} fill="#f4efe9" />
          <rect x={0} y={188} width={400} height={32} fill="#cbc2b8" />
          {/* nightstand + lamp (left) */}
          <rect x={20} y={150} width={54} height={38} fill="#57534e" />
          <rect x={30} y={122} width={10} height={30} fill={accent} />
          <rect x={20} y={116} width={34} height={10} fill="#f5f5f4" />
          {/* bed */}
          <rect x={110} y={128} width={220} height={20} rx={4} fill="#44403c" />
          <rect x={110} y={144} width={220} height={44} fill={accent} />
          <rect x={122} y={100} width={196} height={44} rx={6} fill="#44403c" />
          <ellipse cx={165} cy={132} rx={26} ry={12} fill="#fafaf9" />
          <ellipse cx={235} cy={132} rx={26} ry={12} fill="#fafaf9" />
          {/* nightstand + lamp (right) */}
          <rect x={326} y={150} width={54} height={38} fill="#57534e" />
          <rect x={346} y={122} width={10} height={30} fill={accent} />
          <rect x={334} y={116} width={34} height={10} fill="#f5f5f4" />
        </svg>
      );
    }
    if (room === 'office') {
      return (
        <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
          <rect x={0} y={0} width={400} height={220} fill="#eef1f3" />
          <rect x={0} y={188} width={400} height={32} fill="#c3ccd2" />
          {/* desk */}
          <rect x={90} y={150} width={220} height={12} fill="#57534e" />
          <rect x={100} y={162} width={14} height={30} fill="#78716c" />
          <rect x={286} y={162} width={14} height={30} fill="#78716c" />
          {/* monitor */}
          <rect x={168} y={104} width={64} height={44} rx={3} fill="#292524" />
          <rect x={172} y={108} width={56} height={34} fill="#7dd3fc" />
          <rect x={192} y={148} width={16} height={8} fill="#57534e" />
          {/* chair */}
          <rect x={340} y={120} width={40} height={50} rx={8} fill={accent} />
          <rect x={352} y={170} width={16} height={22} fill="#57534e" />
        </svg>
      );
    }
    // living room
    return (
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
        <rect x={0} y={0} width={400} height={220} fill="#f2ede6" />
        <rect x={0} y={188} width={400} height={32} fill="#c9beae" />
        {/* sofa */}
        <rect x={150} y={130} width={220} height={50} rx={10} fill={accent} />
        <rect x={150} y={112} width={220} height={30} rx={10} fill="#e05a5a" />
        <rect x={140} y={150} width={16} height={40} rx={4} fill="#dc4c4c" />
        <rect x={366} y={150} width={16} height={40} rx={4} fill="#dc4c4c" />
        {/* coffee table */}
        <rect x={210} y={172} width={90} height={10} fill="#57534e" />
        <rect x={218} y={182} width={8} height={16} fill="#44403c" />
        <rect x={284} y={182} width={8} height={16} fill="#44403c" />
        {/* plant */}
        <rect x={40} y={168} width={26} height={22} fill="#78716c" />
        <circle cx={53} cy={148} r={20} fill="#4d7c0f" />
      </svg>
    );
  };

  // Add to Cart Action
  const handleAddToCart = () => {
    if (!isComplete) {
      alert('Please upload or select at least one photograph to customize your canvas print.');
      setActiveTab('UPLOAD');
      return;
    }

    const firstImage = panelImages[0]?.imageUrl || uploadedPhotos[0] || catalogProduct.image;
    const retouchLabels = RETOUCH_CHECKS.filter((r) => retouchChecks[r.id]).map((r) => r.label);

    onAddToCartCustomized({
      product: {
        ...catalogProduct,
        price: unitPrice,
        name: `${selectedProductType.name} - ${isCustomSize && canUseCustomSize ? `${customWidth}" × ${customHeight}"` : currentSizeOption.label}`
      },
      size: isCustomSize && canUseCustomSize ? `${customWidth}" × ${customHeight}"` : currentSizeOption.dimensionsSummary,
      finish: WRAP_OPTIONS.find((w) => w.id === selectedWrapId)?.label || 'Canvas Lite',
      quantity,
      customText: customText || undefined,
      photoUrl: firstImage,
      calculatedPrice: totalPrice,
      material: MATERIAL_VARIANTS.find((m) => m.id === selectedMaterialId)?.name || 'Standard 280 GSM Cotton Canvas',
      style: selectedProductType.name,
      base: HARDWARE_OPTIONS.find((h) => h.id === selectedHardwareId)?.label || 'Hooks for Hanging',
      customizationDetails: {
        productTypeId: selectedProductTypeId,
        sizeId: selectedSizeId,
        shape: shapeApplies ? currentShape.name : undefined,
        wrap: WRAP_OPTIONS.find((w) => w.id === selectedWrapId)?.label,
        borderWidth: shapeApplies ? ACRYLIC_BORDER_WIDTHS.find((b) => b.id === selectedBorderWidthId)?.label : undefined,
        borderColor: shapeApplies && selectedBorderWidthId !== 'none' ? selectedBorderColor : undefined,
        frame: shapeApplies ? FRAME_OPTIONS.find((f) => f.id === selectedFrameId)?.name : undefined,
        mirrorImage,
        display: DISPLAY_OPTIONS.find((d) => d.id === selectedDisplayOptionId)?.label,
        lamination: LAMINATION_OPTIONS.find((l) => l.id === selectedLaminationId)?.label,
        retouching: retouchLabels,
        majorRetouchText: majorRetouchText || undefined,
        proofRequested,
        template: selectedTemplateId ? DESIGN_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name : undefined,
        panels: panels.map((p, idx) => ({
          dimension: p.dimension,
          imageUrl: panelImages[idx]?.imageUrl || null,
          scale: panelImages[idx]?.scale || 1,
          rotation: panelImages[idx]?.rotation || 0,
          panX: panelImages[idx]?.panX || 0,
          panY: panelImages[idx]?.panY || 0,
          filter: panelImages[idx]?.filter || 'original'
        })),
        clipart: clipItems.map((c) => c.emoji),
        customText,
        textItems: textItems.map((t) => ({ text: t.text, font: FONT_OPTIONS.find((f) => f.id === t.fontId)?.label, color: t.color, size: t.size, x: t.x, y: t.y })),
        unitPrice,
        totalPrice
      }
    });
  };

  // Renders a set of grid panels sharing a common column layout (used for split/collage)
  const renderGridPanels = (indices: number[], gridColsClass: string) => (
    <div className={`grid ${gridColsClass} gap-2.5 w-full max-w-lg`}>
      {indices.map((panelIdx) => {
        const panel = panelImages[panelIdx] || createDefaultPanel();
        return (
          <div
            key={panelIdx}
            {...panelHandlers(panelIdx)}
            className={`relative w-full aspect-square bg-white rounded-lg overflow-hidden transition-all cursor-pointer border-2 ${
              activePanelIndex === panelIdx
                ? 'border-[#0E4A93] shadow-2xl ring-2 ring-[#0E4A93]/30'
                : 'border-stone-300 shadow-md hover:border-stone-400'
            }`}
          >
            {dragOverPanel === panelIdx && <div className="absolute inset-0 z-30 bg-[#E8752A]/25 border-4 border-dashed border-[#E8752A] pointer-events-none" />}
            {panel.imageUrl ? (
              <img
                src={panel.imageUrl}
                alt={`Slot ${panelIdx + 1}`}
                style={{
                  transform: `translate(${panel.panX}px, ${panel.panY}px) scale(${panel.scale}) rotate(${panel.rotation}deg)`,
                  filter: getFilterCss(panel.filter),
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                <Upload className="w-4 h-4 text-[#E8752A] mb-1" />
                <span className="text-[10px] font-bold">Slot {panelIdx + 1}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[#F8FAFC] text-stone-900 font-manrope overflow-hidden select-none">
      {/* SVG ClipPath Mask Definitions for non-rectangular canvas shapes */}
      <svg width="0" height="0" className="absolute pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <clipPath id="acrylic-clip-shape-heart" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.85 C 0.12,0.58 0.02,0.38 0.02,0.24 C 0.02,0.08 0.14,0.02 0.28,0.02 C 0.38,0.02 0.46,0.08 0.5,0.18 C 0.54,0.08 0.62,0.02 0.72,0.02 C 0.86,0.02 0.98,0.08 0.98,0.24 C 0.98,0.38 0.88,0.58 0.5,0.85 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-arch" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 L 0,0.4 C 0,0.15 0.22,0 0.5,0 C 0.78,0 1,0.15 1,0.4 L 1,1 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-cloud" clipPathUnits="objectBoundingBox">
            <path d="M 0.17,0.7 C 0.08,0.7 0.02,0.6 0.05,0.5 C 0.02,0.38 0.14,0.28 0.26,0.3 C 0.33,0.14 0.55,0.12 0.65,0.22 C 0.75,0.14 0.93,0.18 0.96,0.32 C 1.05,0.36 1.05,0.52 0.98,0.62 C 1.02,0.7 0.94,0.72 0.88,0.7 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-speech-bubble" clipPathUnits="objectBoundingBox">
            <path d="M 0.05,0.05 L 0.95,0.05 C 0.98,0.05 1,0.08 1,0.12 L 1,0.68 C 1,0.72 0.98,0.75 0.95,0.75 L 0.45,0.75 L 0.15,0.98 L 0.22,0.75 L 0.05,0.75 C 0.02,0.75 0,0.72 0,0.68 L 0,0.12 C 0,0.08 0.02,0.05 0.05,0.05 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-ticket" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.38 C 0.94,0.38 0.9,0.43 0.9,0.5 C 0.9,0.57 0.94,0.62 1,0.62 L 1,1 L 0,1 L 0,0.62 C 0.06,0.62 0.1,0.57 0.1,0.5 C 0.1,0.43 0.06,0.38 0,0.38 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-scalloped" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.02 C 0.56,0.02 0.62,0.06 0.65,0.12 C 0.71,0.08 0.78,0.09 0.82,0.15 C 0.88,0.14 0.93,0.19 0.94,0.25 C 1,0.28 1.01,0.36 0.98,0.41 C 1.02,0.47 1,0.54 0.95,0.59 C 0.98,0.65 0.94,0.73 0.88,0.76 C 0.88,0.83 0.82,0.88 0.75,0.88 C 0.71,0.94 0.64,0.96 0.58,0.94 C 0.52,0.99 0.45,0.98 0.4,0.94 C 0.35,0.97 0.27,0.94 0.24,0.88 C 0.17,0.87 0.12,0.81 0.12,0.74 C 0.06,0.71 0.03,0.63 0.05,0.57 C 0.01,0.51 0.01,0.43 0.05,0.38 C 0.03,0.31 0.06,0.24 0.13,0.22 C 0.14,0.15 0.21,0.11 0.28,0.12 C 0.33,0.06 0.41,0.05 0.47,0.1 C 0.5,0.04 0.45,0.02 0.5,0.02 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-organic-blob" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.02 C 0.78,0 0.98,0.18 0.98,0.45 C 0.98,0.75 0.8,0.98 0.52,0.96 C 0.25,0.94 0.02,0.78 0.02,0.5 C 0.02,0.22 0.22,0.04 0.5,0.02 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Hidden Global File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/bmp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFilesUpload(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={phoneInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFilesUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {/* ===================================================================== */}
      {/* 1. TOP CANVAS INDIA HEADER (#0E4A93 Primary Blue)                     */}
      {/* ===================================================================== */}
      <header className="relative w-full bg-[#0E4A93] text-white h-14 shrink-0 flex items-center justify-between px-2.5 sm:px-4 lg:px-6 shadow-md z-30">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -ml-1 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors cursor-pointer text-white flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-wide truncate max-w-[180px] lg:max-w-xs">
              {selectedProductType.name}
            </span>
            <span className="hidden lg:inline-block text-[11px] bg-white/15 px-2 py-0.5 rounded text-white font-medium border border-white/20">
              Canvas Studio
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity focus:outline-none" title="Canvas India">
            <img src="/canvas-india-official-logo.png" alt="Canvass India" className="h-7 sm:h-8 md:h-9 w-auto object-contain block select-none" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPricePopoverOpen(!pricePopoverOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#0E4A93] font-black text-xs sm:text-sm rounded-lg shadow-xs hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <span>₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#0E4A93]/80" />
            </button>

            {pricePopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-stone-900 rounded-xl shadow-xl border border-stone-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95">
                <div className="font-extrabold pb-2 border-b border-stone-100 flex justify-between text-stone-900">
                  <span>Price Breakdown</span>
                  <button onClick={() => setPricePopoverOpen(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 py-2.5 text-stone-600">
                  <div className="flex justify-between">
                    <span>Base ({isCustomSize && canUseCustomSize ? `${customWidth}"×${customHeight}"` : currentSizeOption.dimensionsSummary}):</span>
                    <span className="font-bold text-stone-900">₹{sizePrice}</span>
                  </div>
                  {selectedWrapId !== 'canvas-lite' && (
                    <div className="flex justify-between">
                      <span>Wrap:</span>
                      <span className="font-bold text-stone-900">+₹{WRAP_OPTIONS.find((w) => w.id === selectedWrapId)?.price}</span>
                    </div>
                  )}
                  {selectedHardwareId !== 'hooks-hanging' && (
                    <div className="flex justify-between">
                      <span>Hardware:</span>
                      <span className="font-bold text-stone-900">+₹{HARDWARE_OPTIONS.find((h) => h.id === selectedHardwareId)?.price}</span>
                    </div>
                  )}
                  {selectedDisplayOptionId === 'dust-cover' && (
                    <div className="flex justify-between">
                      <span>Dust Cover:</span>
                      <span className="font-bold text-stone-900">+₹49</span>
                    </div>
                  )}
                  {selectedLaminationId !== 'none' && (
                    <div className="flex justify-between">
                      <span>Lamination ({LAMINATION_OPTIONS.find((l) => l.id === selectedLaminationId)?.label}):</span>
                      <span className="font-bold text-stone-900">+₹{LAMINATION_OPTIONS.find((l) => l.id === selectedLaminationId)?.price}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-stone-100 text-stone-900 font-extrabold">
                    <span>Total (Qty {quantity}):</span>
                    <span className="text-[#0E4A93]">₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isComplete}
            className={`px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm ${
              isComplete ? 'bg-[#E8752A] hover:bg-[#d6651d] text-white active:scale-[0.98]' : 'bg-white/20 text-white/50 cursor-not-allowed'
            }`}
            title={!isComplete ? 'Upload an image to continue' : 'Add customized canvas to cart'}
            aria-label="Add customized canvas to cart"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">ADD TO CART</span>
            <ChevronRight className="hidden sm:inline w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. BODY CONTAINER: 3-COLUMN LAYOUT                                    */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ------------------------------------------------------------------- */}
        {/* COLUMN 1: LEFT VERTICAL TOOLBAR (7 Steps)                           */}
        {/* ------------------------------------------------------------------- */}
        <nav
          aria-label="Customizer Tools"
          className="bg-[#1E293B] text-stone-300 w-full md:w-20 md:min-w-[80px] shrink-0 flex flex-row md:flex-col items-center justify-around md:justify-start md:py-3 z-20 border-r border-slate-700 overflow-x-auto md:overflow-visible"
        >
          {TOOLBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full py-3.5 px-1 text-center transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#0E4A93] shadow-md font-extrabold' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#0E4A93]' : 'text-slate-300'}`} />
                <span className="text-[10px] leading-tight tracking-tight uppercase px-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ------------------------------------------------------------------- */}
        {/* COLUMN 2: CONFIGURATION PANEL                                       */}
        {/* ------------------------------------------------------------------- */}
        <aside className="w-full md:w-[400px] lg:w-[440px] bg-white shrink-0 border-r border-stone-200 flex flex-col h-auto md:h-full overflow-y-auto shadow-sm z-10">
          {/* ---------------------------- PRODUCTS ---------------------------- */}
          {activeTab === 'PRODUCTS' && (
            <div className="flex flex-col h-full">
              {/* Material Toggle Bar: CANVAS vs ACRYLIC */}
              <div className="flex items-center border-b border-stone-200 text-xs font-black uppercase tracking-wider shrink-0 bg-stone-100">
                <button
                  type="button"
                  className="flex-1 text-center py-3 bg-white text-[#0E4A93] border-b-2 border-[#0E4A93] shadow-xs cursor-default font-extrabold flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0E4A93]" />
                  CANVAS
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/customize/acrylic/acrylic-photo-panel')}
                  className="flex-1 text-center py-3 bg-stone-100 text-stone-500 hover:text-[#0E4A93] hover:bg-stone-50 border-b-2 border-transparent transition-colors cursor-pointer font-bold flex items-center justify-center gap-1.5"
                >
                  ACRYLIC
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2.5">
                  {CANVAS_PRODUCT_TYPES.map((pt) => {
                    const isSelected = selectedProductTypeId === pt.id;
                    return (
                      <div
                        key={pt.id}
                        onClick={() => setSelectedProductTypeId(pt.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center justify-between min-h-[104px] ${
                          isSelected ? 'border-[#0E4A93] bg-blue-50/30 shadow-xs ring-1 ring-[#0E4A93]/20' : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-8 h-8 flex items-center justify-center text-stone-500 my-1">
                          {pt.iconType === 'wall' && (
                            <div className="space-y-1">
                              <div className="w-6 h-2.5 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="flex gap-1">
                                <div className="w-2.5 h-3 bg-[#0E4A93]/40 rounded-xs" />
                                <div className="w-2.5 h-3 bg-[#0E4A93]/40 rounded-xs" />
                              </div>
                            </div>
                          )}
                          {pt.iconType === 'panel' && <div className="w-6 h-6 border-2 border-stone-400 rounded-xs" />}
                          {pt.iconType === 'print' && <div className="w-7 h-5 border-2 border-stone-400 rounded-xs" />}
                          {pt.iconType === 'collage' && (
                            <div className="grid grid-cols-2 gap-0.5">
                              <div className="w-3 h-3 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="w-3 h-3 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="w-3 h-3 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="w-3 h-3 bg-[#0E4A93]/40 rounded-xs" />
                            </div>
                          )}
                          {pt.iconType === 'split' && (
                            <div className="flex gap-1">
                              <div className="w-2 h-6 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="w-2 h-6 bg-[#0E4A93]/40 rounded-xs" />
                              <div className="w-2 h-6 bg-[#0E4A93]/40 rounded-xs" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-stone-900 leading-tight">{pt.name}</div>
                          <div className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-[#0E4A93]' : 'text-stone-500'}`}>
                            Starts at ₹{pt.startingPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------- UPLOAD ------------------------------ */}
          {activeTab === 'UPLOAD' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'computer' as const, label: 'Computer', icon: Monitor },
                  { id: 'phone' as const, label: 'Upload from phone', icon: Smartphone },
                  { id: 'gallery' as const, label: 'Gallery', icon: ImageIcon },
                  { id: 'ai' as const, label: 'Art Generator', icon: Sparkles }
                ].map((src) => {
                  const Icon = src.icon;
                  const isSelected = uploadSource === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setUploadSource(src.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        isSelected ? 'border-[#E8752A] bg-orange-50/50 text-[#E8752A]' : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold leading-tight">{src.label}</span>
                    </button>
                  );
                })}
              </div>

              {panels.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Assigning Photo to Panel:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {panels.map((p, idx) => {
                      const isSelected = activePanelIndex === idx;
                      const hasPhoto = Boolean(panelImages[idx]?.imageUrl);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActivePanelIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0E4A93] text-white shadow-xs'
                              : hasPhoto
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          <span>{p.label}</span>
                          {hasPhoto && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uploadSource === 'computer' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilesUpload(e.dataTransfer.files, activePanelIndex);
                  }}
                  className="border border-stone-200 bg-stone-50 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start gap-2 text-xs text-stone-600">
                    <FileText className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <span>
                      File types accepted: <strong className="text-stone-800">PNG, JPG and BMP (Up to 25MB)</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      uploadTargetRef.current = activePanelIndex;
                      fileInputRef.current?.click();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer uppercase tracking-wide"
                  >
                    Upload
                  </button>
                  <p className="text-[11px] text-stone-400">Drag and drop files here, or click Upload to browse.</p>
                </div>
              )}

              {uploadSource === 'phone' && (
                <div className="border border-stone-200 bg-stone-50 rounded-2xl p-5 space-y-3">
                  <p className="text-xs text-stone-600">
                    On a phone or tablet this opens your camera or photo library. On a computer it opens the file picker.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      uploadTargetRef.current = activePanelIndex;
                      phoneInputRef.current?.click();
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer uppercase tracking-wide inline-flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" /> Take / choose photo
                  </button>
                </div>
              )}

              {uploadSource === 'gallery' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-stone-500">Sample photos — click one to place it, or drag it onto a frame.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {GALLERY_PHOTOS.map((g) => (
                      <div
                        key={g.url}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/x-ci-url', g.url);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => {
                          handleAssignPhotoToPanel(g.url, activePanelIndex);
                          setUploadedPhotos((prev) => (prev.includes(g.url) ? prev : [g.url, ...prev]));
                        }}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-100 cursor-grab hover:ring-2 hover:ring-[#0E4A93] transition-all"
                        title={g.label}
                      >
                        <img src={g.url} alt={g.label} draggable={false} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] font-bold text-center py-0.5">{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadSource === 'ai' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-stone-500">
                    Describe a mood or colours (e.g. "sunset ocean") and get four unique abstract artworks made just for that prompt.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateArt();
                      }}
                      placeholder="e.g. calm blue mountains"
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-[#0E4A93]"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArt}
                      className="px-4 py-2 bg-[#E8752A] hover:bg-[#d6651d] text-white text-xs font-black rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate
                    </button>
                  </div>
                  {aiResults.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {aiResults.map((art, i) => (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-ci-url', art);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => {
                            handleAssignPhotoToPanel(art, activePanelIndex);
                            setUploadedPhotos((prev) => (prev.includes(art) ? prev : [art, ...prev]));
                          }}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 cursor-grab hover:ring-2 hover:ring-[#0E4A93] transition-all"
                        >
                          <img src={art} alt={`Generated art ${i + 1}`} draggable={false} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {uploadedPhotos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Uploaded Photos ({uploadedPhotos.length}):</span>
                    <span className="text-stone-400 text-[11px]">Drag onto a frame, or click</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/x-ci-tray', String(pIdx));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleAssignPhotoToPanel(photo, activePanelIndex)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 cursor-grab shadow-xs hover:ring-2 hover:ring-[#0E4A93] transition-all"
                      >
                        <img src={photo} alt={`Upload ${pIdx}`} draggable={false} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] text-white font-bold bg-[#0E4A93] px-1.5 py-0.5 rounded">Apply</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --------------------------- SELECT SIZE ---------------------------- */}
          {activeTab === 'SELECT SIZE' && (
            <div className="flex flex-col h-full">
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="text-xs font-extrabold uppercase tracking-wide text-stone-700">Popular sizes</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {availableSizeOptions.map((opt) => {
                    const isSelected = !isCustomSize && selectedSizeId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setIsCustomSize(false);
                          setSelectedSizeId(opt.id);
                        }}
                        className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                          isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <div className="w-full aspect-square bg-stone-200 rounded" />
                        <div className="text-[11px] font-bold text-stone-800 leading-tight">{opt.dimensionsSummary}</div>
                        <div className="text-[11px] font-semibold text-stone-500">₹{opt.price.toLocaleString('en-IN')}</div>
                      </div>
                    );
                  })}
                </div>

                {canUseCustomSize ? (
                  <div
                    className={`p-3.5 rounded-xl border-2 space-y-2.5 transition-all ${
                      isCustomSize ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold uppercase tracking-wide text-stone-700">Custom size</div>
                      {isCustomSize && <Check className="w-4 h-4 text-[#0E4A93]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 text-[10px] font-bold text-stone-500 uppercase">
                        Width (in)
                        <select
                          value={customWidth}
                          onChange={(e) => {
                            setIsCustomSize(true);
                            setCustomWidth(Number(e.target.value));
                          }}
                          className="mt-1 w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-bold bg-white text-stone-900"
                        >
                          {CUSTOM_SIZE_STEPS.map((n) => (
                            <option key={n} value={n}>
                              {n}"
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="text-stone-400 text-xs font-bold pt-4">×</span>
                      <label className="flex-1 text-[10px] font-bold text-stone-500 uppercase">
                        Height (in)
                        <select
                          value={customHeight}
                          onChange={(e) => {
                            setIsCustomSize(true);
                            setCustomHeight(Number(e.target.value));
                          }}
                          className="mt-1 w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-bold bg-white text-stone-900"
                        >
                          {CUSTOM_SIZE_STEPS.map((n) => (
                            <option key={n} value={n}>
                              {n}"
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-500">
                        {customWidth}" × {customHeight}"
                      </span>
                      <span className="text-sm font-black text-[#0E4A93]">₹{customSizePrice.toLocaleString('en-IN')}</span>
                    </div>
                    {!isCustomSize && (
                      <button
                        type="button"
                        onClick={() => setIsCustomSize(true)}
                        className="w-full py-2 rounded-lg bg-[#0E4A93] hover:bg-[#09356A] text-white text-xs font-black transition-colors cursor-pointer"
                      >
                        Use custom size
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500">Custom sizes are available for single-photo canvases (Classic and Panoramic).</p>
                )}
              </div>
            </div>
          )}

          {/* ------------------------ LAYOUTS & DESIGNS ------------------------- */}
          {activeTab === 'LAYOUTS & DESIGNS' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center border-b border-stone-200 text-xs font-black uppercase tracking-wide shrink-0">
                <button
                  type="button"
                  onClick={() => setLayoutSubTab('DESIGNS')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors cursor-pointer ${
                    layoutSubTab === 'DESIGNS' ? 'border-[#0E4A93] text-[#0E4A93]' : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Designs
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSubTab('LAYOUTS')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors cursor-pointer ${
                    layoutSubTab === 'LAYOUTS' ? 'border-[#0E4A93] text-[#0E4A93]' : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Layouts
                </button>
              </div>

              {layoutSubTab === 'DESIGNS' && (
                <div className="p-4 space-y-3 overflow-y-auto">
                  <div className="relative">
                    <select
                      value={designCategory}
                      onChange={(e) => setDesignCategory(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0E4A93] appearance-none"
                    >
                      {DESIGN_TEMPLATE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {DESIGN_TEMPLATES.filter((t) => t.category === designCategory).map((tpl) => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleApplyTemplate(tpl)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center p-2.5 shadow-xs ${tpl.swatchClass} ${
                            isSelected ? 'border-[#0E4A93] ring-2 ring-[#0E4A93]/30' : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {/* Real vector decoration, not an emoji */}
                          {renderDecorSvg(tpl.decor, tpl.accent, 'absolute inset-0 w-full h-full pointer-events-none')}
                          <div className="relative w-3/5 aspect-square rounded-md bg-white/70 border border-black/10 shadow-xs" />
                          <span className="relative text-[11px] font-bold leading-tight">{tpl.name}</span>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(null);
                        setTextItems((prev) => prev.filter((t) => t.id !== 'tpl-text'));
                      }}
                      className="w-full py-1 text-rose-600 hover:underline font-bold text-center text-[11px]"
                    >
                      Remove Design/Template
                    </button>
                  )}
                </div>
              )}

              {layoutSubTab === 'LAYOUTS' && (
                <div className="p-4 space-y-2 overflow-y-auto">
                  <p className="text-[11px] text-stone-500 pb-1">
                    Choose how many photos go on your canvas — this switches the product and size to match.
                  </p>
                  {LAYOUT_PRESETS.map((preset) => {
                    const isExpanded = expandedLayoutId === preset.id;
                    const isSelected = selectedProductTypeId === preset.productTypeId && selectedSizeId === preset.sizeId;
                    return (
                      <div
                        key={preset.id}
                        className={`border rounded-xl overflow-hidden ${isSelected ? 'border-[#0E4A93]' : 'border-stone-200'}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedLayoutId(isExpanded ? null : preset.id)}
                          className={`w-full flex items-center justify-between px-3 py-3 text-xs font-bold transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/40 text-[#0E4A93]' : 'bg-white text-stone-800 hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {preset.label}
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#0E4A93]" />}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <div className="p-3 border-t border-stone-100 bg-stone-50">
                            <div
                              onClick={() => handleSelectLayoutPreset(preset)}
                              className={`cursor-pointer p-2.5 rounded-lg border-2 transition-all ${
                                isSelected ? 'border-[#0E4A93] ring-2 ring-[#0E4A93]/20' : 'border-stone-200 hover:border-stone-300 bg-white'
                              }`}
                            >
                              {renderLayoutThumbnail(preset.arrangement)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -------------------------------- SHAPE -------------------------------- */}
          {activeTab === 'SHAPE' && (
            <div className="flex flex-col h-full">
              {!shapeApplies ? (
                <div className="p-4 text-xs text-stone-500 space-y-3">
                  <p>
                    Laser-cut shapes are only available on single-panel canvases. Switch to <strong>Classic Canvas Print</strong> or{' '}
                    <strong>Panoramic Canvas Print</strong> under Products to choose a shape.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center border-b border-stone-200 text-[10px] font-black uppercase tracking-wide shrink-0">
                    {SHAPE_FILTER_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setShapeFilterCategory(tab.id)}
                        className={`flex-1 text-center py-3 border-b-2 transition-colors cursor-pointer ${
                          shapeFilterCategory === tab.id ? 'border-[#0E4A93] text-[#0E4A93]' : 'border-transparent text-stone-400 hover:text-stone-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 grid grid-cols-3 gap-2.5 overflow-y-auto">
                    {filteredShapes.map((shape) => {
                      const isSelected = selectedShapeId === shape.id;
                      return (
                        <div
                          key={shape.id}
                          onClick={() => setSelectedShapeId(shape.id)}
                          className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                            isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-400 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <div
                            className="w-full aspect-square bg-gradient-to-br from-[#0E4A93]/70 to-[#0E4A93]/30"
                            style={{ clipPath: shape.clipPathStyle, WebkitClipPath: shape.clipPathStyle }}
                          />
                          <div className="text-[10px] font-bold text-stone-800 leading-tight">{shape.name}</div>
                          <div className="text-[10px] font-semibold text-stone-500">{shape.priceAddon === 0 ? 'Included' : `+₹${shape.priceAddon}`}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* --------------------------- WRAP & BORDER --------------------------- */}
          {activeTab === 'WRAP & BORDER' && (
            <div className="flex flex-col">
              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Wrap</div>
              <div className="p-4 grid grid-cols-2 gap-2.5">
                {WRAP_OPTIONS.map((w) => {
                  const isSelected = selectedWrapId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWrapId(w.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer text-center space-y-1.5 ${
                        isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      {w.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase bg-[#E8752A] text-white px-2 py-0.5 rounded shadow-xs whitespace-nowrap z-10">
                          {w.badge}
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center z-10">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {/* Realistic 3D Isometric Wrap Corner Preview like CanvasChamp */}
                      {renderWrapPreview(w.id)}
                      <div className="text-[11px] font-bold text-stone-800 leading-tight">
                        {w.label} {w.depth && <span className="text-stone-400">({w.depth})</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-stone-500">{w.price === 0 ? 'Included' : `+₹${w.price}`}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Mirror Image</div>
              <div className="p-4">
                <label
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    mirrorImage ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <FlipHorizontal2 className="w-4 h-4 text-stone-500" />
                    Flip photo horizontally
                  </span>
                  <input type="checkbox" checked={mirrorImage} onChange={(e) => setMirrorImage(e.target.checked)} className="accent-[#0E4A93] w-4 h-4" />
                </label>
                {!shapeApplies && <p className="text-[11px] text-stone-400 mt-1.5">Applies to the active photo panel.</p>}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Border</div>
              {!shapeApplies ? (
                <div className="p-4 text-[11px] text-stone-500">
                  A print border is only available on single-panel canvases. Switch to Classic or Panoramic Canvas under Products.
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {ACRYLIC_BORDER_WIDTHS.map((bw) => {
                      const isSelected = selectedBorderWidthId === bw.id;
                      return (
                        <button
                          key={bw.id}
                          type="button"
                          onClick={() => setSelectedBorderWidthId(bw.id)}
                          className={`py-2.5 px-1 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            isSelected ? 'border-[#0E4A93] bg-blue-50/30 text-[#0E4A93]' : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                          }`}
                        >
                          {/* Mockup: photo swatch with a border ring sized to the real width */}
                          <div
                            className="w-9 h-9 mx-auto mb-1.5 rounded-xs"
                            style={{ backgroundColor: bw.widthPx === 0 ? 'transparent' : selectedBorderColor, padding: `${Math.min(bw.widthPx, 10)}px` }}
                          >
                            <div className="w-full h-full rounded-xs bg-gradient-to-br from-sky-200 to-emerald-200" />
                          </div>
                          <div className="text-[10px] font-black leading-tight">{bw.label.split(' ')[0]}</div>
                          <div className="text-[9px] text-stone-400 mt-0.5">
                            {CANVAS_BORDER_WIDTH_PRICES[bw.id] === 0 ? 'Free' : `+₹${CANVAS_BORDER_WIDTH_PRICES[bw.id]}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedBorderWidthId !== 'none' && (
                    <div className="flex items-center gap-2">
                      {ACRYLIC_BORDER_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setSelectedBorderColor(c.hex)}
                          title={c.name}
                          style={{ backgroundColor: c.hex }}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            selectedBorderColor === c.hex ? 'ring-2 ring-[#0E4A93] ring-offset-2' : 'border-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Frames</div>
              {!shapeApplies ? (
                <div className="p-4 text-[11px] text-stone-500">
                  An outer frame is only available on single-panel canvases. Switch to Classic or Panoramic Canvas under Products.
                </div>
              ) : (
                <div className="p-4 grid grid-cols-3 gap-2.5">
                  {FRAME_OPTIONS.map((f) => {
                    const isSelected = selectedFrameId === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFrameId(f.id)}
                        className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center space-y-1 ${
                          isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {/* Mockup: a small photo sitting inside this frame's actual border color */}
                        <div
                          className="w-11 h-11 rounded mx-auto p-1.5"
                          style={
                            f.id === 'no-frame'
                              ? {
                                  backgroundImage:
                                    'repeating-conic-gradient(#d6d3d1 0% 25%, #f5f5f4 0% 50%)',
                                  backgroundSize: '8px 8px',
                                  border: '1px solid #d6d3d1'
                                }
                              : { backgroundColor: f.color, border: f.color === '#ffffff' ? '1px solid #d6d3d1' : undefined }
                          }
                        >
                          <div className="w-full h-full rounded-xs bg-gradient-to-br from-sky-200 to-emerald-200" />
                        </div>
                        <div className="text-[10px] font-bold text-stone-800 leading-tight">{f.name}</div>
                        <div className="text-[10px] font-semibold text-stone-500">{f.price === 0 ? 'Free' : `+₹${f.price.toFixed(0)}`}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -------------------------- HARDWARE & FINISH ------------------------- */}
          {activeTab === 'HARDWARE & FINISH' && (
            <div className="flex flex-col">
              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Hardware Option &amp; Style</div>
              <div className="p-4 grid grid-cols-3 gap-2.5">
                {HARDWARE_OPTIONS.map((hw) => {
                  const isSelected = selectedHardwareId === hw.id;
                  return (
                    <div
                      key={hw.id}
                      onClick={() => setSelectedHardwareId(hw.id)}
                      className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center space-y-1.5 ${
                        isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {/* Realistic Hardware / Hook Icon */}
                      {renderHardwareIcon(hw.id)}
                      <div className="text-[10px] font-bold text-stone-800 leading-tight">{hw.label}</div>
                      <div className="text-[10px] font-semibold text-stone-500">{hw.price === 0 ? 'Free' : `₹${hw.price}`}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Display Option</div>
              <div className="p-4 space-y-2">
                {DISPLAY_OPTIONS.map((opt) => {
                  const isSelected = selectedDisplayOptionId === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold text-stone-800">
                        <input
                          type="radio"
                          name="display-option"
                          checked={isSelected}
                          onChange={() => setSelectedDisplayOptionId(opt.id)}
                          className="accent-[#0E4A93]"
                        />
                        {opt.label} ({opt.price === 0 ? '₹0.00' : `₹${opt.price.toFixed(2)}`})
                      </span>
                      <Info className="w-3.5 h-3.5 text-stone-400" />
                    </label>
                  );
                })}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Optional Color Finishing</div>
              <div className="p-4 space-y-2">
                <div className="text-[11px] font-bold text-stone-600">Basic</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {COLOR_FINISH_OPTIONS.map((cf) => {
                    const activePanelFilter = panelImages[activePanelIndex]?.filter || 'original';
                    const isSelected = activePanelFilter === cf.id;
                    const previewImage = panelImages[activePanelIndex]?.imageUrl;
                    return (
                      <div
                        key={cf.id}
                        onClick={() => handleApplyFilter(cf.id)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer bg-stone-100 ${
                          isSelected ? 'border-[#0E4A93] ring-2 ring-[#0E4A93]/30' : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {previewImage ? (
                          <img src={previewImage} alt={cf.label} style={{ filter: getFilterCss(cf.id) }} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold text-center py-0.5">
                          {cf.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-stone-400">Free — applies to the active photo panel.</div>
              </div>
            </div>
          )}

          {/* ------------------------------ OPTIONS ------------------------------ */}
          {activeTab === 'OPTIONS' && (
            <div className="flex flex-col">
              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Lamination Options</div>
              <div className="p-4 space-y-2">
                {LAMINATION_OPTIONS.map((lam) => {
                  const isSelected = selectedLaminationId === lam.id;
                  return (
                    <label
                      key={lam.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold text-stone-800">
                        <input
                          type="radio"
                          name="lamination"
                          checked={isSelected}
                          onChange={() => setSelectedLaminationId(lam.id)}
                          className="accent-[#0E4A93]"
                        />
                        {lam.label}
                      </span>
                      <span className="text-xs font-black text-stone-700">{lam.price === 0 ? '' : `(₹${lam.price.toFixed(2)})`}</span>
                    </label>
                  );
                })}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Minor Photo Retouching</div>
              <div className="p-4 grid grid-cols-2 gap-2.5">
                {RETOUCH_CHECKS.map((rc) => (
                  <label key={rc.id} className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(retouchChecks[rc.id])}
                      onChange={(e) => setRetouchChecks((prev) => ({ ...prev, [rc.id]: e.target.checked }))}
                      className="accent-[#0E4A93] w-4 h-4"
                    />
                    {rc.label}
                  </label>
                ))}
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Major Retouching</div>
              <div className="p-4 space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Requirements for retouching</label>
                <textarea
                  value={majorRetouchText}
                  onChange={(e) => setMajorRetouchText(e.target.value)}
                  rows={3}
                  placeholder="Describe any major retouching you'd like our team to do..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-[#0E4A93]"
                />
              </div>

              <div className="bg-stone-700 text-white text-xs font-black uppercase tracking-wide px-4 py-2.5">Proof Request</div>
              <div className="p-4 space-y-2">
                <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proofRequested}
                    onChange={(e) => setProofRequested(e.target.checked)}
                    className="accent-[#0E4A93] w-4 h-4 mt-0.5 shrink-0"
                  />
                  <span>
                    Email with link to the design proof will be emailed within 24 hours and has to be approved online. Approve
                    your proof as quickly as possible to avoid delays in production and shipping times.
                  </span>
                </label>
                <p className="text-[11px] text-stone-400">
                  <strong>Note:</strong> All prints manufactured by Canvas India are handmade and might have a ± 1 inch
                  variation from the size ordered.
                </p>
              </div>

              <div className="p-4 space-y-2 border-t border-stone-100">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Quantity:</label>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-stone-300 rounded-xl bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="px-3.5 py-2 text-stone-600 hover:text-stone-950 font-black cursor-pointer"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-xs font-bold text-stone-900 min-w-[36px] text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="px-3.5 py-2 text-stone-600 hover:text-stone-950 font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">
                    Total: <strong className="text-stone-900">₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* COLUMN 3: MAIN RIGHT DESIGN WORKSPACE                               */}
        {/* ------------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col h-full bg-[#FAFAFA] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Top Yellow Instruction Banner */}
          <div className="w-full bg-[#FEF08A] text-stone-900 text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 border-b border-amber-300 shadow-xs z-10">
            <Move className="w-3.5 h-3.5 text-stone-900" />
            <span>Click and drag within the print lines to Adjust your Photo.</span>
          </div>

          {/* Top-Right Workspace Quick Tools */}
          <div className="absolute top-10 right-4 flex flex-wrap items-center justify-end gap-2 z-20 max-w-[70%]">
            <button
              type="button"
              onClick={handleSaveDesign}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-900 rounded-lg text-xs font-bold shadow-xs border border-stone-200 transition-all cursor-pointer"
              title="Save design to browser"
            >
              <Save className="w-3.5 h-3.5 text-stone-600" />
              <span>SAVE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (showTextPopover) {
                  setShowTextPopover(false);
                } else if (textItems.length === 0) {
                  addTextItem();
                } else {
                  setShowTextPopover(true);
                  setShowClipartPopover(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs border transition-all cursor-pointer ${
                showTextPopover ? 'bg-[#0E4A93] text-white border-[#0E4A93]' : 'bg-white/95 hover:bg-white text-stone-700 hover:text-stone-900 border-stone-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>ADD TEXT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowClipartPopover(!showClipartPopover);
                setShowTextPopover(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs border transition-all cursor-pointer ${
                showClipartPopover ? 'bg-[#0E4A93] text-white border-[#0E4A93]' : 'bg-white/95 hover:bg-white text-stone-700 hover:text-stone-900 border-stone-200'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>ADD CLIPART</span>
            </button>

            {(
              [
                { label: 'ROOM VIEW', icon: Eye, mode: 'room' as const },
                { label: '3D VIEW', icon: Box, mode: '3d' as const },
                { label: '360° VIEW', icon: RotateCw, mode: '360' as const }
              ]
            ).map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => {
                    setViewerRotation(tool.mode === '3d' ? -28 : 0);
                    setViewerAutoRotate(tool.mode === '360');
                    setViewerMode(tool.mode);
                  }}
                  className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-900 rounded-lg text-xs font-bold shadow-xs border border-stone-200 transition-all cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-stone-600" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Floating Tool Popover: ADD TEXT */}
          {showTextPopover && (
            <div className="absolute top-22 right-4 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 text-xs z-30 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between font-black text-stone-900 pb-2 border-b border-stone-100">
                <span>{selectedTextItem ? 'Edit Text' : 'Text'}</span>
                <button onClick={() => setShowTextPopover(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedTextItem ? (
                <>
                  <input
                    type="text"
                    value={selectedTextItem.text}
                    onChange={(e) => updateTextItem(selectedTextItem.id, { text: e.target.value })}
                    placeholder="Type your text"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#0E4A93]"
                  />

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-600">Font style</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateTextItem(selectedTextItem.id, { fontId: f.id })}
                          className={`px-1.5 py-2 rounded-lg border text-center leading-tight cursor-pointer transition-colors ${
                            selectedTextItem.fontId === f.id ? 'border-[#0E4A93] bg-blue-50 text-[#0E4A93]' : 'border-stone-200 hover:border-stone-400 text-stone-700'
                          }`}
                        >
                          <div className="text-base" style={{ fontFamily: f.family }}>Aa</div>
                          <div className="text-[9px] font-bold text-stone-500">{f.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateTextItem(selectedTextItem.id, { bold: !selectedTextItem.bold })}
                      className={`w-9 py-1.5 rounded-lg border font-black cursor-pointer ${selectedTextItem.bold ? 'border-[#0E4A93] bg-blue-50 text-[#0E4A93]' : 'border-stone-200 text-stone-600'}`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTextItem(selectedTextItem.id, { italic: !selectedTextItem.italic })}
                      className={`w-9 py-1.5 rounded-lg border italic font-bold cursor-pointer ${selectedTextItem.italic ? 'border-[#0E4A93] bg-blue-50 text-[#0E4A93]' : 'border-stone-200 text-stone-600'}`}
                    >
                      I
                    </button>
                    <span className="text-[11px] font-bold text-stone-600 ml-2 whitespace-nowrap">Size {selectedTextItem.size}px</span>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={selectedTextItem.size}
                      onChange={(e) => updateTextItem(selectedTextItem.id, { size: Number(e.target.value) })}
                      className="flex-1 accent-[#0E4A93]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-600">Colour</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {TEXT_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => updateTextItem(selectedTextItem.id, { color: col })}
                          style={{ backgroundColor: col }}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${selectedTextItem.color === col ? 'ring-2 ring-[#0E4A93] ring-offset-1' : 'border-stone-300'}`}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedTextItem.color}
                        onChange={(e) => updateTextItem(selectedTextItem.id, { color: e.target.value })}
                        className="w-7 h-7 p-0 border border-stone-300 rounded cursor-pointer"
                        title="Custom colour"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Move className="w-3 h-3" /> Drag the text on the canvas to move it anywhere.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addTextItem()} className="flex-1 py-2 rounded-lg bg-[#0E4A93] hover:bg-[#09356A] text-white font-black cursor-pointer">
                      + Add another
                    </button>
                    <button type="button" onClick={removeSelectedItem} className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {textItems.length === 0 ? (
                    <p className="text-stone-500">No text yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {textItems.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedItem({ type: 'text', id: t.id })}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-[#0E4A93] truncate cursor-pointer"
                        >
                          {t.text || '(empty)'}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => addTextItem()} className="w-full py-2 rounded-lg bg-[#0E4A93] hover:bg-[#09356A] text-white font-black cursor-pointer">
                    + Add text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Floating Tool Popover: ADD CLIPART */}
          {showClipartPopover && (
            <div className="absolute top-22 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 text-xs z-30 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between font-black text-stone-900 pb-2 border-b border-stone-100">
                <span>Select Clipart / Sticker</span>
                <button onClick={() => setShowClipartPopover(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5 text-xl text-center">
                {CLIPART_ITEMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addClipItem(item)}
                    className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:scale-110 hover:border-[#0E4A93] transition-transform cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
              {selectedClipItem && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-600 whitespace-nowrap">Size {selectedClipItem.size}px</span>
                    <input
                      type="range"
                      min={20}
                      max={220}
                      value={selectedClipItem.size}
                      onChange={(e) => updateClipItem(selectedClipItem.id, { size: Number(e.target.value) })}
                      className="flex-1 accent-[#0E4A93]"
                    />
                  </div>
                  <button type="button" onClick={removeSelectedItem} className="w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold cursor-pointer">
                    Remove this clipart
                  </button>
                </div>
              )}
              <p className="text-[11px] text-stone-400 flex items-center gap-1">
                <Move className="w-3 h-3" /> Tap to add, then drag it anywhere on the canvas.
              </p>
            </div>
          )}

          {/* Notification Toast for Save */}
          {saveToast && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-30 animate-in fade-in slide-in-from-top-2">
              {saveToast}
            </div>
          )}

          {/* Center Stage / Design Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            {/* Left Chevron Button: Prev Step */}
            <button
              type="button"
              onClick={() => setActiveTab(prevTab.id)}
              disabled={activeTabIndex === 0}
              className={`hidden lg:flex flex-col items-center justify-center absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 p-3 rounded-xl shadow-md border border-stone-200 transition-all group z-20 ${
                activeTabIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-stone-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black tracking-tight uppercase mt-0.5 max-w-[64px] leading-tight">{prevTab.label}</span>
            </button>

            {/* Right Chevron Button: Next Step */}
            <button
              type="button"
              onClick={() => setActiveTab(nextTab.id)}
              disabled={activeTabIndex === TOOLBAR_ITEMS.length - 1}
              className={`hidden lg:flex flex-col items-center justify-center absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 p-3 rounded-xl shadow-md border border-stone-200 transition-all group z-20 ${
                activeTabIndex === TOOLBAR_ITEMS.length - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black tracking-tight uppercase mt-0.5 max-w-[64px] leading-tight">{nextTab.label}</span>
            </button>

            {/* CANVAS PANELS PREVIEW CONTAINER */}
            <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl w-full">
              {/* Dimension rulers (single-panel products only) */}
              {panels.length === 1 && (
                <>
                  <div className="hidden sm:flex items-center gap-2 mb-2 text-[10px] font-bold text-stone-400">
                    <span className="w-24 border-t border-dashed border-stone-300" />
                    <span className="px-2.5 py-0.5 rounded-full border border-stone-300 bg-white shadow-xs">
                      {isCustomSize && canUseCustomSize ? `${customWidth} inch` : `${panels[0].widthRatio} inch`}
                    </span>
                    <span className="w-24 border-t border-dashed border-stone-300" />
                  </div>
                  <div className="hidden sm:flex items-center gap-1 self-start ml-2 mb-[-1.5rem]">
                    <Ban className="w-3.5 h-3.5 text-stone-300" />
                  </div>
                </>
              )}

              {/* Stage: everything the customer designs on (frames + movable text/clipart) */}
              <div ref={stageRef} className="relative w-full flex flex-col items-center" onPointerDown={() => setSelectedItem(null)}>

              {/* WALL DISPLAY 3-PIECE LAYOUT */}
              {selectedProductTypeId === 'canvas-wall-art' && panels.length === 3 && (
                <div className="flex flex-col items-center gap-3.5 w-full max-w-lg">
                  <div
                    {...panelHandlers(0)}
                    className={`relative w-full aspect-[18/12] bg-white rounded-lg overflow-hidden transition-all cursor-pointer group border-2 ${
                      activePanelIndex === 0 ? 'border-[#0E4A93] shadow-2xl ring-2 ring-[#0E4A93]/30' : 'border-stone-300 shadow-md hover:border-stone-400'
                    }`}
                  >
                    {dragOverPanel === 0 && <div className="absolute inset-0 z-30 bg-[#E8752A]/25 border-4 border-dashed border-[#E8752A] pointer-events-none" />}
                    {panelImages[0]?.imageUrl ? (
                      <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
                        <img
                          src={panelImages[0].imageUrl}
                          alt="Panel 1"
                          style={{
                            transform: `translate(${panelImages[0].panX}px, ${panelImages[0].panY}px) scale(${panelImages[0].scale}) rotate(${panelImages[0].rotation}deg)`,
                            filter: getFilterCss(panelImages[0].filter),
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                          }}
                          className="max-w-none w-full h-full object-cover pointer-events-none"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-orange-50 text-[#E8752A] flex items-center justify-center mb-1 shadow-xs">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-600">Panel 1 (12" × 18")</span>
                        <span className="text-[10px] text-stone-400">Click to upload photo</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded z-20">12" × 18"</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 w-full">
                    {[1, 2].map((panelIdx) => (
                      <div
                        key={panelIdx}
                        {...panelHandlers(panelIdx)}
                        className={`relative w-full aspect-[8/10] bg-white rounded-lg overflow-hidden transition-all cursor-pointer group border-2 ${
                          activePanelIndex === panelIdx ? 'border-[#0E4A93] shadow-2xl ring-2 ring-[#0E4A93]/30' : 'border-stone-300 shadow-md hover:border-stone-400'
                        }`}
                      >
                        {dragOverPanel === panelIdx && <div className="absolute inset-0 z-30 bg-[#E8752A]/25 border-4 border-dashed border-[#E8752A] pointer-events-none" />}
                        {panelImages[panelIdx]?.imageUrl ? (
                          <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
                            <img
                              src={panelImages[panelIdx].imageUrl!}
                              alt={`Panel ${panelIdx + 1}`}
                              style={{
                                transform: `translate(${panelImages[panelIdx].panX}px, ${panelImages[panelIdx].panY}px) scale(${panelImages[panelIdx].scale}) rotate(${panelImages[panelIdx].rotation}deg)`,
                                filter: getFilterCss(panelImages[panelIdx].filter),
                                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                              }}
                              className="max-w-none w-full h-full object-cover pointer-events-none"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-orange-50 text-[#E8752A] flex items-center justify-center mb-1 shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-stone-600">Panel {panelIdx + 1} (10" × 8")</span>
                            <span className="text-[10px] text-stone-400">Click to upload</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded z-20">10" × 8"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SINGLE PANEL LAYOUTS (Classic, Panoramic) — shape, border & frame aware */}
              {selectedProductTypeId !== 'canvas-wall-art' && panels.length === 1 && (() => {
                const frameOption = FRAME_OPTIONS.find((f) => f.id === selectedFrameId);
                const borderWidthPx = ACRYLIC_BORDER_WIDTHS.find((b) => b.id === selectedBorderWidthId)?.widthPx || 0;
                const panelBox = (
                  <div
                    {...panelHandlers(0)}
                    className={`relative ${currentShape.borderRadiusClass} bg-white overflow-hidden transition-all cursor-pointer group border-2 ${
                      activePanelIndex === 0 ? 'border-[#0E4A93] shadow-2xl ring-2 ring-[#0E4A93]/30' : 'border-stone-300 shadow-md hover:border-stone-400'
                    }`}
                    style={{
                      aspectRatio: String(printAspect),
                      width: `min(28rem, calc(56vh * ${printAspect}))`,
                      maxWidth: '100%',
                      clipPath: currentShape.clipPathStyle,
                      WebkitClipPath: currentShape.clipPathStyle
                    }}
                  >
                    {dragOverPanel === 0 && <div className="absolute inset-0 z-30 bg-[#E8752A]/25 border-4 border-dashed border-[#E8752A] pointer-events-none" />}
                    {panelImages[0]?.imageUrl ? (
                      <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
                        <img
                          src={panelImages[0].imageUrl}
                          alt="Canvas Print"
                          style={{
                            transform: `translate(${panelImages[0].panX}px, ${panelImages[0].panY}px) scale(${panelImages[0].scale}) rotate(${panelImages[0].rotation}deg) scaleX(${mirrorImage ? -1 : 1})`,
                            filter: getFilterCss(panelImages[0].filter),
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                          }}
                          className="max-w-none w-full h-full object-cover pointer-events-none"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-[#E8752A] flex items-center justify-center mb-1.5 shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#E8752A]">Upload an Image</span>
                        <span className="text-[11px] text-stone-400 mt-0.5">Maximum upload size: 25MB per file</span>
                      </div>
                    )}

                    {borderWidthPx > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none z-25"
                        style={{ border: `${borderWidthPx}px solid ${selectedBorderColor}`, borderRadius: currentShape.id === 'shape-circle' ? '9999px' : undefined }}
                      />
                    )}

                    {/* Applied design template: real vector decoration, not an emoji */}
                    {activeTemplate && renderDecorSvg(activeTemplate.decor, activeTemplate.accent, 'absolute inset-0 w-full h-full pointer-events-none z-25')}

                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded z-20">
                      {isCustomSize && canUseCustomSize ? `${customWidth}" × ${customHeight}"` : currentSizeOption.dimensionsSummary}
                    </div>
                  </div>
                );

                if (frameOption && frameOption.id !== 'no-frame') {
                  return (
                    <div className="p-3 rounded-2xl shadow-xl mx-auto w-fit max-w-full" style={{ background: frameOption.color }}>
                      {panelBox}
                    </div>
                  );
                }
                return panelBox;
              })()}

              {/* SPLIT CANVAS (3-Panel Triptych Layout) */}
              {selectedProductTypeId === 'canvas-split' && panels.length === 3 && renderGridPanels([0, 1, 2], 'grid-cols-3')}

              {/* PHOTO COLLAGE (2 / 3 / 4-Grid Layouts) */}
              {selectedProductTypeId === 'canvas-collage' && panels.length === 2 && renderGridPanels([0, 1], 'grid-cols-2')}
              {selectedProductTypeId === 'canvas-collage' && panels.length === 3 && renderGridPanels([0, 1, 2], 'grid-cols-3')}
              {selectedProductTypeId === 'canvas-collage' && panels.length === 4 && renderGridPanels([0, 1, 2, 3], 'grid-cols-2')}

              {/* Movable text + clipart: drag anywhere on the print */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                {textItems.map((t) => {
                  const isSel = selectedItem?.type === 'text' && selectedItem.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onPointerDown={(e) => startItemDrag(e, 'text', t.id, t.x, t.y)}
                      onPointerMove={(e) => moveItemDrag(e, 'text', t.id)}
                      onPointerUp={endItemDrag}
                      onPointerCancel={endItemDrag}
                      style={{
                        position: 'absolute',
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: FONT_OPTIONS.find((f) => f.id === t.fontId)?.family,
                        fontSize: `${t.size}px`,
                        fontWeight: t.bold ? 800 : 500,
                        fontStyle: t.italic ? 'italic' : 'normal',
                        color: t.color,
                        whiteSpace: 'pre',
                        lineHeight: 1.15,
                        textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                        pointerEvents: 'auto',
                        touchAction: 'none'
                      }}
                      className={`cursor-move select-none px-1.5 py-0.5 rounded ${isSel ? 'outline outline-2 outline-dashed outline-[#0E4A93] bg-black/10' : 'hover:outline hover:outline-1 hover:outline-white/70'}`}
                    >
                      {t.text || ' '}
                    </div>
                  );
                })}
                {clipItems.map((c) => {
                  const isSel = selectedItem?.type === 'clip' && selectedItem.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onPointerDown={(e) => startItemDrag(e, 'clip', c.id, c.x, c.y)}
                      onPointerMove={(e) => moveItemDrag(e, 'clip', c.id)}
                      onPointerUp={endItemDrag}
                      onPointerCancel={endItemDrag}
                      style={{
                        position: 'absolute',
                        left: `${c.x}%`,
                        top: `${c.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${c.size}px`,
                        lineHeight: 1,
                        pointerEvents: 'auto',
                        touchAction: 'none'
                      }}
                      className={`cursor-move select-none rounded ${isSel ? 'outline outline-2 outline-dashed outline-[#0E4A93] bg-black/10' : ''}`}
                    >
                      {c.emoji}
                    </div>
                  );
                })}
              </div>

              </div>

              {/* FLOATING TRANSFORM CONTROLS FOR ACTIVE PANEL */}
              {panelImages[activePanelIndex]?.imageUrl && (
                <div className="flex items-center gap-1.5 mt-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-stone-200 z-20">
                  <button type="button" onClick={handleZoomIn} className="p-1.5 text-stone-700 hover:text-[#0E4A93] hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Zoom In (+15%)">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={handleZoomOut} className="p-1.5 text-stone-700 hover:text-[#0E4A93] hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Zoom Out (-15%)">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-stone-200 mx-0.5" />
                  <button type="button" onClick={handleRotate90} className="p-1.5 text-stone-700 hover:text-[#0E4A93] hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Rotate 90°">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={handleFit} className="p-1.5 text-stone-700 hover:text-[#0E4A93] hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-xs font-bold" title="Fit to bounds">
                    Fit
                  </button>
                  <button type="button" onClick={handleReset} className="p-1.5 text-stone-700 hover:text-[#0E4A93] hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Reset transformations">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-stone-200 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      setPanelImages((prev) => ({ ...prev, [activePanelIndex]: createDefaultPanel() }));
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Remove this photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom Button: CHANGE MATERIAL (Canvas India Blue #0E4A93) */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setMaterialModalOpen(true)}
                  className="px-6 py-2.5 bg-[#0E4A93] hover:bg-[#09356A] active:scale-[0.99] text-white text-xs font-black rounded-lg shadow-md transition-all cursor-pointer tracking-wider uppercase"
                >
                  CHANGE MATERIAL
                </button>
              </div>
            </div>
          </div>

          {/* Validation Prompt Banner if Photos Missing */}
          {!isComplete && (
            <div className="bg-amber-50 border-t border-amber-200 py-2 px-4 text-center text-xs font-bold text-amber-900 z-10">
              Upload an image to continue with your personalized canvas order.
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* 3. POPUP MODALS                                                       */}
      {/* ===================================================================== */}

      {/* ROOM / 3D / 360 VIEWER */}
      {viewerMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                {viewerMode === 'room' && (
                  <>
                    <Eye className="w-4 h-4" /> Room View
                  </>
                )}
                {viewerMode === '3d' && (
                  <>
                    <Box className="w-4 h-4" /> 3D View
                  </>
                )}
                {viewerMode === '360' && (
                  <>
                    <RotateCw className="w-4 h-4" /> 360&deg; View
                  </>
                )}
              </h3>
              <button onClick={() => setViewerMode(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewerMode === 'room' &&
              (() => {
                const photo = panelImages[activePanelIndex]?.imageUrl || panelImages[0]?.imageUrl || uploadedPhotos[0];
                const isTabletop = selectedHardwareId === 'easel-back';
                return (
                  <div>
                    <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-stone-100">
                      {renderRoomScene(roomBackdrop)}

                      {!isTabletop && renderHardwareGraphic(selectedHardwareId, true) && (
                        <div className="absolute top-[13%] left-[16%]">{renderHardwareGraphic(selectedHardwareId, true)}</div>
                      )}

                      <div
                        className={`absolute left-[16%] w-[26%] ${shapeApplies ? currentShape.aspectClass : 'aspect-[4/3]'} shadow-2xl bg-white`}
                        style={{
                          top: isTabletop ? '54%' : '17%',
                          clipPath: shapeApplies ? currentShape.clipPathStyle : undefined,
                          WebkitClipPath: shapeApplies ? currentShape.clipPathStyle : undefined
                        }}
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt="Room preview"
                            style={{ filter: getFilterCss(panelImages[activePanelIndex]?.filter || 'original') }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px] text-center p-2">
                            Upload a photo to preview it on the wall
                          </div>
                        )}
                      </div>

                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs whitespace-nowrap">
                        Preview is for illustration only — actual room may differ
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 border-t border-stone-100">
                      {(['living', 'office', 'bedroom'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setRoomBackdrop(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                            roomBackdrop === b ? 'bg-[#0E4A93] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

            {(viewerMode === '3d' || viewerMode === '360') &&
              (() => {
                const depthPx = (WRAP_OPTIONS.find((w) => w.id === selectedWrapId)?.depthPx || 10) * 1.6;
                const frameColor = FRAME_OPTIONS.find((f) => f.id === selectedFrameId)?.color;
                const clip = shapeApplies ? { clipPath: currentShape.clipPathStyle, WebkitClipPath: currentShape.clipPathStyle } : {};
                const edgeColor = selectedBorderWidthId !== 'none' ? selectedBorderColor : '#92400e';
                const is360 = viewerMode === '360';

                // The whole product (every panel), not just the first photo
                const faceImg = (idx: number) => {
                  const p = panelImages[idx];
                  return p?.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={`Photo ${idx + 1}`}
                      draggable={false}
                      style={{
                        filter: getFilterCss(p.filter),
                        transform: `translate(${p.panX}px, ${p.panY}px) scale(${p.scale}) rotate(${p.rotation}deg) scaleX(${mirrorImage ? -1 : 1})`
                      }}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 text-[10px] font-bold">Photo {idx + 1}</div>
                  );
                };
                const faceContent =
                  panels.length === 1 ? (
                    faceImg(0)
                  ) : selectedProductTypeId === 'canvas-wall-art' ? (
                    <div className="w-full h-full flex flex-col gap-1 p-1 bg-white">
                      <div className="flex-[1.4] min-h-0 overflow-hidden">{faceImg(0)}</div>
                      <div className="flex-1 min-h-0 grid grid-cols-2 gap-1">
                        <div className="overflow-hidden">{faceImg(1)}</div>
                        <div className="overflow-hidden">{faceImg(2)}</div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full grid gap-1 p-1 bg-white"
                      style={{ gridTemplateColumns: `repeat(${panels.length === 4 ? 2 : panels.length}, minmax(0, 1fr))` }}
                    >
                      {panels.map((_, i) => (
                        <div key={i} className="min-h-0 overflow-hidden">
                          {faceImg(i)}
                        </div>
                      ))}
                    </div>
                  );

                const aspect =
                  panels.length === 1 ? printAspect : selectedProductTypeId === 'canvas-wall-art' ? 1.05 : selectedProductTypeId === 'canvas-split' ? 1.5 : panels.length === 2 ? 2 : panels.length === 3 ? 1.5 : 1;
                let cardW = 200 * aspect;
                let cardH = 200;
                if (cardW > 300) {
                  cardW = 300;
                  cardH = 300 / aspect;
                }
                const angle = ((viewerRotation % 360) + 360) % 360;

                return (
                  <div>
                    <div className="bg-amber-100 text-amber-900 text-[10px] font-bold px-3 py-1.5 text-center">
                      Preview shown is for illustration purpose only — may differ from the actual product
                    </div>
                    <div
                      className="relative h-80 sm:h-96 w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                      style={{
                        perspective: is360 ? '1100px' : '750px',
                        background: is360 ? 'radial-gradient(ellipse at 50% 85%, #e7e5e4 0%, #f5f5f4 60%)' : '#f5f5f4'
                      }}
                      onPointerDown={handleViewerPointerDown}
                      onPointerMove={handleViewerPointerMove}
                      onPointerUp={handleViewerPointerUp}
                      onPointerLeave={handleViewerPointerUp}
                    >
                      {is360 && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 h-6 rounded-[50%] bg-black/15 blur-md pointer-events-none" />
                      )}
                      <div
                        className="relative"
                        style={{
                          width: cardW,
                          height: cardH,
                          transformStyle: 'preserve-3d',
                          transform: `rotateX(${is360 ? 4 : 10}deg) rotateY(${viewerRotation}deg)`,
                          transition: viewerDragRef.current || viewerAutoRotate ? 'none' : 'transform 0.35s ease-out'
                        }}
                      >
                        {/* Front face: the whole design, masked to the selected shape */}
                        <div
                          className={`absolute inset-0 bg-white overflow-hidden ${shapeApplies ? currentShape.borderRadiusClass : ''}`}
                          style={{
                            transform: `translateZ(${depthPx / 2}px)`,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            border: shapeApplies && frameColor && selectedFrameId !== 'no-frame' ? `6px solid ${frameColor}` : undefined,
                            ...clip
                          }}
                        >
                          {faceContent}
                          {textItems.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                position: 'absolute',
                                left: `${t.x}%`,
                                top: `${t.y}%`,
                                transform: 'translate(-50%, -50%)',
                                fontFamily: FONT_OPTIONS.find((f) => f.id === t.fontId)?.family,
                                fontSize: `${t.size * (cardW / 448)}px`,
                                fontWeight: t.bold ? 800 : 500,
                                fontStyle: t.italic ? 'italic' : 'normal',
                                color: t.color,
                                whiteSpace: 'pre',
                                textShadow: '0 1px 3px rgba(0,0,0,0.45)'
                              }}
                            >
                              {t.text}
                            </div>
                          ))}
                          {clipItems.map((c) => (
                            <div
                              key={c.id}
                              style={{ position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${c.size * (cardW / 448)}px`, lineHeight: 1 }}
                            >
                              {c.emoji}
                            </div>
                          ))}
                        </div>

                        {/* Back face: canvas backing + the actual hanging hardware */}
                        <div
                          className={`absolute inset-0 bg-stone-800 overflow-hidden ${shapeApplies ? currentShape.borderRadiusClass : ''}`}
                          style={{
                            transform: `translateZ(${-depthPx / 2}px) rotateY(180deg)`,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            ...clip
                          }}
                        >
                          {renderHardwareGraphic(selectedHardwareId, false)}
                        </div>

                        {/* Side edges: the wrap depth in the border colour (left, right, top, bottom) */}
                        <div
                          className="absolute top-0 right-0 h-full"
                          style={{ width: depthPx, transform: `translateZ(${-depthPx / 2}px) rotateY(90deg)`, transformOrigin: 'right center', background: edgeColor, filter: 'brightness(0.85)' }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full"
                          style={{ width: depthPx, transform: `translateZ(${-depthPx / 2}px) rotateY(-90deg)`, transformOrigin: 'left center', background: edgeColor, filter: 'brightness(0.8)' }}
                        />
                        <div
                          className="absolute top-0 left-0 w-full"
                          style={{ height: depthPx, transform: `translateZ(${-depthPx / 2}px) rotateX(90deg)`, transformOrigin: 'top center', background: edgeColor, filter: 'brightness(1.05)' }}
                        />
                        <div
                          className="absolute bottom-0 left-0 w-full"
                          style={{ height: depthPx, transform: `translateZ(${-depthPx / 2}px) rotateX(-90deg)`, transformOrigin: 'bottom center', background: edgeColor, filter: 'brightness(0.7)' }}
                        />
                      </div>
                      <div className="absolute top-2 right-3 text-[10px] font-bold text-stone-400 tabular-nums">{Math.round(angle)}°</div>
                    </div>
                  </div>
                );
              })()}

            {viewerMode === '360' && (
              <div className="flex items-center gap-3 p-3 border-t border-stone-100">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={Math.round(((viewerRotation % 360) + 360) % 360)}
                  onChange={(e) => {
                    setViewerAutoRotate(false);
                    setViewerRotation(Number(e.target.value));
                  }}
                  className="flex-1 accent-[#0E4A93]"
                />
                <button
                  type="button"
                  onClick={() => setViewerAutoRotate((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewerAutoRotate ? 'bg-[#0E4A93] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {viewerAutoRotate ? 'Pause' : 'Play'}
                </button>
              </div>
            )}

            {viewerMode === '360' && (
              <div className="px-3 pb-3 text-center text-[11px] text-stone-400">
                Full turn: front → side → back (with hanging hardware) → side. Drag to spin it yourself.
              </div>
            )}

            {viewerMode === '3d' && (
              <div className="p-3 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[
                    { label: 'Front', deg: 0 },
                    { label: 'Angled', deg: -28 },
                    { label: 'Side', deg: -90 },
                    { label: 'Back', deg: 180 }
                  ].map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => {
                        setViewerAutoRotate(false);
                        setViewerRotation(v.deg);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        Math.round(viewerRotation) === v.deg ? 'bg-[#0E4A93] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-stone-400">Pick a viewing angle, or drag to tilt — see the wrap depth and the back of the frame.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {materialModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">Select Canvas Material Variant</h3>
              <button onClick={() => setMaterialModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {MATERIAL_VARIANTS.map((mat) => {
                const isSelected = selectedMaterialId === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => {
                      setSelectedMaterialId(mat.id);
                      setMaterialModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'border-[#0E4A93] bg-blue-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900">{mat.name}</div>
                      <div className="text-[11px] text-stone-500">{mat.desc}</div>
                    </div>
                    <span className="text-xs font-black text-[#0E4A93]">{mat.tag}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex z-50 animate-in fade-in">
          <div className="bg-white w-72 h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <img src="/canvas-india-official-logo.png" alt="Canvas India" className="h-8 w-auto object-contain" />
                <button onClick={() => setMenuOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <Link to={`/products/${catalogProduct.slug || catalogProduct.id}`} className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg">
                  ← Return to Product Page
                </Link>
                <Link to="/canvas" className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg">
                  View All Canvas Products
                </Link>
                <Link to="/" className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg">
                  Homepage
                </Link>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-500">
                <div className="font-bold text-stone-900">Official Company Details</div>
                <div>H NO 4-9-197/8184, HMT Nagar Main Road, Nacharam, Hyderabad, Telangana – 500076</div>
                <div>Phone / WhatsApp: 78930 51555</div>
                <div>Email: info@canvassindia.com</div>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 pt-4 border-t border-stone-100">Canvas India &copy; 2026. All rights reserved.</div>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default CanvasCustomizerPage;
