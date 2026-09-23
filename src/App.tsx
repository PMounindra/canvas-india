import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';
import { RootLayout } from './components/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AcrylicCategoryPage } from './pages/AcrylicCategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DesignersArchitectsPage } from './pages/DesignersArchitectsPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { SearchPage } from './pages/SearchPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { ShippingDeliveryPage } from './pages/ShippingDeliveryPage';
import { CancellationPolicyPage } from './pages/CancellationPolicyPage';
import { RefundReturnPage } from './pages/RefundReturnPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CanvasCategoryPage } from './pages/CanvasCategoryPage';
import { AcrylicCustomizerPage } from './pages/AcrylicCustomizerPage';
import { AllCategoriesPage } from './pages/AllCategoriesPage';
import { CanvasCustomizerPage } from './pages/CanvasCustomizerPage';
import { MobileUploadPage } from './pages/MobileUploadPage';

// Auth & Checkout Pages
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AccountPage } from './pages/AccountPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';

import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <Routes>
          {/* Dedicated Full-Screen Acrylic Customizer */}
          <Route
            path="/customize/acrylic/:productId"
            element={
              <ErrorBoundary fallbackTitle="Acrylic Customizer Error">
                <AcrylicCustomizerPage />
              </ErrorBoundary>
            }
          />
          {/* Dedicated Full-Screen Canvas Customizer */}
          <Route
            path="/customize/canvas/:productId"
            element={
              <ErrorBoundary fallbackTitle="Canvas Customizer Error">
                <CanvasCustomizerPage />
              </ErrorBoundary>
            }
          />
          {/* Dedicated Mobile QR Upload Page */}
          <Route path="/mobile-upload/:sessionId" element={<MobileUploadPage />} />

          <Route element={<RootLayout />}>
            {/* Home */}
            <Route path="/" element={<HomePage />} />

            {/* Authentication & Account Routes */}
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />

            {/* Checkout & Order Success */}
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />

            {/* Canvas — dedicated product listing page (feature/canvas-category-page) */}
            <Route path="/categories" element={<AllCategoriesPage />} />
            <Route path="/canvas" element={<CanvasCategoryPage />} />
            {/* /canvas-prints is an alias that uses the generic CategoryPage for SEO parity */}
            <Route path="/canvas-prints" element={<CategoryPage categorySlug="canvas" />} />
            {/* Acrylic — dedicated category page */}
            <Route path="/acrylic" element={<AcrylicCategoryPage />} />
            <Route path="/acrylic-prints" element={<AcrylicCategoryPage />} />
            <Route path="/posters" element={<CategoryPage categorySlug="posters" />} />

            <Route path="/cork" element={<CategoryPage categorySlug="cork" />} />
            <Route path="/cork-prints" element={<CategoryPage categorySlug="cork" />} />

            <Route path="/yoga-fitness" element={<CategoryPage categorySlug="yoga-fitness" />} />
            <Route path="/home-decor" element={<CategoryPage categorySlug="home-decor" />} />
            <Route path="/custom-prints" element={<CategoryPage categorySlug="custom-prints" />} />
            <Route path="/gifts" element={<CategoryPage categorySlug="gifts" />} />

            <Route path="/bulk-order" element={<CategoryPage categorySlug="bulk-order" />} />
            <Route path="/bulk-orders" element={<CategoryPage categorySlug="bulk-order" />} />

            <Route path="/corporate-orders" element={<CategoryPage categorySlug="corporate-orders" />} />
            <Route path="/corporate" element={<CategoryPage categorySlug="corporate-orders" />} />

            <Route path="/wall-art" element={<CategoryPage categorySlug="wall-art" />} />
            <Route path="/photo-frames" element={<CategoryPage categorySlug="photo-frames" />} />

            {/* Solutions for Designers & Architects */}
            <Route path="/designers-architects" element={<DesignersArchitectsPage />} />

            {/* Dedicated Cart, Wishlist, Search Pages */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Reusable Product Detail Page */}
            <Route path="/products/:productId" element={<ProductDetailPage />} />

            {/* About & Policies */}
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
            <Route path="/terms" element={<TermsConditionsPage />} />
            <Route path="/shipping-policy" element={<ShippingDeliveryPage />} />
            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
            <Route path="/refund-policy" element={<RefundReturnPage />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;
