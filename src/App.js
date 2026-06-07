import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminApp from './admin/AdminApp';
import StaffPortal from './admin/staff/StaffPortal';
import './styles/global.css';

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return <AdminApp />;
  if (path.startsWith('/staff')) return <StaffPortal />;

  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
