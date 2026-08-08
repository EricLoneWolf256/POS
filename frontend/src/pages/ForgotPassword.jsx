import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
          {sent ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-blue-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">
                If an account exists for <span className="text-gray-600 font-normal">{email}</span>, we've sent a password reset link.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Forgot password?</h2>
              <p className="text-sm text-gray-400 font-light mb-6">Enter your email and we'll send you a reset link.</p>

              {error && <div className="alert alert-error mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Email address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="email"
                      className="input input-icon-left"
                      placeholder="you@business.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
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
                    : 'Send reset link'
                  }
                </button>
              </form>

              <div className="text-center mt-5">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-normal text-gray-400 hover:text-gray-700 transition-colors">
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
