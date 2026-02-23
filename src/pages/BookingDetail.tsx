import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ArrowLeft, Loader2, MapPin, User, CheckCircle, XCircle, Ban, Clock, AlertTriangle, RotateCcw, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CancelBookingDialog } from "@/components/CancelBookingDialog";

const BookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("approval");

  // Payment tracking state
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "maya" | "cash">("gcash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [bookingId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setIsCoach(profile?.user_type === "coach");
    await fetchBookingDetails(session.user.id, profile?.user_type === "coach");
  };

  const fetchBookingDetails = async (userId: string, userIsCoach: boolean) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          coach_profiles:coach_profiles!coach_id(
            profiles:profiles(full_name, phone),
            business_name
          ),
          payments:payments(*)
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      if (userIsCoach && data.coach_id !== userId) {
        throw new Error("Access denied");
      }
      if (!userIsCoach) {
        throw new Error("Access denied");
      }

      setBooking(data);
      setPaymentAmount("0");
      
      // Set active tab based on status
      if (data.status === "pending") {
        setActiveTab("approval");
      } else if (data.status === "approved") {
        setActiveTab("payment");
      } else {
        setActiveTab("session");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBooking = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "approved" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Approved!",
        description: "The booking is now awaiting payment from the athlete.",
      });

      await fetchBookingDetails(user.id, isCoach);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectBooking = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "rejected" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Rejected",
        description: "The booking has been rejected.",
      });

      await fetchBookingDetails(user.id, isCoach);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod !== "cash" && (!referenceNumber || referenceNumber.trim().length === 0)) {
      toast({
        title: "Error",
        description: "Please enter the last 4 digits of the reference number",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(paymentAmount) > remainingBalance) {
      toast({
        title: "Error",
        description: `Amount cannot exceed the remaining balance of ₱${remainingBalance.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.from("payments").insert({
        booking_id: bookingId,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_status: "paid",
        reference_number: referenceNumber || null,
        payment_date: new Date().toISOString(),
        is_deposit: isDeposit,
      });

      if (error) throw error;

      const totalPaid = booking.payments
        .filter((p: any) => p.payment_status === 'paid')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) + parseFloat(paymentAmount);
      
      if (totalPaid >= booking.total_amount) {
        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .eq("id", bookingId);
      }

      toast({
        title: "Payment Recorded!",
        description: `₱${parseFloat(paymentAmount).toLocaleString()} payment recorded successfully.`,
      });

      setReferenceNumber("");
      await fetchBookingDetails(user.id, isCoach);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAllowRebooking = async () => {
    // Send rebooking link to athlete
    toast({
      title: "Rebooking Link Sent",
      description: "The athlete has been sent a new booking link.",
    });
  };

  const handleCloseRequest = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", cancellation_reason: "Payment not received - Request closed" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Request Closed",
        description: "The booking request has been closed.",
      });

      await fetchBookingDetails(user.id, isCoach);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  const totalPaid = booking.payments
    ?.filter((p: any) => p.payment_status === 'paid')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
  const remainingBalance = booking.total_amount - totalPaid;
  const isPaid = totalPaid >= booking.total_amount;

  // Determine display status
  const getDisplayStatus = () => {
    if (booking.status === "completed" || isPaid) return "paid";
    if (booking.status === "approved" && !isPaid) return "awaiting_payment";
    if (booking.status === "cancelled") return "cancelled";
    if (booking.status === "rejected") return "rejected";
    return booking.status;
  };

  const displayStatus = getDisplayStatus();

  const getStatusBadge = () => {
    switch (displayStatus) {
      case "paid":
        return <Badge className="bg-success text-success-foreground text-lg px-4 py-2">Paid</Badge>;
      case "awaiting_payment":
        return <Badge className="bg-warning text-warning-foreground text-lg px-4 py-2">Awaiting Payment</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground text-lg px-4 py-2">Pending Approval</Badge>;
      case "rejected":
        return <Badge className="bg-destructive text-destructive-foreground text-lg px-4 py-2">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive text-destructive-foreground text-lg px-4 py-2">Cancelled</Badge>;
      case "expired":
        return <Badge className="bg-destructive/80 text-destructive-foreground text-lg px-4 py-2">Expired</Badge>;
      default:
        return null;
    }
  };

  const sessionDate = new Date(booking.session_date);
  const sessionEndTime = booking.session_time.slice(0, 5);
  const [hours, minutes] = sessionEndTime.split(':').map(Number);
  const endHours = hours + booking.duration_hours;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border bg-card backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/transactions")}
              className="hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl cursor-pointer" onClick={() => navigate("/dashboard")}>
              <Calendar className="h-7 w-7 text-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Booking with {booking.athlete_name}
              </h1>
              <p className="text-xs text-muted-foreground">#{booking.booking_reference}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      <div className="bg-card border-b-2 border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Booking Details Card */}
        <Card className="border-2 border-border bg-card p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-secondary" />
              <div>
                <p className="font-bold text-foreground">
                  {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {booking.session_time.slice(0, 5)}–{endTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-secondary" />
              <p className="text-foreground">{booking.location}</p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-secondary" />
              <p className="text-foreground">{booking.duration_hours * 60} mins</p>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-secondary" />
              <p className="text-foreground">{booking.sport}</p>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="text-xl font-bold text-foreground">
                ₱{booking.total_amount.toLocaleString()} • {booking.payment_method || 'Not specified'}
              </span>
            </div>
          </div>
        </Card>

        {/* Athlete Contact Info */}
        <Card className="border-2 border-border bg-card p-6 mb-6">
          <h3 className="font-bold text-foreground mb-4">Athlete Contact</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{booking.athlete_name}</span>
            </div>
            {booking.athlete_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{booking.athlete_phone}</span>
              </div>
            )}
            {booking.athlete_notes && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Notes from athlete:</p>
                <p className="text-foreground text-sm">{booking.athlete_notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs for Actions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="approval" className="data-[state=active]:bg-primary">
              Approval
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-primary">
              Payment
            </TabsTrigger>
            <TabsTrigger value="session" className="data-[state=active]:bg-primary">
              Session
            </TabsTrigger>
          </TabsList>

          {/* Approval Tab */}
          <TabsContent value="approval">
            {booking.status === "pending" ? (
              <Card className="border-2 border-secondary bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Review and approve or reject this booking</h3>
                <div className="flex gap-4">
                  <Button
                    onClick={handleApproveBooking}
                    disabled={isUpdating}
                    className="flex-1 h-14 bg-success text-success-foreground hover:bg-success/90 text-lg"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Approve Booking
                  </Button>
                  <Button
                    onClick={handleRejectBooking}
                    disabled={isUpdating}
                    variant="destructive"
                    className="flex-1 h-14 text-lg"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Reject Booking
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-border bg-card p-6">
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-lg font-bold text-foreground">
                    {booking.status === "approved" || booking.status === "completed" 
                      ? "Booking Approved" 
                      : booking.status === "rejected" 
                        ? "Booking Rejected" 
                        : "Booking Cancelled"}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {booking.status === "approved" && "Waiting for payment from athlete"}
                    {booking.status === "completed" && "Session completed"}
                    {booking.status === "rejected" && "This booking was rejected"}
                    {booking.status === "cancelled" && "This booking was cancelled"}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            {displayStatus === "awaiting_payment" && (
              <Card className="border-2 border-warning/30 bg-warning/5 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Awaiting Payment</h3>
                    <p className="text-sm text-muted-foreground">
                      Payment request sent. Booking will expire in 24 hours if unpaid. 
                      Automatic reminders are being sent to the athlete.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Summary */}
            <Card className="border-2 border-border bg-card p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-foreground">₱{booking.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-success">₱{totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Remaining Balance</span>
                  <span className={`font-bold ${remainingBalance > 0 ? 'text-warning' : 'text-success'}`}>
                    ₱{remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Record Payment Form */}
            {isCoach && remainingBalance > 0 && (booking.status === "approved" || booking.status === "pending" || booking.status === "completed") && (
              <Card className="border-2 border-secondary bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Record Payment</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gcash" id="gcash" />
                          <Label htmlFor="gcash" className="cursor-pointer">GCash</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="maya" id="maya" />
                          <Label htmlFor="maya" className="cursor-pointer">Maya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="cursor-pointer">Cash</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        max={remainingBalance}
                        value={paymentAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > remainingBalance) {
                            setPaymentAmount(remainingBalance.toString());
                          } else {
                            setPaymentAmount(e.target.value);
                          }
                        }}
                        placeholder="1500"
                        className="border-2 border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                    </div>
                    {paymentMethod !== "cash" && (
                      <div>
                        <Label htmlFor="reference">Last 4 digits of Reference Number</Label>
                        <Input
                          id="reference"
                          type="text"
                          maxLength={4}
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="1234"
                          className="border-2 border-border"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDeposit"
                        checked={isDeposit}
                        onChange={(e) => setIsDeposit(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isDeposit" className="cursor-pointer">
                        This is a partial payment
                      </Label>
                    </div>
                    {isDeposit && (
                      <p className="text-sm text-muted-foreground mt-2 ml-6">
                        Remaining balance: ₱{(remainingBalance - (parseFloat(paymentAmount) || 0)).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleRecordPayment}
                    disabled={isUpdating}
                    className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary-hover"
                  >
                    Record Payment
                  </Button>
                </div>
              </Card>
            )}

            {/* Expired State Actions */}
            {displayStatus === "expired" && (
              <Card className="border-2 border-destructive/30 bg-destructive/5 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Booking Expired</h3>
                    <p className="text-sm text-muted-foreground">
                      Booking was not paid on time. It has been removed from your calendar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handleAllowRebooking}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 h-12 border-2"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Allow re-booking
                  </Button>
                  <Button
                    onClick={handleCloseRequest}
                    disabled={isUpdating}
                    variant="destructive"
                    className="flex-1 h-12"
                  >
                    <Ban className="mr-2 h-5 w-5" />
                    Don't allow re-booking
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Session Tab */}
          <TabsContent value="session">
            {isPaid ? (
              <Card className="border-2 border-success/30 bg-success/5 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Payment Received</h3>
                    <p className="text-sm text-muted-foreground">
                      Rescheduling allowed until {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {sessionEndTime} (12 hours before session).
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-border bg-card p-6 mb-6">
                <div className="text-center py-4">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Session details will be available after payment is confirmed.
                  </p>
                </div>
              </Card>
            )}

            {/* Session Actions */}
            {isPaid && (() => {
              const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
              const sessionDate = new Date(booking.session_date + "T23:59:59");
              return now <= sessionDate;
            })() && (
              <Card className="border-2 border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Manage reschedules or issue a refund for this booking</h3>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-2"
                    onClick={() => toast({ title: "Coming Soon", description: "Reschedule feature is coming soon!" })}
                  >
                    View/Reschedule
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-12"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel & Refund
                  </Button>
                </div>
              </Card>
            )}

            {/* Cancel for non-paid */}
            {!isPaid && (booking.status === "approved" || booking.status === "pending") && (
              <Card className="border-2 border-destructive/20 bg-card p-6">
                <h3 className="text-lg font-bold text-destructive mb-4">Cancel Booking</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cancel this booking and notify the athlete. This action cannot be undone.
                </p>
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isUpdating}
                  variant="destructive"
                  className="w-full h-12"
                >
                  <Ban className="mr-2 h-5 w-5" />
                  Cancel Booking
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Booking Dialog */}
      <CancelBookingDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        booking={booking}
        onSuccess={() => fetchBookingDetails(user.id, isCoach)}
      />
    </div>
  );
};

export default BookingDetail;
