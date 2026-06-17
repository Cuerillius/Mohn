import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, signIn, signUp, getSession } from "../lib/authClient";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { apiPost, apiDelete } from "../services/api";
import { keys } from "../lib/queryKeys";
import { isTauri } from "@/lib/platform";

export type Mode = "signin" | "signup";

export function useAuthActions() {
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();
  const { setProfile } = useProfile();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  interface AuthUser {
    id: string;
    email: string;
    name: string;
  }

  function toAuthUser(user: {
    id: string;
    email: string;
    name: string;
  }): AuthUser {
    return { id: user.id, email: user.email, name: user.name };
  }

  const handleEmailSubmit = async (mode: Mode, data: any) => {
    const { email, password, name } = data;
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { data: res, error: err } = await signIn.email({
          email,
          password,
        });
        if (err || !res?.user)
          throw new Error(err?.message ?? "Sign in failed");
        setUser(res.user);
      } else {
        const { data: res, error: err } = await signUp.email({
          email,
          password,
          name,
        });
        if (err || !res?.user)
          throw new Error(err?.message ?? "Sign up failed");
        setUser(res.user);
        await apiPost("/api/profiles", { name: res.user.name }).catch(() => {});
      }
      navigate("/profile");
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    if (!isTauri) {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/profile`,
      });
      setGoogleLoading(false);
      return;
    }

    const { start, cancel, onUrl } =
      await import("@fabianlars/tauri-plugin-oauth");
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");

    let port: number | undefined;
    let unlisten: (() => void) | undefined;
    let oauthWindow: InstanceType<typeof WebviewWindow> | undefined;

    const cleanup = async () => {
      unlisten?.();
      await oauthWindow?.close();
      if (port !== undefined) await cancel(port).catch(() => {});
    };

    try {
      port = await start();

      unlisten = await onUrl(async () => {
        await cleanup();
        await queryClient.invalidateQueries({ queryKey: keys.session() });

        const { data } = await getSession();
        if (data?.user) {
          setUser(toAuthUser(data.user));
          navigate("/profile");
        } else {
          setError("Google sign-in failed — please try again.");
        }
        setGoogleLoading(false);
      });

      const result = await (
        authClient.signIn.social as (opts: unknown) => Promise<{
          data?: { url?: string } | null;
          error?: unknown;
        } | null>
      )({
        provider: "google",
        callbackURL: `http://localhost:${port}/`,
        disableRedirect: true,
      });

      if (!result?.data?.url) throw new Error("No OAuth URL returned");

      oauthWindow = new WebviewWindow("oauth", {
        url: result.data.url,
        title: "Sign in with Google",
        width: 500,
        height: 700,
      });
    } catch (e) {
      await cleanup();
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Google sign-in currently unavailable: ${msg}`);
      setGoogleLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiDelete("/api/account");
      await authClient.signOut();
      logout();
      setProfile(null);
      navigate("/login");
    } catch {
      setIsDeleting(false);
    }
  };

  return {
    handleEmailSubmit,
    handleGoogleSignIn,
    handleDeleteAccount,
    loading,
    googleLoading,
    isDeleting,
    error,
    setError,
  };
}
