import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsProvider";
import { authService } from "@/services/authService";
import { mfaService } from "@/services/mfaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { signIn, signOut, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      mfaService.isEnabled().then((enabled) => {
        if (enabled) {
          const mfaVerified = sessionStorage.getItem("mfa_verified");
          if (!mfaVerified) {
            setMfaRequired(true);
          } else {
            router.replace("/");
          }
        } else {
          router.replace("/");
        }
      });
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated && !mfaRequired) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      const mfaEnabled = await mfaService.isEnabled();
      if (mfaEnabled) {
        setMfaRequired(true);
      } else {
        router.replace("/");
      }
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!mfaToken.trim()) {
      setError("Please enter a verification code");
      return;
    }

    setMfaVerifying(true);
    const { data, error } = await mfaService.verifyToken(mfaToken);
    setMfaVerifying(false);

    if (error || !data?.valid) {
      setError(error?.message || "Invalid verification code");
      return;
    }

    sessionStorage.setItem("mfa_verified", "true");
    toast({ title: "Success", description: "MFA verification complete" });
    router.replace("/");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetLoading(true);
    const { error } = await authService.resetPasswordForAdmin(email);
    setResetLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("If this is a registered admin email, a password reset link has been sent.");
      setShowForgot(false);
    }
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem("mfa_verified");
    await signOut();
    setMfaRequired(false);
    setMfaToken("");
    router.push("/login");
  };

  const companyName = settings?.company_name || "FleetCommand";
  const logoUrl = settings?.logo_url;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 w-8 object-contain" />
            ) : mfaRequired ? (
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Shield className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="font-display text-2xl">{companyName}</CardTitle>
          <CardDescription>
            {mfaRequired 
              ? "Enter your MFA verification code" 
              : showForgot 
                ? "Reset your admin password" 
                : "Sign in to manage your fleet"}
          </CardDescription>
        </CardHeader>
        
        {mfaRequired ? (
          <form onSubmit={handleMfaVerify}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfa-token">Verification Code</Label>
                <Input
                  id="mfa-token"
                  type="text"
                  placeholder="123456 or backup code"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  maxLength={10}
                  autoFocus
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app or a backup code
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={mfaVerifying}>
                {mfaVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify
              </Button>
              <Button type="button" variant="ghost" className="w-full text-xs" onClick={handleSignOut}>
                Sign out and use different account
              </Button>
            </CardFooter>
          </form>
        ) : showForgot ? (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Admin email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="fleet@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send reset link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
                Back to sign in
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="fleet@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
              <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={() => setShowForgot(true)}>
                Forgot password?
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}