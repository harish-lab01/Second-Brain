import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useCollections } from '../../hooks/useCollections';

export default function Layout() {
  const { user } = useAuth();
  const { fetchCollections } = useCollections(user?.uid);

  // Fetch collections once on mount so NoteCards across all pages can show badges
  useEffect(() => {
    if (user) fetchCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // fetchCollections is a stable useCallback — omitting intentionally

  return (
    <div className="flex h-screen mesh-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
