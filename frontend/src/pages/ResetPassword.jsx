import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid reset link</h2>
          <p className="text-sm text-slate-500 mb-4">This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="text-sm font-semibold text-teal-600 hover:text-teal-700">Request a new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-slate-800">Venderra</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm shadow-slate-200/50 border border-slate-200/80">
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Password reset!</h2>
              <p className="text-sm text-slate-500 mb-6">Your password has been updated. You can now sign in.</p>
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all active:scale-[0.98]">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Set new password</h2>
              <p className="text-sm text-slate-500 mb-6">Choose a strong password for your account.</p>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} placeholder="Re-enter password" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
