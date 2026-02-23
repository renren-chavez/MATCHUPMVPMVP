import { z } from "zod";

// Philippine phone number validation
// Format: +63XXXXXXXXXX (13 characters total)
export const philippinePhoneSchema = z
  .string()
  .refine(
    (phone) => /^\+63[0-9]{10}$/.test(phone),
    {
      message: "Phone number must be in Philippine format: +63XXXXXXXXXX (e.g., +639171234567)",
    }
  );

// Format phone number to Philippine format
export const formatPhilippinePhone = (phone: string): string => {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +63
  if (cleaned.startsWith('0')) {
    cleaned = '+63' + cleaned.substring(1);
  }
  
  // If doesn't start with +63, add it
  if (!cleaned.startsWith('+63')) {
    cleaned = '+63' + cleaned;
  }
  
  return cleaned;
};

// Validate and format phone number
export const validateAndFormatPhone = (phone: string): { valid: boolean; formatted: string; error?: string } => {
  try {
    const formatted = formatPhilippinePhone(phone);
    philippinePhoneSchema.parse(formatted);
    return { valid: true, formatted };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, formatted: phone, error: error.errors[0].message };
    }
    return { valid: false, formatted: phone, error: "Invalid phone number" };
  }
};
