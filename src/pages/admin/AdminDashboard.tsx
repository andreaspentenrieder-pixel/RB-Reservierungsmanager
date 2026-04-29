import { Link } from 'react-router-dom';
import { Users, Building, Car, FileSpreadsheet, History, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const cards = [
    { name: 'User Verwaltung', path: '/admin/users', icon: Users, desc: 'Berechtigungen und User verwalten' },
    { name: 'Räume bearbeiten', path: '/admin/rooms', icon: Building, desc: 'Besprechungszimmer anlegen und anpassen' },
    { name: 'Fuhrpark bearbeiten', path: '/admin/vehicles', icon: Car, desc: 'Fahrzeuge anlegen und anpassen' },
    { name: 'CSV Import / Export', path: '/admin/csv', icon: FileSpreadsheet, desc: 'User per CSV Liste hoch- oder herunterladen' },
    { name: 'Änderungshistorie', path: '/admin/audit', icon: History, desc: 'Audit-Log aller Aktionen im System' },
    { name: 'Einstellungen / Passwort', path: '/admin/settings', icon: Settings, desc: 'Admin-Passwort und Systemeinstellungen' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Verwaltung</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <Link key={c.path} to={c.path} className="vr-card group hover:border-vr-blue transition-colors cursor-pointer block">
              <Icon className="w-8 h-8 text-vr-orange mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-vr-blue">{c.name}</h2>
              <p className="text-sm text-gray-500">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
