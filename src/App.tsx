import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import { SkeletonHero } from '@/components/Skeletons';

const Home = lazy(() => import('@/pages/Home'));
const Movies = lazy(() => import('@/pages/Movies'));
const Series = lazy(() => import('@/pages/Series'));
const RecentlyAdded = lazy(() => import('@/pages/RecentlyAdded'));
const Trending = lazy(() => import('@/pages/Trending'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const Watch = lazy(() => import('@/pages/Watch'));
const MyList = lazy(() => import('@/pages/MyList'));
const ContinueWatching = lazy(() => import('@/pages/ContinueWatching'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Profile = lazy(() => import('@/pages/Profile'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="pt-16">
      <SkeletonHero />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-ink">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/series" element={<Series />} />
                <Route path="/recently-added" element={<RecentlyAdded />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route
                  path="/my-list"
                  element={
                    <ProtectedRoute>
                      <MyList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/continue-watching"
                  element={
                    <ProtectedRoute>
                      <ContinueWatching />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
