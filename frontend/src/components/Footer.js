export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden">
      {/* Top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <div className="bg-[#080c14]/80 backdrop-blur-xl px-4 py-8">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">

          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BKN-Running" className="w-8 h-8 object-contain opacity-80" />
            <span className="font-black text-white tracking-tight">BKN<span className="text-orange-400">-Running</span></span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <div className="w-1 h-1 rounded-full bg-orange-500/60" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* Credit */}
          <div className="text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Created by</p>
            <p className="text-white font-bold text-sm tracking-wide">Oktavianus Sihotang</p>
            <p className="text-orange-400/70 text-xs mt-0.5 tracking-widest uppercase">Programmer BKN</p>
          </div>

          {/* Year */}
          <p className="text-white/15 text-[10px] tracking-widest uppercase">
            © {new Date().getFullYear()} BKN-Running. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
