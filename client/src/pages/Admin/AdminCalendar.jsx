import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Video } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../../components/admin/ui";

export default function AdminCalendar() {
  const [events] = useState([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">Manage meetings and appointments</p>
        </div>
        <Button icon={Plus}>New Event</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Calendar view coming soon!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
