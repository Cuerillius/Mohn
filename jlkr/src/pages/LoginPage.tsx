import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/authClient';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error: err } = await signIn.email({ email, password });
        if (err || !data?.user) {
          setError(err?.message ?? 'Sign in failed');
          return;
        }
        setUser({ id: data.user.id, email: data.user.email, name: data.user.name });
      } else {
        const { data, error: err } = await signUp.email({ email, password, name });
        if (err || !data?.user) {
          setError(err?.message ?? 'Sign up failed');
          return;
        }
        setUser({ id: data.user.id, email: data.user.email, name: data.user.name });
      }
      navigate('/profile');
    } catch {
      setError('Network error — is the gatekeeper running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-8 bg-[#1f1f1f]">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
          <span className="text-[15px] font-semibold text-white tracking-[0.1em]">JLKR</span>
        </div>
        <h1 className="text-[22px] font-normal text-white mb-8 text-center">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <input
              className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-[#555] outline-none focus:border-[#555] transition-colors"
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <input
            className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-[#555] outline-none focus:border-[#555] transition-colors"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-[#555] outline-none focus:border-[#555] transition-colors"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          {error && (
            <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black text-[13px] font-medium py-3 rounded-lg cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-90 mt-1"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#555] mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="text-white bg-transparent border-none cursor-pointer underline underline-offset-2"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
