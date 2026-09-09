import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Calendar, Clock, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { timezones } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { EmailPriority } from '@/types';
import { api } from '@/lib/api';

export function ComposePage() {
  const navigate = useNavigate();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'later'>('now');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [priority, setPriority] = useState<EmailPriority>('normal');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!to.trim()) e.to = 'Recipient is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) e.to = 'Please enter a valid email';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!body.trim()) e.body = 'Message body is required';
    if (sendMode === 'later') {
      if (!date) e.date = 'Please select a date';
      if (!time) e.time = 'Please select a time';
      if (date && time) {
        const scheduled = new Date(date);
        const [h, m] = time.split(':');
        scheduled.setHours(parseInt(h), parseInt(m), 0, 0);
        if (scheduled.getTime() <= Date.now()) e.date = 'Scheduled time must be in the future';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before sending.');
      return;
    }

    setLoading(true);
    try {
      let scheduled = new Date();
      if (sendMode === 'later') {
        const [h, m] = time.split(':');
        scheduled = new Date(date!);
        scheduled.setHours(parseInt(h), parseInt(m), 0, 0);
      }
      await api.emails.create({ to, subject, body, scheduledAt: scheduled.toISOString() });

      if (sendMode === 'now') {
        toast.success('Email queued', {
          description: `Your email to ${to} is queued for delivery.`,
        });
      } else {
        toast.success('Email scheduled', {
          description: `Will send on ${scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ${timezone}.`,
        });
      }
      navigate('/scheduled');
    } catch (error) {
      toast.error('Something went wrong', { description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Compose Email</h2>
        <p className="text-sm text-muted-foreground">Write a new email and send it now or schedule it for later.</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6 space-y-5">
          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to">To <span className="text-destructive">*</span></Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={cn(errors.to && 'border-destructive')}
            />
            {errors.to && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.to}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={cn(errors.subject && 'border-destructive')}
            />
            {errors.subject && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.subject}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message <span className="text-destructive">*</span></Label>
            <Textarea
              id="body"
              placeholder="Write your email message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={cn(errors.body && 'border-destructive')}
            />
            {errors.body && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.body}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as EmailPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Send mode */}
          <div className="space-y-3">
            <Label>Delivery</Label>
            <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as 'now' | 'later')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="now" className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Send now
                </TabsTrigger>
                <TabsTrigger value="later" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Schedule for later
                </TabsTrigger>
              </TabsList>

              <TabsContent value="now" className="mt-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  This email will be sent immediately upon clicking the button below.
                </div>
              </TabsContent>

              <TabsContent value="later" className="mt-4 space-y-4">
                {/* Date & Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date
                    </Label>
                    <PopoverCalendar date={date} setDate={setDate} />
                    {errors.date && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.date}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Time
                    </Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={cn(errors.time && 'border-destructive')}
                    />
                    {errors.time && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : sendMode === 'now' ? (
                <>
                  <Send className="h-4 w-4" /> Send Email
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" /> Schedule Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PopoverCalendar({ date, setDate }: { date?: Date; setDate: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Calendar className="h-3.5 w-3.5" />
          {date ? format(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarPicker
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
