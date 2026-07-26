import { supabase } from "@/integrations/supabase/client";
import { generateSecret, generateURI, TOTP } from "otplib";

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
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
    const otpauthUrl = generateURI({
      secret,
      label: user.email || user.id,
      issuer: "FleetCommand",
    });

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

    const totp = new TOTP({ secret });
    const isValid = await totp.verify({ token });
    
    if (!isValid) {
      return { data: null, error: new Error("Invalid verification code") };
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

    const totp = new TOTP({ secret: profile.mfa_secret });
    const isValid = await totp.verify({ token });
    
    if (isValid) {
      return { data: { valid: true }, error: null };
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