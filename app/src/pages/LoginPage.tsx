import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/lib/icons";
import { Mode, useAuthActions } from "@/hooks/useAuthActions";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    handleEmailSubmit,
    handleGoogleSignIn,
    loading,
    googleLoading,
    error,
  } = useAuthActions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleEmailSubmit(mode, { email, password, name });
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
  };

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex justify-center mb-4">
            <img src="/mohn.svg" alt="Mohn" className="size-16" />
          </div>

          <h2 className="text-balance text-center text-xl font-semibold">
            {mode === "signin" ? "Sign in to Mohn" : "Sign up to Mohn"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John"
                  className="mt-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                className="mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Must be at least 8 characters"
                className="mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-[13px] text-destructive text-center bg-destructive/10 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-4 w-full">
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="size-5" aria-hidden />
            <span className="text-sm font-medium">
              {googleLoading ? "Redirecting…" : "Sign in with Google"}
            </span>
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? "Need an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-foreground hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
