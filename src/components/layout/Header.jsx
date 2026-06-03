import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': 'Dashboard',
  '/notes': 'My Notes',
  '/chat': 'AI Chat',
};

export default function Header() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const title = titles[base] || 'AI Second Brain';

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
