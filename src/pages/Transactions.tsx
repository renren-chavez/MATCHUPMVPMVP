import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Clock,
  Download,
  Search,
  Filter,
  ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface Transaction {
  id: string;
  booking_reference: string;
  athlete_name: string;
  athlete_phone: string;
  
  sport: string;
  location: string;
  session_date: string;
  session_time: string;
  duration_hours: number;
  total_amount: number;
  status: string;
  created_at: string;
  payments: {
    id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    payment_date: string | null;
    payment_receipt_url: string | null;
    reference_number: string | null;
  }[];
}

const Transactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchTransactions(user.id);
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          payments (*)
        `)
        .eq('coach_id', userId)
        .in('status', ['completed', 'cancelled', 'approved', 'pending'])
        .order('session_date', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions
    .filter(transaction => transaction.payments.some(p => p.payment_status === 'paid'))
    .filter(transaction => {
      const matchesSearch = 
        transaction.athlete_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.sport.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      
      const matchesPayment = paymentFilter === "all" || 
        transaction.payments.some(p => p.payment_status === paymentFilter);

      return matchesSearch && matchesStatus && matchesPayment;
    });

  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  const totalSessions = filteredTransactions.filter(t => t.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl cursor-pointer" onClick={() => navigate("/dashboard")}>
                <FileText className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h1>
                <p className="text-xs text-muted-foreground">Sessions & payments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">₱{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent">
                  <FileText className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by athlete, reference, or sport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] border-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px] border-2">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="container mx-auto px-4 py-8">
        {filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center border-2">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No transactions found</h2>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Try adjusting your filters"
                : "Your completed sessions will appear here"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map(transaction => (
              <Card key={transaction.id} className="overflow-hidden border-2 hover:shadow-lg transition-all">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left Column - Session Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-foreground">
                              {transaction.athlete_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            Ref: {transaction.booking_reference}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Sport:</span>
                          <span className="font-medium">{transaction.sport}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {format(new Date(transaction.session_date), 'MMM dd, yyyy')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">{transaction.session_time}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{transaction.duration_hours}h</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{transaction.location}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{transaction.athlete_phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Payment Details */}
                    <div className="lg:w-80 space-y-4">
                      <Card className="p-4 bg-accent border-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                          <span className="text-2xl font-bold text-secondary">
                            ₱{Number(transaction.total_amount).toLocaleString()}
                          </span>
                        </div>

                        {transaction.payments.filter(p => p.payment_status === 'paid').length > 0 ? (
                          <div className="space-y-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
                            {transaction.payments
                              .filter(p => p.payment_status === 'paid')
                              .map(payment => (
                              <div key={payment.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-medium capitalize">
                                      {payment.payment_method}
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-foreground">
                                    ₱{Number(payment.amount).toLocaleString()}
                                  </span>
                                </div>

                                {payment.payment_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Paid on {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                                  </p>
                                )}

                                {payment.payment_receipt_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => window.open(payment.payment_receipt_url!, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    View Receipt
                                  </Button>
                                )}

                                {payment.reference_number && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Ref: {payment.reference_number}
                                  </p>
                                )}
                              </div>
                            ))}
                            {(() => {
                              const totalPaid = transaction.payments
                                .filter(p => p.payment_status === 'paid')
                                .reduce((sum, p) => sum + Number(p.amount), 0);
                              const remaining = Number(transaction.total_amount) - totalPaid;
                              return remaining > 0 ? (
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-xs text-muted-foreground">Remaining Balance</span>
                                  <span className="text-sm font-bold text-warning">₱{remaining.toLocaleString()}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center pt-3 border-t border-border">
                            No payment records
                          </p>
                        )}
                      </Card>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/booking/${transaction.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
