import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { 
  Menu,
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
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
  AlertCircle, 
  Trash2, 
  Move,
  Eye,
  Crop,
  Grid,
  Search,
  Shapes,
  Maximize2,
  Smartphone,
  Laptop,
  Copy,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import {
  ToolbarTab,
  AcrylicProductType,
  ACRYLIC_PRODUCT_TYPES,
  SizeCategory,
  SizeOption,
  SIZE_OPTIONS,
  LayoutPreset,
  LAYOUT_PRESETS,
  DesignTemplate,
  DESIGN_TEMPLATES,
  HardwareOption,
  HARDWARE_OPTIONS,
  DisplayOption,
  DISPLAY_OPTIONS,
  FinishOption,
  FINISH_OPTIONS,
  FrameOption,
  FRAME_OPTIONS,
  ColorFilterType,
  ColorFinishOption,
  COLOR_FINISH_OPTIONS,
  TypographyOption,
  TYPOGRAPHY_OPTIONS,
  AcrylicEdgeWrap,
  ACRYLIC_EDGE_WRAPS,
  ACRYLIC_WRAP_OPTIONS,
  AcrylicShapeOption,
  ACRYLIC_SHAPES,
  getSizesForShape,
  ACRYLIC_BACKGROUNDS,
  ACRYLIC_BORDER_WIDTHS,
  ACRYLIC_BORDER_COLORS,
  THICKNESS_OPTIONS,
  PAPER_OPTIONS,
  FONT_OPTIONS,
  TEXT_COLOR_PRESETS,
  DesignCategory,
  DESIGN_CATEGORIES,
  AcrylicDesignOverlay,
  ACRYLIC_DESIGN_OVERLAYS
} from '../data/acrylicCustomizerData';
import { AcrylicLiveTextEditor, TextElement } from '../components/AcrylicLiveTextEditor';
import { AcrylicClipartModal, ClipartElement } from '../components/AcrylicClipartModal';
import { AcrylicRoomViewModal } from '../components/AcrylicRoomViewModal';
import { ClipartItem } from '../data/acrylicClipartData';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface UploadedImageMeta {
  file?: File;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
}

export interface PanelImageState {
  imageUrl: string | null;
  uploadedImage?: UploadedImageMeta | null;
  panX: number;
  panY: number;
  scale: number;
  rotation: number;
  fitMode: 'contain' | 'cover';
  filter: ColorFilterType;
  textElements: TextElement[];
  clipartElements: ClipartElement[];
}

export type SelectedElementType = 'image' | 'text' | 'clipart';

export interface SelectedElement {
  type: SelectedElementType;
  panelIndex: number;
  elementId?: string;
}

const createDefaultPanelState = (imageUrl: string | null = null): PanelImageState => ({
  imageUrl,
  uploadedImage: null,
  panX: 0,
  panY: 0,
  scale: 1,
  rotation: 0,
  fitMode: 'contain',
  filter: 'original',
  textElements: [],
  clipartElements: []
});

const CURVED_GEOMETRIC_SHAPES = ['shape-circle', 'shape-oval', 'shape-heart', 'shape-hexagon'];

// ============================================================================
// MAIN ACRYLIC CUSTOMIZER COMPONENT
// ============================================================================

export const AcrylicCustomizerPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { allProducts, onAddToCartCustomized } = useShop();

  // Matched catalog product
  const catalogProduct = useMemo(() => {
    return allProducts.find(
      (p) => (p.id === productId || p.slug === productId) && p.categorySlug === 'acrylic'
    ) || allProducts.find((p) => p.categorySlug === 'acrylic') || allProducts[0];
  }, [allProducts, productId]);

  // Active Left Toolbar Tab
  const [activeTab, setActiveTab] = useState<ToolbarTab>('PRODUCTS');

  // Selected Acrylic Product Type
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>(() => {
    const key = (catalogProduct?.slug || catalogProduct?.id || catalogProduct?.name || '').toLowerCase();
    if (key.includes('block')) return 'acrylic-photo-block';
    if (key.includes('wall') || key.includes('display')) return 'acrylic-wall-art';
    if (key.includes('collage')) return 'acrylic-collage';
    if (key.includes('split')) return 'acrylic-split';
    if (key.includes('signage')) return 'acrylic-signage';
    if (key.includes('panel')) return 'acrylic-photo-panel';
    return 'acrylic-photo-panel';
  });

  const selectedProductType = useMemo(() => {
    return ACRYLIC_PRODUCT_TYPES.find((pt) => pt.id === selectedProductTypeId) || ACRYLIC_PRODUCT_TYPES[0];
  }, [selectedProductTypeId]);

  // Size Category filter tabs in SELECT SIZE panel
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>('RECOMMENDED');

  // Shape Selection State (SHAPES Tab - 9 practical shapes)
  const [selectedShapeId, setSelectedShapeId] = useState<string>(() => {
    const paramShape = searchParams.get('shape');
    if (paramShape) {
      const match = ACRYLIC_SHAPES.find(s => s.id === paramShape || s.id === `shape-${paramShape}`);
      if (match) return match.id;
    }
    if (catalogProduct?.shape) {
      const match = ACRYLIC_SHAPES.find(s => s.id === catalogProduct.shape || s.id === `shape-${catalogProduct.shape}`);
      if (match) return match.id;
    }
    if (catalogProduct?.shapes && catalogProduct.shapes.length > 0) {
      const s0 = catalogProduct.shapes[0];
      const match = ACRYLIC_SHAPES.find(s => s.id === s0 || s.id === `shape-${s0}`);
      if (match) return match.id;
    }
    return 'shape-square';
  });

  const currentShape = useMemo(() => {
    return ACRYLIC_SHAPES.find((s) => s.id === selectedShapeId) || ACRYLIC_SHAPES[0];
  }, [selectedShapeId]);

  const isCurvedShape = useMemo(() => {
    return CURVED_GEOMETRIC_SHAPES.includes(selectedShapeId);
  }, [selectedShapeId]);

  // Dynamic Shape-Specific Sizes
  const shapeSizes = useMemo(() => {
    return getSizesForShape(selectedShapeId, selectedProductTypeId);
  }, [selectedShapeId, selectedProductTypeId]);

  // Selected Size Option
  const [selectedSizeId, setSelectedSizeId] = useState<string>(() => {
    const defaultSizes = getSizesForShape(selectedShapeId, selectedProductTypeId);
    return defaultSizes[2]?.id || defaultSizes[0]?.id || 'shape-square-8x8';
  });

  useEffect(() => {
    if (shapeSizes.length > 0 && !shapeSizes.some((s) => s.id === selectedSizeId)) {
      setSelectedSizeId(shapeSizes[2]?.id || shapeSizes[0]?.id);
    }
  }, [shapeSizes, selectedSizeId]);

  // Custom Size controls
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number>(8);
  const [customHeight, setCustomHeight] = useState<number>(8);

  const currentSizeOption = useMemo(() => {
    return (
      shapeSizes.find((s) => s.id === selectedSizeId) ||
      SIZE_OPTIONS.find((s) => s.id === selectedSizeId) ||
      shapeSizes[2] ||
      shapeSizes[0] ||
      SIZE_OPTIONS[0]
    );
  }, [selectedSizeId, shapeSizes]);

  // Layouts & Designs Subtabs
  const [layoutSubTab, setLayoutSubTab] = useState<'LAYOUTS' | 'DESIGNS'>('LAYOUTS');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('layout-1-single');

  // Designs Overlay state
  const [selectedDesignCategory, setSelectedDesignCategory] = useState<DesignCategory>('Minimal');
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const activeDesignOverlay = useMemo(() => {
    if (!selectedDesignId) return null;
    return ACRYLIC_DESIGN_OVERLAYS.find((d) => d.id === selectedDesignId) || null;
  }, [selectedDesignId]);

  const currentLayout = useMemo(() => {
    return LAYOUT_PRESETS.find((l) => l.id === selectedLayoutId) || LAYOUT_PRESETS[0];
  }, [selectedLayoutId]);

  const frames = currentLayout.frames;

  // Frame Images State (independent slots)
  const [panelImages, setPanelImages] = useState<Record<number, PanelImageState>>({
    0: createDefaultPanelState(null),
    1: createDefaultPanelState(null),
    2: createDefaultPanelState(null),
    3: createDefaultPanelState(null)
  });

  // Active Frame / Element Selection
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);
  const [selectedElement, setSelectedElement] = useState<SelectedElement>({
    type: 'image',
    panelIndex: 0
  });

  // Hardware & Finish States
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('standoff-mounts');
  const [selectedDisplayOptionId, setSelectedDisplayOptionId] = useState<string>('display-standoff');
  const [selectedFinishId, setSelectedFinishId] = useState<string>('high-gloss');
  const [selectedFrameId, setSelectedFrameId] = useState<string>('frame-none');
  const [selectedEdgeWrapId, setSelectedEdgeWrapId] = useState<string>('full-bleed');

  // Options panel states
  const [selectedThicknessId, setSelectedThicknessId] = useState<string>('3mm');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('white-luster');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>('transparent');
  const [selectedBorderWidthId, setSelectedBorderWidthId] = useState<string>('none');
  const [selectedBorderColor, setSelectedBorderColor] = useState<string>('#FFFFFF');
  const [selectedTypographyId, setSelectedTypographyId] = useState<string>('modern-sans');

  // Uploaded Photos session gallery
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Room View state
  const [showRoomView, setShowRoomView] = useState<boolean>(false);

  // Add Text Editor Popover State
  const [showTextModal, setShowTextModal] = useState<boolean>(false);

  // Clipart Picker Popover State
  const [showClipartModal, setShowClipartModal] = useState<boolean>(false);

  // UI Modals & Notifications
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Drag-and-Drop state for Upload Panel -> Canvas Frames
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);
  const [dragOverPanelIndex, setDragOverPanelIndex] = useState<number | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);

  // Helper to assign a photo to a specific panel slot non-destructively
  const handleAssignPhotoToPanel = (photoSrc: string, panelIdx: number) => {
    if (!photoSrc) return;
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || 1200;
      const naturalHeight = img.naturalHeight || 800;
      const aspectRatio = naturalWidth / naturalHeight;

      updateFrame(panelIdx, (curr) => ({
        ...curr,
        imageUrl: photoSrc,
        uploadedImage: {
          src: photoSrc,
          naturalWidth,
          naturalHeight,
          aspectRatio
        },
        panX: 0,
        panY: 0,
        scale: 1,
        rotation: 0,
        fitMode: 'contain'
      }));

      setActivePanelIndex(panelIdx);
      setSelectedElement({ type: 'image', panelIndex: panelIdx });
      setValidationWarning(null);
    };
    img.onerror = () => {
      updateFrame(panelIdx, (curr) => ({
        ...curr,
        imageUrl: photoSrc,
        panX: 0,
        panY: 0,
        scale: 1,
        rotation: 0,
        fitMode: 'contain'
      }));
      setActivePanelIndex(panelIdx);
      setSelectedElement({ type: 'image', panelIndex: panelIdx });
    };
    img.src = photoSrc;
  };

  // Drop handler for a specific panel slot
  const handlePanelSlotDrop = (e: React.DragEvent, panelIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPanelIndex(null);
    setIsDragOverCanvas(false);
    setDraggingPhotoIndex(null);

    // 1. Check custom tray index data from upload panel
    const trayIdxStr = e.dataTransfer.getData('application/x-ci-tray');
    if (trayIdxStr !== '' && !isNaN(Number(trayIdxStr))) {
      const photo = uploadedPhotos[Number(trayIdxStr)];
      if (photo) {
        handleAssignPhotoToPanel(photo, panelIdx);
        return;
      }
    }

    // 2. Check plain text / URL data
    const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (textData && (textData.startsWith('data:image') || textData.startsWith('http') || textData.startsWith('/') || textData.startsWith('blob:'))) {
      handleAssignPhotoToPanel(textData, panelIdx);
      setUploadedPhotos((prev) => (prev.includes(textData) ? prev : [textData, ...prev]));
      return;
    }

    // 3. Native files dropped from user OS
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name))) {
        handleSingleFileChange(file, panelIdx);
      }
    }
  };

  // Mobile Upload & QR Code Sync State
  const [uploadMode, setUploadMode] = useState<'computer' | 'mobile'>('computer');
  const [uploadSessionId] = useState<string>(() => 'ac-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [serverLanIp, setServerLanIp] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const processedImagesRef = useRef<Set<string>>(new Set<string>());

  // Discover server LAN IP for direct mobile connection over Wi-Fi
  useEffect(() => {
    fetch('/api/server-info')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.localIp) {
          setServerLanIp(data.localIp);
        }
      })
      .catch(() => {});
  }, []);

  // Compute mobile upload URL
  const mobileUploadUrl = useMemo(() => {
    if (serverLanIp && window.location.hostname === 'localhost') {
      return `http://${serverLanIp}:${window.location.port || '3000'}/mobile-upload/${uploadSessionId}`;
    }
    return `${window.location.origin}/mobile-upload/${uploadSessionId}`;
  }, [serverLanIp, uploadSessionId]);

  // Generate QR Code data URL dynamically
  useEffect(() => {
    QRCode.toDataURL(mobileUploadUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0E4A93',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [mobileUploadUrl]);

  // Handler to assign incoming photo from mobile into active slot or next empty slot
  const handleApplyIncomingPhoto = (imgSrc: string) => {
    if (processedImagesRef.current.has(imgSrc)) return;
    processedImagesRef.current.add(imgSrc);

    // 1. Add to gallery list
    setUploadedPhotos((prev) => (prev.includes(imgSrc) ? prev : [imgSrc, ...prev]));

    // 2. Load into image meta to preserve full natural dimensions non-destructively
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || 1200;
      const naturalHeight = img.naturalHeight || 800;
      const aspectRatio = naturalWidth / naturalHeight;

      // 3. Determine target slot
      let targetSlot = activePanelIndex;
      if (frames.length > 1) {
        // If active slot already has an image, look for an empty slot
        const emptyIdx = [0, 1, 2, 3].slice(0, frames.length).find((idx) => !panelImages[idx]?.imageUrl);
        if (emptyIdx !== undefined) {
          targetSlot = emptyIdx;
          setActivePanelIndex(emptyIdx);
        }
      }

      updateFrame(targetSlot, (curr) => ({
        ...curr,
        imageUrl: imgSrc,
        uploadedImage: {
          src: imgSrc,
          naturalWidth,
          naturalHeight,
          aspectRatio
        },
        panX: 0,
        panY: 0,
        scale: 1,
        rotation: 0,
        fitMode: 'contain'
      }));

      setSelectedElement({ type: 'image', panelIndex: targetSlot });
      setSaveToast('Photo uploaded from mobile successfully!');
      setTimeout(() => setSaveToast(null), 4000);
    };
    img.src = imgSrc;
  };

  // 1. Listen via BroadcastChannel (same-origin / multi-tab)
  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`acrylic-upload-${uploadSessionId}`);
        channel.onmessage = (event) => {
          if (event.data && event.data.image) {
            handleApplyIncomingPhoto(event.data.image);
          }
        };
        return () => {
          channel.close();
        };
      }
    } catch (e) {
      console.warn(e);
    }
  }, [uploadSessionId, activePanelIndex, frames.length, panelImages]);

  // 2. Listen via localStorage (storage events)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `acrylic_upload_${uploadSessionId}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.image) {
            handleApplyIncomingPhoto(data.image);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [uploadSessionId, activePanelIndex, frames.length, panelImages]);

  // 3. Poll Connect API endpoint every 2 seconds for cross-network phone uploads
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload-session/${uploadSessionId}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            for (const img of data.images) {
              handleApplyIncomingPhoto(img);
            }
          }
        }
      } catch (err) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [uploadSessionId, activePanelIndex, frames.length, panelImages]);

  // Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number; panelIdx: number } | null>(null);
  const textDragRef = useRef<{ x: number; y: number; initialOffset: { x: number; y: number }; rect: DOMRect } | null>(null);
  const clipartDragRef = useRef<{ x: number; y: number; initialOffset: { x: number; y: number }; rect: DOMRect } | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetPanelRef = useRef<number>(0);

  // Handle URL pre-selects
  useEffect(() => {
    const sizeParam = searchParams.get('size');
    if (sizeParam) {
      const matched = SIZE_OPTIONS.find((s) => s.id === sizeParam || s.label.toLowerCase() === sizeParam.toLowerCase());
      if (matched) setSelectedSizeId(matched.id);
    }
  }, [searchParams]);

  // Update a specific frame's state
  const updateFrame = (panelIdx: number, updater: (curr: PanelImageState) => PanelImageState) => {
    setPanelImages((prev) => {
      const current = prev[panelIdx] || createDefaultPanelState(null);
      return {
        ...prev,
        [panelIdx]: updater(current)
      };
    });
  };

  // Active Frame helper
  const activeFrameState = panelImages[activePanelIndex] || createDefaultPanelState(null);

  // Dynamic Pricing Calculation
  const finalPrice = useMemo(() => {
    let base = currentSizeOption?.price || selectedProductType.startingPrice;
    
    // Custom size calculation
    if (isCustomSize) {
      base = Math.max(399, Math.round(customWidth * customHeight * 4.5));
    }

    // Shape Laser-Cut Addon (if any)
    if (currentShape?.priceAddon) {
      base += currentShape.priceAddon;
    }

    // Hardware
    const hw = HARDWARE_OPTIONS.find((h) => h.id === selectedHardwareId);
    if (hw) base += hw.price;

    // Finish
    const fin = FINISH_OPTIONS.find((f) => f.id === selectedFinishId);
    if (fin) base += fin.price;

    // Frame
    const frm = FRAME_OPTIONS.find((f) => f.id === selectedFrameId);
    if (frm) base += frm.price;

    // Edge Wrap / Border
    const wrap = ACRYLIC_WRAP_OPTIONS.find((w) => w.id === selectedEdgeWrapId);
    if (wrap) base += wrap.price;

    // Thickness
    const thick = THICKNESS_OPTIONS.find((t) => t.id === selectedThicknessId);
    if (thick) base += thick.price;

    return Math.max(355, Math.round(base));
  }, [
    currentSizeOption,
    selectedProductType,
    isCustomSize,
    customWidth,
    customHeight,
    currentShape,
    selectedHardwareId,
    selectedFinishId,
    selectedFrameId,
    selectedEdgeWrapId,
    selectedThicknessId
  ]);

  // Dimension label helper
  const currentDimensionLabel = useMemo(() => {
    if (isCustomSize) {
      return currentShape.isSingleDimension
        ? `${customWidth}" Dia`
        : `${customWidth}" × ${customHeight}"`;
    }
    return currentSizeOption?.label || currentShape.name;
  }, [isCustomSize, customWidth, customHeight, currentShape, currentSizeOption]);

  // Click on empty frame opens picker for that specific frame
  const handleEmptyFrameClick = (panelIdx: number) => {
    uploadTargetPanelRef.current = panelIdx;
    singleFileInputRef.current?.click();
  };

  // Single file picker change
  const handleSingleFileChange = async (file: File | null, explicitPanelIdx?: number) => {
    if (!file) return;
    const targetIdx = explicitPanelIdx !== undefined ? explicitPanelIdx : uploadTargetPanelRef.current;

    if (file.size > 25 * 1024 * 1024) {
      alert(`File ${file.name} exceeds the 25MB limit.`);
      return;
    }

    try {
      const result = await optimizeImageFile(file);
      if (result) {
        const img = new Image();
        img.onload = () => {
          const naturalWidth = img.naturalWidth || 800;
          const naturalHeight = img.naturalHeight || 600;
          const aspectRatio = naturalWidth / naturalHeight;

          updateFrame(targetIdx, (curr) => ({
            ...curr,
            imageUrl: result,
            uploadedImage: {
              file,
              src: result,
              naturalWidth,
              naturalHeight,
              aspectRatio
            },
            panX: 0,
            panY: 0,
            scale: 1,
            rotation: 0,
            fitMode: 'contain'
          }));
          setUploadedPhotos((prev) => (prev.includes(result) ? prev : [result, ...prev]));
          setActivePanelIndex(targetIdx);
          setSelectedElement({ type: 'image', panelIndex: targetIdx });
          setValidationWarning(null);
        };
        img.onerror = () => {
          updateFrame(targetIdx, (curr) => ({
            ...curr,
            imageUrl: result,
            panX: 0,
            panY: 0,
            scale: 1,
            rotation: 0,
            fitMode: 'contain'
          }));
          setUploadedPhotos((prev) => (prev.includes(result) ? prev : [result, ...prev]));
        };
        img.src = result;
      }
    } catch (err) {
      console.error('Failed to optimize image file:', err);
    }
  };

  // Multiple files upload to session gallery
  const handleGalleryUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const readers: Promise<{ result: string; file: File; naturalWidth: number; naturalHeight: number; aspectRatio: number } | null>[] = [];

    Array.from(files).forEach((file) => {
      if (file.size <= 25 * 1024 * 1024) {
        const promise = new Promise<{ result: string; file: File; naturalWidth: number; naturalHeight: number; aspectRatio: number } | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              const img = new Image();
              img.onload = () => {
                const naturalWidth = img.naturalWidth || 800;
                const naturalHeight = img.naturalHeight || 600;
                resolve({ result, file, naturalWidth, naturalHeight, aspectRatio: naturalWidth / naturalHeight });
              };
              img.onerror = () => resolve({ result, file, naturalWidth: 800, naturalHeight: 600, aspectRatio: 1.33 });
              img.src = result;
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
        readers.push(promise);
      }
    });

    Promise.all(readers).then((items) => {
      const validItems = items.filter((item): item is NonNullable<typeof item> => !!item);
      const newPhotos = validItems.map((v) => v.result);
      setUploadedPhotos((prev) => [...newPhotos, ...prev]);

      if (!panelImages[activePanelIndex]?.imageUrl && validItems[0]) {
        const first = validItems[0];
        updateFrame(activePanelIndex, (curr) => ({
          ...curr,
          imageUrl: first.result,
          uploadedImage: {
            file: first.file,
            src: first.result,
            naturalWidth: first.naturalWidth,
            naturalHeight: first.naturalHeight,
            aspectRatio: first.aspectRatio
          },
          panX: 0,
          panY: 0,
          scale: 1,
          rotation: 0,
          fitMode: 'contain'
        }));
      }
    });
  };

  // Image Transformations (Per Active Frame)
  const handleZoomIn = () => {
    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      scale: Math.min(curr.scale + 0.15, 3.5)
    }));
  };

  const handleZoomOut = () => {
    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      scale: Math.max(curr.scale - 0.15, 0.4)
    }));
  };

  const handleRotate = () => {
    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      rotation: (curr.rotation + 90) % 360
    }));
  };

  const handleResetImage = () => {
    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      scale: 1,
      panX: 0,
      panY: 0,
      rotation: 0
    }));
  };

  const handleApplyFilter = (filterType: ColorFilterType) => {
    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      filter: filterType
    }));
  };

  // Image Panning Handlers
  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>, panelIdx: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setActivePanelIndex(panelIdx);
    setSelectedElement({ type: 'image', panelIndex: panelIdx });
    setIsDragging(true);

    const frame = panelImages[panelIdx] || createDefaultPanelState(null);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: frame.panX || 0,
      initialPanY: frame.panY || 0,
      panelIdx
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const targetIdx = dragStartRef.current.panelIdx;

    updateFrame(targetIdx, (curr) => ({
      ...curr,
      panX: dragStartRef.current!.initialPanX + deltaX,
      panY: dragStartRef.current!.initialPanY + deltaY
    }));
  };

  const handleImagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Wheel Zoom Listener Ref Callback
  const registerWheelRef = (panelIdx: number) => (el: HTMLDivElement | null) => {
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      updateFrame(panelIdx, (curr) => ({
        ...curr,
        scale: Math.max(0.4, Math.min(curr.scale + zoomFactor, 3.5))
      }));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
  };

  // Drag Text Element
  const startTextDrag = (e: React.PointerEvent<HTMLDivElement>, panelIdx: number, textId: string, rect: DOMRect) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setActivePanelIndex(panelIdx);
    setSelectedElement({ type: 'text', panelIndex: panelIdx, elementId: textId });

    const txt = panelImages[panelIdx]?.textElements.find((t) => t.id === textId);
    if (!txt) return;

    textDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffset: { x: txt.x, y: txt.y },
      rect
    };

    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {}

    const onMove = (moveEv: PointerEvent) => {
      if (!textDragRef.current) return;
      const dx = moveEv.clientX - textDragRef.current.x;
      const dy = moveEv.clientY - textDragRef.current.y;
      const percentX = (dx / textDragRef.current.rect.width) * 100;
      const percentY = (dy / textDragRef.current.rect.height) * 100;

      updateFrame(panelIdx, (curr) => ({
        ...curr,
        textElements: curr.textElements.map((t) =>
          t.id === textId
            ? {
                ...t,
                x: Math.max(-48, Math.min(48, textDragRef.current!.initialOffset.x + percentX)),
                y: Math.max(-48, Math.min(48, textDragRef.current!.initialOffset.y + percentY))
              }
            : t
        )
      }));
    };

    const onUp = (upEv: PointerEvent) => {
      textDragRef.current = null;
      try {
        targetEl.releasePointerCapture(upEv.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Drag Clipart Element
  const startClipartDrag = (e: React.PointerEvent<HTMLDivElement>, panelIdx: number, clipId: string, rect: DOMRect) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setActivePanelIndex(panelIdx);
    setSelectedElement({ type: 'clipart', panelIndex: panelIdx, elementId: clipId });

    const clip = panelImages[panelIdx]?.clipartElements.find((c) => c.id === clipId);
    if (!clip) return;

    clipartDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffset: { x: clip.x, y: clip.y },
      rect
    };

    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {}

    const onMove = (moveEv: PointerEvent) => {
      if (!clipartDragRef.current) return;
      const dx = moveEv.clientX - clipartDragRef.current.x;
      const dy = moveEv.clientY - clipartDragRef.current.y;
      const percentX = (dx / clipartDragRef.current.rect.width) * 100;
      const percentY = (dy / clipartDragRef.current.rect.height) * 100;

      updateFrame(panelIdx, (curr) => ({
        ...curr,
        clipartElements: curr.clipartElements.map((c) =>
          c.id === clipId
            ? {
                ...c,
                x: Math.max(-48, Math.min(48, textDragRef.current ? 0 : clipartDragRef.current!.initialOffset.x + percentX)),
                y: Math.max(-48, Math.min(48, textDragRef.current ? 0 : clipartDragRef.current!.initialOffset.y + percentY))
              }
            : c
        )
      }));
    };

    const onUp = (upEv: PointerEvent) => {
      clipartDragRef.current = null;
      try {
        targetEl.releasePointerCapture(upEv.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Text Elements Management
  const handleAddNewText = () => {
    const newId = `text-${Date.now()}`;
    const newTextObj: TextElement = {
      id: newId,
      text: 'Captured Moments',
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: 26,
      fontWeight: 'bold',
      color: '#FFFFFF',
      alignment: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      rotation: 0,
      x: 0,
      y: 30
    };

    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      textElements: [...curr.textElements, newTextObj]
    }));
    setSelectedElement({ type: 'text', panelIndex: activePanelIndex, elementId: newId });
    setShowTextModal(true);
  };

  const handleUpdateActiveText = (updates: Partial<TextElement>) => {
    if (selectedElement.type !== 'text' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      textElements: curr.textElements.map((t) => (t.id === selectedElement.elementId ? { ...t, ...updates } : t))
    }));
  };

  const handleDuplicateActiveText = () => {
    if (selectedElement.type !== 'text' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    const source = panelImages[panelIdx]?.textElements.find((t) => t.id === selectedElement.elementId);
    if (!source) return;
    const newId = `text-${Date.now()}`;
    const copyText: TextElement = {
      ...source,
      id: newId,
      x: Math.min(45, source.x + 4),
      y: Math.min(45, source.y + 4)
    };
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      textElements: [...curr.textElements, copyText]
    }));
    setSelectedElement({ type: 'text', panelIndex: panelIdx, elementId: newId });
  };

  const handleDeleteActiveText = () => {
    if (selectedElement.type !== 'text' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      textElements: curr.textElements.filter((t) => t.id !== selectedElement.elementId)
    }));
    setSelectedElement({ type: 'image', panelIndex: panelIdx });
  };

  // Clipart Elements Management
  const handleSelectClipart = (clip: ClipartItem) => {
    const newId = `clipart-${Date.now()}`;
    const newClipObj: ClipartElement = {
      id: newId,
      clipartId: clip.id,
      name: clip.name,
      svgPath: clip.svgPath,
      viewBox: clip.viewBox,
      x: 0,
      y: -25,
      scale: 1.2,
      rotation: 0,
      color: '#D4AF37'
    };

    updateFrame(activePanelIndex, (curr) => ({
      ...curr,
      clipartElements: [...curr.clipartElements, newClipObj]
    }));
    setSelectedElement({ type: 'clipart', panelIndex: activePanelIndex, elementId: newId });
  };

  const handleUpdateActiveClipart = (updates: Partial<ClipartElement>) => {
    if (selectedElement.type !== 'clipart' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      clipartElements: curr.clipartElements.map((c) => (c.id === selectedElement.elementId ? { ...c, ...updates } : c))
    }));
  };

  const handleDuplicateActiveClipart = () => {
    if (selectedElement.type !== 'clipart' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    const source = panelImages[panelIdx]?.clipartElements.find((c) => c.id === selectedElement.elementId);
    if (!source) return;
    const newId = `clipart-${Date.now()}`;
    const copyClip: ClipartElement = {
      ...source,
      id: newId,
      x: Math.min(42, source.x + 4),
      y: Math.min(42, source.y + 4)
    };
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      clipartElements: [...curr.clipartElements, copyClip]
    }));
    setSelectedElement({ type: 'clipart', panelIndex: panelIdx, elementId: newId });
  };

  const handleDeleteActiveClipart = () => {
    if (selectedElement.type !== 'clipart' || !selectedElement.elementId) return;
    const panelIdx = selectedElement.panelIndex;
    updateFrame(panelIdx, (curr) => ({
      ...curr,
      clipartElements: curr.clipartElements.filter((c) => c.id !== selectedElement.elementId)
    }));
    setSelectedElement({ type: 'image', panelIndex: panelIdx });
  };

  const activeTextElement = useMemo(() => {
    if (selectedElement.type === 'text' && selectedElement.elementId) {
      return panelImages[selectedElement.panelIndex]?.textElements.find((t) => t.id === selectedElement.elementId) || null;
    }
    return null;
  }, [selectedElement, panelImages]);

  const activeClipartElement = useMemo(() => {
    if (selectedElement.type === 'clipart' && selectedElement.elementId) {
      return panelImages[selectedElement.panelIndex]?.clipartElements.find((c) => c.id === selectedElement.elementId) || null;
    }
    return null;
  }, [selectedElement, panelImages]);

  const handleDeleteSelectedElement = () => {
    if (selectedElement.type === 'text' && selectedElement.elementId) {
      handleDeleteActiveText();
    } else if (selectedElement.type === 'clipart' && selectedElement.elementId) {
      handleDeleteActiveClipart();
    }
  };

  // Switch product type
  const handleSelectProductType = (ptId: string) => {
    setSelectedProductTypeId(ptId);
    const pt = ACRYLIC_PRODUCT_TYPES.find((p) => p.id === ptId);
    if (pt) {
      if (ptId === 'acrylic-wall-art' || ptId === 'acrylic-split') {
        setSelectedLayoutId('layout-3-collage');
      } else if (ptId === 'acrylic-collage') {
        setSelectedLayoutId('layout-4-grid');
      } else {
        setSelectedLayoutId('layout-1-single');
      }
      if (pt.supportedShapeIds && !pt.supportedShapeIds.includes(selectedShapeId)) {
        const supported = pt.supportedShapeIds[0] || 'shape-square';
        setSelectedShapeId(supported);
      }
      const newSizes = getSizesForShape(selectedShapeId, ptId);
      if (newSizes.length > 0) {
        setSelectedSizeId(newSizes[2]?.id || newSizes[0]?.id);
      }
    }
  };

  // Switch acrylic shape
  const handleSelectShape = (shapeId: string) => {
    setSelectedShapeId(shapeId);
    if (CURVED_GEOMETRIC_SHAPES.includes(shapeId)) {
      setSelectedLayoutId('layout-1-single');
    }
    const newSizes = getSizesForShape(shapeId, selectedProductTypeId);
    if (newSizes.length > 0) {
      const targetSize = newSizes[2] || newSizes[0];
      setSelectedSizeId(targetSize.id);
      setIsCustomSize(false);
      setCustomWidth(targetSize.widthInches);
      setCustomHeight(targetSize.heightInches);
    }
  };

  // Switch layout preset
  const handleSelectLayout = (layout: LayoutPreset) => {
    if (isCurvedShape && layout.id !== 'layout-1-single') {
      return;
    }
    setSelectedLayoutId(layout.id);
    setActivePanelIndex(0);
    setSelectedElement({ type: 'image', panelIndex: 0 });
  };

  // Save customization to local storage
  const handleSaveDesign = () => {
    const designPayload = {
      productId: catalogProduct?.id || productId,
      productTypeId: selectedProductTypeId,
      sizeId: selectedSizeId,
      shapeId: selectedShapeId,
      isCustomSize,
      customWidth,
      customHeight,
      layoutId: selectedLayoutId,
      designId: selectedDesignId,
      hardwareId: selectedHardwareId,
      finishId: selectedFinishId,
      frameId: selectedFrameId,
      edgeWrapId: selectedEdgeWrapId,
      panelImages,
      uploadedPhotos,
      savedAt: new Date().toISOString(),
      finalPrice
    };

    localStorage.setItem(`canvas_india_acrylic_custom_${productId}`, JSON.stringify(designPayload));
    setSaveToast('Custom design saved to browser successfully!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Restore saved design from localStorage on initial mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`canvas_india_acrylic_custom_${productId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.panelImages) setPanelImages(parsed.panelImages);
        if (parsed.selectedFinishId) setSelectedFinishId(parsed.selectedFinishId);
        if (parsed.selectedHardwareId) setSelectedHardwareId(parsed.selectedHardwareId);
        if (parsed.selectedThicknessId) setSelectedThicknessId(parsed.selectedThicknessId);
        if (parsed.shapeId) setSelectedShapeId(parsed.shapeId);
        if (parsed.edgeWrapId) setSelectedEdgeWrapId(parsed.edgeWrapId);
        if (parsed.designId) setSelectedDesignId(parsed.designId);
      }
    } catch (e) {
      console.error('Failed to restore saved design', e);
    }
  }, [productId]);

  // Add to Cart with ShopContext typing
  const handleAddToCart = () => {
    const hasAnyPhoto = Object.values(panelImages).some((p) => !!p.imageUrl);
    if (!hasAnyPhoto) {
      setValidationWarning('Please upload at least one photo to complete your Acrylic customizer.');
      setTimeout(() => setValidationWarning(null), 4000);
      return;
    }

    if (onAddToCartCustomized && catalogProduct) {
      onAddToCartCustomized({
        product: catalogProduct,
        quantity: 1,
        size: currentDimensionLabel,
        calculatedPrice: finalPrice,
        material: 'Acrylic',
        finish: FINISH_OPTIONS.find((f) => f.id === selectedFinishId)?.name || 'High Gloss Optical Acrylic',
        thickness: THICKNESS_OPTIONS.find((t) => t.id === selectedThicknessId)?.label || '3mm',
        style: currentShape.name,
        photoUrl: panelImages[0]?.imageUrl || catalogProduct?.image || '/assets/customizer/acrylic/products/acrylic-photo-panel.jpg',
        customizationDetails: {
          productType: selectedProductType.name,
          shape: currentShape.name,
          dimensions: currentDimensionLabel,
          layout: currentLayout.name,
          design: activeDesignOverlay?.name || 'None',
          hardware: HARDWARE_OPTIONS.find((h) => h.id === selectedHardwareId)?.name || 'Standoff Mounts',
          edgeWrap: ACRYLIC_WRAP_OPTIONS.find((w) => w.id === selectedEdgeWrapId)?.name || 'Full Bleed',
          frame: FRAME_OPTIONS.find((f) => f.id === selectedFrameId)?.name || 'Frameless',
          paper: PAPER_OPTIONS.find((p) => p.id === selectedPaperId)?.label || 'White Luster Finish'
        }
      });
      navigate('/cart');
    }
  };

  // ============================================================================
  // EXACT SHAPE-FOLLOWING SVG BORDER RENDERER
  // ============================================================================
  const renderShapeBorder = () => {
    let strokeColor = 'transparent';
    let strokeWidth = 0;
    let isClearEdge = false;

    if (selectedEdgeWrapId === 'white-border') {
      strokeColor = '#FFFFFF';
      strokeWidth = 4.5;
    } else if (selectedEdgeWrapId === 'black-border') {
      strokeColor = '#0F172A';
      strokeWidth = 4.5;
    } else if (selectedEdgeWrapId === 'clear-edge') {
      strokeColor = 'rgba(255, 255, 255, 0.75)';
      strokeWidth = 3;
      isClearEdge = true;
    }

    const borderWidthPx = ACRYLIC_BORDER_WIDTHS.find((b) => b.id === selectedBorderWidthId)?.widthPx || 0;
    if (borderWidthPx > 0) {
      strokeColor = selectedBorderColor;
      strokeWidth = Math.max(strokeWidth, Math.min(8, Math.round(borderWidthPx / 2.5)));
    }

    if (strokeWidth === 0 && !isClearEdge) return null;

    return (
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible"
      >
        {selectedShapeId === 'shape-heart' && (
          <path
            d="M 50,85 C 12,58 2,38 2,24 C 2,8 14,2 28,2 C 38,2 46,8 50,18 C 54,8 62,2 72,2 C 86,2 98,8 98,24 C 98,38 88,58 50,85 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        )}
        {selectedShapeId === 'shape-circle' && (
          <circle
            cx="50"
            cy="50"
            r={50 - strokeWidth / 2}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {selectedShapeId === 'shape-oval' && (
          <ellipse
            cx="50"
            cy="50"
            rx={50 - strokeWidth / 2}
            ry={38 - strokeWidth / 2}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {selectedShapeId === 'shape-hexagon' && (
          <polygon
            points="25,1 75,1 99,50 75,99 25,99 1,50"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        )}
        {selectedShapeId === 'shape-rounded-rect' && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={100 - strokeWidth}
            height={100 - strokeWidth}
            rx="10"
            ry="10"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {['shape-square', 'shape-rectangle', 'shape-landscape', 'shape-portrait'].includes(selectedShapeId) && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={100 - strokeWidth}
            height={100 - strokeWidth}
            rx="3"
            ry="3"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}

        {isClearEdge && (
          <g opacity="0.6">
            {selectedShapeId === 'shape-circle' ? (
              <circle cx="50" cy="50" r={47} fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 2" />
            ) : selectedShapeId === 'shape-heart' ? (
              <path d="M 50,82 C 14,56 4,37 4,25 C 4,10 15,4 28,4 C 37,4 45,10 50,19 C 55,10 63,4 72,4 C 85,4 96,10 96,25 C 96,37 86,56 50,82 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            ) : (
              <rect x="3" y="3" width="94" height="94" rx="4" ry="4" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="5 2" />
            )}
          </g>
        )}
      </svg>
    );
  };

  // ============================================================================
  // RENDER A SINGLE ACRYLIC FRAME (Slot container)
  // ============================================================================
  const renderFrameContainer = (panelIdx: number, aspectClass: string, dimensionLabel?: string) => {
    const frame = panelImages[panelIdx] || createDefaultPanelState(null);
    const isActive = activePanelIndex === panelIdx;
    const isTargetEmpty = !frame.imageUrl;
    const frameInfo = frames[panelIdx];
    const label = dimensionLabel || frameInfo?.dimension || `Frame ${panelIdx + 1}`;
    const isDragOverThisSlot = dragOverPanelIndex === panelIdx;

    const filterCss = 
      frame.filter === 'sepia'
        ? 'sepia(0.85) contrast(1.1) brightness(0.95)'
        : frame.filter === 'grayscale'
        ? 'grayscale(100%) contrast(1.05)'
        : 'none';

    const shapeClip = currentShape.clipPathStyle;
    const shapeRadius = currentShape.borderRadiusClass;

    const containerAspectStyle: React.CSSProperties = isCustomSize
      ? { aspectRatio: `${customWidth} / ${customHeight}` }
      : {};
    const effectiveAspectClass = isCustomSize ? '' : (aspectClass || currentShape.aspectClass);

    return (
      <div 
        key={panelIdx} 
        className="relative w-full transition-all"
        style={{
          filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.2)) drop-shadow(0 8px 10px rgba(0, 0, 0, 0.1))'
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActivePanelIndex(panelIdx);
            setSelectedElement({ type: 'image', panelIndex: panelIdx });
            if (isTargetEmpty) {
              handleEmptyFrameClick(panelIdx);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            if (dragOverPanelIndex !== panelIdx) {
              setDragOverPanelIndex(panelIdx);
            }
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDragOverPanelIndex((curr) => (curr === panelIdx ? null : curr));
          }}
          onDrop={(e) => {
            handlePanelSlotDrop(e, panelIdx);
          }}
          className={`acrylic-frame-container relative w-full ${effectiveAspectClass} ${shapeRadius} bg-white overflow-hidden transition-all select-none border-2 ${
            isDragOverThisSlot
              ? 'border-[#0E4A93] ring-4 ring-[#0E4A93] shadow-2xl scale-[1.01] z-30'
              : isActive
              ? 'border-[#0E4A93] ring-4 ring-[#0E4A93]/30 z-20'
              : 'border-stone-300 hover:border-stone-400 z-10'
          } ${isTargetEmpty ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
          style={{
            clipPath: shapeClip,
            WebkitClipPath: shapeClip,
            ...containerAspectStyle
          }}
        >
        {/* Dynamic Drop Overlay when dragging an image over this slot */}
        {isDragOverThisSlot && (
          <div className="absolute inset-0 bg-[#0E4A93]/20 backdrop-blur-[1px] z-40 flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in duration-150">
            <div className="bg-[#0E4A93] text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/20 scale-105">
              <Upload className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-black tracking-wide uppercase">Drop Image Here</span>
            </div>
          </div>
        )}
        {/* Optical Acrylic Gloss Overlay */}
        {selectedFinishId === 'high-gloss' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent pointer-events-none z-20" />
        )}
        {selectedFinishId === 'anti-glare' && (
          <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-[0.5px] pointer-events-none z-20" />
        )}
        {selectedFinishId === 'diamond-bevel' && (
          <div className="absolute inset-0 border-4 border-white/60 pointer-events-none z-20 shadow-inner" />
        )}

        {/* Shape-Following Exact Wrap & Border Overlay */}
        {renderShapeBorder()}

        {/* Architectural Chrome Standoff Bolts */}
        {(selectedHardwareId === 'standoff-mounts' || selectedProductTypeId === 'acrylic-signage' || selectedDisplayOptionId === 'display-standoff') && !isCurvedShape && (
          <>
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-stone-400 via-stone-200 to-stone-50 border border-stone-600 shadow-md z-30 pointer-events-none flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-stone-500" />
            </div>
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-stone-400 via-stone-200 to-stone-50 border border-stone-600 shadow-md z-30 pointer-events-none flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-stone-500" />
            </div>
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-stone-400 via-stone-200 to-stone-50 border border-stone-600 shadow-md z-30 pointer-events-none flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-stone-500" />
            </div>
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-stone-400 via-stone-200 to-stone-50 border border-stone-600 shadow-md z-30 pointer-events-none flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-stone-500" />
            </div>
          </>
        )}

        {/* Frame Label Badge for multi-frame layouts */}
        {frames.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-30 pointer-events-none">
            <span>{frameInfo?.label || `Slot ${panelIdx + 1}`}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8752A] animate-pulse" />
            )}
          </div>
        )}

        {/* Frame Dimension Badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm z-30 pointer-events-none">
          {label}
        </div>

        {/* Active Filter Badge */}
        {frame.imageUrl && frame.filter !== 'original' && (
          <div className="absolute bottom-2 right-2 bg-[#0E4A93]/85 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm z-30 pointer-events-none">
            {frame.filter}
          </div>
        )}

        {/* Frame Content */}
        {frame.imageUrl ? (
          <div
            ref={registerWheelRef(panelIdx)}
            onPointerDown={(e) => handleImagePointerDown(e, panelIdx)}
            onPointerMove={handleImagePointerMove}
            onPointerUp={handleImagePointerUp}
            onPointerCancel={handleImagePointerUp}
            style={{ touchAction: 'none' }}
            className={`w-full h-full relative overflow-hidden flex items-center justify-center select-none ${
              isDragging && activePanelIndex === panelIdx ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <img
              src={frame.imageUrl}
              alt={label}
              draggable={false}
              style={{
                transform: `translate3d(${frame.panX || 0}px, ${frame.panY || 0}px, 0) scale(${frame.scale || 1}) rotate(${frame.rotation || 0}deg)`,
                transformOrigin: 'center center',
                filter: filterCss,
                objectFit: frame.fitMode === 'contain' ? 'contain' : 'cover',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              className="max-w-none w-full h-full pointer-events-none select-none"
            />

            {/* Design Overlay Layer */}
            {activeDesignOverlay && (
              <div 
                className="absolute inset-0 pointer-events-none z-22 w-full h-full flex items-center justify-center select-none"
                dangerouslySetInnerHTML={{ __html: activeDesignOverlay.renderOverlaySvg }}
              />
            )}

            {/* Draggable & Editable Text Elements */}
            {frame.textElements?.map((txt) => {
              const isTextSelected =
                selectedElement.type === 'text' &&
                selectedElement.panelIndex === panelIdx &&
                selectedElement.elementId === txt.id;

              return (
                <div
                  key={txt.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const frameEl = (e.currentTarget as HTMLElement).closest('.acrylic-frame-container');
                    const rect = frameEl?.getBoundingClientRect() || (e.currentTarget as HTMLElement).getBoundingClientRect();
                    startTextDrag(e, panelIdx, txt.id, rect);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanelIndex(panelIdx);
                    setSelectedElement({ type: 'text', panelIndex: panelIdx, elementId: txt.id });
                    setShowTextModal(true);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setActivePanelIndex(panelIdx);
                    setSelectedElement({ type: 'text', panelIndex: panelIdx, elementId: txt.id });
                    setShowTextModal(true);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${50 + txt.x}%`,
                    top: `${50 + txt.y}%`,
                    transform: `translate(-50%, -50%) rotate(${txt.rotation || 0}deg)`,
                    fontFamily: txt.fontFamily,
                    fontSize: `${txt.fontSize}px`,
                    fontWeight: txt.fontWeight || 'bold',
                    color: txt.color,
                    textAlign: txt.alignment,
                    lineHeight: txt.lineHeight || 1.2,
                    letterSpacing: `${txt.letterSpacing || 0}px`,
                    whiteSpace: 'pre-line'
                  }}
                  className={`z-30 cursor-move px-2.5 py-1 select-none transition-all rounded-lg ${
                    isTextSelected
                      ? 'ring-2 ring-[#0E4A93] bg-black/45 backdrop-blur-xs shadow-xl'
                      : 'hover:ring-1 hover:ring-white/80'
                  }`}
                >
                  {txt.text}
                </div>
              );
            })}

            {/* Draggable & Editable Clipart Elements */}
            {frame.clipartElements?.map((clip) => {
              const isClipSelected =
                selectedElement.type === 'clipart' &&
                selectedElement.panelIndex === panelIdx &&
                selectedElement.elementId === clip.id;

              return (
                <div
                  key={clip.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const frameEl = (e.currentTarget as HTMLElement).closest('.acrylic-frame-container');
                    const rect = frameEl?.getBoundingClientRect() || (e.currentTarget as HTMLElement).getBoundingClientRect();
                    startClipartDrag(e, panelIdx, clip.id, rect);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanelIndex(panelIdx);
                    setSelectedElement({ type: 'clipart', panelIndex: panelIdx, elementId: clip.id });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${50 + clip.x}%`,
                    top: `${50 + clip.y}%`,
                    transform: `translate(-50%, -50%) scale(${clip.scale}) rotate(${clip.rotation}deg)`,
                    color: clip.color || '#D4AF37'
                  }}
                  className={`z-30 cursor-move p-1.5 select-none rounded-xl transition-all flex items-center justify-center ${
                    isClipSelected
                      ? 'ring-2 ring-[#0E4A93] bg-black/45 backdrop-blur-xs shadow-xl'
                      : 'hover:ring-1 hover:ring-white/80'
                  }`}
                >
                  {clip.svgPath ? (
                    <div 
                      className="w-9 h-9 flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: `<svg viewBox="${clip.viewBox || '0 0 24 24'}" width="34" height="34" fill="currentColor">${clip.svgPath}</svg>`
                      }}
                    />
                  ) : (
                    <span className="text-3xl leading-none">⭐</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* MINIMAL EMPTY FRAME: ONLY UPLOAD ICON [ ↑ ] */
          <div 
            className="w-full h-full flex flex-col items-center justify-center bg-stone-50/70 hover:bg-stone-100/90 transition-colors cursor-pointer group p-4 text-center"
          >
            <div className="w-11 h-11 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-[#0E4A93] group-hover:border-[#0E4A93]/40 group-hover:scale-110 transition-all mb-1">
              <Upload className="w-5 h-5 stroke-[2.2]" />
            </div>
            {draggingPhotoIndex !== null && !isDragOverThisSlot && (
              <span className="text-[11px] font-bold text-[#0E4A93] animate-pulse">
                Drop photo here
              </span>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  // Dynamic frame outer border CSS
  const currentFrameCss = useMemo(() => {
    const frameObj = FRAME_OPTIONS.find((f) => f.id === selectedFrameId);
    return frameObj?.borderCss || '';
  }, [selectedFrameId]);

  // Primary Toolbar items: EXACT 8 ITEMS IN ORDER
  const toolbarItems: { id: ToolbarTab; label: string; icon: React.ElementType }[] = [
    { id: 'PRODUCTS', label: 'PRODUCTS', icon: LayoutGrid },
    { id: 'UPLOAD', label: 'UPLOAD', icon: UploadCloud },
    { id: 'SELECT SIZE', label: 'SELECT SIZE', icon: Grid },
    { id: 'SHAPES', label: 'SHAPES', icon: Shapes },
    { id: 'LAYOUTS & DESIGNS', label: 'LAYOUTS & DESIGNS', icon: Layers },
    { id: 'WRAP & BORDER', label: 'WRAP & BORDER', icon: Crop },
    { id: 'HARDWARE & FINISH', label: 'HARDWARE & FINISH', icon: SlidersHorizontal },
    { id: 'OPTIONS', label: 'OPTIONS', icon: Menu }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] font-sans antialiased select-none">
      
      {/* Hidden File Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
        className="hidden"
        onChange={(e) => handleGalleryUpload(e.target.files)}
      />
      <input
        ref={singleFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSingleFileChange(e.target.files[0]);
          }
        }}
      />

      {/* 1. CUSTOMIZER BLUE HEADER WITH ORIGINAL LOGO */}
      <header className="h-14 bg-[#0E4A93] text-white flex items-center justify-between px-3 sm:px-6 shadow-md z-30 shrink-0">
        
        {/* LEFT: Menu / Back / Logo / Customizer */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
            title="Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link
            to="/acrylic"
            className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Acrylic</span>
          </Link>
          
          <div className="h-5 w-[1px] bg-white/20 mx-1 hidden sm:block" />
          
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none" title="Canvas India">
            <img 
              src="/canvas-india-official-logo.png" 
              alt="Canvas India" 
              className="h-7 sm:h-8 md:h-9 w-auto object-contain block select-none" 
            />
            <span className="text-white font-bold text-xs tracking-wider uppercase hidden md:inline border-l border-white/20 pl-2">
              Acrylic Customizer
            </span>
          </Link>
        </div>

        {/* RIGHT: Price Display + Add to Cart Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-white/70 uppercase font-semibold">Total Price</div>
            <div className="text-lg font-black text-white leading-tight">
              ₹{finalPrice.toLocaleString()}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center gap-2 bg-[#E8752A] hover:bg-[#d4651e] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-lg shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex z-50 animate-in fade-in">
          <div className="bg-white w-72 h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-left duration-200 text-stone-800">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <img src="/canvas-india-official-logo.png" alt="Canvas India" className="h-8 w-auto object-contain" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                <Link 
                  to={`/products/${catalogProduct.slug || catalogProduct.id}`} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg"
                >
                  Return to Product Page
                </Link>
                <Link 
                  to="/acrylic" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg"
                >
                  View All Acrylic Products
                </Link>
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 rounded-lg"
                >
                  Homepage
                </Link>
              </div>
              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-500">
                <div className="font-bold text-stone-900">Official Company Details</div>
                <div>H NO 4-9-197/8184, HMT Nagar Main Road, Nacharam, Hyderabad, Telangana - 500076</div>
                <div>Email: info@canvasindia.com | Phone: +91 99999 99999</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Global ClipPath Mask Definitions for Shapes */}
      <svg width="0" height="0" className="absolute pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <clipPath id="acrylic-clip-shape-heart" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.85 C 0.12,0.58 0.02,0.38 0.02,0.24 C 0.02,0.08 0.14,0.02 0.28,0.02 C 0.38,0.02 0.46,0.08 0.5,0.18 C 0.54,0.08 0.62,0.02 0.72,0.02 C 0.86,0.02 0.98,0.08 0.98,0.24 C 0.98,0.38 0.88,0.58 0.5,0.85 Z" />
          </clipPath>
          <clipPath id="acrylic-clip-shape-arch" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 L 0,0.4 C 0,0.15 0.22,0 0.5,0 C 0.78,0 1,0.15 1,0.4 L 1,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Validation Warning Banner */}
      {validationWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* MAIN CUSTOMIZER BODY */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PRIMARY TOOLBAR */}
        <aside className="w-full md:w-20 bg-white border-b md:border-b-0 md:border-r border-stone-200 flex md:flex-col items-center justify-start py-1 md:py-3 px-1 md:px-0 gap-1 md:gap-1 shrink-0 z-20 overflow-x-auto md:overflow-y-auto no-scrollbar">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'SHAPES' && activeTab === 'SHAPE');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 md:flex-none md:w-18 py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-[#0E4A93] font-bold bg-blue-50/60'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50 font-medium'
                }`}
              >
                {isActive && (
                  <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0E4A93] rounded-r-full" />
                )}
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#0E4A93]/10' : ''}`}>
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-center tracking-tight leading-tight line-clamp-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* LEFT SECONDARY DRAWER CONTENT */}
        <section className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-stone-200 flex flex-col z-10 shrink-0 h-72 md:h-auto overflow-y-auto">
          
          {/* Panel Header */}
          <div className="p-3.5 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-black tracking-wider text-stone-800 uppercase flex items-center gap-1.5">
              <span>{activeTab === 'SHAPE' ? 'SHAPES' : activeTab}</span>
            </h2>
            <span className="text-[11px] font-semibold text-stone-500">
              {activeTab === 'PRODUCTS' && '7 Styles'}
              {activeTab === 'SELECT SIZE' && `${shapeSizes.length} Options`}
              {(activeTab === 'SHAPES' || activeTab === 'SHAPE') && '9 Shapes'}
              {activeTab === 'LAYOUTS & DESIGNS' && (layoutSubTab === 'LAYOUTS' ? '7 Layouts' : '11 Categories')}
              {activeTab === 'WRAP & BORDER' && '5 Options'}
              {activeTab === 'HARDWARE & FINISH' && 'Hardware & Finish'}
              {activeTab === 'OPTIONS' && 'Specifications'}
            </span>
          </div>

          {/* TAB 1: PRODUCTS */}
          {activeTab === 'PRODUCTS' && (
            <div className="flex flex-col h-full">
              {/* Material Toggle Bar: CANVAS vs ACRYLIC */}
              <div className="flex items-center border-b border-stone-200 text-xs font-black uppercase tracking-wider shrink-0 bg-stone-100">
                <button
                  type="button"
                  onClick={() => navigate('/customize/canvas/canvas-classic')}
                  className="flex-1 text-center py-3 bg-stone-100 text-stone-500 hover:text-[#0E4A93] hover:bg-stone-50 border-b-2 border-transparent transition-colors cursor-pointer font-bold flex items-center justify-center gap-1.5"
                >
                  CANVAS
                </button>
                <button
                  type="button"
                  className="flex-1 text-center py-3 bg-white text-[#0E4A93] border-b-2 border-[#0E4A93] shadow-xs cursor-default font-extrabold flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0E4A93]" />
                  ACRYLIC
                </button>
              </div>

              <div className="p-3.5 grid grid-cols-2 gap-2.5 overflow-y-auto">
                {ACRYLIC_PRODUCT_TYPES.map((pt) => {
                const isSelected = selectedProductTypeId === pt.id;
                return (
                  <div
                    key={pt.id}
                    onClick={() => handleSelectProductType(pt.id)}
                    className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-full h-20 bg-stone-50 flex items-center justify-center p-1 overflow-hidden relative">
                      <img 
                        src={pt.image} 
                        alt={pt.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/acrylic/acrylic-fallback.jpg';
                        }}
                      />
                    </div>

                    <div className="p-2 bg-white border-t border-stone-100">
                      <div className="text-xs font-bold text-stone-900 leading-tight truncate">
                        {pt.name}
                      </div>
                      <div className="text-[11px] font-medium text-stone-500 mt-0.5">
                        From ₹{pt.startingPrice}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'UPLOAD' && (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                  Upload Photos
                </h3>
                <p className="text-[11px] text-stone-500">
                  Add high-resolution photos from your computer or scan the QR code to upload directly from your mobile phone.
                </p>
              </div>

              {/* Segmented Control: Computer vs Mobile QR */}
              <div className="flex border border-stone-200 rounded-xl p-1 bg-stone-100">
                <button
                  type="button"
                  onClick={() => setUploadMode('computer')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    uploadMode === 'computer'
                      ? 'bg-white text-[#0E4A93] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Upload from Computer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('mobile')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    uploadMode === 'mobile'
                      ? 'bg-white text-[#0E4A93] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Upload from Mobile</span>
                </button>
              </div>

              {/* Multi-slot assignment selector */}
              {frames.length > 1 && (
                <div className="p-2.5 bg-stone-100 rounded-xl space-y-1.5">
                  <div className="text-[11px] font-bold text-stone-700">Assign to Slot:</div>
                  <div className="flex gap-1.5">
                    {frames.map((f, fIdx) => {
                      const isTarget = activePanelIndex === fIdx;
                      const hasPhoto = !!panelImages[fIdx]?.imageUrl;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActivePanelIndex(fIdx)}
                          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isTarget
                              ? 'bg-white border-[#0E4A93] text-[#0E4A93] shadow-xs'
                              : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          <span>Slot {fIdx + 1}</span>
                          {hasPhoto && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uploadMode === 'computer' ? (
                /* COMPUTER UPLOAD ZONE */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleGalleryUpload(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-[#0E4A93]/40 hover:border-[#0E4A93] bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-[#0E4A93] shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="text-xs font-bold text-stone-900">
                    Click to Browse or Drag Photos
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Supports JPG, PNG, WEBP up to 25MB
                  </div>
                </div>
              ) : (
                /* MOBILE QR UPLOAD ZONE */
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5 text-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-stone-700">Listening for mobile upload</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#0E4A93] px-2 py-0.5 rounded border border-blue-100">
                      #{uploadSessionId}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative inline-block p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-sm mx-auto">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Scan QR code with mobile phone" 
                        className="w-44 h-44 sm:w-48 sm:h-48 mx-auto block object-contain"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400">
                        Generating QR Code...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-stone-900">
                      Scan with your phone camera
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                      Point your smartphone camera at this QR code to upload photos directly from your phone into your Acrylic print.
                    </p>
                  </div>

                  {/* Direct Link & Test Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mobileUploadUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-bold text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={mobileUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0E4A93] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Upload Page</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Uploaded Photos Gallery with Drag-and-Drop & Click-to-Apply */}
              {uploadedPhotos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Uploaded Photos ({uploadedPhotos.length}):</span>
                    <span className="text-[11px] font-semibold text-[#0E4A93] flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      <span>Drag to frame or click</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
                    {uploadedPhotos.map((photo, pIdx) => {
                      const isDraggingThis = draggingPhotoIndex === pIdx;
                      return (
                        <div
                          key={pIdx}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-ci-tray', String(pIdx));
                            e.dataTransfer.setData('text/plain', photo);
                            e.dataTransfer.effectAllowed = 'copy';
                            setDraggingPhotoIndex(pIdx);
                          }}
                          onDragEnd={() => {
                            setDraggingPhotoIndex(null);
                            setDragOverPanelIndex(null);
                            setIsDragOverCanvas(false);
                          }}
                          onClick={() => handleAssignPhotoToPanel(photo, activePanelIndex)}
                          className={`aspect-square rounded-lg overflow-hidden border transition-all relative group bg-white shadow-2xs select-none ${
                            isDraggingThis
                              ? 'opacity-40 scale-95 ring-2 ring-[#0E4A93] cursor-grabbing'
                              : 'border-stone-200 hover:border-[#0E4A93] hover:shadow-xs cursor-grab active:cursor-grabbing'
                          }`}
                          title="Click to apply to active slot or drag directly onto any frame"
                        >
                          <img 
                            src={photo} 
                            alt={`Upload ${pIdx}`} 
                            className="w-full h-full object-cover pointer-events-none" 
                          />
                          {/* Move / Drag Indicator Icon */}
                          <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Move className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SELECT SIZE */}
          {activeTab === 'SELECT SIZE' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                  {currentShape.name} Sizes
                </span>
                <span className="text-[11px] font-bold text-[#0E4A93]">
                  {shapeSizes.length} Presets
                </span>
              </div>

              <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCustomSize(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    !isCustomSize
                      ? 'bg-white text-[#0E4A93] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  PRESET SIZES
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomSize(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    isCustomSize
                      ? 'bg-white text-[#0E4A93] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  CUSTOM SIZE
                </button>
              </div>

              {!isCustomSize ? (
                <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {shapeSizes.map((size) => {
                    const isSelected = selectedSizeId === size.id && !isCustomSize;
                    return (
                      <div
                        key={size.id}
                        onClick={() => {
                          setSelectedSizeId(size.id);
                          setIsCustomSize(false);
                          setCustomWidth(size.widthInches);
                          setCustomHeight(size.heightInches);
                        }}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-14 bg-stone-50 flex items-center justify-center p-1.5 overflow-hidden relative">
                          <img 
                            src={size.image} 
                            alt={size.label} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                          />
                        </div>

                        <div className="p-2 bg-white border-t border-stone-100 text-center">
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {size.label}
                          </div>
                          <div className="text-[11px] font-bold text-[#0E4A93] mt-0.5">
                            ₹{size.price}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-stone-800">Custom Dimensions:</div>
                  {currentShape.isSingleDimension ? (
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase">
                        DIAMETER / SIZE (INCHES)
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={48}
                        value={customWidth}
                        onChange={(e) => {
                          const val = Math.max(4, Math.min(48, Number(e.target.value) || 4));
                          setCustomWidth(val);
                          setCustomHeight(val);
                        }}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0E4A93]"
                      />
                      <div className="text-[10px] text-stone-500 mt-1">Min 4", Max 48" for symmetrical cuts</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase">WIDTH (INCHES)</label>
                        <input
                          type="number"
                          min={4}
                          max={60}
                          value={customWidth}
                          onChange={(e) => {
                            const val = Math.max(4, Math.min(60, Number(e.target.value) || 4));
                            setCustomWidth(val);
                          }}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0E4A93]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase">HEIGHT (INCHES)</label>
                        <input
                          type="number"
                          min={4}
                          max={60}
                          value={customHeight}
                          onChange={(e) => {
                            const val = Math.max(4, Math.min(60, Number(e.target.value) || 4));
                            setCustomHeight(val);
                          }}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0E4A93]"
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-[11px] text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                    <span>Dimension: <strong className="text-stone-900">{currentDimensionLabel}</strong></span>
                    <span className="text-[#0E4A93] font-black">₹{Math.max(399, Math.round(customWidth * customHeight * 4.5))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHAPES (The 9 practical shapes) */}
          {(activeTab === 'SHAPES' || activeTab === 'SHAPE') && (
            <div className="p-3.5 space-y-3">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider mb-0.5">
                  Select Acrylic Shape
                </h3>
                <p className="text-[10px] text-stone-500">
                  Select laser-cut shape. Instant canvas masking preserves your photo.
                </p>
              </div>

              {/* Grid of 9 Shape Cards with Small Thumbnails */}
              <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {ACRYLIC_SHAPES.map((shape) => {
                  const isSelected = selectedShapeId === shape.id;

                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectShape(shape.id)}
                      className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0E4A93] bg-blue-50/25 shadow-sm ring-1 ring-[#0E4A93]/20'
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="w-full h-18 bg-stone-50 flex items-center justify-center p-2 overflow-hidden relative">
                        <img 
                          src={shape.image} 
                          alt={shape.name} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/acrylic/acrylic-photo-panel.jpg';
                          }}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                        />
                      </div>

                      <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                        <div className="text-xs font-bold text-stone-900 leading-tight truncate">
                          {shape.name}
                        </div>
                        <div className="text-[10px] font-semibold text-stone-500 mt-0.5">
                          {shape.priceAddon ? `+₹${shape.priceAddon}` : 'Included'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: LAYOUTS & DESIGNS */}
          {activeTab === 'LAYOUTS & DESIGNS' && (
            <div className="p-3.5 space-y-3">
              <div className="flex border border-stone-200 rounded-xl p-1 bg-stone-100">
                <button
                  type="button"
                  onClick={() => setLayoutSubTab('LAYOUTS')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    layoutSubTab === 'LAYOUTS'
                      ? 'bg-white text-[#0E4A93] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  LAYOUTS
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSubTab('DESIGNS')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    layoutSubTab === 'DESIGNS'
                      ? 'bg-white text-[#0E4A93] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  DESIGNS
                </button>
              </div>

              {/* SUBTAB 1: LAYOUTS (7 Options) */}
              {layoutSubTab === 'LAYOUTS' && (
                <div className="space-y-2">
                  {isCurvedShape && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{currentShape.name} supports Single Image layout only.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                    {LAYOUT_PRESETS.slice(0, 7).map((layout) => {
                      const isSelected = selectedLayoutId === layout.id;
                      const isDisabled = isCurvedShape && layout.id !== 'layout-1-single';

                      return (
                        <div
                          key={layout.id}
                          onClick={() => {
                            if (!isDisabled) handleSelectLayout(layout);
                          }}
                          className={`group relative rounded-xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                            isDisabled
                              ? 'border-stone-200 bg-stone-100 opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20 cursor-pointer'
                              : 'border-stone-200 hover:border-stone-400 bg-white cursor-pointer'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          <div className="w-full h-16 bg-stone-50 border-b border-stone-100 p-2 flex items-center justify-center">
                            <img 
                              src={layout.image} 
                              alt={layout.name} 
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                            />
                          </div>

                          <div className="p-1.5 bg-white text-center">
                            <div className="text-[11px] font-bold text-stone-900 leading-tight truncate">
                              {layout.name}
                            </div>
                            <div className="text-[10px] font-medium text-stone-500">
                              {layout.photoCount} {layout.photoCount === 1 ? 'Photo' : 'Photos'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: DESIGNS (11 Categories with Overlays) */}
              {layoutSubTab === 'DESIGNS' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                      Categories
                    </span>
                    {selectedDesignId && (
                      <button
                        type="button"
                        onClick={() => setSelectedDesignId(null)}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        [ Remove Design ]
                      </button>
                    )}
                  </div>

                  {/* 11 Category Chips */}
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {DESIGN_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedDesignCategory(cat)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                          selectedDesignCategory === cat
                            ? 'bg-[#0E4A93] text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Design Cards for Selected Category */}
                  <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                    {/* None Card */}
                    <div
                      onClick={() => setSelectedDesignId(null)}
                      className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                        selectedDesignId === null
                          ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="w-full h-18 bg-stone-50 flex items-center justify-center p-2 text-stone-400 font-bold text-xs">
                        No Design
                      </div>
                      <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                        <div className="text-xs font-bold text-stone-800">Original Only</div>
                      </div>
                    </div>

                    {ACRYLIC_DESIGN_OVERLAYS.filter((d) => d.category === selectedDesignCategory).map((overlay) => {
                      const isSelected = selectedDesignId === overlay.id;

                      return (
                        <div
                          key={overlay.id}
                          onClick={() => setSelectedDesignId(overlay.id)}
                          className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                              : 'border-stone-200 hover:border-stone-400 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          <div className="w-full h-18 bg-stone-900 flex items-center justify-center p-1 overflow-hidden relative">
                            <img 
                              src={overlay.image} 
                              alt={overlay.name} 
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                            />
                          </div>

                          <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                            <div className="text-xs font-bold text-stone-900 leading-tight truncate">
                              {overlay.name}
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                              {overlay.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WRAP & BORDER (5 Edge Options with Shape-Following Borders) */}
          {activeTab === 'WRAP & BORDER' && (
            <div className="p-3.5 space-y-4">
              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Wrap & Edge Finish
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACRYLIC_WRAP_OPTIONS.map((wrap) => {
                    const isSelected = selectedEdgeWrapId === wrap.id;
                    return (
                      <div
                        key={wrap.id}
                        onClick={() => setSelectedEdgeWrapId(wrap.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-16 bg-stone-50 flex items-center justify-center p-2 overflow-hidden relative">
                          <img 
                            src={wrap.image} 
                            alt={wrap.name} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                          />
                        </div>

                        <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {wrap.name}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 mt-0.5">
                            {wrap.price === 0 ? 'Included' : `+₹${wrap.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Inner Border Width
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACRYLIC_BORDER_WIDTHS.map((border) => {
                    const isSelected = selectedBorderWidthId === border.id;
                    return (
                      <div
                        key={border.id}
                        onClick={() => setSelectedBorderWidthId(border.id)}
                        className={`p-2 rounded-xl border-2 transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/30'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-stone-900">{border.label}</div>
                        <div className="text-[10px] text-stone-500">{border.widthPx === 0 ? 'No Border' : `${border.widthPx}px`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedBorderWidthId !== 'none' && (
                <div>
                  <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                    Border Color
                  </div>
                  <div className="flex gap-2">
                    {ACRYLIC_BORDER_COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setSelectedBorderColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          selectedBorderColor === col.hex ? 'border-[#0E4A93] scale-110 shadow-sm' : 'border-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: HARDWARE & FINISH */}
          {activeTab === 'HARDWARE & FINISH' && (
            <div className="p-3.5 space-y-4">
              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Hardware & Mounting
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {HARDWARE_OPTIONS.map((hw) => {
                    const isSelected = selectedHardwareId === hw.id;
                    return (
                      <div
                        key={hw.id}
                        onClick={() => setSelectedHardwareId(hw.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-16 bg-stone-50 flex items-center justify-center p-2 overflow-hidden relative">
                          <img 
                            src={hw.image} 
                            alt={hw.name} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                          />
                        </div>

                        <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {hw.name}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 mt-0.5">
                            {hw.price === 0 ? 'Included' : `+₹${hw.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Surface Finish
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FINISH_OPTIONS.map((fin) => {
                    const isSelected = selectedFinishId === fin.id;
                    return (
                      <div
                        key={fin.id}
                        onClick={() => setSelectedFinishId(fin.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-16 bg-stone-50 flex items-center justify-center p-2 overflow-hidden relative">
                          <img 
                            src={fin.image} 
                            alt={fin.name} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                          />
                        </div>

                        <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {fin.name}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 mt-0.5">
                            {fin.price === 0 ? 'Included' : `+₹${fin.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: OPTIONS */}
          {activeTab === 'OPTIONS' && (
            <div className="p-3.5 space-y-4">
              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Frame Moulding
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_OPTIONS.map((frm) => {
                    const isSelected = selectedFrameId === frm.id;
                    return (
                      <div
                        key={frm.id}
                        onClick={() => setSelectedFrameId(frm.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-16 bg-stone-50 flex items-center justify-center p-2 overflow-hidden relative">
                          <img 
                            src={frm.image} 
                            alt={frm.name} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                          />
                        </div>

                        <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {frm.name}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 mt-0.5">
                            {frm.price === 0 ? 'Included' : `+₹${frm.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Color Finishing
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_FINISH_OPTIONS.map((cfo) => {
                    const isSelected = activeFrameState.filter === cfo.id;
                    const previewImg = activeFrameState.imageUrl || selectedProductType.image;
                    return (
                      <div
                        key={cfo.id}
                        onClick={() => handleApplyFilter(cfo.id)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0E4A93] bg-blue-50/20 shadow-sm ring-1 ring-[#0E4A93]/20'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-[#0E4A93] text-white rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="w-full h-14 bg-stone-50 flex items-center justify-center p-1 overflow-hidden relative">
                          <img
                            src={previewImg}
                            alt={cfo.label}
                            style={{ filter: cfo.cssFilter }}
                            className="max-h-full max-w-full object-cover rounded"
                          />
                        </div>

                        <div className="p-1.5 bg-white border-t border-stone-100 text-center">
                          <div className="text-[11px] font-bold text-stone-900 leading-tight truncate">
                            {cfo.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </section>

        {/* CENTER / MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col bg-[#F8FAFC] relative overflow-hidden">
          
          {/* TOP-RIGHT TOOLBAR ABOVE WORKSPACE */}
          <div className="h-12 bg-white border-b border-stone-200 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 overflow-x-auto">
            
            {/* Left Image Manipulation Tools */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetImage}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Reset Image"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Right: [SAVE, ADD TEXT, ADD CLIPART, ROOM VIEW]  */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* SAVE */}
              <button
                type="button"
                onClick={handleSaveDesign}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:border-stone-400 cursor-pointer"
                title="Save design to browser"
              >
                <Save className="w-3.5 h-3.5 text-[#0E4A93]" />
                <span>SAVE</span>
              </button>

              {/* ADD TEXT */}
              <button
                type="button"
                onClick={handleAddNewText}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-2xs cursor-pointer ${
                  showTextModal
                    ? 'bg-[#0E4A93] text-white border-[#0E4A93]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
                title="Add custom typography with live real-time editing"
              >
                <Type className="w-3.5 h-3.5" />
                <span>ADD TEXT</span>
              </button>

              {/* ADD CLIPART */}
              <button
                type="button"
                onClick={() => setShowClipartModal(!showClipartModal)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-2xs cursor-pointer ${
                  showClipartModal
                    ? 'bg-[#0E4A93] text-white border-[#0E4A93]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
                title="Add clipart and stickers"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>ADD CLIPART</span>
              </button>

              {/* ROOM VIEW */}
              <button
                type="button"
                onClick={() => setShowRoomView(true)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-2xs cursor-pointer ${
                  showRoomView
                    ? 'bg-[#0E4A93] text-white border-[#0E4A93]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
                title="Preview on realistic wall"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ROOM VIEW</span>
              </button>

              {/* Delete Selected Element (Text/Clipart) */}
              {selectedElement.type !== 'image' && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedElement}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Delete Selected Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

            </div>
          </div>

          {/* LIVE REAL-TIME TEXT EDITOR COMPONENT */}
          {showTextModal && (
            <AcrylicLiveTextEditor
              activeText={activeTextElement || {
                id: 'temp',
                text: 'Your Custom Text',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 28,
                fontWeight: 'bold',
                color: '#FFFFFF',
                alignment: 'center',
                lineHeight: 1.2,
                letterSpacing: 0,
                rotation: 0,
                x: 0,
                y: 0
              }}
              onUpdateText={handleUpdateActiveText}
              onDuplicateText={handleDuplicateActiveText}
              onDeleteText={handleDeleteActiveText}
              onClose={() => setShowTextModal(false)}
            />
          )}

          {/* VISUAL CLIPART PICKER MODAL */}
          <AcrylicClipartModal
            isOpen={showClipartModal}
            onClose={() => setShowClipartModal(false)}
            onAddClipart={handleSelectClipart}
            activeClipart={activeClipartElement}
            onUpdateClipart={handleUpdateActiveClipart}
            onDuplicateClipart={handleDuplicateActiveClipart}
            onDeleteClipart={handleDeleteActiveClipart}
          />

          {/* INTERACTIVE WORKSPACE CANVAS */}
          <div 
            onClick={() => setSelectedElement({ type: 'image', panelIndex: activePanelIndex })}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (!isDragOverCanvas) setIsDragOverCanvas(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setIsDragOverCanvas(false);
            }}
            onDrop={(e) => {
              handlePanelSlotDrop(e, activePanelIndex);
            }}
            className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 sm:p-8 relative bg-radial from-slate-100 via-slate-200/50 to-slate-200"
          >
            
            {/* Acrylic Product Frame Wrapper */}
            <div 
              className={`relative max-w-2xl w-full flex items-center justify-center transition-all duration-300 ${currentFrameCss}`}
            >
              
              {/* 1. Single Frame Layout */}
              {(isCurvedShape || selectedLayoutId === 'layout-1-single') && (
                <div className="w-full max-w-lg">
                  {renderFrameContainer(0, currentShape.aspectClass, currentDimensionLabel)}
                </div>
              )}

              {/* 2. 2 Image Split (or Left + Right / 2 Columns) */}
              {!isCurvedShape && (selectedLayoutId === 'layout-2-split' || selectedLayoutId === 'layout-left-right' || selectedLayoutId === 'layout-2-vertical') && (
                <div className="w-full max-w-xl flex gap-3">
                  <div className="flex-1">
                    {renderFrameContainer(0, 'aspect-[3/4]')}
                  </div>
                  <div className="flex-1">
                    {renderFrameContainer(1, 'aspect-[3/4]')}
                  </div>
                </div>
              )}

              {/* 3. Top + Bottom */}
              {!isCurvedShape && (selectedLayoutId === 'layout-top-bottom' || selectedLayoutId === 'layout-2-horizontal') && (
                <div className="w-full max-w-md flex flex-col gap-3">
                  <div className="w-full">
                    {renderFrameContainer(0, 'aspect-[16/9]')}
                  </div>
                  <div className="w-full">
                    {renderFrameContainer(1, 'aspect-[16/9]')}
                  </div>
                </div>
              )}

              {/* 4. 3 Image Collage (Triptych 3 Columns) */}
              {!isCurvedShape && (selectedLayoutId === 'layout-3-collage' || selectedLayoutId === 'layout-3-wall') && (
                <div className="w-full max-w-2xl flex items-center justify-center gap-3">
                  <div className="flex-1">
                    {renderFrameContainer(0, 'aspect-[1/2]')}
                  </div>
                  <div className="flex-1 scale-105 z-10">
                    {renderFrameContainer(1, 'aspect-[1/2]')}
                  </div>
                  <div className="flex-1">
                    {renderFrameContainer(2, 'aspect-[1/2]')}
                  </div>
                </div>
              )}

              {/* 5. Main + 2 Small Images */}
              {!isCurvedShape && selectedLayoutId === 'layout-main-2small' && (
                <div className="w-full max-w-xl flex gap-3">
                  <div className="w-2/3">
                    {renderFrameContainer(0, 'aspect-[4/3]')}
                  </div>
                  <div className="w-1/3 flex flex-col gap-3">
                    <div className="flex-1">
                      {renderFrameContainer(1, 'aspect-[4/3]')}
                    </div>
                    <div className="flex-1">
                      {renderFrameContainer(2, 'aspect-[4/3]')}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. 4 Image Grid (2x2 Quadrant Grid) */}
              {!isCurvedShape && selectedLayoutId === 'layout-4-grid' && (
                <div className="w-full max-w-lg grid grid-cols-2 gap-3">
                  {renderFrameContainer(0, 'aspect-square')}
                  {renderFrameContainer(1, 'aspect-square')}
                  {renderFrameContainer(2, 'aspect-square')}
                  {renderFrameContainer(3, 'aspect-square')}
                </div>
              )}

            </div>

            {/* Compact Floating Image Editor Controls Bar for Active Slot */}
            {activeFrameState.imageUrl && (
              <div className="mt-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-stone-200/90 flex items-center gap-2.5 z-30 select-none animate-in fade-in slide-in-from-bottom-2">
                {frames.length > 1 && !isCurvedShape && (
                  <div className="text-[11px] font-bold text-stone-700 pr-2 border-r border-stone-200">
                    Slot {activePanelIndex + 1}
                  </div>
                )}

                {/* Containment Mode: [ Fit / Fill ] */}
                <button
                  type="button"
                  onClick={() => updateFrame(activePanelIndex, (curr) => ({
                    ...curr,
                    fitMode: curr.fitMode === 'cover' ? 'contain' : 'cover'
                  }))}
                  className="flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-[#0E4A93] bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Toggle between complete uncropped fit and full shape cover"
                >
                  <span>{activeFrameState.fitMode === 'cover' ? 'Fit (Contain)' : 'Fill (Cover)'}</span>
                </button>

                {/* Zoom Controls: [ − ] [ 1.00x ] [ + ] */}
                <div className="flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-stone-700 hover:text-stone-900 transition-colors font-bold text-sm cursor-pointer"
                    title="Zoom Out (or wheel down)"
                  >
                    −
                  </button>
                  <span className="text-[11px] font-extrabold text-stone-800 min-w-[36px] text-center">
                    {(activeFrameState.scale || 1).toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-stone-700 hover:text-stone-900 transition-colors font-bold text-sm cursor-pointer"
                    title="Zoom In (or wheel up)"
                  >
                    +
                  </button>
                </div>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-[#0E4A93] bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleResetImage}
                  className="flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Reset position, zoom & rotation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            )}

          </div>

        </main>

      </div>

      {/* REALISTIC ROOM VIEW MODAL */}
      <AcrylicRoomViewModal
        isOpen={showRoomView}
        onClose={() => setShowRoomView(false)}
        productDimensionLabel={currentDimensionLabel}
        renderProduct={(isRoomView) => (
          <div className="w-full flex items-center justify-center">
            {renderFrameContainer(0, currentShape.aspectClass, currentDimensionLabel)}
          </div>
        )}
      />

    </div>
  );
};

export default AcrylicCustomizerPage;
