import { useState } from 'react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Invalid reset link</h2>
          <p className="text-sm text-gray-400 font-light mb-5">This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] animate-fade-in">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-white font-medium text-sm leading-none">V</span>
          </div>
          <span className="font-medium text-gray-800 text-[15px]">Venderra</span>
        </div>

        <div className="card p-8">
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-blue-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-400 font-light mb-6">Your password has been updated. You can now sign in.</p>
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Set new password</h2>
              <p className="text-sm text-gray-400 font-light mb-6">Choose a strong password for your account.</p>

              {error && <div className="alert alert-error mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">New password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="password"
                      className="input input-icon-left"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="password"
                      className="input input-icon-left"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg w-full justify-center"
                >
                  {loading
                    ? <span className="spinner spinner-sm spinner-white" />
                    : 'Reset Password'
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
