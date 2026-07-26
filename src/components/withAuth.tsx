import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mfaService } from "@/services/mfaService";
import { useToast } from "@/hooks/use-toast";

export function withAuth(
  Component: React.ComponentType,
  allowedRoles?: Array<"admin" | "director" | "employee">
) {
  return function AuthenticatedPage(props: Record<string, unknown>) {
    const { isAuthenticated, isLoading, profile, refreshProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace("/login");
        return;
      }

      if (!isLoading && isAuthenticated && profile) {
        mfaService.isEnabled().then((enabled) => {
          if (enabled) {
            const mfaVerified = sessionStorage.getItem("mfa_verified");
            if (!mfaVerified) {
              setMfaRequired(true);
            }
          }
        });
      }

      if (!isLoading && isAuthenticated && allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.replace("/");
      }
    }, [isLoading, isAuthenticated, profile, router]);

    const handleMfaVerify = async () => {
      if (!mfaToken.trim()) {
        toast({ title: "Error", description: "Please enter a verification code", variant: "destructive" });
        return;
      }

      setVerifying(true);
      const { data, error } = await mfaService.verifyToken(mfaToken);
      setVerifying(false);

      if (error || !data?.valid) {
        toast({ title: "Error", description: error?.message || "Invalid verification code", variant: "destructive" });
        return;
      }

      sessionStorage.setItem("mfa_verified", "true");
      setMfaRequired(false);
      setMfaToken("");
      toast({ title: "Success", description: "MFA verification complete" });
    };

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="w-full max-w-md space-y-4 p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      );
    }

    if (!isAuthenticated) return null;
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) return null;

    if (mfaRequired) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">MFA Verification Required</h1>
              <p className="text-sm text-muted-foreground">
                Enter your 6-digit authentication code or backup code
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-token">Verification Code</Label>
                <Input
                  id="mfa-token"
                  type="text"
                  placeholder="123456 or backup code"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMfaVerify()}
                  maxLength={10}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleMfaVerify}
                disabled={verifying}
                className="w-full"
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}