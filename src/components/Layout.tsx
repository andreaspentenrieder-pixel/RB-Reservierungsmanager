import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Calendar, Car, List, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Räume', path: '/rooms', icon: Calendar },
    { name: 'Fahrzeuge', path: '/vehicles', icon: Car },
    { name: 'Meine Reservierungen', path: '/my-reservations', icon: List }
  ];

  if (user?.role === 'Admin') {
    navItems.push({ name: 'Verwaltung', path: '/admin', icon: Shield });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-vr-bg text-gray-900">
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-[260px] bg-white border-r border-vr-border flex flex-col pt-6 shrink-0`}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <div>
            <div className="text-vr-blue font-bold text-xl uppercase tracking-wider">Raiffeisenbank</div>
            <div className="text-vr-orange font-bold text-sm tracking-tighter">Isar-Loisachtal eG</div>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6 text-gray-500"/></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-5 py-3 text-sm font-medium flex items-center cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-vr-blue border-l-4 border-vr-blue' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-vr-blue border-l-4 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-gray-100">
          <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-widest">Portal-Sicherheit</div>
          <div className="text-[10px] text-gray-500 italic">noindex, nofollow aktiv</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-vr-border flex justify-between items-center px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 font-medium text-gray-700">
              <span className="hidden sm:inline">Willkommen,</span> <span className="text-vr-blue">{user?.yhIdentifier} ({user?.role})</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 hidden sm:block">{user?.email}</div>
            <button onClick={handleLogout} className="text-sm font-semibold text-vr-orange flex items-center">
              Abmelden
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 md:left-[260px] left-0 w-full md:w-[calc(100%-260px)] h-10 bg-white border-t border-gray-200 flex items-center px-4 md:px-8 text-[11px] text-gray-400 justify-between z-10">
        <div>&copy; 2024 Raiffeisenbank Isar-Loisachtal eG | Internes Portal</div>
        <div className="space-x-4">
          <Link to="/impressum" className="hover:text-vr-blue">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-vr-blue">Datenschutz</Link>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="hidden sm:inline text-red-800 font-bold uppercase">Vertraulich</span>
        </div>
      </footer>
    </div>
  );
}
