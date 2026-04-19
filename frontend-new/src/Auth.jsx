import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Navigation } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let result;

    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    const { data, error } = result;

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (isSignUp && !data.session) {
        setErrorMsg("Please check your email to confirm your account.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Background glowing orbs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl mb-5 shadow-lg shadow-blue-600/30">
            <Navigation className="text-white" size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Pathfinder</h1>
          <p className="text-slate-400 mt-2 font-medium">
            {isSignUp ? 'Create a new account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              isSignUp ? 'Sign Up' : 'Log In'
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        <div className="mt-8 text-center text-sm font-medium text-slate-400">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-blue-400 hover:text-blue-300 transition-colors ml-1 font-bold focus:outline-none"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}