import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Heart, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Award, 
  Palette, 
  Gift, 
  SlidersHorizontal,
  ArrowRight,
  PackageCheck,
  Info,
  Zap,
  Upload,
  Type,
  Check
} from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { ProductImage } from '../components/ProductImage';
import { 
  AcrylicProductReview, 
  getProductReviews, 
  saveProductReview, 
  getRelatedAcrylicProducts 
} from '../data/acrylicReviews';

export interface AcrylicProductDetailPageProps {
  product: Product;
}

export const AcrylicProductDetailPage: React.FC<AcrylicProductDetailPageProps> = ({ product }) => {
  const navigate = useNavigate();
  const { allProducts, wishlistIds, onToggleWishlist, onAddToCart } = useShop();

  const isWishlisted = wishlistIds.includes(product.id);

  // Gallery State
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (!list.includes(img)) list.push(img);
      });
    }
    // Add additional angles if available
    if (list.length < 3) {
      list.push('/assets/acrylic/acrylic-panel-living.jpg');
      list.push('/assets/acrylic/acrylic-panel-standoff.jpg');
    }
    return list;
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Configuration Selectors State
  const availableStyles = product.availableStyles || ['Block', 'Shapes'];
  const availableThicknesses = product.availableThicknesses || ['7mm', '18mm'];
  const availableSizes = product.availableSizes || product.sizes || [
    '4" x 4"', '6" x 4"', '4" x 6"', '5" x 5"', '5" x 7"', '7" x 5"',
    '6" x 6"', '8" x 8"', '10" x 8"', '8" x 10"', '12" x 8"', '8" x 12"'
  ];
  const availablePapers = product.availablePapers || ['White Luster Photo Paper', 'Metallic Pearl Paper'];
  const availableBases = product.availableBases || ['Without Base', 'Acrylic Base', 'Solid Wood Base'];

  const [selectedStyle, setSelectedStyle] = useState<string>(availableStyles[0] || 'Block');
  const [selectedThickness, setSelectedThickness] = useState<string>(availableThicknesses[0] || '7mm');
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '4" x 4"');
  const [selectedPaper, setSelectedPaper] = useState<string>(availablePapers[0] || 'White Luster Photo Paper');
  const [selectedBase, setSelectedBase] = useState<string>(availableBases[0] || 'Without Base');
  const [quantity, setQuantity] = useState<number>(1);

  // Photo Upload & Custom Text state
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile(event.target?.result as string);
        setUploadSuccess(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Bottom Tabs State ('description' | 'specifications' | 'shipping' | 'reviews')
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping' | 'reviews'>('description');

  // Reset variant state when product changes
  useEffect(() => {
    setSelectedStyle(availableStyles[0] || 'Block');
    setSelectedThickness(availableThicknesses[0] || '7mm');
    setSelectedSize(availableSizes[0] || '4" x 4"');
    setSelectedPaper(availablePapers[0] || 'White Luster Photo Paper');
    setSelectedBase(availableBases[0] || 'Without Base');
    setQuantity(1);
    setActiveImageIndex(0);
    document.title = `${product.name} | Canvas India`;
  }, [product]);

  // Gallery Navigation Controls
  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };


  // Product Reviews State for this specific product
  const [reviews, setReviews] = useState<AcrylicProductReview[]>(() => {
    return getProductReviews(product.id);
  });

  useEffect(() => {
    setReviews(getProductReviews(product.id));
  }, [product.id]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return Number(product.rating || 4.8);
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, product.rating]);

  const totalReviewsCount = useMemo(() => {
    return (product.reviewsCount || 48) + Math.max(0, reviews.length - 2);
  }, [reviews.length, product.reviewsCount]);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  const handleOpenReviewModal = () => {
    setReviewRating(5);
    setHoverRating(0);
    setReviewText('');
    setReviewerName('');
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setReviewError(null);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 5) {
      setReviewError('Please write at least a few words describing your experience (minimum 5 characters).');
      return;
    }

    const created = saveProductReview(product.id, {
      author: reviewerName.trim() || 'Verified Customer',
      rating: reviewRating,
      comment: reviewText.trim(),
    });

    setReviews(prev => [created, ...prev]);
    setReviewSuccessMessage('Thank you! Your review for "' + product.name + '" has been added.');
    setTimeout(() => setReviewSuccessMessage(null), 4000);
    handleCloseReviewModal();
  };

  // Related Acrylic Products (Product-specific, excluding current product)
  const relatedAcrylics = useMemo(() => {
    return getRelatedAcrylicProducts(product.id, allProducts, 4);
  }, [product.id, allProducts]);

  // Dynamic Price Calculation
  const unitPrice = useMemo(() => {
    let price = product.price || 999;
    const sizeStr = selectedSize || '';

    // Size adjustment
    if (sizeStr.includes('6" x 6"') || sizeStr.includes('5" x 7"') || sizeStr.includes('7" x 5"')) price += 200;
    else if (sizeStr.includes('8" x 8"') || sizeStr.includes('8" x 10"') || sizeStr.includes('10" x 8"')) price += 450;
    else if (sizeStr.includes('12" x 8"') || sizeStr.includes('8" x 12"') || sizeStr.includes('12" x 12"')) price += 700;
    else if (sizeStr.includes('12" x 18"') || sizeStr.includes('16" x 24"')) price += 1100;
    else if (sizeStr.includes('20" x 30"') || sizeStr.includes('24" x 36"') || sizeStr.includes('Set of 3')) price += 1800;
    else if (sizeStr.includes('30" x 48"') || sizeStr.includes('36" x 60"')) price += 2600;

    // Thickness adjustment
    if (selectedThickness === '18mm' || selectedThickness === '8mm' || selectedThickness === '10mm') {
      price += 350;
    }

    // Base adjustment
    if (selectedBase === 'Acrylic Base') price += 200;
    else if (selectedBase === 'Solid Wood Base') price += 250;
    else if (selectedBase === 'Chrome Floating Standoffs') price += 200;

    // Paper adjustment
    if (selectedPaper === 'Metallic Pearl Paper') price += 150;

    return price;
  }, [product.price, selectedSize, selectedThickness, selectedBase, selectedPaper]);

  const originalUnitPrice = useMemo(() => {
    return Math.round(unitPrice * 1.4);
  }, [unitPrice]);

  const discountPercent = useMemo(() => {
    return Math.round(((originalUnitPrice - unitPrice) / originalUnitPrice) * 100);
  }, [originalUnitPrice, unitPrice]);

  const totalDiscountedPrice = unitPrice * quantity;
  const totalOriginalPrice = originalUnitPrice * quantity;
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;

  // Add to Cart from PDP
  const handleAddToCart = () => {
    onAddToCart(
      {
        ...product,
        price: unitPrice,
      },
      selectedSize,
      `${selectedThickness} Acrylic - ${selectedStyle}`,
      quantity,
      undefined,
      galleryImages[activeImageIndex] || product.image,
      product.material,
      selectedThickness,
      selectedStyle,
      selectedBase,
      selectedPaper
    );
  };

  // Dedicated Customizer Page Navigation
  const handleOpenCustomizer = () => {
    const params = new URLSearchParams({
      size: selectedSize,
      thickness: selectedThickness,
      style: selectedStyle,
      paper: selectedPaper,
      base: selectedBase,
      qty: quantity.toString(),
    });
    navigate(`/customize/acrylic/${product.slug || product.id}?${params.toString()}`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="w-full bg-[#FFFDF9] text-stone-900 font-manrope min-h-screen">
      
      {/* ========================================================================= */}
      {/* 1. FUNCTIONAL BREADCRUMB STRIP                                            */}
      {/* ========================================================================= */}
      <div className="w-full border-b border-stone-200 bg-white">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 overflow-x-auto scrollbar-none">
            <Link to="/" className="hover:text-[#0E4A93] transition-colors whitespace-nowrap">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link to="/acrylic" className="hover:text-[#0E4A93] transition-colors whitespace-nowrap">Acrylic</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link 
              to={`/acrylic?sub=${encodeURIComponent(product.subcategory || 'Photo Panels')}`} 
              className="hover:text-[#0E4A93] transition-colors whitespace-nowrap"
            >
              {product.subcategory || 'Photo Panels'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="font-bold text-stone-900 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN PRODUCT SECTION                                        */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* --------------------------------------------------------------------- */}
          {/* LEFT COLUMN: PRODUCT IMAGE GALLERY                                    */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Stage Image Container */}
            <div className="relative aspect-[4/3] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-md group">
              
              <ProductImage
                src={uploadedFile || galleryImages[activeImageIndex] || product.image}
                alt={product.name}
                category="acrylic"
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Live custom text preview on the product image */}
              {customText.trim() && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center z-10">
                  <span
                    className="inline-block max-w-full break-words text-white text-xl sm:text-3xl font-bold leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', textShadow: '0 2px 10px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.6)' }}
                  >
                    {customText}
                  </span>
                </div>
              )}

              {/* Uploaded User Photo Indicator Overlay */}
              {uploadedFile && (
                <div className="absolute top-4 left-4 z-10 bg-[#0E4A93] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Custom Artwork Applied</span>
                </div>
              )}

              {/* Acrylic Gloss Glass Sheen Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none" />

              {/* Discount Tag Overlay */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                <span className="bg-[#E8752A] text-white text-xs font-black px-3 py-1 rounded-full shadow-md tracking-wide uppercase">
                  {discountPercent}% OFF
                </span>
                {product.badge && product.badge !== 'Custom' && (
                  <span className="bg-[#0E4A93] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Wishlist Heart Button Overlay */}
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white/90 text-stone-600 hover:text-rose-600 hover:bg-white'
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              {/* Previous Image Navigation Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-10"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Image Navigation Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-10"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Thickness / Optical Tag */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-lg">
                {selectedThickness} Optical Cast Acrylic
              </div>
            </div>

            {/* Thumbnail Gallery Underneath */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 sm:w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'border-[#0E4A93] ring-2 ring-[#0E4A93]/20 shadow-md scale-105'
                          : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${product.name} preview ${idx + 1}`}
                        category="acrylic"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: PRODUCT INFORMATION & PURCHASE / CUSTOMIZATION         */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Title & Category Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0E4A93]">
                  ACRYLIC / {product.subcategory || 'Photo Panels'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Stock</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Star Rating Display */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-extrabold text-stone-900">
                  {product.rating || '4.8'} / 5
                </span>
                <span className="text-stone-400">•</span>
                <span className="text-stone-500 underline cursor-pointer hover:text-[#0E4A93]">
                  {product.reviewsCount || 48} Customer Reviews
                </span>
              </div>
            </div>

            {/* Price Display */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-stone-950 tracking-tight">
                    ₹{totalDiscountedPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-semibold text-stone-400 line-through">
                    ₹{totalOriginalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    Save ₹{totalSavings.toLocaleString('en-IN')} ({discountPercent}%)
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100/70 text-[#92400e] text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-[#E8752A]" />
                <span>LOWEST PRICE GUARANTEED</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.shortDescription || 'Personalized Acrylic Photo Blocks provide a clean, modern display for photographs and artwork, featuring crystal-clear cast acrylic, diamond-polished beveled edges, and an immersive dimensional appearance.'}
            </p>

            {/* ========================================================================= */}
            {/* PROMINENT "CUSTOMIZE YOUR PRODUCT" WORKFLOW                               */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-wider text-[#E8752A] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E8752A]" />
                  <span>Customize Your Product</span>
                </div>
                <span className="text-[10px] font-bold bg-[#E8752A] text-white px-2 py-0.5 rounded-full">
                  Step-by-Step
                </span>
              </div>

              {/* Step Visual List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">1</span>
                  <span>Select Size</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">2</span>
                  <span>Select Style</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">3</span>
                  <span>Select Thickness</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">4</span>
                  <span>Upload Your Design</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">5</span>
                  <span>Add Custom Text</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E4A93] font-bold text-[11px] flex items-center justify-center border border-orange-200 shrink-0">6</span>
                  <span>Choose Quantity</span>
                </div>
              </div>

              {/* Upload & Custom Text In-Page Inputs */}
              <div className="pt-2 border-t border-orange-200/60 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1 flex items-center gap-1">
                    <Upload className="w-3 h-3 text-[#E8752A]" />
                    <span>4. Upload Your Photo or Artwork:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-600 hover:border-[#0E4A93] cursor-pointer flex items-center justify-between">
                      <span className="truncate">{uploadSuccess ? 'Photo attached successfully!' : 'Choose JPG, PNG or WebP file...'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      <span className="px-2 py-0.5 bg-stone-100 text-[10px] font-bold rounded">Browse</span>
                    </label>
                    {uploadSuccess && (
                      <button 
                        type="button" 
                        onClick={() => { setUploadedFile(null); setUploadSuccess(false); }}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1 flex items-center gap-1">
                    <Type className="w-3 h-3 text-[#E8752A]" />
                    <span>5. Add Custom Text (e.g. Names, Date, Mantra):</span>
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Optional text to print on product..."
                    className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E4A93]"
                  />
                </div>
              </div>
            </div>

            {/* 1. Available Sizes (Pill Buttons) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">1. Available Sizes:</span>
                <span className="text-stone-500 font-medium">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Style (Pill Buttons) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">2. Select Style:</span>
                <span className="text-stone-500 font-medium">{selectedStyle}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      selectedStyle === style
                        ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Select Thickness (Pill Buttons) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">3. Select Thickness:</span>
                <span className="text-stone-500 font-medium">{selectedThickness}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableThicknesses.map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setSelectedThickness(th)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      selectedThickness === th
                        ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Select Paper (Pill Buttons) */}
            {availablePapers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">4. Select Paper:</span>
                  <span className="text-stone-500 font-medium">{selectedPaper}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availablePapers.map((paper) => (
                    <button
                      key={paper}
                      type="button"
                      onClick={() => setSelectedPaper(paper)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedPaper === paper
                          ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {paper}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Select Base (Pill Buttons) */}
            {availableBases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">5. Select Base:</span>
                  <span className="text-stone-500 font-medium">{selectedBase}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableBases.map((base) => (
                    <button
                      key={base}
                      type="button"
                      onClick={() => setSelectedBase(base)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedBase === base
                          ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {base}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Quantity Selector */}
            <div className="flex items-center gap-4 pt-1">
              <span className="font-bold text-xs text-stone-800">6. Quantity:</span>
              <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs font-extrabold text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* =================================================================== */}
            {/* TWO PRIMARY ACTIONS: [ ADD TO CART ] & [ BUY NOW ]                  */}
            {/* =================================================================== */}
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. ADD TO CART BUTTON */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 bg-[#0E4A93] hover:bg-[#09356A] active:scale-[0.99] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 tracking-wide transition-all cursor-pointer uppercase"
                >
                  <ShoppingCart className="w-4 h-4 text-white" />
                  <span>ADD TO CART</span>
                </button>

                {/* 2. BUY NOW BUTTON */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 bg-[#E8752A] hover:bg-[#d6651d] active:scale-[0.99] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 tracking-wide transition-all cursor-pointer uppercase"
                >
                  <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
                  <span>BUY NOW</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Quality Guaranteed</span>
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#0E4A93]" />
                  <span>Free Pan-India Delivery &gt;₹999</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ADVANTAGES & EDITORIAL COPY SECTION (Matches Reference 1)               */}
      {/* ========================================================================= */}
      <section className="w-full bg-stone-50 border-t border-stone-200/80 py-12">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14 text-center max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight">
            ADVANTAGES OF CUSTOM ACRYLIC PHOTO BLOCKS
          </h2>
          <div className="w-16 h-1 bg-[#E8752A] mx-auto my-3 rounded-full" />
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            You can make your memories last a lifetime when you decorate your home with them. With Canvas India, we go the extra mile when it comes to transforming your family photos into unique home decor. Print your special occasions onto custom acrylic photo blocks from Canvas India.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT TABS: DESCRIPTION, SPECIFICATIONS, SHIPPING, REVIEWS           */}
      {/* ========================================================================= */}
      <section className="w-full bg-white border-t border-stone-200 py-12">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
          
          {/* Tabs Bar */}
          <div className="flex items-center gap-3 border-b border-stone-200 overflow-x-auto scrollbar-none pb-px mb-8">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specifications', label: 'Specifications' },
              { id: 'shipping', label: 'Shipping & Delivery' },
              { id: 'reviews', label: `Reviews (${totalReviewsCount})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-4 text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#0E4A93] text-[#0E4A93]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {activeTab === 'description' && (
              <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <h3 className="text-base font-bold text-stone-900">
                  About {product.name}
                </h3>
                <p>
                  Custom photo acrylic blocks, crafted with {selectedThickness} clear, diamond-polished optical acrylic, allow natural light to filter through for a striking 3D glass effect that stands proudly on any desk, shelf, or mantelpiece.
                </p>
                <p>
                  Create a contemporary, vibrant look for your favorite photographs. These crystal pieces capture ambient lighting to enhance color saturation and optical depth in portraits, wedding snapshots, family milestones, and architectural cityscapes.
                </p>
                <p>
                  Choose from custom size options, finishes, and optional solid wooden or crystal acrylic bases. Sub-surface archival UV printing seals every pigment against moisture and UV light, ensuring vibrant color fidelity that never fades or wrinkles.
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Material</span>
                    <span className="font-bold text-stone-900">Solid Optical Cast Acrylic</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Thickness</span>
                    <span className="font-bold text-stone-900">{selectedThickness} (approx 0.3 to 0.7 inch)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Edge Finish</span>
                    <span className="font-bold text-stone-900">Diamond Beveled &amp; Hand Flame Polished</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Printing Technology</span>
                    <span className="font-bold text-stone-900">Direct Archival Sub-Surface UV Inks</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Display Style</span>
                    <span className="font-bold text-stone-900">{selectedStyle} (Freestanding / Standoff)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Manufactured In</span>
                    <span className="font-bold text-stone-900">Hyderabad Facility, Telangana, India</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <h3 className="text-base font-bold text-stone-900">
                  Fast &amp; Secure Pan-India Dispatch
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <PackageCheck className="w-5 h-5 text-[#0E4A93]" />
                    <div className="font-bold text-stone-900 text-xs">Production Time</div>
                    <div className="text-[11px] text-stone-500">Handcrafted &amp; cured in 24 - 48 hours</div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <div className="font-bold text-stone-900 text-xs">Delivery Time</div>
                    <div className="text-[11px] text-stone-500">3 - 5 business days across Indian pin codes</div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <div className="font-bold text-stone-900 text-xs">Transit Guarantee</div>
                    <div className="text-[11px] text-stone-500">Free replacement if damaged in transit</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                      ))}
                    </div>
                    <span className="font-extrabold text-stone-900 text-sm">{averageRating} out of 5</span>
                    <span className="text-xs text-stone-500">({totalReviewsCount} Customer Reviews)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenReviewModal}
                    className="px-4 py-2 bg-[#0E4A93] hover:bg-[#09356A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>+ Add Review</span>
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{rev.author}</span>
                            {rev.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>
                          <span className="text-stone-400 text-[11px]">{rev.date}</span>
                        </div>
                        <div className="flex text-amber-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= rev.rating ? 'text-amber-400' : 'text-stone-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-stone-600 italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                      No customer reviews yet for {product.name}. Be the first to add your review!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRODUCT BENEFITS (4 CLEAN ICONS)                                       */}
      {/* ========================================================================= */}
      <section className="w-full bg-stone-50 border-t border-stone-200 py-10">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0E4A93] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-stone-900">Premium Quality</div>
                <div className="text-[11px] text-stone-500">Crystal clear &amp; vibrant prints</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#E8752A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-stone-900">Secure Packaging</div>
                <div className="text-[11px] text-stone-500">Damage-free transit guarantee</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-stone-900">Easy Customization</div>
                <div className="text-[11px] text-stone-500">Design your way with 3D studio</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-stone-900">Fast Delivery</div>
                <div className="text-[11px] text-stone-500">Direct from Hyderabad across India</div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. DEDICATED CUSTOMER REVIEWS SECTION                                      */}
      {/* ========================================================================= */}
      <section className="w-full bg-white border-t border-stone-200 py-12 sm:py-16 text-left">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E4A93] mb-1">
                Verified Customer Feedback
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                CUSTOMER REVIEWS
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} 
                    />
                  ))}
                </div>
                <span className="font-extrabold text-stone-900 text-sm">
                  {averageRating}
                </span>
                <span className="text-xs text-stone-500">
                  • {totalReviewsCount} Customer Reviews
                </span>
              </div>
            </div>

            {/* + Add Review Button */}
            <div>
              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="px-5 py-2.5 bg-[#0E4A93] hover:bg-[#09356A] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>+ Add Review</span>
              </button>
            </div>
          </div>

          {/* Product-Specific Reviews List */}
          <div className="py-6 divide-y divide-stone-200 max-w-4xl space-y-6">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500 text-xs">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900">
                        {rev.author}
                      </span>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {rev.date}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                No customer reviews yet for {product.name}. Be the first to share your experience!
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MORE LIKE THIS (Related Acrylic Products, Product-Specific)            */}
      {/* ========================================================================= */}
      {relatedAcrylics.length > 0 && (
        <section className="w-full bg-stone-50 border-t border-stone-200 py-12 sm:py-16 text-left">
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E4A93] mb-1">
                  Explore Similar Formats
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  MORE LIKE THIS
                </h2>
              </div>
              <Link 
                to="/acrylic" 
                className="text-xs font-bold text-[#0E4A93] hover:underline flex items-center gap-1"
              >
                <span>View All Acrylics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Related Acrylic Products Grid (Compact Cards, Non-nested) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedAcrylics.map((rel) => (
                <div 
                  key={rel.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <Link to={`/products/${rel.id}`} className="block relative aspect-square overflow-hidden bg-stone-100">
                      <img 
                        src={rel.image} 
                        alt={rel.name}
                        onError={(e) => {
                          e.currentTarget.src = '/assets/acrylic/acrylic-fallback.jpg';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#0E4A93] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Acrylic
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-3.5 space-y-1 text-left">
                      <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rel.rating || '4.8'}</span>
                        <span className="text-stone-400 font-normal">({rel.reviewsCount || 48})</span>
                      </div>

                      <Link to={`/products/${rel.id}`} className="block">
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#0E4A93] transition-colors truncate">
                          {rel.name}
                        </h3>
                      </Link>

                      <div className="text-xs sm:text-sm font-extrabold text-stone-900 pt-0.5">
                        ₹{rel.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* View Product CTA */}
                  <div className="p-3.5 pt-0">
                    <Link 
                      to={`/products/${rel.id}`}
                      className="w-full py-2 px-3 bg-stone-100 hover:bg-[#0E4A93] text-stone-800 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>View Product</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. ADD REVIEW MODAL                                                       */}
      {/* ========================================================================= */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-left space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E4A93]">Customer Review</span>
                <h3 className="text-base font-extrabold text-stone-900">
                  Write a Review for {product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReviewModal}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Overall Rating:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-xl cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={(hoverRating || reviewRating) >= star ? 'text-amber-400' : 'text-stone-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {(hoverRating || reviewRating)} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Review:
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => {
                    setReviewText(e.target.value);
                    if (reviewError) setReviewError(null);
                  }}
                  rows={4}
                  placeholder="Write your review about print clarity, glass thickness, beveling, packaging..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-[#0E4A93] focus:ring-1 focus:ring-[#0E4A93]"
                  required
                />
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Name:
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Your name (e.g. Priya Sharma)"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-[#0E4A93] focus:ring-1 focus:ring-[#0E4A93]"
                />
              </div>

              {reviewError && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {reviewError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E4A93] hover:bg-[#09356A] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {reviewSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{reviewSuccessMessage}</span>
        </div>
      )}

    </div>
  );
};
export default AcrylicProductDetailPage;
