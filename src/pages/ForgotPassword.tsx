import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';

export default function ForgotPassword() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-gradient-to-br from-ink via-ink-soft to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(229,9,20,0.12),transparent_50%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-surface p-8">
          <Link to="/" className="mb-6 block text-center">
            <span className="font-display text-3xl tracking-wider text-primary">
              {settings?.site_name ?? 'BytesFlix'}
            </span>
          </Link>

          {success ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
              <p className="mt-2 text-sm text-neutral-400">
                We sent a password reset link to <span className="text-white">{email}</span>.
                Follow the link to reset your password.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold text-white">Reset Password</h1>
              <p className="mb-6 text-sm text-neutral-400">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
