import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, BookOpen, MessageSquare, Zap, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try { await signIn(); }
    catch (err) { console.error('Sign in failed:', err); }
  };

  const features = [
    { icon: BookOpen,      text: 'Save notes, PDFs, and URLs in one place',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    { icon: Sparkles,      text: 'AI auto-tags and summarizes everything',        color: 'text-primary-300', bg: 'bg-primary/10',    border: 'border-primary/20'  },
    { icon: MessageSquare, text: 'Chat with your knowledge using Gemini',         color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { icon: Shield,        text: 'Private, secure, synced with your Google account', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  ];

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6C63FF 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />

      <div className="w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(19,19,26,0.9)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          }}>
          {/* Top gradient bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="p-8">
            {/* Logo area */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 scale-110 animate-pulse-glow" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-glow">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-100 border border-white/[0.08] flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-primary-300" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white text-center">AI Second Brain</h1>
              <p className="text-slate-500 text-sm mt-1.5 text-center">Your AI-powered personal knowledge base</p>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-8">
              {features.map(({ icon: Icon, text, color, bg, border }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <span className="text-sm text-slate-400">{text}</span>
                </li>
              ))}
            </ul>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl
                bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.2]
                text-slate-200 font-semibold text-sm transition-all duration-200 group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
              <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500">→</span>
            </button>

            <p className="text-[11px] text-slate-600 text-center mt-5">
              Free to use · Powered by Firebase &amp; Google Gemini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
