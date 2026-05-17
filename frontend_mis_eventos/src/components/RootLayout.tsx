import { useLocation, Outlet } from 'react-router-dom';
import NavBar from './NavBar/NavBar';
import Footer from './Footer/Footer';
import ToastContainer from './Toast/ToastContainer';

export default function RootLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <NavBar />
      <main style={{ flex: 1, paddingTop: isHome ? 0 : 64 }}>
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </>
  );
}
