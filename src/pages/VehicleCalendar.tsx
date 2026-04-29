import { useState, useEffect } from 'react';
import CalendarView from '../components/CalendarView';

export default function VehicleCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [resVehicles, resReservations] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/reservations?resource_type=vehicle')
      ]);
      const dataVehicles = await resVehicles.json();
      const dataRes = await resReservations.json();
      
      if (dataVehicles.vehicles) setVehicles(dataVehicles.vehicles);
      
      if (dataRes.reservations) {
        setEvents(dataRes.reservations.map((r: any) => {
          const veh = dataVehicles.vehicles?.find((v: any) => v.id === r.resource_id);
          return {
            id: r.id,
            title: `${veh?.name || 'KFZ'} - ${r.user_yh_identifier}`,
            start: new Date(r.start_at),
            end: new Date(r.end_at),
            data: r
          };
        }));
      }
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    if (vehicles.length > 0) setSelectedVehicleId(vehicles[0].id.toString());
    setDescription('');
    setVehicleCondition('');
    setError('');
    setShowModal(true);
  };

  const handleSelectEvent = (event: any) => {
    alert(`Reservierung von ${event.data.user_yh_identifier}\nBeschreibung: ${event.data.description || '-'}`);
  };

  const toLocalISOString = (date: Date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedVehicleId || !selectedSlot) return;

    try {
      const startIso = new Date(selectedSlot.start).toISOString();
      let endIso = new Date(selectedSlot.end).toISOString();
      
      if (startIso === endIso || selectedSlot.action === 'click') {
        const end = new Date(selectedSlot.start);
        end.setHours(end.getHours() + 1);
        endIso = end.toISOString();
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: 'vehicle',
          resource_id: Number(selectedVehicleId),
          start_at: startIso,
          end_at: endIso,
          description,
          vehicle_condition: vehicleCondition
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch(err) {
      setError('Fehler beim Speichern');
    }
  };

  return (
    <div className="space-y-6">
      <div className="vr-card flex justify-between items-center py-4">
        <h1 className="text-xl font-bold text-gray-900">Fahrzeugbelegung</h1>
        <div className="flex gap-2 items-center text-sm text-gray-500 font-medium">
          <span className="w-3 h-3 rounded-full bg-vr-blue inline-block"></span> Alle
          <span className="w-3 h-3 rounded-full bg-vr-orange inline-block ml-3"></span> Eigene
        </div>
      </div>
      
      <CalendarView 
        events={events}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Neue Fahrzeugreservierung</h2>
            
            {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zeitraum</label>
                <div className="mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                  {new Date(selectedSlot.start).toLocaleString('de-DE')} - {new Date(selectedSlot.end).toLocaleString('de-DE')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fahrzeug wählen</label>
                <select 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  required
                >
                  <option value="" disabled>Bitte wählen...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grund der Fahrt</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fahrzeugzustand / Vorschäden / Bemerkungen</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={vehicleCondition}
                  onChange={e => setVehicleCondition(e.target.value)}
                  placeholder="Optional, z.B. Beschädigung festgestellt, Verschmutzung"
                  rows={3}
                ></textarea>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-vr-orange text-white rounded-md hover:bg-vr-orange-dark shadow-sm">Buchen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
