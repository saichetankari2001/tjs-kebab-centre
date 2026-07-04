import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import MenuPage from './pages/MenuPage';
import MenuCardPage from './pages/MenuCardPage';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AccountPage from './pages/AccountPage';
import AdminApp from './admin/AdminApp';
import StaffPortal from './admin/staff/StaffPortal';
import './styles/global.css';

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return <AdminApp />;
  if (path.startsWith('/staff')) return <StaffPortal />;

  return (
    <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <CustomCursor />
        {/* Cinematic grain overlay — fixed, pointer-events:none */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99998, pointerEvents: 'none',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          opacity: 0.022,
          mixBlendMode: 'overlay',
        }} />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu-card" element={<MenuCardPage />} />
          <Route path="/gallery"   element={<GalleryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
    </AuthProvider>
  );
}
