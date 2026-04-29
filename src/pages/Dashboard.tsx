import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Car, Shield, List } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetch('/api/admin/dashboard').then(r => r.json()).then(d => setStats(d.metrics)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservierungs-Dashboard</h1>
          <p className="text-gray-500 mt-1">Willkommen, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/rooms" className="btn-primary">Raum buchen</Link>
          <Link to="/vehicles" className="btn-orange">Fahrzeug buchen</Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link to="/rooms" className="vr-card group hover:border-vr-blue transition-colors cursor-pointer block">
          <Calendar className="w-8 h-8 text-vr-blue mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-vr-orange">Raum buchen</h2>
          <p className="text-gray-500 text-sm">Kalender und Verfügbarkeit aller Sitzungszimmer.</p>
        </Link>

        <Link to="/vehicles" className="vr-card group hover:border-vr-blue transition-colors cursor-pointer block">
          <Car className="w-8 h-8 text-vr-blue mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-vr-orange">Fahrzeug buchen</h2>
          <p className="text-gray-500 text-sm">Kalender und Verfügbarkeit des Fuhrparks.</p>
        </Link>
        
        <Link to="/my-reservations" className="vr-card group hover:border-vr-blue transition-colors cursor-pointer block">
          <List className="w-8 h-8 text-vr-blue mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-vr-orange">Meine Buchungen</h2>
          <p className="text-gray-500 text-sm">Eigene Reservierungen verwalten und stornieren.</p>
        </Link>

        {user?.role === 'Admin' && (
          <Link to="/admin" className="vr-card group hover:border-vr-blue transition-colors cursor-pointer block">
            <Shield className="w-8 h-8 text-vr-orange mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-vr-blue">Verwaltung</h2>
            <p className="text-gray-500 text-sm">Systemeinstellungen, User und Ressourcen.</p>
          </Link>
        )}
      </div>

      {user?.role === 'Admin' && stats && (
        <div className="vr-card">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Admin Übersicht (Heute)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 mb-1 uppercase font-bold">Aktive User</span>
               <span className="text-3xl font-bold text-vr-blue">{stats.activeUsers}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 mb-1 uppercase font-bold">Räume</span>
               <span className="text-3xl font-bold text-vr-blue">{stats.activeRooms}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 mb-1 uppercase font-bold">Fahrzeuge</span>
               <span className="text-3xl font-bold text-vr-blue">{stats.activeVehicles}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-vr-orange mb-1 uppercase font-bold">Raum-Buchungen heute</span>
               <span className="text-3xl font-bold text-vr-orange">{stats.todayRoomReservations}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-vr-orange mb-1 uppercase font-bold">KFZ-Buchungen heute</span>
               <span className="text-3xl font-bold text-vr-orange">{stats.todayVehicleReservations}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
