import { useState, useEffect } from 'react';

export default function RoomManagement() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/rooms').then(r => r.json()).then(d => { if(d.rooms) setRooms(d.rooms) });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-vr-blue">Raumverwaltung</h2>
      <ul>
        {rooms.map((r: any) => <li key={r.id}>{r.name} ({r.capacity} Personen) - {r.status}</li>)}
      </ul>
    </div>
  );
}
