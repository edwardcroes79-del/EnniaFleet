import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { mfaService } from "@/services/mfaService";

export function withAuth(
  Component: React.ComponentType,
  allowedRoles?: Array<"admin" | "director" | "employee">
) {
  return function AuthenticatedPage(props: Record<string, unknown>) {
    const { isAuthenticated, isLoading, profile } = useAuth();
    const router = useRouter();

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
              router.replace("/login");
            }
          }
        });
      }

      if (!isLoading && isAuthenticated && allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.replace("/");
      }
    }, [isLoading, isAuthenticated, profile, router]);

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

    return <Component {...props} />;
  };
}