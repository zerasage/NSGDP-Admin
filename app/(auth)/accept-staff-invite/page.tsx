"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import {
  validateStaffInviteToken,
  acceptStaffInvite,
  type ValidateStaffInviteResponse,
} from "@/lib/api/staff";
import { ApiError } from "@/lib/api/client";
import * as tokenStorage from "@/lib/utils/token-storage";

type LoadState = "loading" | "valid" | "invalid";

export default function AcceptStaffInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <div className="flex justify-center">
            <GeoHealthLogo />
          </div>
        </div>
      }
    >
      <AcceptStaffInviteForm />
    </Suspense>
  );
}

function AcceptStaffInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<LoadState>(token ? "loading" : "invalid");
  const [invite, setInvite] = useState<ValidateStaffInviteResponse | null>(null);
  const [error, setError] = useState(token ? "" : "This invite link is missing its token.");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    tokenStorage.clearTokens();

    if (!token) return;

    validateStaffInviteToken(token)
      .then((result) => {
        setInvite(result);
        setState("valid");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "This invite link is invalid.");
        setState("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await acceptStaffInvite(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      tokenStorage.storeTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken,
        result.tokens.expiresIn,
      );
      toast.success("Account created — welcome to the admin portal");
      // Full reload (not router.push): AuthProvider only loads the user from
      // stored tokens on mount, so a client-side nav would land on "/" with
      // the auth context still not knowing about this session yet, and
      // SuperAdminGuard would bounce straight back to /login.
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept invite");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <GeoHealthLogo />
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Join as Agency Staff</CardTitle>
            {state === "valid" && invite && (
              <CardDescription>
                Invited by {invite.invitedByName} to the &ldquo;{invite.targetGroupName}&rdquo; group
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {state === "loading" && (
              <p className="text-center text-sm text-muted-foreground py-8">Checking your invite…</p>
            )}

            {state === "invalid" && (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Ask whoever invited you to send a new invite, or contact your administrator.
                </p>
              </div>
            )}

            {state === "valid" && invite && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={invite.invitedEmail} disabled />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (optional)</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={8}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={8}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
