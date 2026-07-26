import { supabase } from "@/integrations/supabase/client";
import * as OTPAuth from "otpauth";

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
}

function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

function generateURI(secret: string, label: string, issuer: string): string {
  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  
  const delta = totp.validate({ token, window });
  return delta !== null;
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
      const isValid = verifyTOTP(secret, token);
      
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
      const isValid = verifyTOTP(profile.mfa_secret, token);
      
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