import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Loader2, Plus, X, Upload, User, Lock, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { validateAndFormatPhone } from "@/lib/phoneValidation";

const SPORTS_OPTIONS = ["Basketball", "Tennis", "Volleyball", "Badminton", "Football", "Swimming", "Golf", "Fitness"];
const METRO_MANILA_LOCATIONS = [
  "Makati", "BGC Taguig", "Quezon City", "Mandaluyong", "Pasig", 
  "Manila", "Pasay", "Paranaque", "Las Pinas", "Muntinlupa",
  "Marikina", "San Juan", "Caloocan", "Malabon", "Navotas", "Valenzuela"
];

const CoachProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Form state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [venueDetails, setVenueDetails] = useState<Record<string, string>>({});
  const [certifications, setCertifications] = useState<string[]>([""]);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [coachingHoursEnabled, setCoachingHoursEnabled] = useState(false);
  const [coachingStart, setCoachingStart] = useState("08:00");
  const [coachingEnd, setCoachingEnd] = useState("17:00");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      navigate("/auth");
      return;
    }

    setProfileData(profile);

    // Set existing photo preview if available
    if (profile.avatar_url) {
      setPhotoPreview(profile.avatar_url);
    }

    if (profile?.user_type !== "coach") {
      toast({
        title: "Access Denied",
        description: "This page is only for coaches.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    // Check for existing coach profile
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (coachProfile) {
      setExistingProfile(coachProfile);
      setBusinessName(coachProfile.business_name || "");
      setBio(coachProfile.bio || "");
      setYearsExperience(coachProfile.years_of_experience?.toString() || "");
      setHourlyRate(coachProfile.hourly_rate?.toString() || "");
      setSelectedSports(coachProfile.sports_offered || []);
      setSelectedLocations(coachProfile.locations || []);
      setVenueDetails((coachProfile.venue_details as Record<string, string>) || {});
      setCertifications(coachProfile.certifications || [""]);
      setCancellationPolicy(coachProfile.cancellation_policy || "");
      // Load coaching hours
      const ch = coachProfile.coaching_hours as { start: string; end: string } | null;
      if (ch) {
        setCoachingHoursEnabled(true);
        setCoachingStart(ch.start || "08:00");
        setCoachingEnd(ch.end || "17:00");
      }
    }
  };

  const toggleSport = (sport: string) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => {
      const newLocations = prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location];
      
      // Remove venue details if location is deselected
      if (prev.includes(location)) {
        const newVenueDetails = { ...venueDetails };
        delete newVenueDetails[location];
        setVenueDetails(newVenueDetails);
      }
      
      return newLocations;
    });
  };

  const updateVenueDetail = (location: string, detail: string) => {
    setVenueDetails(prev => ({
      ...prev,
      [location]: detail
    }));
  };

  const addCertification = () => {
    setCertifications([...certifications, ""]);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) {
      // If no new photo but existing preview, return existing URL
      if (photoPreview && photoPreview.startsWith('http')) {
        return photoPreview;
      }
      return null;
    }

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('coach-photos')
        .upload(fileName, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('coach-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number if provided
    if (phone && phone.trim()) {
      const phoneValidation = validateAndFormatPhone(phone);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || "Invalid phone number");
        toast({
          title: "Invalid Phone Number",
          description: phoneValidation.error || "Please use Philippine format: +639XXXXXXXXX",
          variant: "destructive",
        });
        return;
      }
      setPhoneError("");
    }

    if (selectedSports.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one sport.",
        variant: "destructive",
      });
      return;
    }

    if (selectedLocations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one location.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload photo if provided
      const photoUrl = await uploadPhoto(user.id);

      // Update profile with photo URL (if uploaded) and phone (if provided)
      const phoneValidation = phone && phone.trim() ? validateAndFormatPhone(phone) : null;
      const updateData: any = {};
      
      if (photoUrl) {
        updateData.avatar_url = photoUrl;
      }
      
      if (phoneValidation?.valid) {
        updateData.phone = phoneValidation.formatted;
      }

      // Only update profile if there's data to update
      if (Object.keys(updateData).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (profileError) throw profileError;
      }
      const profileData: any = {
        id: user.id,
        business_name: businessName,
        bio,
        years_of_experience: yearsExperience ? parseInt(yearsExperience) : null,
        certifications: certifications.filter(c => c.trim() !== ""),
        sports_offered: selectedSports,
        hourly_rate: parseFloat(hourlyRate),
        locations: selectedLocations,
        venue_details: venueDetails,
        cancellation_policy: cancellationPolicy,
        coaching_hours: coachingHoursEnabled ? { start: coachingStart, end: coachingEnd } : null,
      };

      const { error } = existingProfile
        ? await supabase.from("coach_profiles").update(profileData).eq("id", user.id)
        : await supabase.from("coach_profiles").insert(profileData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: existingProfile ? "Profile updated successfully!" : "Profile created successfully!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border bg-card backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl">
                <Calendar className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">MatchUp</h1>
                <p className="text-xs text-muted-foreground">Coach Profile Setup</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 -ml-12">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h2 className="text-4xl font-extrabold text-foreground mb-0">
              {existingProfile ? "Update Your Profile" : "Complete Your Coach Profile"}
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Athletes will see this information when booking sessions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Profile Photo *</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Profile preview"
                      className="h-40 w-40 rounded-2xl object-cover border-4 border-secondary shadow-xl"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-40 w-40 rounded-2xl border-4 border-dashed border-border bg-accent flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                <div className="text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Label htmlFor="photo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-secondary hover:bg-secondary/10 cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {photoPreview ? "Change Photo" : "Upload Photo"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or WEBP (max 5MB) • Optional
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Coaching Hours */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Coaching Hours
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Set specific coaching hours</Label>
                  <p className="text-xs text-muted-foreground">Off = available 24/7</p>
                </div>
                <Switch checked={coachingHoursEnabled} onCheckedChange={setCoachingHoursEnabled} />
              </div>
              {coachingHoursEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={coachingStart} onChange={(e) => setCoachingStart(e.target.value)} className="border-2 border-border bg-background" />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" value={coachingEnd} onChange={(e) => setCoachingEnd(e.target.value)} className="border-2 border-border bg-background" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business/Coach Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Elite Basketball Training"
                  className="border-2 border-border bg-background"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell athletes about your coaching experience, philosophy, and achievements..."
                  rows={4}
                  className="border-2 border-border bg-background"
                />
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="5"
                  className="border-2 border-border bg-background"
                />
              </div>
            </div>
          </Card>

          {/* Certifications */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Certifications</h3>
            
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={cert}
                    onChange={(e) => updateCertification(index, e.target.value)}
                    placeholder="e.g., FIBA Level 2 Basketball Coach"
                    className="border-2 border-border bg-background"
                  />
                  {certifications.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCertification(index)}
                      className="border-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCertification}
                className="w-full border-2 border-secondary hover:bg-secondary/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Certification
              </Button>
            </div>
          </Card>

          {/* Sports & Rates */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Sports & Pricing</h3>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Sports Offered *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPORTS_OPTIONS.map((sport) => (
                    <div
                      key={sport}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                        selectedSports.includes(sport)
                          ? "border-secondary bg-secondary/10"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <Checkbox 
                        checked={selectedSports.includes(sport)}
                        onCheckedChange={() => toggleSport(sport)}
                      />
                      <label 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={() => toggleSport(sport)}
                      >
                        {sport}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (₱) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="1500"
                  className="border-2 border-border bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">Your rate per hour of coaching</p>
              </div>
            </div>
          </Card>

          {/* Locations */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Service Locations *</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {METRO_MANILA_LOCATIONS.map((location) => (
                <div
                  key={location}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    selectedLocations.includes(location)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox 
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => toggleLocation(location)}
                  />
                  <label 
                    className="text-sm font-medium cursor-pointer flex-1"
                    onClick={() => toggleLocation(location)}
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>

            {/* Venue Details for Selected Locations */}
            {selectedLocations.length > 0 && (
              <div className="mt-6 space-y-4">
                <Label className="text-base font-semibold">Venue Details (Exact Court/Address) *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Specify the exact venue, court name, or address for each location so athletes know where to go
                </p>
                {selectedLocations.map((location) => (
                  <div key={location} className="space-y-2">
                    <Label htmlFor={`venue-${location}`} className="text-sm font-medium">
                      {location}
                    </Label>
                    <Textarea
                      id={`venue-${location}`}
                      value={venueDetails[location] || ""}
                      onChange={(e) => updateVenueDetail(location, e.target.value)}
                      placeholder={`e.g., ABC Sports Complex, 123 Main Street, ${location} or XYZ Basketball Court, near ${location} City Hall`}
                      rows={2}
                      className="border-2 border-border bg-background"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Booking Policies */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Booking Policies</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  placeholder="e.g., 24-hour notice required for full refund"
                  rows={3}
                  className="border-2 border-border bg-background"
                />
              </div>
            </div>
          </Card>

          {/* Change Password */}
          <Card className="border-2 border-border bg-card p-6">
            <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Change Password
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="border-2 border-border bg-background"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="border-2 border-border bg-background"
                />
              </div>

              <Button
                type="button"
                disabled={isChangingPassword}
                onClick={async () => {
                  if (newPassword.length < 6) {
                    toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
                    return;
                  }
                  setIsChangingPassword(true);
                  try {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) throw error;
                    toast({ title: "Success!", description: "Password updated successfully." });
                    setNewPassword("");
                    setConfirmPassword("");
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  } finally {
                    setIsChangingPassword(false);
                  }
                }}
                className="w-full border-2 border-secondary bg-secondary text-secondary-foreground hover:bg-secondary-hover"
              >
                {isChangingPassword ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </Card>

          {/* Submit */}
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary-hover"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{existingProfile ? "Update Profile" : "Create Profile"}</>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CoachProfileSetup;
