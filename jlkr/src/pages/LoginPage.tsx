import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/authClient";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error: err } = await signIn.email({ email, password });
        if (err || !data?.user) {
          setError(err?.message ?? "Sign in failed");
          return;
        }
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        });
      } else {
        const { data, error: err } = await signUp.email({
          email,
          password,
          name,
        });
        if (err || !data?.user) {
          setError(err?.message ?? "Sign up failed");
          return;
        }
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        });
      }
      navigate("/profile");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="w-full max-w-[380px] px-6">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-[24px] font-semibold tracking-tight">
            {mode === "signin" ? "Login" : "Sign Up"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-zinc-400 ml-1">
                Name
              </label>
              <input
                className="bg-transparent border border-zinc-800 rounded-lg px-4 py-2.5 text-[14px] focus:border-zinc-500 outline-none transition-all"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-zinc-400 ml-1">
              Email
            </label>
            <input
              className="bg-transparent border border-zinc-800 rounded-lg px-4 py-2.5 text-[14px] focus:border-zinc-500 outline-none transition-all"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-zinc-400 ml-1">
              Password
            </label>
            <input
              className="bg-transparent border border-zinc-800 rounded-lg px-4 py-2.5 text-[14px] focus:border-zinc-500 outline-none transition-all"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-400 mt-1 text-center bg-red-400/5 py-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold text-[14px] py-3 rounded-lg mt-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Login"
                : "Sign up"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-[13px] text-zinc-500 mt-10">
          {mode === "signin"
            ? "Need an account? "
            : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="text-white font-semibold hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
