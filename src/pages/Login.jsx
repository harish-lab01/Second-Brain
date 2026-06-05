import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, BookOpen, MessageSquare, Zap, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ── Animated particle canvas ──────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf;

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Create particles
    const particles = Array.from({ length: 120 }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 1.5 + 0.3,
      dx:   (Math.random() - 0.5) * 0.35,
      dy:   (Math.random() - 0.5) * 0.35,
      o:    Math.random() * 0.6 + 0.1,
      hue:  Math.random() > 0.5 ? 250 : 270, // purple / violet
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.o})`;
        ctx.fill();
      });

      // Draw faint connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108,99,255,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}

// ── Login page ─────────────────────────────────────────────────────────────────
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
    { icon: BookOpen,      text: 'Save notes, PDFs, and URLs in one place',         color: 'text-blue-400',    bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
    { icon: Sparkles,      text: 'AI auto-tags, summarizes, and finds connections',  color: 'text-primary-300', bg: 'bg-primary/10',    border: 'border-primary/20'    },
    { icon: MessageSquare, text: 'Chat with your knowledge using Groq AI',           color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { icon: Shield,        text: 'Private, secure, synced with your Google account', color: 'text-green-400',   bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">

      {/* ── Real background image — AI neural network (Unsplash, free to use) ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1920&q=85&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* Dark overlay to ensure card readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(4,4,18,0.82) 0%, rgba(10,5,30,0.75) 50%, rgba(4,4,18,0.88) 100%)',
          zIndex: 1,
        }}
      />
      {/* Animated particle network */}
      <ParticleCanvas />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          zIndex: 2,
        }}
      />

      {/* Large blurred aurora blobs — layered depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute" style={{
          top: '-10%', left: '-5%',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'floatA 12s ease-in-out infinite alternate',
        }} />
        <div className="absolute" style={{
          bottom: '-15%', right: '-5%',
          width: '700px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)',
          filter: 'blur(100px)',
          animation: 'floatB 15s ease-in-out infinite alternate',
        }} />
        <div className="absolute" style={{
          top: '40%', left: '55%',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)',
          filter: 'blur(70px)',
          animation: 'floatC 18s ease-in-out infinite alternate',
        }} />
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes floatA {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes floatB {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-30px, -40px) scale(1.05); }
        }
        @keyframes floatC {
          from { transform: translate(0, 0); }
          to   { transform: translate(-50px, 20px); }
        }
        @keyframes shimmerBorder {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Login card */}
      <div className="w-full max-w-md animate-slide-up relative" style={{ zIndex: 10 }}>

        {/* Animated glowing border wrapper */}
        <div
          className="relative rounded-3xl p-px"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.6), rgba(139,92,246,0.2), rgba(59,130,246,0.4), rgba(108,99,255,0.6))',
            backgroundSize: '300% 300%',
            animation: 'shimmerBorder 6s ease infinite',
            boxShadow: '0 0 60px rgba(108,99,255,0.25), 0 0 120px rgba(108,99,255,0.10), 0 30px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* Inner card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(8,8,18,0.88)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            {/* Top shimmer line */}
            <div className="h-px w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.8), rgba(167,139,250,0.5), transparent)',
              }}
            />

            <div className="p-8">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-5">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-2xl animate-pulse-glow"
                    style={{ background: 'rgba(108,99,255,0.25)', transform: 'scale(1.3)', filter: 'blur(12px)' }} />
                  {/* Icon */}
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow"
                    style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4c3fd1 100%)' }}>
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  {/* Badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(8,8,18,0.9)', border: '1px solid rgba(108,99,255,0.4)' }}>
                    <Zap className="w-3 h-3 text-primary-300" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white tracking-tight">AI Second Brain</h1>
                <p className="text-slate-400 text-sm mt-1.5">Your AI-powered personal knowledge base</p>

                {/* Decorative divider */}
                <div className="flex items-center gap-3 mt-4 w-full">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.3))' }} />
                  <Sparkles className="w-3 h-3 text-primary-300/50" />
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(108,99,255,0.3), transparent)' }} />
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8">
                {features.map(({ icon: Icon, text, color, bg, border }) => (
                  <li key={text} className="flex items-center gap-3 group">
                    <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Sign In Button */}
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl
                  text-slate-200 font-semibold text-sm transition-all duration-300 group relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(108,99,255,0.15)';
                  e.currentTarget.style.border = '1px solid rgba(108,99,255,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(108,99,255,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary-300">→</span>
              </button>

              <p className="text-[11px] text-slate-600 text-center mt-5">
                Free to use · Powered by Firebase &amp; Groq AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
