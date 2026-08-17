import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import TigerAvatar from "@/components/TigerAvatar";

const Login = () => {
  const navigate = useNavigate();
  const { signUp, signIn, isAnonymous } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
