
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";

const Index = lazy(() => import("./pages/Index"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const VenuePage = lazy(() => import("./pages/VenuePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ConfirmAndPay = lazy(() => import("./pages/ConfirmAndPay"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const BookingHistoryPage = lazy(() => import("./pages/BookingHistoryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Header />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/venue/:id" element={<VenuePage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/confirm-and-pay" element={<ConfirmAndPay />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/booking-history" element={<BookingHistoryPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
