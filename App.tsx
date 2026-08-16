import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import InviteSignupPage from "@/pages/InviteSignupPage";
import IndustriesPage from "@/pages/IndustriesPage";
import StockDetailPage from "@/pages/StockDetailPage";
import CoursesPage from "@/pages/CoursesPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import StockComparePage from "@/pages/StockComparePage";
import StockScreenerPage from "@/pages/StockScreenerPage";
import NewsPage from "@/pages/NewsPage";
import SettingsPage from "@/pages/SettingsPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col">
    <Navigation />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const ProtectedAppLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/signup/invite/:token" element={<InviteSignupPage />} />
              
              {/* Access denied page - requires auth but not verification */}
              <Route 
                path="/access-denied" 
                element={
                  <ProtectedRoute requireVerification={false}>
                    <AccessDeniedPage />
                  </ProtectedRoute>
                } 
              />

              
              {/* Public routes - accessible to guests */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<AppLayout><HomePage /></AppLayout>} />
              <Route path="/industries" element={<AppLayout><IndustriesPage /></AppLayout>} />
              <Route path="/stocks/:id" element={<AppLayout><StockDetailPage /></AppLayout>} />
              <Route path="/courses" element={<AppLayout><CoursesPage /></AppLayout>} />
              <Route path="/courses/:id" element={<AppLayout><CourseDetailPage /></AppLayout>} />
              <Route path="/resources" element={<AppLayout><ResourcesPage /></AppLayout>} />
              <Route path="/compare" element={<AppLayout><StockComparePage /></AppLayout>} />
              <Route path="/screener" element={<AppLayout><StockScreenerPage /></AppLayout>} />
              <Route path="/news" element={<AppLayout><NewsPage /></AppLayout>} />
              <Route path="/terms" element={<AppLayout><TermsPage /></AppLayout>} />
              <Route path="/privacy" element={<AppLayout><PrivacyPage /></AppLayout>} />
              <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
              <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
              <Route path="/leaderboard" element={<AppLayout><LeaderboardPage /></AppLayout>} />

              {/* Protected routes - require authentication */}
              <Route path="/dashboard" element={<ProtectedAppLayout><DashboardPage /></ProtectedAppLayout>} />
              <Route path="/admin" element={<ProtectedAppLayout><AdminPage /></ProtectedAppLayout>} />
              <Route path="/settings" element={<ProtectedAppLayout><SettingsPage /></ProtectedAppLayout>} />
              <Route path="/profile" element={<ProtectedAppLayout><ProfilePage /></ProtectedAppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

