"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { getTodayIST } from "@/lib/utils/date";

interface DatePickerProps {
  onDateSelect: (date: string) => void;
  availableDates?: string[];
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({ onDateSelect, availableDates = [], minDate, maxDate }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date(getTodayIST() + "T00:00:00");
  const maxSelectableDate = maxDate || today;
  const minSelectableDate = minDate || new Date("2020-01-01"); // Default to a very old date if not specified

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dateString = format(date, "yyyy-MM-dd");
    onDateSelect(dateString);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
      </Button>
      {isOpen && (
        <Card className="absolute z-50 mt-2">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date > maxSelectableDate || date < minSelectableDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
