import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

moment.locale('de');
const localizer = momentLocalizer(moment);

type EventType = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resourceId?: number;
  data: any;
};

type Props = {
  events: EventType[];
  resources?: any[];
  onSelectSlot: (slotInfo: any) => void;
  onSelectEvent: (event: EventType) => void;
};

export default function CalendarView({ events, resources, onSelectSlot, onSelectEvent }: Props) {
  const { user } = useAuth();
  
  const eventPropGetter = (event: EventType) => {
    let backgroundColor = '#0066b3'; // vr-blue
    if (event.data.user_yh_identifier === user?.yhIdentifier) {
      backgroundColor = '#ff6600'; // vr-orange for own events
    }
    return { style: { backgroundColor, border: 'none' } };
  };

  return (
    <div style={{ height: '70vh' }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        step={15}
        timeslots={4}
        defaultView="week"
        views={['month', 'week', 'day']}
        messages={{
          next: "Nächste",
          previous: "Vorherige",
          today: "Heute",
          month: "Monat",
          week: "Woche",
          day: "Tag",
          noEventsInRange: "Keine Reservierungen in diesem Zeitraum."
        }}
      />
    </div>
  );
}
