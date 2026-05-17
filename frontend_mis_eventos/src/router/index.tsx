import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import RootLayout from '../components/RootLayout';
import { useAuthStore } from '../store/authStore';

const HomePage = lazy(() => import('../pages/Home/HomePage'));
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const EventsListPage = lazy(() => import('../pages/EventsList/EventsListPage'));
const EventDetailPage = lazy(() => import('../pages/EventDetail/EventDetailPage'));
const EventFormPage = lazy(() => import('../pages/EventForm/EventFormPage'));
const MyRegistrationsPage = lazy(() => import('../pages/MyRegistrations/MyRegistrationsPage'));
const AdminPage = lazy(() => import('../pages/AdminPanel/AdminPage'));

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-on-surface-variant)' }}>
    Cargando...
  </div>
);

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<Loading />}>{element}</Suspense>
);

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'events', element: withSuspense(<EventsListPage />) },
      { path: 'events/new', element: withSuspense(<RequireAuth><EventFormPage /></RequireAuth>) },
      { path: 'events/:id', element: withSuspense(<EventDetailPage />) },
      { path: 'events/:id/edit', element: withSuspense(<RequireAuth><EventFormPage /></RequireAuth>) },
      { path: 'my-registrations', element: withSuspense(<RequireAuth><MyRegistrationsPage /></RequireAuth>) },
      { path: 'admin', element: withSuspense(<RequireAdmin><AdminPage /></RequireAdmin>) },
    ],
  },
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '*', element: <Navigate to="/" replace /> },
]);
