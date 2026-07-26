import { supabase } from "@/integrations/supabase/client";

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.ceil((cleaned.length * 5) / 8));

  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = alphabet.indexOf(cleaned[i]);
    if (charIndex === -1) continue;
    
    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output.slice(0, index);
}

function generateSecret(): string {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

function generateURI(secret: string, label: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function generateTOTP(secret: string, time: number = Date.now()): Promise<string> {
  const period = 30;
  const digits = 6;
  const counter = Math.floor(time / 1000 / period);
  
  const counterBuffer = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const key = base32Decode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return code.toString().padStart(digits, "0");
}

async function verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
  const now = Date.now();
  
  for (let i = -window; i <= window; i++) {
    const time = now + i * 30 * 1000;
    const expected = await generateTOTP(secret, time);
    if (expected === token) {
      return true;
    }
  }
  
  return false;
}

export const mfaService = {
  async isEnabled(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("mfa_enabled")
      .eq("id", user.id)
      .single();

    if (error || !data) return false;
    return data.mfa_enabled || false;
  },

  async generateSecret(): Promise<{ data: MFASetupResponse | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const secret = generateSecret();
    const otpauthUrl = generateURI(secret, user.email || user.id, "FleetCommand");

    return {
      data: {
        secret,
        qrCodeUrl: otpauthUrl,
      },
      error: null,
    };
  },

  async verifyAndEnable(secret: string, token: string): Promise<{ data: { success: boolean } | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    try {
      const isValid = await verifyTOTP(secret, token);
      
      if (!isValid) {
        return { data: null, error: new Error("Invalid verification code") };
      }
    } catch (err) {
      console.error("MFA verification error:", err);
      return { data: null, error: new Error("Failed to verify code") };
    }

    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    const { error } = await supabase
      .from("profiles")
      .update({
        mfa_enabled: true,
        mfa_secret: secret,
        mfa_backup_codes: backupCodes,
      })
      .eq("id", user.id);

    if (error) return { data: null, error };

    return { data: { success: true }, error: null };
  },

  async verifyToken(token: string): Promise<{ data: { valid: boolean; usedBackup?: boolean } | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("mfa_secret, mfa_backup_codes")
      .eq("id", user.id)
      .single();

    if (error || !profile?.mfa_secret) {
      return { data: null, error: new Error("MFA not configured") };
    }

    try {
      const isValid = await verifyTOTP(profile.mfa_secret, token);
      
      if (isValid) {
        return { data: { valid: true }, error: null };
      }
    } catch (err) {
      console.error("MFA token verification error:", err);
      return { data: null, error: new Error("Failed to verify code") };
    }

    const backupCodes = profile.mfa_backup_codes || [];
    const codeIndex = backupCodes.indexOf(token.toUpperCase());
    if (codeIndex !== -1) {
      const remainingCodes = backupCodes.filter((_, i) => i !== codeIndex);
      await supabase
        .from("profiles")
        .update({ mfa_backup_codes: remainingCodes })
        .eq("id", user.id);

      return { data: { valid: true, usedBackup: true }, error: null };
    }

    return { data: { valid: false }, error: null };
  },

  async getBackupCodes(): Promise<{ data: { backupCodes: string[] } | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("mfa_backup_codes")
      .eq("id", user.id)
      .single();

    if (error) return { data: null, error };
    return { data: { backupCodes: profile?.mfa_backup_codes || [] }, error: null };
  },

  async disable(): Promise<{ data: null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: [],
      })
      .eq("id", user.id);

    if (error) return { data: null, error };
    return { data: null, error: null };
  },
};