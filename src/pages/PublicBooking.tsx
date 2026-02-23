import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Award, Briefcase, Send, Sparkles, Image as ImageIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PublicBooking = () => {
  const { coachId } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [coach, setCoach] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchCoachDetails();
  }, [coachId]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const fetchCoachDetails = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_coach_public_info', { coach_uuid: coachId });

      if (error) throw error;
      if (!data) throw new Error('Coach not found');

      const coachData = data as any;
      setCoach(coachData);
      
      setMessages([{
        role: "assistant",
        content: `Hello, I am Coach ${coachData.full_name}'s AI Assistant, Machi! 👋\n\nLet's get your session booked! Here's what I'll need from you:\n\n• Full name\n• Phone number\n• Preferred sport\n• Location/venue\n• Date & time range\n• Payment method (GCash, Maya, or Cash)\n• Any special requests (optional)\n\nYou can send everything in one message or answer one by one — whatever's easiest!`
      }]);
    } catch (error) {
      console.error('Error fetching coach:', error);
      toast({
        title: "Error",
        description: "Failed to load coach details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending || bookingCompleted) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data, error } = await supabase.functions.invoke('booking-assistant', {
        body: { 
          messages: [...messages, userMessage],
          coachId,
          sessionId
        }
      });

      if (error) throw error;

      if (data?.reply) {
        // If we have chunks, animate them for a streaming feel
        if (data.chunks && data.chunks.length > 0) {
          setIsStreaming(true);
          let accumulated = '';
          setMessages(prev => [...prev, { role: "assistant", content: '' }]);
          
          for (const chunk of data.chunks) {
            accumulated += chunk;
            const content = accumulated;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content };
              return updated;
            });
            // Small delay between chunks for streaming effect
            await new Promise(r => setTimeout(r, 15));
          }
          setIsStreaming(false);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        }
        
        // Check if bot is asking for receipt upload
        if (data.reply.includes('RECEIPT_READY') || 
            data.reply.toLowerCase().includes('upload') ||
            data.reply.toLowerCase().includes('screenshot')) {
          setTimeout(() => fileInputRef.current?.click(), 500);
        }
        
        if (data.bookingCreated) {
          setBookingCompleted(true);
          toast({
            title: "Booking Submitted!",
            description: `Your booking request has been sent to the coach. Reference: ${data.bookingReference}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !coach) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sessionId}-${Date.now()}.${fileExt}`;
      const filePath = `payment-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Receipt is in private bucket - coaches will access via signed URLs

      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ Receipt uploaded successfully!\n\nYour payment receipt has been forwarded to the coach for verification. You'll be notified once confirmed!`
      }]);

      toast({
        title: "Receipt Uploaded",
        description: "Your payment receipt has been submitted for verification.",
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center border-2">
          <h2 className="text-2xl font-bold mb-2">Coach Not Found</h2>
          <p className="text-muted-foreground">The coach you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Coach Info */}
      <div className="border-b-2 border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {coach.full_name}
              </h1>
              {coach.business_name && (
                <p className="text-lg text-muted-foreground mb-3">{coach.business_name}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>{coach.sports_offered.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>₱{coach.hourly_rate}/hour</span>
                </div>
                {coach.years_of_experience && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{coach.years_of_experience} years experience</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-foreground border border-border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isSending && !isStreaming && (
            <div className="flex justify-start animate-in fade-in-0 duration-200">
              <div className="bg-accent rounded-2xl px-4 py-3 border border-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-border bg-card p-4">
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || uploadingFile}
              className="shrink-0"
              title="Upload payment receipt"
            >
              {uploadingFile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={uploadingFile ? "Uploading receipt..." : bookingCompleted ? "Booking completed!" : "Type your message..."}
              disabled={isSending || bookingCompleted || uploadingFile}
              rows={1}
              className="flex-1 resize-none overflow-hidden rounded-md border-2 border-border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm scrollbar-hide"
              style={{ maxHeight: '120px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !input.trim() || bookingCompleted || uploadingFile}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              AI-powered booking assistant • Available 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
