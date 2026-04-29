import { useState, useEffect } from 'react';
import CalendarView from '../components/CalendarView';

export default function RoomCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [resRooms, resReservations] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/reservations?resource_type=room')
      ]);
      const dataRooms = await resRooms.json();
      const dataRes = await resReservations.json();
      
      if (dataRooms.rooms) setRooms(dataRooms.rooms);
      
      if (dataRes.reservations) {
        setEvents(dataRes.reservations.map((r: any) => {
          const room = dataRooms.rooms?.find((rm: any) => rm.id === r.resource_id);
          return {
            id: r.id,
            title: `${room?.name || 'Raum'} - ${r.user_yh_identifier}`,
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
    if (rooms.length > 0) setSelectedRoomId(rooms[0].id.toString());
    setDescription('');
    setParticipantCount('');
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
    
    if (!selectedRoomId || !selectedSlot) return;

    try {
      const startIso = new Date(selectedSlot.start).toISOString();
      let endIso = new Date(selectedSlot.end).toISOString();
      
      // Fix full day clicks which give whole day 00:00 to 00:00 next day
      if (startIso === endIso || selectedSlot.action === 'click') {
        const end = new Date(selectedSlot.start);
        end.setHours(end.getHours() + 1);
        endIso = end.toISOString();
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: 'room',
          resource_id: Number(selectedRoomId),
          start_at: startIso,
          end_at: endIso,
          description,
          participant_count: participantCount ? Number(participantCount) : null
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
        <h1 className="text-xl font-bold text-gray-900">Raumbelegung</h1>
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
            <h2 className="text-xl font-bold mb-4">Neue Raumreservierung</h2>
            
            {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zeitraum</label>
                <div className="mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                  {new Date(selectedSlot.start).toLocaleString('de-DE')} - {new Date(selectedSlot.end).toLocaleString('de-DE')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Raum wählen</label>
                <select 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  required
                >
                  <option value="" disabled>Bitte wählen...</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.capacity} Pers.)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Beschreibung / Titel</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teilnehmerzahl</label>
                <input 
                  type="number" 
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-vr-blue focus:ring-vr-blue sm:text-sm"
                  value={participantCount}
                  onChange={e => setParticipantCount(e.target.value)}
                  placeholder="Optional"
                />
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
