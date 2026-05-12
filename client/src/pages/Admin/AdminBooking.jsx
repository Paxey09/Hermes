import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Skeleton
} from "../../components/admin/ui";
import { Calendar, Clock, Video, MapPin, Plus, ChevronLeft, ChevronRight, User } from "lucide-react";
import { supabase } from "../../config/supabaseClient";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STATUS_COLORS = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBooking() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => { 
    if (currentMonth === 0) { 
      setCurrentMonth(11); 
      setCurrentYear(y => y - 1); 
    } else setCurrentMonth(m => m - 1); 
  };
  
  const nextMonth = () => { 
    if (currentMonth === 11) { 
      setCurrentMonth(0); 
      setCurrentYear(y => y + 1); 
    } else setCurrentMonth(m => m + 1); 
  };

  // Fetch bookings from Supabase
  useEffect(() => {
    fetchBookings();
  }, [currentMonth, currentYear]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date');

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Use mock data for demo
      setBookings([
        { id: 1, title: "Discovery Call — NextGen Analytics", time: "09:00 AM", duration: 45, type: "video", attendees: ["Alex Thompson", "Admin"], date: selectedDate, status: "confirmed" },
        { id: 2, title: "Product Demo — TechCorp", time: "11:30 AM", duration: 60, type: "video", attendees: ["Sarah Chen", "Admin"], date: selectedDate, status: "confirmed" },
        { id: 3, title: "Quarterly Review — GrowthMetrics", time: "02:00 PM", duration: 90, type: "in-person", attendees: ["Priya Patel", "Admin", "Jordan Lee"], date: "2026-05-06", status: "pending" },
        { id: 4, title: "Contract Negotiation — DataSync", time: "10:00 AM", duration: 30, type: "video", attendees: ["Emily Watson", "Admin"], date: "2026-05-07", status: "confirmed" },
        { id: 5, title: "Onboarding Session", time: "03:00 PM", duration: 60, type: "video", attendees: ["Marcus Rodriguez", "Admin"], date: "2026-05-08", status: "confirmed" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const todayBookings = bookings.filter((b) => b.date === selectedDate);
  const bookedDates = new Set(bookings.map(b => b.date));

  const formatDate = (dateStr) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { 
      weekday: "long", 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking</h2>
          <p className="text-muted-foreground">Schedule and manage client meetings and appointments.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> New Booking</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[340px,1fr]">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="font-semibold">{MONTHS[currentMonth]} {currentYear}</span>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr === selectedDate;
                const hasBooking = bookedDates.has(dateStr);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-9 w-9 mx-auto rounded-full text-sm flex items-center justify-center relative transition-colors
                      ${isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}
                    `}
                  >
                    {day}
                    {hasBooking && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {formatDate(selectedDate)}
            </h3>
            <Badge variant="outline">{todayBookings.length} appointment{todayBookings.length !== 1 ? "s" : ""}</Badge>
          </div>
          
          {isLoading ? (
            <Card><CardContent className="py-12">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ) : todayBookings.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No bookings for this day</CardContent></Card>
          ) : (
            todayBookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${b.type === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                    {b.type === "video" ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{b.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {b.time} ({b.duration} min)
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {b.attendees?.length} attendee{b.attendees?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[b.status]}>
                        {b.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {b.attendees?.map((attendee, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded-full">
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
