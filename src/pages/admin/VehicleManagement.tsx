import { useState, useEffect } from 'react';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(d => { if(d.vehicles) setVehicles(d.vehicles) });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-vr-blue">Fahrzeugverwaltung</h2>
      <ul>
        {vehicles.map((v: any) => <li key={v.id}>{v.name} ({v.license_plate}) - {v.status}</li>)}
      </ul>
    </div>
  );
}
