import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, LogIn, MailCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import TigerAvatar from "@/components/TigerAvatar";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, requestPasswordReset, updatePassword, isAnonymous } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(searchParams.get("recovery") === "1");
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    if (searchParams.get("recovery") === "1") setIsRecovery(true);
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setResetRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setPasswordUpdated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Account</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        <TigerAvatar size={96} pose="wave" />
        <p className="mt-3 text-sm text-muted-foreground text-center max-w-xs">
          {isAnonymous
            ? "Save your quests, photos, and wardrobe by creating an account."
            : "Log in to sync your progress."}
        </p>

        {isRecovery ? (
          <div className="w-full max-w-sm mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {passwordUpdated ? (
              <div className="text-center space-y-4">
                <MailCheck className="mx-auto text-primary" size={36} />
                <div>
                  <h2 className="font-bold text-lg">Password updated!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">You can now continue with your K-Quest account.</p>
                </div>
                <Button className="w-full rounded-xl h-12 font-bold" onClick={() => navigate("/profile")}>Continue</Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                <div className="flex items-center gap-2">
                  <KeyRound size={20} className="text-primary" />
                  <h2 className="font-bold text-lg">Set a new password</h2>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input id="confirm-password" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={submitting}>
                  {submitting ? "Updating password..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        ) : showForgotPassword ? (
          <div className="w-full max-w-sm mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {resetRequested ? (
              <div className="text-center space-y-4">
                <MailCheck className="mx-auto text-primary" size={36} />
                <div>
                  <h2 className="font-bold text-lg">Check your email</h2>
                  <p className="mt-1 text-sm text-muted-foreground">We sent a password reset link to {email}.</p>
                </div>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowForgotPassword(false)}>Back to Log In</Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handlePasswordResetRequest}>
                <div>
                  <h2 className="font-bold text-lg">Reset your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
                <button type="button" className="w-full text-sm font-semibold text-primary" onClick={() => setShowForgotPassword(false)}>Back to Log In</button>
              </form>
            )}
          </div>
        ) : (

        <Tabs defaultValue="signup" className="w-full max-w-sm mt-6">
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-xl bg-muted">
            <TabsTrigger value="signup" className="rounded-lg text-xs font-bold gap-1.5">
              <UserPlus size={14} /> Sign Up
            </TabsTrigger>
            <TabsTrigger value="login" className="rounded-lg text-xs font-bold gap-1.5">
              <LogIn size={14} /> Log In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-5">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login" className="mt-5">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={submitting}>
                {submitting ? "Logging in..." : "Log In"}
              </Button>
              <button type="button" className="w-full text-sm font-semibold text-primary" onClick={() => { setError(null); setShowForgotPassword(true); }}>
                Forgot password?
              </button>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};

export default Login;
