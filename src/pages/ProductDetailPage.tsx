import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Check, 
  Truck, 
  ShieldCheck, 
  Award, 
  MapPin, 
  ChevronRight, 
  Share2, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Upload,
  Layers,
  Sliders,
  Type,
  Maximize2,
  Zap,
  ShoppingCart
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { CUSTOMER_REVIEWS } from '../data/storeData';
import { Product } from '../types';
import { AcrylicProductDetailPage } from './AcrylicProductDetailPage';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface FinishStyle { wall: string; border: number; color: string; shadow: string; outline: string; overlay: string; }

// Visual swatch for a finish/style name: frame colour, edge treatment and surface sheen.
const getFinishStyle = (name: string): FinishStyle => {
  const n = name.toLowerCase();
  const base: FinishStyle = { wall: '#ECE7DF', border: 0, color: 'transparent', shadow: '0 6px 10px -4px rgba(0,0,0,0.45), 3px 3px 0 #d6d0c4', outline: 'none', overlay: '' };
  if (n.includes('black')) return { ...base, border: 5, color: '#161616', shadow: '0 6px 10px -4px rgba(0,0,0,0.5)' };
  if (n.includes('white')) return { ...base, wall: '#E3E8EE', border: 5, color: '#FAFAFA', shadow: '0 6px 10px -4px rgba(0,0,0,0.35)' };
  if (n.includes('gold')) return { ...base, border: 5, color: '#C9A227', shadow: '0 6px 10px -4px rgba(0,0,0,0.45)' };
  if (n.includes('teak') || n.includes('oak') || n.includes('wood')) return { ...base, border: 6, color: n.includes('oak') ? '#C99A62' : '#8B5A2B', shadow: '0 6px 10px -4px rgba(0,0,0,0.45)' };
  if (n.includes('anodized') || n.includes('metal')) return { ...base, border: 3, color: '#9AA3AD', shadow: '0 6px 10px -4px rgba(0,0,0,0.4)' };
  if (n.includes('mirror')) return { ...base, shadow: '0 6px 10px -4px rgba(0,0,0,0.45), 3px 3px 0 #b9c6d6', overlay: 'linear-gradient(120deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 60%)' };
  if (n.includes('bevel')) return { ...base, border: 3, color: 'rgba(255,255,255,0.85)', overlay: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 50%)' };
  if (n.includes('anti-glare') || n.includes('frost') || n.includes('matte') || n.includes('satin')) return { ...base, overlay: 'rgba(255,255,255,0.18)' };
  if (n.includes('gloss') || n.includes('diamond') || n.includes('pearl') || n.includes('lustre')) return { ...base, overlay: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.15) 100%)' };
  return base; // gallery wrap / classic wrap / standard: image wraps the edge
};

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { 
    allProducts, 
    wishlistIds, 
    onToggleWishlist, 
    onAddToCart, 
    onOpenCustomize 
  } = useShop();

  // Find product by id or slug
  const product = useMemo(() => {
    return allProducts.find((p) => p.id === productId || p.slug === productId);
  }, [allProducts, productId]);

  const isWishlisted = product ? wishlistIds.includes(product.id) : false;

  // Variant state
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // In-page customization state
  const [customText, setCustomText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Delivery check state
  const [pincode, setPincode] = useState<string>('500001');
  const [pincodeChecked, setPincodeChecked] = useState<boolean>(false);
  const [checkingPincode, setCheckingPincode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Materials available for this product
  const availableMaterials = useMemo(() => {
    if (!product) return ['Premium Archival Grade Material'];
    if (product.material) {
      return [product.material];
    }
    switch (product.categorySlug) {
      case 'canvas':
        return ['380 GSM Cotton Canvas', 'Satin Lustre Canvas', 'Museum Archival Blend'];
      case 'acrylic':
        return ['5mm Cast Optical Acrylic', '3mm Ultra-Clear Acrylic', '8mm Heavy Glass Acrylic'];
      case 'cork':
        return ['8mm Natural Portuguese Cork', 'High-Density Fine Grain Cork', 'Acoustic Backed Cork'];
      case 'yoga-fitness':
        return ['Natural Tree Rubber & Microfiber', 'Eco TPE High Grip', 'Dual-Layer Cushioned Foam'];
      case 'posters':
        return ['300 GSM Heavyweight Matte Paper', 'Lustre Coated Archival Paper', 'Tear-Proof Coated Film'];
      default:
        return ['Premium Archival Grade Material'];
    }
  }, [product]);

  // Sync variants when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.availableSizes?.[0] || product.sizes?.[0] || '12x18 inch');
      setSelectedFinish(product.finishes?.[0] || 'Standard Finish');
      setSelectedMaterial(availableMaterials[0] || 'Standard');
      setQuantity(1);
      setActiveImageIndex(0);
      setCustomText('');
      setUploadedFile(null);
      setUploadSuccess(false);
      document.title = `${product.name} | Canvas India`;

      // Save to recently viewed
      try {
        const raw = localStorage.getItem('ci_recently_viewed');
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const updated = [product.id, ...existing.filter(id => id !== product.id)].slice(0, 6);
        localStorage.setItem('ci_recently_viewed', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }, [product, availableMaterials]);

  // Gallery images (product primary + any secondary images)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  }, [product]);

  // Related products from same category or catalog
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
      .slice(0, 6);
  }, [allProducts, product]);

  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem('ci_recently_viewed');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const filtered = ids
          .filter(id => id !== product.id)
          .map(id => allProducts.find(p => p.id === id))
          .filter((p): p is Product => Boolean(p))
          .slice(0, 4);
        setRecentlyViewed(filtered);
      }
    } catch {
      // ignore
    }
  }, [product?.id, allProducts]);

  // Handlers
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 6) return;
    setCheckingPincode(true);
    setTimeout(() => {
      setCheckingPincode(false);
      setPincodeChecked(true);
    }, 350);
  };

  const handleShare = () => {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Canvas India`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFile(reader.result as string);
        setUploadSuccess(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCartWithVariants = () => {
    if (!product) return;
    onAddToCart(product, selectedSize, selectedFinish, quantity, customText, uploadedFile || undefined, selectedMaterial);
  };

  const handleBuyNow = () => {
    if (!product) return;
    onAddToCart(product, selectedSize, selectedFinish, quantity, customText, uploadedFile || undefined, selectedMaterial);
    navigate('/cart');
  };

  if (!product) {
    return (
      <div className="w-full bg-[#FFFDF9] py-20 text-center text-stone-900 font-manrope min-h-[65vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Product Not Found</h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            The requested product (<code className="text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded font-mono text-xs">{productId}</code>) could not be found.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/canvas"
              className="px-5 py-2.5 bg-[#0E4A93] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#09356A] transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 border border-stone-300 text-stone-800 text-xs font-bold rounded-lg hover:border-stone-400 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
 
  // Dedicated Acrylic Product Detail Page with Reference 1 layout & customizer drawer
  if (product.categorySlug === 'acrylic') {
    return (
      <ErrorBoundary fallbackTitle="Acrylic Product Error">
        <AcrylicProductDetailPage product={product} />
      </ErrorBoundary>
    );
  }

  const categoryName = product.category || 'Prints';
  const categoryLink = `/${product.categorySlug || 'canvas'}`;

  return (
    <div className="w-full bg-[#FFFDF9] py-6 sm:py-10 text-stone-900 font-manrope">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
        
        {/* ========================================================================= */}
        {/* 1. BREADCRUMBS                                                            */}
        {/* ========================================================================= */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8">
          <Link to="/" className="hover:text-[#0E4A93] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link to={categoryLink} className="hover:text-[#0E4A93] transition-colors">{categoryName}</Link>
          {product.subcategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <Link to={`${categoryLink}?sub=${encodeURIComponent(product.subcategory)}`} className="hover:text-[#0E4A93] transition-colors">
                {product.subcategory}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-medium truncate max-w-[180px] sm:max-w-md">{product.name}</span>
        </nav>

        {/* ========================================================================= */}
        {/* 2. MAIN 2-COLUMN PRODUCT DISPLAY                                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
          
          {/* LEFT: GALLERY (Sticky on desktop, 6-7 columns) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 sticky top-24">
            
            {/* Main Primary Image */}
            <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 shadow-xs group">
              <ProductImage
                src={uploadedFile || galleryImages[activeImageIndex] || product.image}
                alt={product.name}
                categorySlug={product.categorySlug}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Live custom text preview on the product image */}
              {customText.trim() && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
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
                <div className="absolute top-4 left-4 bg-[#0E4A93] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Custom Artwork Applied</span>
                </div>
              )}

              {/* Discount Tag */}
              {!uploadedFile && product.discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-[#E8752A] text-white text-xs font-black uppercase px-2.5 py-1 rounded-md shadow-sm tracking-wider">
                  {product.discountPercent}% OFF
                </div>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 shadow-md flex items-center justify-center transition-all cursor-pointer"
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setActiveImageIndex(idx);
                    }}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx && !uploadedFile
                        ? 'border-[#0E4A93] shadow-md ring-2 ring-[#0E4A93]/20' 
                        : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ProductImage src={img} alt={`View ${idx + 1}`} categorySlug={product.categorySlug} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges Strip (Box-Free, underneath gallery) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-stone-200/80 text-left">
              <div className="flex items-start gap-2.5">
                <Award className="w-5 h-5 text-[#E8752A] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-stone-900">Museum Grade</div>
                  <div className="text-[11px] text-stone-500">12-color archival inks</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Truck className="w-5 h-5 text-[#0E4A93] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-stone-900">Free Delivery</div>
                  <div className="text-[11px] text-stone-500">On orders ₹999+</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-stone-900">Safe Payments</div>
                  <div className="text-[11px] text-stone-500">UPI, NetBanking & Cards</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-stone-900">Pan-India Ship</div>
                  <div className="text-[11px] text-stone-500">19,000+ PIN codes</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: PRODUCT INFO & PURCHASE CONTROLS (5-6 columns) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-5 text-left">
            
            {/* Header: Category & Share */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Link 
                    to={categoryLink}
                    className="text-xs uppercase font-bold tracking-widest text-[#0E4A93] hover:underline"
                  >
                    {categoryName}
                  </Link>
                  {product.subcategory && (
                    <span className="text-xs text-stone-400 font-medium">/ {product.subcategory}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-stone-100"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
                {product.name}
              </h1>

              {/* Status & Ratings */}
              <div className="flex items-center gap-2.5 mt-2.5 text-xs text-stone-600">
                {product.rating !== null && product.rating > 0 ? (
                  <>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-800 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                    <span>•</span>
                    <span className="underline decoration-stone-300">{product.reviewsCount || 48} Customer Reviews</span>
                    <span>•</span>
                  </>
                ) : (
                  <>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[11px] px-2 py-0.5 rounded">
                      New Arrival
                    </span>
                    <span>•</span>
                  </>
                )}
                
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{product.stockStatus || 'In Stock & Handcrafted'}</span>
                </span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Pricing */}
            <div className="pb-4 border-b border-stone-200">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-stone-950">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-base sm:text-lg text-stone-400 line-through">
                  ₹{(product.compareAtPrice || product.originalPrice || Math.round(product.price * 1.3)).toLocaleString('en-IN')}
                </span>
                {product.discountPercent > 0 && (
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Save ₹{((product.compareAtPrice || product.originalPrice || Math.round(product.price * 1.3)) - product.price).toLocaleString('en-IN')} ({product.discountPercent}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Inclusive of GST taxes. Free shipping on orders above ₹999 across India.</p>
            </div>



            {/* 1. Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">1. Available Sizes:</span>
                  <span className="text-stone-500 font-medium">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
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
            )}

            {/* 2. Material Selector */}
            {availableMaterials.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">2. Material:</span>
                  <span className="text-stone-500 font-medium">{selectedMaterial}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableMaterials.map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setSelectedMaterial(mat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedMaterial === mat
                          ? 'border-[#0E4A93] bg-blue-50/60 text-[#0E4A93] shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Finish Selector */}
            {product.finishes && product.finishes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">3. Finish &amp; Style:</span>
                  <span className="text-stone-500 font-medium">{selectedFinish}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.finishes.map((finish) => {
                    const fs = getFinishStyle(finish);
                    const active = selectedFinish === finish;
                    return (
                      <button
                        key={finish}
                        type="button"
                        onClick={() => setSelectedFinish(finish)}
                        className={`p-1.5 text-left rounded-xl border-2 transition-all cursor-pointer ${
                          active
                            ? 'border-[#0E4A93] bg-blue-50/60 shadow-2xs'
                            : 'border-stone-200 bg-white hover:border-stone-400'
                        }`}
                      >
                        <div className="relative aspect-[4/3] bg-stone-200 rounded-md overflow-hidden flex items-center justify-center" style={{ background: fs.wall }}>
                          <div
                            className="relative w-[62%] aspect-[4/3] overflow-hidden"
                            style={{ border: `${fs.border}px solid ${fs.color}`, boxShadow: fs.shadow, outline: fs.outline }}
                          >
                            <img src={galleryImages[0] || product.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                            {fs.overlay && <div className="absolute inset-0 pointer-events-none" style={{ background: fs.overlay }} />}
                          </div>
                        </div>
                        <div className={`mt-1.5 px-0.5 text-[11px] font-semibold leading-tight ${active ? 'text-[#0E4A93]' : 'text-stone-700'}`}>{finish}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-1">
              <span className="font-bold text-xs text-stone-800">6. Quantity:</span>
              <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs font-extrabold text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action CTAs: Add to Cart & Buy Now */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. ADD TO CART BUTTON */}
                <button
                  type="button"
                  onClick={handleAddToCartWithVariants}
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

            {/* Indian Delivery Check Section */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                <Truck className="w-4 h-4 text-[#0E4A93]" />
                <span>Delivery Options &amp; Timelines</span>
              </div>
              
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setPincodeChecked(false);
                  }}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E4A93]"
                />
                <button
                  type="submit"
                  disabled={checkingPincode}
                  className="px-4 py-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-950 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {checkingPincode ? 'Checking...' : 'Check'}
                </button>
              </form>

              {pincodeChecked && (
                <div className="text-xs text-stone-700 space-y-1 pt-1 border-t border-stone-200">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Delivery available to PIN {pincode} in 3–5 business days</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    • Free doorstep delivery eligible (Order ₹999+)
                    <br />
                    • Multi-layer insured packaging with protective corner guards
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. PRODUCT SPECIFICATIONS & APPLICATIONS                                  */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-20 pt-12 border-t border-stone-200 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left: Product Description & Craftsmanship */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Product Description &amp; Craftsmanship
              </h2>

              <p className="text-sm text-stone-700 leading-relaxed">
                {product.description} Handcrafted at Canvas India&apos;s dedicated print studio, each personalized piece undergoes meticulous color grading, museum-grade pigment printing, and professional artisan assembly. Whether displayed in your living room, gifted for an anniversary, or installed in modern corporate spaces, our prints are built to retain vibrancy and depth for over 50 years.
              </p>

              {/* Recommended Applications */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-stone-900">Recommended Applications &amp; Spaces:</h3>
                <div className="flex flex-wrap gap-2">
                  {(product.applications || ['Living Room', 'Master Bedroom', 'Home Office', 'Dining Foyer', 'Corridors']).map((app) => (
                    <span key={app} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-semibold border border-stone-200">
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-stone-900">Care &amp; Handling Instructions:</h3>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li>Dust gently with a clean, dry microfiber cloth. Avoid abrasive cleaning pads.</li>
                  <li>For acrylic glass surfaces, use a soft cotton cloth lightly dampened with water.</li>
                  <li>Keep out of continuous direct rainfall and excessive humidity.</li>
                  <li>Pre-installed hanging hardware makes mounting effortless on standard wall hooks or screws.</li>
                </ul>
              </div>
            </div>

            {/* Right: Specifications Table */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Product Specifications
              </h2>

              <div className="rounded-xl border border-stone-200 overflow-hidden text-xs bg-white divide-y divide-stone-100">
                <div className="flex py-2.5 px-4 bg-stone-50">
                  <span className="w-1/3 font-bold text-stone-800">Category</span>
                  <span className="w-2/3 text-stone-700">{categoryName}</span>
                </div>
                {product.subcategory && (
                  <div className="flex py-2.5 px-4">
                    <span className="w-1/3 font-bold text-stone-800">Subcategory</span>
                    <span className="w-2/3 text-stone-700">{product.subcategory}</span>
                  </div>
                )}
                <div className="flex py-2.5 px-4 bg-stone-50">
                  <span className="w-1/3 font-bold text-stone-800">Material</span>
                  <span className="w-2/3 text-stone-700">{selectedMaterial || product.material || 'Museum Grade Fine Art'}</span>
                </div>
                <div className="flex py-2.5 px-4">
                  <span className="w-1/3 font-bold text-stone-800">Print Quality</span>
                  <span className="w-2/3 text-stone-700">12-Color Archival UV-Resistant Inks (2400 DPI)</span>
                </div>
                <div className="flex py-2.5 px-4 bg-stone-50">
                  <span className="w-1/3 font-bold text-stone-800">Available Sizes</span>
                  <span className="w-2/3 text-stone-700">{product.sizes?.join(', ') || 'Custom Dimensions Available'}</span>
                </div>
                <div className="flex py-2.5 px-4">
                  <span className="w-1/3 font-bold text-stone-800">Available Finishes</span>
                  <span className="w-2/3 text-stone-700">{product.finishes?.join(', ') || 'Standard Finish'}</span>
                </div>
                <div className="flex py-2.5 px-4 bg-stone-50">
                  <span className="w-1/3 font-bold text-stone-800">Mounting Hardware</span>
                  <span className="w-2/3 text-stone-700">Pre-attached hangers &amp; stainless wall standoffs included</span>
                </div>
                <div className="flex py-2.5 px-4">
                  <span className="w-1/3 font-bold text-stone-800">Origin</span>
                  <span className="w-2/3 text-stone-700">Proudly Designed &amp; Handcrafted in India</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. WORKSHOP QUALITY VERIFICATION & CUSTOMER FEEDBACK                      */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-20 pt-12 border-t border-stone-200 text-left">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Quality Verification &amp; Workshop Standards
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Every piece is handcrafted &amp; individually tested at our Hyderabad facility</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Inspected Prior to Dispatch</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-stone-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E4A93]">Color Fidelity Test</span>
                <span className="text-[11px] text-emerald-600 font-bold">Passed</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Calibrated against 12-color archival pigment gamut for &gt;99% tone accuracy and zero banding.
              </p>
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                Canvas India Hyderabad Lab
              </div>
            </div>

            <div className="p-5 rounded-xl border border-stone-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E4A93]">Substrate &amp; Frame Rigidity</span>
                <span className="text-[11px] text-emerald-600 font-bold">Passed</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Kiln-dried pine wood and cast-acrylic substrate tested for humidity tolerance and zero warping.
              </p>
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                Master Framers Studio
              </div>
            </div>

            <div className="p-5 rounded-xl border border-stone-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E4A93]">Safe Transit Guarantee</span>
                <span className="text-[11px] text-emerald-600 font-bold">Passed</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                3-ply corner-reinforced shock-resistant packaging tested to withstand transit vibration and moisture.
              </p>
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                Logistics &amp; Fulfillment
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. YOU MAY ALSO LIKE (Related Products, Box-Free)                         */}
        {/* ========================================================================= */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-20 pt-12 border-t border-stone-200 text-left">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  You May Also Like in {categoryName}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">Popular complementary formats and bestselling custom wall decor</p>
              </div>
              <Link to={categoryLink} className="text-xs font-bold text-[#0E4A93] hover:text-[#E8752A] flex items-center gap-1 transition-colors">
                <span>View All {categoryName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
              {relatedProducts.map((relProd) => (
                <ProductCard
                  key={relProd.id}
                  product={relProd}
                  isWishlisted={wishlistIds.includes(relProd.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                  onCustomize={onOpenCustomize}
                />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. RECENTLY VIEWED (LocalStorage driven, box-free)                        */}
        {/* ========================================================================= */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16 pt-12 border-t border-stone-200 text-left">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mb-6">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
              {recentlyViewed.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  isWishlisted={wishlistIds.includes(item.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                  onCustomize={onOpenCustomize}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
