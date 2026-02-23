import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Ban, Trash2, CalendarDays, Plus, Loader2, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Blocking {
  id: string;
  coach_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}

interface RecurringBlocking {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}

interface BlockingsDialogProps {
  coachId: string;
  onBlockingsChange: () => void;
}

export const BlockingsDialog = ({ coachId, onBlockingsChange }: BlockingsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [blockings, setBlockings] = useState<Blocking[]>([]);
  const [recurringBlockings, setRecurringBlockings] = useState<RecurringBlocking[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [isUniversal, setIsUniversal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const DAY_LABELS = [
    { day: 1, label: "M" },
    { day: 2, label: "T" },
    { day: 3, label: "W" },
    { day: 4, label: "Th" },
    { day: 5, label: "F" },
    { day: 6, label: "Sat" },
    { day: 0, label: "Sun" },
  ];

  useEffect(() => {
    if (open) {
      fetchBlockings();
      fetchRecurringBlockings();
    }
  }, [open]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const getDayName = (day: number) => {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
  };

  const fetchBlockings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_blockings")
      .select("*")
      .eq("coach_id", coachId)
      .gte("blocked_date", new Date().toISOString().split("T")[0])
      .order("blocked_date", { ascending: true });

    if (error) {
      toast({ title: "Error fetching blockings", description: error.message, variant: "destructive" });
    } else {
      setBlockings(data || []);
    }
    setLoading(false);
  };

  const fetchRecurringBlockings = async () => {
    const { data, error } = await supabase
      .from("coach_recurring_blockings")
      .select("*")
      .eq("coach_id", coachId)
      .order("day_of_week", { ascending: true });
    if (!error) setRecurringBlockings(data || []);
  };

  const handleDeleteRecurring = async (id: string) => {
    const { error } = await supabase.from("coach_recurring_blockings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error removing recurring blocking", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recurring blocking removed" });
      fetchRecurringBlockings();
      onBlockingsChange();
    }
  };

  const handleAdd = async () => {
    if (isUniversal) {
      if (selectedDays.length === 0) {
        toast({ title: "Please select at least one day", variant: "destructive" });
        return;
      }
      if (startTime >= endTime) {
        toast({ title: "End time must be after start time", variant: "destructive" });
        return;
      }
      setSaving(true);
      const rows = selectedDays.map(day => ({
        coach_id: coachId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        reason: reason || null,
      }));
      const { error } = await supabase.from("coach_recurring_blockings").insert(rows);
      if (error) {
        toast({ title: "Error adding recurring blocking", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Recurring times blocked successfully" });
        setSelectedDays([]);
        setStartTime("09:00");
        setEndTime("17:00");
        setReason("");
        fetchRecurringBlockings();
        onBlockingsChange();
      }
      setSaving(false);
      return;
    }
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (startTime >= endTime) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("coach_blockings").insert({
      coach_id: coachId,
      blocked_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTime,
      reason: reason || null,
    });

    if (error) {
      toast({ title: "Error adding blocking", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Time blocked successfully" });
      setSelectedDate(undefined);
      setStartTime("09:00");
      setEndTime("17:00");
      setReason("");
      fetchBlockings();
      onBlockingsChange();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coach_blockings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error removing blocking", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Blocking removed" });
      fetchBlockings();
      onBlockingsChange();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-2 border-destructive/30 hover:bg-destructive/10 gap-2">
          <Ban className="h-4 w-4 text-destructive" />
          Blockings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Manage Blocked Times</DialogTitle>
        </DialogHeader>

        {/* Add new blocking form */}
        <Card className="p-4 border-2 border-border space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Blocked Time
          </h4>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox checked={isUniversal} onCheckedChange={(v) => setIsUniversal(!!v)} id="universal-check" />
              <Label htmlFor="universal-check" className="cursor-pointer">Universal Blocking (recurring weekly)</Label>
            </div>

            {isUniversal ? (
              <div>
                <Label className="mb-2 block">Select Days</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map(({ day, label }) => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      className={`min-w-[40px] ${selectedDays.includes(day) ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-2 border-border"}`}
                      onClick={() => toggleDay(day)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
            <div>
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal border-2 border-border">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setDatePickerOpen(false); }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border-2 border-border" />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border-2 border-border" />
              </div>
            </div>

            <div>
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Personal, Holiday" value={reason} onChange={(e) => setReason(e.target.value)} className="border-2 border-border" />
            </div>

            <Button onClick={handleAdd} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isUniversal ? "Block Recurring Time" : "Block Time"}
            </Button>
          </div>
        </Card>

        {/* Existing blockings list */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Upcoming Blocked Times</h4>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : blockings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No blocked times set</p>
          ) : (
            blockings.map((b) => (
              <Card key={b.id} className="p-3 border-2 border-destructive/20 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {new Date(b.blocked_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                    {b.reason && ` · ${b.reason}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          )}
        </div>

        {/* Recurring Blockings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Repeat className="h-4 w-4" /> Recurring Blocked Times
          </h4>
          {recurringBlockings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recurring blocked times</p>
          ) : (
            recurringBlockings.map((rb) => (
              <Card key={rb.id} className="p-3 border-2 border-destructive/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Recurring</Badge>
                    <p className="font-semibold text-foreground text-sm">Every {getDayName(rb.day_of_week)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rb.start_time.slice(0, 5)} – {rb.end_time.slice(0, 5)}
                    {rb.reason && ` · ${rb.reason}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRecurring(rb.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
