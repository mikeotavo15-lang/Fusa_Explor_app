import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Tags, 
  MessageSquare, 
  Star, 
  PlusCircle, 
  Home,
  Map as MapIcon, 
  Settings, 
  LogOut, 
  User,
  LayoutDashboard,
  Search,
  Utensils,
  Martini,
  Music,
  PartyPopper,
  ArrowLeft,
  Share2,
  Bookmark,
  MoreHorizontal,
  Heart,
  Send,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Apple,
  Mail,
  Navigation,
  X,
  Plus,
  Pencil,
  Check,
  Church,
  CloudSun,
  CloudRain,
  Sun,
  CloudLightning,
  Thermometer,
  Droplets,
  Wind,
  CloudDrizzle,
  Compass,
  RotateCw,
  Globe,
  RefreshCw,
  CircleDashed,
  ShoppingBag,
  Bed,
  Store,
  Pill,
  Car,
  Sparkles,
  Wrench,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  getLugares, 
  subscribeToLugares,
  getCategorias, 
  addLugar, 
  getUsuario, 
  createUsuario,
  updateUsuario,
  getComentarios,
  addComentario,
  deleteLugar,
  updateLugar,
  getUserComentarios,
  subscribeToHistorias,
  addHistoria,
  deleteHistoria,
  addComentarioAHistoria
} from './lib/fusaService';
import { seedDatabase } from './lib/seed';
import { Lugar, Categoria, Usuario, Comentario, Historia } from './types';
// @ts-ignore
import fusaWelcomeImg from './assets/images/fusa_welcome_1780776077554.png';
// @ts-ignore
import saharaAdImg from './assets/images/sahara_club_ad_1783861204356.jpg';

interface ModerationResultFrontend {
  aprobado: boolean;
  categoriaInfraccion: string;
  motivo: string;
}

async function moderarContenidoFrontend(texto: string, imagenBase64?: string): Promise<ModerationResultFrontend> {
  try {
    const res = await fetch('/api/moderar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, imagenBase64 })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Error en API de moderación:", err);
  }
  return { aprobado: true, categoriaInfraccion: "ninguno", motivo: "Aprobado por contingencia" };
}

const GravestoneIcon = ({ size = 24, className = "", strokeWidth = 2 }: { size?: number, className?: string, strokeWidth?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Tombstone arch shape */}
    <path d="M6 20V10a6 6 0 0 1 12 0v10" />
    {/* Ground base */}
    <path d="M3 20h18" />
    {/* Cross inside tombstone */}
    <path d="M12 7v6" />
    <path d="M9.5 9.5h5" />
    {/* Accent ground line */}
    <path d="M7 17h10" />
  </svg>
);

const getCategoryIcon = (idOrCat: string | Categoria | any) => {
  const id = typeof idOrCat === 'string' ? idOrCat : (idOrCat?.id || '');
  const nombre = (typeof idOrCat === 'object' ? idOrCat?.nombre : '') || '';
  const nameLower = nombre.toLowerCase();

  if (nameLower.includes('cementerio') || nameLower.includes('lapida') || nameLower.includes('lápida') || nameLower.includes('panteon') || id === 'cat14' || id === 'cat_cementerio') {
    return GravestoneIcon;
  }

  switch (id) {
    case 'cat1': return MapPin;
    case 'cat2': return Utensils;
    case 'cat3': return ShoppingBag;
    case 'cat4': return Bed;
    case 'cat6': return Store;
    case 'cat7': return Pill;
    case 'cat8': return Martini;
    case 'cat9': return Church;
    case 'cat10': return Car;
    case 'cat12': return Sparkles;
    case 'cat13': return Wrench;
    case 'cat14': return GravestoneIcon;
    case 'cat_cementerio': return GravestoneIcon;
    default: 
      if (typeof id === 'string' && (id.toLowerCase().includes('cementer') || id.toLowerCase().includes('lapid'))) {
        return GravestoneIcon;
      }
      return HelpCircle;
  }
};



const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`${color} p-4 rounded-3xl text-white shadow-lg flex items-center gap-4`}
  >
    <div className="bg-white/20 p-3 rounded-2xl">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-2xl font-bold font-mono">{value}</h3>
      <p className="text-xs opacity-90 font-medium">{label}</p>
    </div>
  </motion.div>
);

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const QuickAction = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 text-center"
  >
    <div className={`${color} p-3 rounded-2xl`}>
      <Icon size={24} className="text-white" />
    </div>
    <span className="text-xs font-semibold text-slate-700">{label}</span>
  </motion.button>
);


const BrandLogo = ({ animated = false, size = "md", yellow = false }: { animated?: boolean, size?: 'md' | 'lg', yellow?: boolean }) => {
  const svgClass = size === 'lg' ? "w-64 h-64" : size === 'md' ? "w-44 h-44" : "w-28 h-28";

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={animated ? { 
          y: [0, -6, 0],
          scale: [1, 1.02, 1]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
      >
        <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className={`${svgClass} drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)]`}>
          <defs>
            {/* Orchid petal gradients */}
            <linearGradient id="logoPetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fca5d9" />
              <stop offset="50%" stopColor="#eb6fae" />
              <stop offset="100%" stopColor="#c53e8c" />
            </linearGradient>
            
            {/* Ruffled lip gradient */}
            <radialGradient id={yellow ? "logoLipGradYellow" : "logoLipGrad"} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={yellow ? "#ffea3a" : "#ebd5ff"} />
              <stop offset="25%" stopColor={yellow ? "#ffaa00" : "#c084fc"} />
              <stop offset="60%" stopColor="#e61a6b" />
              <stop offset="100%" stopColor="#99004d" />
            </radialGradient>
            
            {/* "FE" Letters Gradient */}
            <linearGradient id="letterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5c155c" />
              <stop offset="50%" stopColor="#99155a" />
              <stop offset="100%" stopColor="#cc2277" />
            </linearGradient>

            {/* Lila Tapered Underline Gradient */}
            <linearGradient id={yellow ? "goldUnderlineGradYellow" : "goldUnderlineGrad"} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor={yellow ? "#cca03a" : "#c084fc"} />
              <stop offset="50%" stopColor={yellow ? "#ffd000" : "#d8b4fe"} />
              <stop offset="80%" stopColor={yellow ? "#cca03a" : "#c084fc"} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* BACK SEPAL AND PETALS (Orchid) */}
          <g stroke="#7d1f54" strokeWidth="1.2" strokeLinejoin="round" opacity="0.98">
            {/* Top Sepal */}
            <path d="M 110,85 C 95,20 102,5 110,5 C 118,5 125,20 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Left & Right Sepals (behind wide petals) */}
            <path d="M 110,85 C 50,105 55,135 110,85 Z" fill="url(#logoPetalGrad)" />
            <path d="M 110,85 C 170,105 165,135 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Left Wide Frilly Petal */}
            <path d="M 110,85 C 35,50 15,80 35,115 C 55,140 90,115 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Right Wide Frilly Petal */}
            <path d="M 110,85 C 185,50 205,80 185,115 C 165,140 130,115 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Bottom Left Narrow Sepal */}
            <path d="M 110,85 C 75,120 70,150 85,160 C 100,155 105,120 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Bottom Right Narrow Sepal */}
            <path d="M 110,85 C 145,120 150,150 135,160 C 120,155 115,120 110,85 Z" fill="url(#logoPetalGrad)" />
            
            {/* Center Frilly Lip */}
            <path d="M 110,95 C 75,95 70,130 85,165 C 95,185 125,185 135,165 C 150,130 145,95 110,95 Z" fill={yellow ? "url(#logoLipGradYellow)" : "url(#logoLipGrad)"} stroke="#b3003b" strokeWidth="1.8" strokeLinejoin="round" />
            
            {/* Lip lilac/white veins */}
            <path d="M 110,105 Q 101,128 95,152" fill="none" stroke={yellow ? "#ffee55" : "#ebd5ff"} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 110,105 Q 110,130 110,155" fill="none" stroke={yellow ? "#ffee55" : "#ebd5ff"} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 110,105 Q 119,128 125,152" fill="none" stroke={yellow ? "#ffee55" : "#ebd5ff"} strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Column / Pistil */}
            <ellipse cx="110" cy="110" rx="4.5" ry="7.5" fill="#ffffff" stroke="#99004d" strokeWidth="0.8" />
            <circle cx="110" cy="107" r="2.2" fill={yellow ? "#ffea3a" : "#ebd5ff"} />
          </g>

          {/* OVERLAPPING "FE" LETTERS (Pop art/comic style exactly matching picture) */}
          <g fontStyle="italic">
            {/* F Letter Stacks (creating 3D extruded block shadow) */}
            <text x="63" y="131" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="#501025" stroke="#501025" strokeWidth="6" strokeLinejoin="round" transform="skewX(-6)">F</text>
            <text x="61" y="129" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="#a84a04" stroke="#a84a04" strokeWidth="5" strokeLinejoin="round" transform="skewX(-6)">F</text>
            <text x="59" y="127" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="42" fill={yellow ? "#ffd000" : "#c084fc"} stroke={yellow ? "#ffd000" : "#c084fc"} strokeWidth="4" strokeLinejoin="round" transform="skewX(-6)">F</text>
            <text x="57" y="125" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="#fff" stroke="#1f0213" strokeWidth="3.5" strokeLinejoin="round" transform="skewX(-6)">F</text>
            <text x="57" y="125" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="42" fill="url(#letterGrad)" transform="skewX(-6)">F</text>

            {/* E Letter Stacks */}
            <text x="93" y="161" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="36" fill="#501025" stroke="#501025" strokeWidth="6" strokeLinejoin="round" transform="skewX(-6)">E</text>
            <text x="91" y="159" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="36" fill="#a84a04" stroke="#a84a04" strokeWidth="5" strokeLinejoin="round" transform="skewX(-6)">E</text>
            <text x="89" y="157" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="36" fill={yellow ? "#ffd000" : "#c084fc"} stroke={yellow ? "#ffd000" : "#c084fc"} strokeWidth="4" strokeLinejoin="round" transform="skewX(-6)">E</text>
            <text x="87" y="155" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="36" fill="#fff" stroke="#1f0213" strokeWidth="3.5" strokeLinejoin="round" transform="skewX(-6)">E</text>
            <text x="87" y="155" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="36" fill="url(#letterGrad)" transform="skewX(-6)">E</text>
          </g>

          {/* FUSA EXPLORER TEXT WITH WHITE OUTLINE FOR CONTRAST */}
          <text 
            x="110" 
            y="196" 
            fontFamily="Impact, Arial Black, sans-serif" 
            fontWeight="900" 
            fontSize="16.5" 
            fill="#341b37" 
            stroke="#ffffff"
            strokeWidth="3.5"
            paintOrder="stroke"
            strokeLinejoin="round"
            textAnchor="middle" 
            letterSpacing="0.06em"
          >
            FUSA EXPLOR
          </text>

          {/* TAPERED GOLD UNDERLINE */}
          <path d="M 45,203 Q 110,205 175,203 Q 110,207 45,203" fill={yellow ? "url(#goldUnderlineGradYellow)" : "url(#goldUnderlineGrad)"} />

          {/* SUBTLE STAR SPARKLE IN BOTTOM RIGHT */}
          <path d="M 200,203 L 203,206 L 200,209 L 197,206 Z" fill="#dfb4cd" />
        </svg>
      </motion.div>
    </div>
  );
};


export const DashboardSkeleton = () => (
  <div className="flex flex-col h-[100dvh] pt-8 px-6 max-w-lg mx-auto relative overflow-hidden backdrop-blur-md bg-[#3b1154]/40">
    <div className="flex items-center justify-between mb-6 shrink-0 animate-pulse">
        <div>
          <div className="w-24 h-4 bg-[#ebd5ff]/30 rounded mb-2"></div>
          <div className="w-40 h-8 bg-[#ebd5ff]/30 rounded"></div>
        </div>
        <div className="w-12 h-12 bg-[#ebd5ff]/30 rounded-full"></div>
    </div>
    <div className="mt-6 animate-pulse">
        <div className="w-32 h-6 bg-[#ebd5ff]/30 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
           <div className="h-24 bg-[#ebd5ff]/20 rounded-3xl"></div>
           <div className="h-24 bg-[#ebd5ff]/20 rounded-3xl"></div>
           <div className="h-24 bg-[#ebd5ff]/20 rounded-3xl"></div>
        </div>
    </div>
    <div className="mt-12 animate-pulse">
        <div className="w-48 h-6 bg-[#ebd5ff]/30 rounded mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
            <div className="w-72 h-60 bg-[#ebd5ff]/20 rounded-[32px] flex-none"></div>
            <div className="w-72 h-60 bg-[#ebd5ff]/20 rounded-[32px] flex-none"></div>
        </div>
    </div>
  </div>
);

const LoadingOrchid = () => (
  <div className="flex flex-col items-center justify-center p-12 bg-[#ebd5ff]/30 backdrop-blur-xl rounded-[48px] shadow-2xl border border-[#ebd5ff]/50">
    <BrandLogo animated={true} size="lg" yellow={true} />
    <p className="text-white/80 font-black text-[10px] uppercase tracking-[0.4em] italic mt-8 animate-pulse text-center">
      Cargando...
    </p>
  </div>
);

const CommentsSection = ({ lugarId, user, darkMode }: { lugarId: string, user: Usuario, darkMode: boolean }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [puntuacion, setPuntuacion] = useState(0);
  const [esPrivado, setEsPrivado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const unsub = getComentarios(lugarId, setComentarios);
    return () => unsub();
  }, [lugarId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || enviando) return;
    setEnviando(true);
    try {
      const moderation = await moderarContenidoFrontend(nuevoComentario);
      if (!moderation.aprobado) {
        alert(`⚠️ Tu comentario viola las normas de la comunidad:\nMotivo: ${moderation.motivo}\nCategoría: ${moderation.categoriaInfraccion}`);
        setEnviando(false);
        return;
      }
      await addComentario(lugarId, {
        usuarioId: auth.currentUser?.uid || '',
        usuarioNombre: user.nombre,
        lugarId,
        puntuacion,
        texto: nuevoComentario,
        esPrivado
      });
      setNuevoComentario('');
      setEsPrivado(false);
      setPuntuacion(0);
    } catch (err) {
      console.error(err);
      alert("Error al publicar comentario. Por favor verifica tus permisos.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`mt-8 border-t pt-8 transition-colors ${darkMode ? 'border-pink-500/10' : 'border-slate-100'}`}>
      <h3 className={`text-xl font-comic-bold mb-6 flex items-center gap-2 transition-colors ${
        darkMode ? 'text-pink-200' : 'text-slate-800'
      }`}>
        <MessageSquare className={darkMode ? 'text-pink-400' : 'text-primary'} size={24} />
        Comentarios y Reseñas
      </h3>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className={`rounded-[32px] p-6 mb-8 border shadow-inner transition-colors duration-300 ${
        darkMode ? 'bg-[#1c182d] border-pink-500/10' : 'bg-slate-50 border-white shadow-inner'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={() => setPuntuacion(star)}
                className="transition-colors"
                title={`${star} estrellas`}
              >
                <Star 
                  size={24} 
                  fill={star <= puntuacion && puntuacion > 0 ? "#ffb800" : "none"} 
                  color={star <= puntuacion && puntuacion > 0 ? "#ffb800" : (darkMode ? "#4b3a5a" : "#cbd5e1")} 
                  className={star <= puntuacion && puntuacion > 0 ? "drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]" : ""}
                />
              </motion.button>
            ))}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-pink-400' : 'text-slate-400'}`}>
            {puntuacion} / 5
          </span>
        </div>

        <textarea
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          maxLength={300}
          placeholder="Comparte tu experiencia... (máx 300 caracteres)"
          className={`w-full rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all border min-h-[100px] mb-4 text-sm ${
            darkMode ? 'bg-[#221c32] border-pink-500/15 text-pink-100 focus:border-pink-500/35' : 'bg-white border-slate-200 text-slate-700'
          }`}
        />

        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => setEsPrivado(!esPrivado)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              esPrivado 
                ? (darkMode ? 'bg-pink-500 border-pink-500' : 'bg-primary border-primary shadow-lg shadow-primary/20') 
                : (darkMode ? 'border-pink-500/40 hover:border-pink-500 bg-[#221c32]' : 'border-slate-300 bg-white group-hover:border-primary')
            }`}>
              {esPrivado && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
              darkMode ? 'text-pink-300/60' : 'text-slate-500'
            }`}>Nombre privado</span>
          </button>
          
          <button
            disabled={!nuevoComentario.trim() || enviando}
            className={`px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 ${
              darkMode 
                ? 'bg-pink-600 text-white shadow-pink-600/20 hover:bg-pink-505 shadow-pink-600/15 disabled:bg-slate-800' 
                : 'fusa-teal text-white shadow-teal-500/20'
            }`}
          >
            {enviando ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </form>

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {comentarios.length === 0 ? (
          <div className={`text-center py-10 rounded-[32px] border-2 border-dashed ${
            darkMode ? 'bg-[#1c182d] border-pink-500/10' : 'bg-slate-50 border-slate-100'
          }`}>
            <p className="text-slate-400 text-xs font-medium italic">Aún no hay mensajes. ¡Escribe el primero!</p>
          </div>
        ) : (
          comentarios.map((c) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={c.id} 
              className={`p-5 rounded-[28px] border shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-[#1e1a2f] border-pink-500/10' : 'bg-white border-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    darkMode ? 'bg-pink-500/10 text-pink-300' : 'bg-slate-100 text-primary'
                  }`}>
                    {c.esPrivado ? '?' : (c.usuarioNombre?.[0] || 'U')}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold leading-none transition-colors ${
                      darkMode ? 'text-pink-100' : 'text-slate-800'
                    }`}>
                      {c.esPrivado ? 'Anónimo' : c.usuarioNombre}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase tracking-tight transition-colors ${
                      darkMode ? 'text-pink-300/50' : 'text-slate-400'
                    }`}>Fusagatán</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={12} 
                      fill={s <= c.puntuacion ? "#ffb800" : "none"} 
                      color={s <= c.puntuacion ? "#ffb800" : (darkMode ? "#4b3a5a" : "#e2e8f0")} 
                    />
                  ))}
                </div>
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap transition-colors ${
                darkMode ? 'text-purple-100/80' : 'text-slate-600'
              }`}>{c.texto}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const PlaceDetail = ({ 
  lugar, 
  user, 
  onClose, 
  onDelete, 
  onEdit, 
  onOpenMap, 
  isFavorited, 
  onToggleFavorite, 
  isSaved, 
  onToggleSave, 
  userLocation,
  darkMode
}: { 
  lugar: Lugar, 
  user: Usuario, 
  onClose: () => void, 
  onDelete: (id: string) => void, 
  onEdit: (lugar: Lugar) => void, 
  onOpenMap: (lugar: Lugar) => void, 
  isFavorited: boolean, 
  onToggleFavorite: () => void, 
  isSaved: boolean, 
  onToggleSave: () => void, 
  userLocation: { lat: number, lng: number } | null,
  darkMode: boolean
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const todasLasImagenes = [lugar.imagen, ...(lugar.imagenes || [])].filter(Boolean);

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((prev) => (prev === 0 ? todasLasImagenes.length - 1 : prev! - 1));
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((prev) => (prev === todasLasImagenes.length - 1 ? 0 : prev! + 1));
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: lugar.nombre,
          text: lugar.descripcion,
          url: window.location.href,
        });
      } else {
        throw new Error("API de compartir no disponible");
      }
    } catch (err) {
      alert("Compartiendo: " + lugar.nombre);
    }
  };

  const calculateDistance = (lat2: number, lon2: number) => {
    if (!userLocation || lat2 === 0) return "4053 km";
    const R = 6371;
    const dLat = (lat2 - userLocation.lat) * Math.PI / 180;
    const dLon = (lon2 - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1) + " km";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-[#1c182d]' : 'bg-primary'
      }`}
    >
      {/* Header bar */}
      <div className={`flex items-center justify-between px-6 py-4 transition-colors ${
        darkMode ? 'bg-[#1c182d] text-pink-200 border-b border-pink-500/10' : 'bg-primary text-white'
      }`}>
        <button 
          onClick={onClose} 
          className={`p-2 rounded-full transition-colors ${
            darkMode ? 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/40 border border-pink-500/20' : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          {(user?.rol === 'admin' || user?.correo?.endsWith('@fusaexplor.com') || user?.correo?.endsWith('@fusaexplorer.com') || user?.correo === 'riascosmarlon66@gmail.com' || user?.correo === 'mike.otavo15@gmail.com') && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(lugar); }} 
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/40 border border-pink-500/20' : 'bg-white/20 hover:bg-white/30'
                }`}
                title="Editar"
              >
                <Pencil size={20} />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm(`¿Seguro que deseas eliminar el lugar "${lugar.nombre}"?`)) {
                    onDelete(lugar.id); 
                  }
                }} 
                className={`p-2 rounded-full text-white bg-red-600 hover:bg-red-700 shadow-md transition-all active:scale-95`}
                title="Eliminar lugar"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
          <button 
            onClick={() => {
              const commentsEl = document.getElementById('comments-section');
              commentsEl?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/40 border border-pink-500/20' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={handleShare} 
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/40 border border-pink-500/20' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Share2 size={20} />
          </button>
          <div className="flex items-center gap-3 ml-2">
            <button onClick={onToggleFavorite} className="transition-transform active:scale-90">
              <Heart size={24} fill={isFavorited ? "#ff4b4b" : "none"} color={isFavorited ? "#ff4b4b" : "currentColor"} />
            </button>
            <button onClick={onToggleSave} className="transition-transform active:scale-90">
              <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 mx-4 mb-4 rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-[#221c32] border border-pink-500/10' : 'bg-white'
      }`}>
        <div className="p-8">
          <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{lugar.nombre}</h2>
          <div className={`flex items-center gap-2 mb-6 ${darkMode ? 'text-pink-300/65' : 'text-primary/60'}`}>
            <MapPin size={18} fill="currentColor" fillOpacity={0.2} />
            <span className="text-md font-medium">{lugar.direccion || 'Fusagasugá, Cundinamarca'}</span>
          </div>

          {/* Redesigned high-contrast ¡Vamos! button */}
          <button 
            onClick={() => onOpenMap(lugar)}
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 mb-6 shadow-xl active:scale-[0.98] transition-all duration-300 cursor-pointer border-[3px] border-black ${
              darkMode 
                ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-[4px_4px_0_#ec4899] hover:shadow-[6px_6px_0_#ec4899]' 
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000]'
            }`}
          >
            <Compass size={24} className="text-white animate-spin-slow" />
            <span className="uppercase tracking-wider text-base">¡Vamos!</span>
          </button>

          {/* Main Image */}
          <div className={`rounded-[32px] overflow-hidden aspect-video mb-4 shadow-md p-1.5 border transition-colors duration-300 ${
            darkMode ? 'bg-[#181524] border-pink-500/10' : 'bg-slate-100 border-slate-100'
          }`}>
            <img 
              src={lugar.imagen} 
              alt={lugar.nombre} 
              className="w-full h-full object-cover rounded-[26px] cursor-pointer hover:opacity-95 transition-opacity" 
              onClick={() => handleOpenLightbox(0)}
            />
          </div>

          {/* Gallery - Secondary Images */}
          {lugar.imagenes && lugar.imagenes.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 no-scrollbar">
              {lugar.imagenes.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleOpenLightbox(idx + 1)}
                  className={`flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden shadow-sm p-1 border cursor-pointer hover:scale-[1.02] transition-transform ${
                    darkMode ? 'bg-[#181524] border-pink-500/10' : 'bg-white border-slate-100'
                  }`}
                >
                  <img src={img} alt={`${lugar.nombre} ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </div>
          )}

          <div className={`mt-6 leading-relaxed transition-colors duration-300 ${
            darkMode ? 'text-purple-100/80' : 'text-slate-600'
          }`}>
            <p>{lugar.descripcion}</p>
          </div>

          {/* Comments Section */}
          <div id="comments-section">
            <CommentsSection lugarId={lugar.id} user={user} darkMode={darkMode} />
          </div>
        </div>
      </div>

      {/* Lightbox full-screen photo viewer (Google Maps style) */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 select-none"
            onClick={() => setActivePhotoIndex(null)}
          >
            {/* Header */}
            <div className="flex items-center justify-between text-white py-2 px-4 z-10 w-full bg-linear-to-b from-black/60 to-transparent absolute top-0 left-0">
              <div className="flex flex-col">
                <span className="font-bold text-lg drop-shadow-md">{lugar.nombre}</span>
                <span className="text-xs text-slate-300 font-medium drop-shadow-sm">Foto {activePhotoIndex + 1} de {todasLasImagenes.length}</span>
              </div>
              <button 
                onClick={() => setActivePhotoIndex(null)} 
                className="p-3 bg-white/10 hover:bg-white/25 rounded-full transition-all focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Middle Container for Image and Arrows */}
            <div className="flex-1 flex items-center justify-center relative w-full h-full max-h-[75vh] mt-16">
              {/* Left Button */}
              {todasLasImagenes.length > 1 && (
                <button 
                  onClick={handlePrevPhoto}
                  className="absolute left-4 p-3 bg-black/40 hover:bg-black/65 border border-white/15 text-white rounded-full transition-all active:scale-95 z-20"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Main Image View */}
              <motion.img 
                key={activePhotoIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={todasLasImagenes[activePhotoIndex]} 
                alt={`${lugar.nombre} photo`} 
                className="max-w-full max-h-full object-contain pointer-events-none rounded-lg shadow-2xl border border-white/5"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Right Button */}
              {todasLasImagenes.length > 1 && (
                <button 
                  onClick={handleNextPhoto}
                  className="absolute right-4 p-3 bg-black/40 hover:bg-black/65 border border-white/15 text-white rounded-full transition-all active:scale-95 z-20"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Bottom thumbnail selector (Google Maps carousel style) */}
            <div className="py-4 bg-linear-to-t from-black/80 to-transparent w-full absolute bottom-0 left-0 z-10 flex flex-col items-center">
              <div className="flex gap-2.5 overflow-x-auto max-w-[90%] px-4 py-2 no-scrollbar">
                {todasLasImagenes.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(idx); }}
                    className={`flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                      activePhotoIndex === idx ? 'border-pink-500 scale-105 shadow-lg shadow-pink-500/20' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover rounded-md" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InAppBrowser = ({ 
  lugar, 
  onClose, 
  userLocation,
  darkMode 
}: { 
  lugar: Lugar, 
  onClose: () => void, 
  userLocation: { lat: number, lng: number } | null,
  darkMode: boolean
}) => {
  const [useApp, setUseApp] = useState(true);
  const [travelMode, setTravelMode] = useState<'d' | 'w'>('d');
  
  // WhatsApp map style controls
  const [zoom, setZoom] = useState(15);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = road map, 'k' = satellite
  const [showRoute, setShowRoute] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [currentDeviceLoc, setCurrentDeviceLoc] = useState<{ lat: number, lng: number } | null>(userLocation);

  const lat = lugar.lat || 4.3361;
  const lng = lugar.lng || -74.3638;

  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        setCurrentDeviceLoc({ lat: currentLat, lng: currentLng });
      },
      (error) => {
        console.warn("GPS location error:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  
  const targetCenter = mapCenter 
    ? mapCenter 
    : (showRoute && (currentDeviceLoc || userLocation) ? null : { lat, lng });

  
  let embedUrl = "";
  const actualUserLoc = currentDeviceLoc || userLocation;
  if (showRoute && actualUserLoc && !mapCenter) {
    embedUrl = `https://maps.google.com/maps?saddr=${actualUserLoc.lat},${actualUserLoc.lng}&daddr=${lat},${lng}&dirflg=${travelMode}&t=${mapType}&hl=es&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  } else {
    const centerLat = targetCenter ? targetCenter.lat : lat;
    const centerLng = targetCenter ? targetCenter.lng : lng;
    embedUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&t=${mapType}&hl=es&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  const destinationQuery = encodeURIComponent(
    `${lugar.nombre}${lugar.direccion ? `, ${lugar.direccion}` : ''}, Fusagasugá, Cundinamarca, Colombia`
  );

  const MapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}${
    actualUserLoc ? `&origin=${actualUserLoc.lat},${actualUserLoc.lng}` : ''
  }&travelmode=${
    travelMode === 'd' ? 'driving' : 'walking'
  }`;

  const handleCenterOnUser = () => {
    if (actualUserLoc) {
      setMapCenter({ lat: actualUserLoc.lat, lng: actualUserLoc.lng });
      setZoom(16);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentDeviceLoc(loc);
          setMapCenter(loc);
          setZoom(16);
        },
        () => alert("No se pudo obtener tu ubicación actual. Activa el GPS.")
      );
    }
  };

  const handleCenterOnPlace = () => {
    setMapCenter(null); // point back to default target site coordinates
    setZoom(15);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex flex-col p-4"
    >
      <div className={`w-full max-w-lg mx-auto rounded-[40px] shadow-2xl flex-1 flex flex-col overflow-hidden border-4 transition-colors duration-300 ${
        darkMode ? 'bg-[#221c32] border-[#221c32]' : 'bg-white border-white'
      }`}>
        <div className={`p-6 flex items-center justify-between border-b transition-colors ${
          darkMode ? 'border-pink-500/10 bg-[#1e1a2f] text-white' : 'border-slate-100 bg-slate-50 text-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold leading-tight ${darkMode ? 'text-pink-100' : 'text-slate-800'}`}>{lugar.nombre}</h3>
            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-pink-400' : 'text-slate-400'}`}>
              Navegación Fusa Explor
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`p-2 rounded-2xl shadow-sm transition-colors ${
              darkMode ? 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/40' : 'bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className={`flex-1 relative ${darkMode ? 'bg-[#181524]' : 'bg-slate-100'}`}>
          {useApp ? (
            <>
              {/* Transport Mode Options (🚗 Auto, 🚶 Caminar) on top of map */}
              <div className="absolute top-4 left-4 right-4 z-[60] flex justify-center gap-3">
                {[
                  { mode: 'd', label: '🚗 Conducir' },
                  { mode: 'w', label: '🚶 Caminar' }
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setTravelMode(item.mode as any)}
                    className={`text-xs px-4 py-2.5 rounded-full font-extrabold shadow-md transition-all active:scale-95 ${
                      travelMode === item.mode
                        ? (darkMode ? 'bg-pink-600 text-white shadow-pink-600/20' : 'bg-primary text-white shadow-primary/20')
                        : (darkMode ? 'bg-slate-800/90 text-pink-200 hover:bg-slate-700/90' : 'bg-white/90 text-slate-700 hover:bg-white')
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Floating WhatsApp styled Map Operations Column on the right */}
              <div className="absolute top-20 right-4 z-[60] flex flex-col gap-2.5">
                {/* Toggle Map type (Satellite / Standard) */}
                <button
                  onClick={() => setMapType(m => m === 'm' ? 'k' : 'm')}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={mapType === 'm' ? "Ver Satélite" : "Ver Mapa"}
                >
                  <Globe size={18} className={mapType === 'k' ? "text-pink-400 rotate-12" : ""} />
                </button>

                {/* Toggle mode: Full route vs Lugar marker */}
                <button
                  onClick={() => {
                    setShowRoute(r => !r);
                    setMapCenter(null);
                  }}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={showRoute ? "Ver solo marcador del sitio" : "Ver ruta desde mi ubicación"}
                >
                  {showRoute ? <MapPin size={18} className="text-pink-500 animate-bounce" /> : <Compass size={18} />}
                </button>

                {/* Reset Center to My Location (Crosshair GPS) */}
                <button
                  onClick={handleCenterOnUser}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Centrar en mi ubicación"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <circle cx="12" cy="12" r="8"></circle>
                    <line x1="12" y1="1" x2="12" y2="4"></line>
                    <line x1="12" y1="20" x2="12" y2="23"></line>
                    <line x1="1" y1="12" x2="4" y2="12"></line>
                    <line x1="20" y1="12" x2="23" y2="12"></line>
                    <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
                  </svg>
                </button>

                {/* Reset Center to Place coordinates */}
                <button
                  onClick={handleCenterOnPlace}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Enfocar destino del lugar"
                >
                  <MapIcon size={16} />
                </button>

                {/* Zoom In */}
                <button
                  onClick={() => setZoom(z => Math.min(20, z + 1))}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center font-extrabold ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Acercar mapa"
                >
                  <Plus size={16} />
                </button>

                {/* Zoom Out */}
                <button
                  onClick={() => setZoom(z => Math.max(10, z - 1))}
                  className={`p-3 rounded-full shadow-lg border transition-all active:scale-90 flex items-center justify-center ${
                    darkMode 
                      ? 'bg-slate-900 border-pink-500/10 text-pink-300 hover:bg-slate-850' 
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Alejar mapa"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>

              <iframe 
                src={embedUrl}
                className="w-full h-full border-none"
                title="Google Maps Navigation"
              ></iframe>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
                darkMode ? 'bg-pink-500/10 text-pink-400' : 'bg-primary/10 text-primary'
              }`}>
                <Navigation size={40} className="animate-bounce" />
              </div>
              <h4 className={`text-xl font-comic-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Redireccionando a Google Maps</h4>
              <p className={`text-sm mb-8 ${darkMode ? 'text-purple-200/60' : 'text-slate-500'}`}>Estamos abriendo la aplicación externa para una mejor experiencia de navegación.</p>
              <button 
                type="button"
                onClick={() => window.open(MapsUrl, '_blank')}
                className={`px-8 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                  darkMode ? 'bg-pink-600 text-white shadow-pink-600/20 hover:bg-pink-500' : 'fusa-teal text-white shadow-teal-500/20'
                }`}
              >
                Abrir ahora
              </button>
            </div>
          )}
        </div>

        <div className={`p-6 border-t grid grid-cols-2 gap-4 transition-colors ${
          darkMode ? 'bg-[#1e1a2f] border-pink-500/10' : 'bg-slate-50 border-slate-100'
        }`}>
          <button 
            type="button"
            onClick={() => setUseApp(true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${
              useApp 
                ? (darkMode ? 'bg-pink-600/10 shadow-xl border border-pink-500/20 text-pink-300 scale-105' : 'bg-white shadow-xl border border-primary/20 text-primary scale-105') 
                : (darkMode ? 'text-pink-300/40 opacity-60' : 'text-slate-400 opacity-60')
            }`}
          >
            <MapIcon size={24} />
            <span className="text-[10px] font-black uppercase">En la App</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              setUseApp(false);
              window.open(MapsUrl, '_blank');
            }}
            className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${
              !useApp 
                ? (darkMode ? 'bg-pink-600/10 shadow-xl border border-pink-500/20 text-pink-300 scale-105' : 'bg-white shadow-xl border border-primary/20 text-primary scale-105') 
                : (darkMode ? 'text-pink-300/40 opacity-60' : 'text-slate-400 opacity-60')
            }`}
          >
            <Navigation size={24} />
            <span className="text-[10px] font-black uppercase">Google Maps</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};



const NotARobotCaptcha = ({ onVerify }: { onVerify: (verified: boolean) => void }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleToggle = () => {
    if (isVerified || isVerifying) return;
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      onVerify(true);
    }, 1200);
  };

  return (
    <div className="bg-[#f9f9f9] border border-slate-200 rounded-xl p-4 flex items-center justify-between w-full shadow-sm select-none mb-4">
      <div className="flex items-center gap-4">
        <motion.div 
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          className={`w-7 h-7 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
            isVerified ? 'border-green-500 bg-green-500 shadow-lg shadow-green-200' : 'border-slate-300 bg-white hover:border-primary'
          }`}
        >
          {isVerifying ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            />
          ) : isVerified ? (
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
              <Check size={18} className="text-white" strokeWidth={4} />
            </motion.div>
          ) : null}
        </motion.div>
        <div>
          <p className="text-sm font-bold text-slate-700 tracking-tight">No soy un robot</p>
          <p className="text-[10px] text-slate-400 font-medium">Verificación de seguridad</p>
        </div>
      </div>
      <div className="flex flex-col items-center opacity-60 grayscale scale-90">
        <img 
          src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
          alt="Security" 
          className="w-7 h-7"
        />
        <span className="text-[7px] text-slate-500 font-black uppercase mt-1">reCAPTCHA</span>
      </div>
    </div>
  );
};


const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [nombreInput, setNombreInput] = useState('');
  const [apellidoInput, setApellidoInput] = useState('');
  const [fechaNacimientoInput, setFechaNacimientoInput] = useState('');

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in App component handles user document creation and session state automatically
    } catch (err: any) {
      console.error("Google Login failed", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado por el usuario.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor permite ventanas emergentes.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Petición duplicada ignorada
      } else {
        setError("El ingreso con Google falló. Por favor intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering && !captchaVerified) {
      setError('Por favor, completa la verificación "No soy un robot".');
      return;
    }

    if (isRegistering) {
      if (!nombreInput.trim() || !apellidoInput.trim() || !fechaNacimientoInput) {
        setError('Por favor completa nombre, apellido y fecha de nacimiento.');
        return;
      }
      const nacimiento = new Date(fechaNacimientoInput);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const aunNoCumple = (hoy.getMonth() < nacimiento.getMonth()) ||
        (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
      if (aunNoCumple) edad--;
      if (isNaN(edad) || edad < 13) {
        setError('Debes tener al menos 13 años para registrarte.');
        return;
      }
    }
    setLoading(true);
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const isAdminEmail = email.endsWith('@fusaexplor.com') || email === 'riascosmarlon66@gmail.com' || email === 'mike.otavo15@gmail.com';
        await createUsuario(result.user.uid, {
          nombre: email.split('@')[0],
          nombre: nombreInput.trim(),
          apellido: apellidoInput.trim(),
          fechaNacimiento: fechaNacimientoInput,
          correo: email,
          rol: isAdminEmail ? 'admin' : 'usuario'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('El ingreso por correo no está habilitado.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está en uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('Contraseña muy débil.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Usuario no encontrado o contraseña incorrecta.');
      } else {
        setError('Error al autenticar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a0e4a] via-[#5b21b6] to-[#a78bfa] py-8">
      {/* Glow Backdrops for Modern Attention-grabbing Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-pink-500/15 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-400/25 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-[35%] left-[20%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/15 blur-[100px] pointer-events-none z-0"></div>

      {/* Rotating Comic Action Sunburst Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay z-0 flex items-center justify-center overflow-hidden">
        <svg className="w-[180%] h-[180%] animate-[spin_120s_linear_infinite]" viewBox="0 0 100 100">
          <g stroke="white" strokeWidth="0.8">
            <line x1="50" y1="50" x2="0" y2="0" />
            <line x1="50" y1="50" x2="50" y2="0" />
            <line x1="50" y1="50" x2="100" y2="0" />
            <line x1="50" y1="50" x2="100" y2="50" />
            <line x1="50" y1="50" x2="100" y2="100" />
            <line x1="50" y1="50" x2="50" y2="100" />
            <line x1="50" y1="50" x2="0" y2="100" />
            <line x1="50" y1="50" x2="0" y2="50" />
            <line x1="50" y1="50" x2="15" y2="15" />
            <line x1="50" y1="50" x2="85" y2="15" />
            <line x1="50" y1="50" x2="85" y2="85" />
            <line x1="50" y1="50" x2="15" y2="85" />
            <line x1="50" y1="50" x2="30" y2="5" />
            <line x1="50" y1="50" x2="70" y2="5" />
            <line x1="50" y1="50" x2="95" y2="30" />
            <line x1="50" y1="50" x2="95" y2="70" />
            <line x1="50" y1="50" x2="70" y2="95" />
            <line x1="50" y1="50" x2="30" y2="95" />
            <line x1="50" y1="50" x2="5" y2="70" />
            <line x1="50" y1="50" x2="5" y2="30" />
          </g>
        </svg>
      </div>

      {/* Comic Halftone Dot overlay specifically tuned for dark backgrounds */}
      <div className="absolute inset-0 halftone-bg-dark pointer-events-none z-0"></div>

      {/* Foreground Content */}
      <div className="relative z-20 w-full max-w-md px-6 flex flex-col items-center">
        
        {/* Beautiful Comic-styled Brand Logo */}
        <div className="mb-8 relative flex justify-center w-full">
           <div className="absolute w-52 h-52 bg-pink-500/30 rounded-full blur-[50px] opacity-60"></div>
           <BrandLogo animated={true} size="lg" yellow={true} />
        </div>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-100 text-red-800 text-xs font-black border-4 border-red-500 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] animate-fadeIn">
            💥 {error}
          </div>
        )}

        {!showEmailForm ? (
          <div className="w-full space-y-5">
            {/* Google Button in comic style */}
            <div 
              className="relative group cursor-pointer w-full" 
              onClick={handleGoogleLogin}
            >
              <div className="bg-white border-[4px] border-black py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-3 text-black shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 rounded-full border border-black" />
                <span className="text-lg uppercase font-comic tracking-widest">CONTINUAR CON GOOGLE</span>
              </div>
            </div>
            
            {/* Email Option */}
            <button 
              onClick={() => setShowEmailForm(true)}
              className="mt-6 flex items-center justify-center gap-2.5 w-full bg-white border-[4px] border-black py-3 rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-purple-100 transition-all text-black cursor-pointer tracking-widest font-comic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              INGRESAR CON CORREO
            </button>
          </div>
        ) : (
          <div className="w-full bg-white border-[5px] border-black p-6 shadow-[8px_8px_0_#000] rounded-[28px] rotate-[-0.5deg]">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <h3 className="text-3xl font-comic tracking-widest text-purple-600 mb-4 text-center drop-shadow-[2px_2px_0_#000] uppercase">
                {isRegistering ? '¡REGÍSTRATE!' : '¡INICIA SESIÓN!'}
              </h3>
              
              <div className="space-y-3">
                   {isRegistering && (
                  <>
                    <input
                      type="text"
                      placeholder="NOMBRE"
                      value={nombreInput}
                      onChange={(e) => setNombreInput(e.target.value)}
                      required
                      className="w-full bg-purple-50/50 border-[4px] border-black p-3.5 rounded-xl font-bold outline-none focus:bg-white focus:shadow-[4px_4px_0_#000] transition-all text-black placeholder-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="APELLIDO"
                      value={apellidoInput}
                      onChange={(e) => setApellidoInput(e.target.value)}
                      required
                      className="w-full bg-purple-50/50 border-[4px] border-black p-3.5 rounded-xl font-bold outline-none focus:bg-white focus:shadow-[4px_4px_0_#000] transition-all text-black placeholder-slate-400"
                    />
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 ml-1">Fecha de nacimiento</label>
                      <input
                        type="date"
                        value={fechaNacimientoInput}
                        onChange={(e) => setFechaNacimientoInput(e.target.value)}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-purple-50/50 border-[4px] border-black p-3.5 rounded-xl font-bold outline-none focus:bg-white focus:shadow-[4px_4px_0_#000] transition-all text-black"
                      />
                    </div>
                  </>
                )}
                <input 
                  type="email" 
                  placeholder="CORREO ELECTRÓNICO" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-purple-50/50 border-[4px] border-black p-3.5 rounded-xl font-bold outline-none focus:bg-white focus:shadow-[4px_4px_0_#000] transition-all text-black placeholder-slate-400"
                />
                <input 
                  type="password" 
                  placeholder="CONTRASEÑA" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-purple-50/50 border-[4px] border-black p-3.5 rounded-xl font-bold outline-none focus:bg-white focus:shadow-[4px_4px_0_#000] transition-all text-black placeholder-slate-400"
                />
              </div>

              {isRegistering && (
                  <NotARobotCaptcha onVerify={setCaptchaVerified} />
                )}
              <button
                type="submit"
                className="w-full mt-4 bg-black text-white border-[4px] border-black py-4 rounded-2xl font-black uppercase tracking-widest shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
              >
                {isRegistering ? 'CREAR CUENTA' : 'INGRESAR CON CORREO'}
              </button>

              <div className="flex justify-between items-center mt-5 pt-4 border-t-4 border-dashed border-black">
                <button 
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-xs font-black text-slate-700 uppercase tracking-widest hover:underline cursor-pointer"
                >
                  ⬅ VOLVER
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setCaptchaVerified(false);
                  }}
                  className="text-xs font-black text-pink-600 hover:text-pink-700 uppercase tracking-widest hover:underline cursor-pointer"
                >
                  {isRegistering ? 'YA TENGO CUENTA' : 'CREAR CUENTA 🚀'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


const ImageAdjusterModal = ({
  imageSrc,
  onCrop,
  onClose,
  darkMode
}: {
  imageSrc: string;
  onCrop: (croppedImageBase64: string) => void;
  onClose: () => void;
  darkMode: boolean;
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offsetX, y: clientY - offsetY });
  };
  
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffsetX(clientX - dragStart.x);
    setOffsetY(clientY - dragStart.y);
  };
  
  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 180, 180);
    
    // Circled Crop Mask
    ctx.beginPath();
    ctx.arc(90, 90, 90, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 180, 180);

    const img = new Image();
    img.onload = () => {
      ctx.translate(90, 90);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const ratio = 180 / 200;
      
      let drawW = 200;
      let drawH = 200;
      if (img.width > img.height) {
        drawW = (img.width / img.height) * 200;
      } else {
        drawH = (img.height / img.width) * 200;
      }

      ctx.drawImage(
        img,
        -drawW / 2 + offsetX * ratio,
        -drawH / 2 + offsetY * ratio,
        drawW,
        drawH
      );

      const croppedResult = canvas.toDataURL('image/jpeg', 0.85);
      onCrop(croppedResult);
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-[35px] p-6 shadow-2xl border transition-all ${
        darkMode ? 'bg-[#1e1a30] border-pink-500/10 text-white' : 'bg-white border-[#eaeaea] text-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-wider">Ajustar Foto de Perfil</h3>
          <button 
            type="button" 
            onClick={onClose}
            className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-pink-850/20 text-pink-300' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div 
          ref={viewportRef}
          onMouseDown={e => handleStart(e.clientX, e.clientY)}
          onMouseMove={e => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={e => {
            if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={e => {
            if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleEnd}
          className="relative w-48 h-48 mx-auto rounded-full border-4 border-primary/20 overflow-hidden cursor-move bg-slate-950 flex items-center justify-center shadow-inner select-none"
        >
          <div className="absolute inset-x-0 inset-y-0 rounded-full border-2 border-dashed border-white/50 pointer-events-none z-10" />
          
          <img 
            src={imageSrc} 
            alt="Original profile visual" 
            draggable={false}
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              maxWidth: 'none',
              width: '100%',
              userSelect: 'none'
            }}
            className="pointer-events-none transition-transform duration-75"
          />
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
          Arrastra la imagen o usa los deslizadores
        </p>

        <div className="space-y-4 mt-6">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Ajustar Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Rotación</span>
              <span>{rotation}°</span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="range"
                min="0"
                max="360"
                step="5"
                value={rotation}
                onChange={e => setRotation(parseInt(e.target.value))}
                className="w-full accent-primary flex-1"
              />
              <button 
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className={`p-1.5 rounded-lg border flex items-center justify-center ${
                  darkMode ? 'border-pink-500/10 text-pink-300 bg-pink-950/20' : 'border-slate-100 text-slate-600 bg-slate-50'
                }`}
                title="Girar 90°"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2 border-t border-slate-100/10">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Mover X</span>
              <input 
                type="range"
                min="-150"
                max="150"
                value={offsetX}
                onChange={e => setOffsetX(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Mover Y</span>
              <input 
                type="range"
                min="-150"
                max="150"
                value={offsetY}
                onChange={e => setOffsetY(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleApply}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black mt-6 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Check size={16} />
          Confirmar Ajuste
        </button>
      </div>
    </div>
  );
};


const ProfileView = ({ 
  user, 
  lugares, 
  darkMode 
}: { 
  user: Usuario, 
  lugares: Lugar[], 
  darkMode: boolean 
}) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [adjustingImageSrc, setAdjustingImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchComentarios = async () => {
      await Promise.all([
        (async () => {
          const data = await getUserComentarios(user.id);
          setComentarios(data);
        })(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      setLoading(false);
    };
    fetchComentarios();
  }, [user.id]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdjustingImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreSocialPic = async () => {
    const socialPic = auth.currentUser?.photoURL;
    if (socialPic) {
      setUpdatingAvatar(true);
      try {
        await updateUsuario(user.id, { avatar: socialPic });
      } catch (error) {
        console.error("Error restoring social photo url:", error);
      } finally {
        setUpdatingAvatar(false);
      }
    }
  };

  if (loading) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex flex
          -col items-center justify-center overflow-hidden touch-none select-none ${
          darkMode ? 'bg-[#181524]' : 'bg-white'
        }`}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      >
        <LoadingOrchid />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {adjustingImageSrc && (
        <ImageAdjusterModal 
          imageSrc={adjustingImageSrc}
          darkMode={darkMode}
          onClose={() => setAdjustingImageSrc(null)}
          onCrop={async (croppedBase64) => {
            setAdjustingImageSrc(null);
            setUpdatingAvatar(true);
            try {
              await updateUsuario(user.id, { avatar: croppedBase64 });
            } catch (error) {
              console.error("Error setting custom cropped avatar profile:", error);
            } finally {
              setUpdatingAvatar(false);
            }
          }}
        />
      )}

      <div className={`p-8 rounded-[40px] shadow-xl border flex flex-col items-center text-center transition-all duration-300 ${
        darkMode ? 'bg-[#221c32] border-pink-500/10 text-white shadow-none' : 'bg-white border-white/50 text-slate-800'
      }`}>
        <div className="relative group">
          {user.avatar ? (
            <img src={user.avatar} alt={user.nombre} className={`w-24 h-24 rounded-[32px] border-4 shadow-xl object-cover transition-all ${
              darkMode ? 'border-pink-500/30' : 'border-white'
            }`} />
          ) : (
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center font-bold text-3xl shadow-inner transition-colors ${
              darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-primary/10 text-primary'
            }`}>
              {(user.nombre || 'E').charAt(0).toUpperCase()}
            </div>
          )}
          
          <button 
            type="button"
            onClick={triggerFileInput}
            disabled={updatingAvatar}
            className={`absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg border transition-all active:scale-90 ${
              darkMode 
                ? 'bg-pink-600 border-pink-500 text-white hover:bg-pink-500' 
                : 'bg-primary border-white text-white hover:bg-purple-700'
            }`}
            title="Cambiar foto de perfil"
          >
            <Pencil size={12} />
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAvatarFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        
        {auth.currentUser?.photoURL && user.avatar !== auth.currentUser.photoURL && (
          <button
            type="button"
            onClick={handleRestoreSocialPic}
            disabled={updatingAvatar}
            className={`mt-3 py-1.5 px-4 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-1 ${
              darkMode 
                ? 'bg-[#1a1527] border-pink-500/20 text-pink-300 hover:bg-[#251f38]' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
            title="Vincular con la foto de tu red social de registro"
          >
            <RefreshCw size={10} className={updatingAvatar ? "animate-spin" : ""} />
            Vincular Red Social
          </button>
        )}

        <h2 className={`text-2xl font-black mt-4 ${darkMode ? 'text-pink-100' : 'text-slate-800'}`}>{user.nombre}</h2>
        <p className={`font-medium ${darkMode ? 'text-purple-200/60' : 'text-slate-500'}`}>{user.correo}</p>
        
        <span className={`mt-4 px-4 py-2 border text-[10px] font-black uppercase tracking-widest rounded-2xl ${
          darkMode ? 'bg-pink-900/10 border-pink-500/15 text-pink-300' : 'bg-slate-50 border-slate-100 text-slate-400'
        }`}>
          {user.rol}
        </span>
      </div>

      <div>
        <h3 className={`text-xs font-comic-bold uppercase tracking-widest mb-4 ml-4 ${
          darkMode ? 'text-pink-300/80' : 'text-slate-500/80'
        }`}>
          Historial de Reseñas / Visitas
        </h3>
        
        <div className="space-y-4">
          {comentarios.length > 0 ? (
            comentarios.map(c => {
              const lugar = lugares.find(l => l.id === c.lugarId);
              return (
                <div key={c.id} className={`p-6 rounded-[32px] shadow-sm border transition-colors duration-300 ${
                  darkMode ? 'bg-[#221c32] border-pink-500/10 text-white shadow-none' : 'bg-white border-slate-100/50 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-bold ${darkMode ? 'text-pink-100' : 'text-slate-800'}`}>
                      {lugar?.nombre || 'Lugar desconocido'}
                    </span>
                    <div className="flex gap-1 text-orange-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < c.puntuacion ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p className={`font-medium italic text-sm ${darkMode ? 'text-purple-200/80' : 'text-slate-600'}`}>
                    "{c.texto}"
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${
                    darkMode ? 'text-pink-400/50' : 'text-slate-400'
                  }`}>
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'Ayer'}
                  </p>
                </div>
              );
            })
          ) : (
            <div className={`text-center py-12 rounded-[40px] border border-dashed transition-colors duration-300 ${
              darkMode ? 'bg-[#221c32] border-pink-500/20 text-purple-200/40' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <p className="font-medium">Aún no has escrito reseñas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ user }: { user: Usuario }) => {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLugarModal, setShowLugarModal] = useState(false);
  const [lugarToEdit, setLugarToEdit] = useState<Lugar | null>(null);
  const [selectedLugar, setSelectedLugar] = useState<Lugar | null>(null);
  const [navigatingLugar, setNavigatingLugar] = useState<Lugar | null>(null);
  const [currentView, setCurrentView] = useState<'inicio' | 'guardados' | 'favoritos' | 'pahacer' | 'menu' | 'perfil' | 'clima' | 'estados'>('inicio');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('fusa-pastel-dark') === 'true');


  useEffect(() => {
    if (selectedLugar) {
      const updated = lugares.find(l => l.id === selectedLugar.id);
      if (updated) {
        setSelectedLugar(updated);
      }
    }
  }, [lugares, selectedLugar]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showAdPopup, setShowAdPopup] = useState(true);

  const activeAdLugar = React.useMemo(() => {
    const now = new Date().toISOString();
    return lugares.find(l => 
      l.anuncioActivo && 
      l.anuncioHasta && 
      l.anuncioHasta > now &&
      l.anuncioImagen
    );
  }, [lugares]);

  const adTargetLugar = React.useMemo(() => {
    if (activeAdLugar) return activeAdLugar;
    return lugares.find(l => l.nombre.toLowerCase().includes('sahara')) || lugares[0] || null;
  }, [activeAdLugar, lugares]);

  const handleAdClick = () => {
    setShowAdPopup(false);
    if (adTargetLugar) {
      setSelectedLugar(adTargetLugar);
    } else {
      setCurrentView('pahacer');
    }
  };

  const [historias, setHistorias] = useState<Historia[]>([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [newStoryType, setNewStoryType] = useState<'image' | 'text'>('image');
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryImage, setNewStoryImage] = useState<string | null>(null);
  const [newStoryBg, setNewStoryBg] = useState('from-purple-500 to-pink-500');
  const [newStoryLugar, setNewStoryLugar] = useState<string>('');
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

 
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);


  const [floatingHearts, setFloatingHearts] = useState<{ id: number, x: number }[]>([]);
  const [storyCommentText, setStoryCommentText] = useState('');
  const [storyToast, setStoryToast] = useState<string | null>(null);

  const handleSendPurpleHeart = () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const newHeart = { id: Date.now() + Math.random(), x: Math.random() * 70 + 15 };
        setFloatingHearts(prev => [...prev, newHeart]);
        setTimeout(() => {
          setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, 2200);
      }, i * 150);
    }
  };

  const handleAddStoryComment = async (text: string, authorName: string, avatarUrl?: string) => {
    const currentUserGroup = storiesGroupedByUser[activeUserIndex];
    const currentStory = currentUserGroup?.stories[activeStoryIndex];
    if (!currentStory) return;

    const moderation = await moderarContenidoFrontend(text);
    if (!moderation.aprobado) {
      alert(`⚠️ Tu comentario viola las normas de la comunidad:\nMotivo: ${moderation.motivo}\nCategoría: ${moderation.categoriaInfraccion}`);
      setStoryToast(`⚠️ Comentario bloqueado: ${moderation.motivo}`);
      setTimeout(() => setStoryToast(null), 3500);
      return;
    }

    const newComment = {
      id: Date.now().toString() + Math.random().toString(),
      author: authorName,
      avatar: avatarUrl || '',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };


    setHistorias(prev => prev.map(h => {
      if (h.id === currentStory.id) {
        return {
          ...h,
          comentarios: [...(h.comentarios || []), newComment]
        };
      }
      return h;
    }));

    
    addComentarioAHistoria(currentStory.id, newComment);

    handleSendPurpleHeart();
    setStoryToast(`Comentario enviado 💜`);
    setTimeout(() => setStoryToast(null), 2500);
  };

  const gradients = [
    'from-purple-500 to-pink-500',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-red-500',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-300 to-purple-500'
  ];


  useEffect(() => {
    const unsubscribe = subscribeToHistorias((data) => {
      const now = Date.now();

      const active = (data || []).filter(h => {
        if (!h.expiresAt) return true; 
        let dateObj: Date;
        const exp = h.expiresAt as any;
        if (typeof exp === 'string') {
          dateObj = new Date(exp);
        } else if (exp && typeof exp.toDate === 'function') {
          dateObj = exp.toDate();
        } else if (exp && exp.seconds) {
          dateObj = new Date(exp.seconds * 1000);
        } else {
          dateObj = new Date(exp);
        }
        const timeVal = dateObj.getTime();
        return isNaN(timeVal) || timeVal > now;
      });
      setHistorias(active);
    });
    return () => unsubscribe();
  }, []);

  const storiesGroupedByUser = React.useMemo(() => {
    const groups: { [userId: string]: Historia[] } = {};
    (historias || []).forEach(h => {
      if (!groups[h.usuarioId]) {
        groups[h.usuarioId] = [];
      }
      groups[h.usuarioId].push(h);
    });
    return Object.keys(groups).map(userId => {
      const userStories = groups[userId];
      return {
        userId,
        usuarioNombre: userStories[0].usuarioNombre,
        usuarioAvatar: userStories[0].usuarioAvatar,
        stories: userStories
      };
    });
  }, [historias]);

  const destacados = React.useMemo(() => {
    return (lugares || []).filter(l => {
      if (!l.destacado) return false;
      if (l.destacadoHasta) {
        const expiresAt = new Date(l.destacadoHasta).getTime();
        if (Date.now() > expiresAt) return false;
      }
      return true;
    });
  }, [lugares]);

  // Featured Auto-scroll effect
  useEffect(() => {
    if (destacados.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % destacados.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [destacados.length]);

  const mainContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainContainerRef.current?.scrollTo({ top: 0 });
  }, [currentView]);

  const handleNextStory = React.useCallback(() => {
    const currentUserGroup = storiesGroupedByUser[activeUserIndex];
    if (!currentUserGroup) {
      setStoryViewerOpen(false);
      return;
    }
    if (activeStoryIndex < currentUserGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {

      if (activeUserIndex < storiesGroupedByUser.length - 1) {
        setActiveUserIndex(prev => prev + 1);
        setActiveStoryIndex(0);
      } else {
    
        setStoryViewerOpen(false);
      }
    }
  }, [activeUserIndex, activeStoryIndex, storiesGroupedByUser]);

  const handlePrevStory = React.useCallback(() => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
 
      if (activeUserIndex > 0) {
        setActiveUserIndex(prev => prev - 1);
        const prevUserGroup = storiesGroupedByUser[activeUserIndex - 1];
        setActiveStoryIndex(prevUserGroup.stories.length - 1);
      } else {
     
        setStoryProgress(0);
      }
    }
  }, [activeUserIndex, activeStoryIndex, storiesGroupedByUser]);

  
  useEffect(() => {
    if (!storyViewerOpen) return;
    setStoryProgress(0);
    setFloatingHearts([]);
    const startTime = Date.now();
    const duration = 15000; // 15 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setStoryProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        handleNextStory();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [activeUserIndex, activeStoryIndex, storyViewerOpen, handleNextStory]);

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setNewStoryImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostStory = async () => {
    if (newStoryType === 'text' && !newStoryText.trim()) return;
    if (newStoryType === 'image' && !newStoryImage) {
      alert("Por favor selecciona o toma una foto.");
      return;
    }
    if (!newStoryLugar) {
      alert("Debes seleccionar un lugar obligatorio para tu historia.");
      return;
    }

    setIsSubmittingStory(true);
    try {
      const moderation = await moderarContenidoFrontend(
        newStoryText,
        newStoryType === 'image' ? (newStoryImage || undefined) : undefined
      );
      if (!moderation.aprobado) {
        alert(`⚠️ Tu estado viola las normas de la comunidad:\nMotivo: ${moderation.motivo}\nCategoría: ${moderation.categoriaInfraccion}`);
        setIsSubmittingStory(false);
        return;
      }
      const selectedLugar = lugares.find(l => l.id === newStoryLugar);
      const expiresAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await addHistoria({
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        usuarioAvatar: user.avatar || '',
        imagen: newStoryType === 'image' ? (newStoryImage || '') : '',
        texto: newStoryText,
        background: newStoryType === 'text' ? newStoryBg : '',
        lugarId: newStoryLugar,
        lugarNombre: selectedLugar?.nombre || '',
        expiresAt: expiresAtDate
      });
  
      setShowCreateStoryModal(false);
      setNewStoryText('');
      setNewStoryImage(null);
      setNewStoryLugar('');
    } catch (error) {
      console.error("Error posting story", error);
    } finally {
      setIsSubmittingStory(false);
    }
  };
  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: '¡Hola! Soy **Fusa Guía**, tu guía virtual de Fusagasugá 🌸. ¿Qué plan tienes para hoy o qué tipo de lugar te gustaría descubrir? Puedo sugerirte los mejores restaurantes, iglesias o paseos de la aplicación.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('fusa-pastel-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (showAssistant) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, showAssistant]);

  const INITIAL_CITIES_WEATHER_DATA = {
    'Fusagasugá': {
      temp: 22,
      apparentTemp: 23,
      humidity: 68,
      windSpeed: 10,
      isDay: true,
      code: 2,
      des: "Parcialmente Nublado ⛅",
      forecast: [
        { day: "Hoy", temp: 23, code: 1, des: "Chubascos" },
        { day: "Mañ", temp: 24, code: 0, des: "Soleado" },
        { day: "Mar", temp: 22, code: 3, des: "Nublado" },
        { day: "Mié", temp: 21, code: 51, des: "Llovizna" },
        { day: "Jue", temp: 23, code: 2, des: "Despejado" }
      ]
    },
    'Bogotá': {
      temp: 15,
      apparentTemp: 14,
      humidity: 75,
      windSpeed: 12,
      isDay: true,
      code: 3,
      des: "Llovizna suave 🌧️",
      forecast: [
        { day: "Hoy", temp: 15, code: 3, des: "Llovizna" },
        { day: "Mañ", temp: 16, code: 51, des: "Lluvia" },
        { day: "Mar", temp: 14, code: 3, des: "Nublado" },
        { day: "Mié", temp: 15, code: 2, des: "Nublado" },
        { day: "Jue", temp: 16, code: 1, des: "Despejado" }
      ]
    },
    'Ibagué': {
      temp: 26,
      apparentTemp: 27,
      humidity: 62,
      windSpeed: 8,
      isDay: true,
      code: 1,
      des: "Parcialmente Nublado ⛅",
      forecast: [
        { day: "Hoy", temp: 26, code: 1, des: "Chubascos" },
        { day: "Mañ", temp: 27, code: 0, des: "Soleado" },
        { day: "Mar", temp: 28, code: 1, des: "Soleado" },
        { day: "Mié", temp: 25, code: 3, des: "Nublado" },
        { day: "Jue", temp: 27, code: 2, des: "Medio nublado" }
      ]
    },
    'Melgar': {
      temp: 31,
      apparentTemp: 34,
      humidity: 55,
      windSpeed: 6,
      isDay: true,
      code: 0,
      des: "Cielo Despejado ☀️",
      forecast: [
        { day: "Hoy", temp: 31, code: 0, des: "Soleado" },
        { day: "Mañ", temp: 32, code: 0, des: "Soleado" },
        { day: "Mar", temp: 33, code: 1, des: "Soleado" },
        { day: "Mié", temp: 30, code: 51, des: "Lluvioso" },
        { day: "Jue", temp: 32, code: 0, des: "Soleado" }
      ]
    }
  };

  const [activeWeatherCity, setActiveWeatherCity] = useState<string>('Fusagasugá');
  const [citiesWeatherData, setCitiesWeatherData] = useState<{
    [cityName: string]: {
      temp: number;
      apparentTemp: number;
      humidity: number;
      windSpeed: number;
      isDay: boolean;
      code: number;
      des: string;
      forecast: { day: string; temp: number; code: number; des: string }[];
    }
  }>(INITIAL_CITIES_WEATHER_DATA);

  const [weatherData, setWeatherData] = useState<{
    temp: number;
    apparentTemp: number;
    humidity: number;
    windSpeed: number;
    isDay: boolean;
    code: number;
    des: string;
    forecast: { day: string; temp: number; code: number; des: string }[];
  } | null>(INITIAL_CITIES_WEATHER_DATA['Fusagasugá']);
  const [refreshingWeather, setRefreshingWeather] = useState(false);

  const getWeatherIcon = (code: number, size = 24, className = "") => {
    if (code === 0) return <Sun size={size} className={`${className} text-amber-400`} />;
    if (code >= 1 && code <= 3) return <CloudSun size={size} className={`${className} text-amber-300`} />;
    if (code >= 51 && code <= 65) return <CloudRain size={size} className={`${className} text-sky-400`} />;
    if (code >= 80 && code <= 82) return <CloudDrizzle size={size} className={`${className} text-blue-300`} />;
    if (code >= 95 && code <= 99) return <CloudLightning size={size} className={`${className} text-purple-400 animate-pulse`} />;
    return <CloudSun size={size} className={`${className} text-slate-300`} />;
  };

  const fetchWeather = async (isManual = false) => {
    if (isManual) setRefreshingWeather(true);
    try {
      const response = await fetch('/api/weather');
      const results = await response.json();

      setCitiesWeatherData(results);
      if (results[activeWeatherCity]) {
        setWeatherData(results[activeWeatherCity]);
      } else {
        setWeatherData(results['Fusagasugá']);
      }
    } catch (error) {
      console.log("General weather fetch is currently using local weather model.");
    } finally {
      if (isManual) {
        setTimeout(() => setRefreshingWeather(false), 800);
      }
    }
  };

  useEffect(() => {
    if (citiesWeatherData[activeWeatherCity]) {
      setWeatherData(citiesWeatherData[activeWeatherCity]);
    }
  }, [activeWeatherCity, citiesWeatherData]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => {
      fetchWeather();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const NEARBY_ZONES: { [city: string]: { name: string; lat: number; lng: number; label: string }[] } = {
    'Fusagasugá': [
      { name: 'Chinauta', lat: 4.2760, lng: -74.4550, label: 'Bajo Fusagasugá (Cálido/Piscinas)' },
      { name: 'Pasca', lat: 4.3106, lng: -74.2967, label: 'Alto Fusagasugá (Frío/Paramuno)' },
    ],
    'Bogotá': [
      { name: 'Monserrate', lat: 4.6053, lng: -74.0553, label: 'Cerro Oriental (Fresco/Mirador)' },
      { name: 'La Calera', lat: 4.7186, lng: -73.9668, label: 'Vía perimetral (Frío/Montaña)' },
    ],
    'Ibagué': [
      { name: 'Cañón del Combeima', lat: 4.4900, lng: -75.3300, label: 'Zona Ecológica (Templado/Nevado)' },
      { name: 'Totare (Bajo)', lat: 4.5700, lng: -74.9800, label: 'Valle de Ibagué (Cálido/Planicie)' },
    ],
    'Melgar': [
      { name: 'Piscilago', lat: 4.2400, lng: -74.6300, label: 'Parque temático (Muy Cálido)' },
      { name: 'Carmen de Apicalá', lat: 4.1450, lng: -74.7160, label: 'Municipio Vecino (Clima Cálido)' },
    ],
  };

  const [nearbyZonesWeather, setNearbyZonesWeather] = useState<{
    [zoneName: string]: { temp: number; code: number } | null;
  }>({});

  useEffect(() => {
    const zones = NEARBY_ZONES[activeWeatherCity];
    if (!zones) return;
    let cancelled = false;

    zones.forEach(async (zone) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${zone.lat}&longitude=${zone.lng}&current=temperature_2m,weather_code&timezone=America/Bogota`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.current) {
          setNearbyZonesWeather(prev => ({
            ...prev,
            [zone.name]: {
              temp: Math.round(data.current.temperature_2m),
              code: data.current.weather_code,
            },
          }));
        }
      } catch (err) {
        console.log(`No se pudo obtener clima real de ${zone.name}, se omite del comparativo.`);
      }
    });

    return () => { cancelled = true; };
  }, [activeWeatherCity]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let parsedLine = line;
      
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isListItem) {
        parsedLine = parsedLine.replace(/^[\s*-]+/, '').trim();
      }
      
      const parts: React.ReactNode[] = [];
      let currentText = parsedLine;
      let boldMatch;
      let keyCounter = 0;
      
      while ((boldMatch = currentText.match(/\*\*(.*?)\*\*/))) {
        const index = boldMatch.index!;
        const matchText = boldMatch[1];
        
        if (index > 0) {
          parts.push(currentText.substring(0, index));
        }
        parts.push(<strong key={`b-${keyCounter++}`} className="font-extrabold text-inherit">{matchText}</strong>);
        currentText = currentText.substring(index + boldMatch[0].length);
      }
      if (currentText) {
        parts.push(currentText);
      }
      
      if (isListItem) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 py-0.5 text-xs text-inherit leading-relaxed">
            <span>{parts}</span>
          </li>
        );
      } else {
        return (
          <p key={i} className="text-xs py-1 leading-relaxed text-inherit m-0">
            {parts}
          </p>
        );
      }
    });
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    
    try {
      const prunedLugares = (lugares || []).map((l: any) => ({
        id: l.id,
        nombre: l.nombre,
        descripcion: l.descripcion,
        direccion: l.direccion,
        categoriaId: l.categoriaId,
        puntuacion: l.puntuacion
      }));

      const prunedCategorias = (categorias || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatMessages,
          lugares: prunedLugares,
          categorias: prunedCategorias
        })
      });
      
      const data = await response.json();
      if (data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Surgió un pequeño percance al intentar conectarme con la señal de Fusa Guía. Por favor reintenta.' }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Vaya, parece que en este momento no tengo cobertura móvil. Por favor verifica tu conexión hoy.' }]);
    } finally {
      setChatLoading(false);
    }
  };
  

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log("Location error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const calculateDistance = (lat2: number, lon2: number) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = (lat2 - userLocation.lat) * Math.PI / 180;
    const dLon = (lon2 - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1) + " km";
  };


  const [favoritosIds, setFavoritosIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fusa_favoritos');
    return saved ? JSON.parse(saved) : [];
  });
  const [guardadosIds, setGuardadosIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fusa_guardados');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fusa_favoritos', JSON.stringify(favoritosIds));
  }, [favoritosIds]);

  useEffect(() => {
    localStorage.setItem('fusa_guardados', JSON.stringify(guardadosIds));
  }, [guardadosIds]);

  const toggleFavorite = (id: string) => {
    setFavoritosIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSave = (id: string) => {
    setGuardadosIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

useEffect(() => {
  let unsubscribeLugares: (() => void) | undefined;
  let cancelled = false;

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback: T
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => {
        setTimeout(() => {
          console.warn(
            `Fusa Explor: Firebase tardó más de ${timeoutMs} ms. Usando fallback.`
          );
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  };

  const fetchData = async () => {
    try {
      /*
       * ==========================================================
       * 1. CARGAR CATEGORÍAS
       * ==========================================================
       */

      const localCategories: Categoria[] = [
        {
          id: "cat1",
          nombre: "Sitios de Interés",
          color: "#1d4ed8",
        },
        {
          id: "cat2",
          nombre: "Dónde comer",
          color: "#ef4444",
        },
        {
          id: "cat3",
          nombre: "Centros Comerciales",
          color: "#8b5cf6",
        },
        {
          id: "cat4",
          nombre: "Hospedaje",
          color: "#10b981",
        },
        {
          id: "cat6",
          nombre: "Tiendas",
          color: "#f59e0b",
        },
        {
          id: "cat7",
          nombre: "Droguerías",
          color: "#ec4899",
        },
        {
          id: "cat8",
          nombre: "Para salir",
          color: "#6366f1",
        },
        {
          id: "cat9",
          nombre: "Iglesias",
          color: "#78350f",
        },
        {
          id: "cat10",
          nombre: "Parqueaderos",
          color: "#475569",
        },
        {
          id: "cat12",
          nombre: "Belleza",
          color: "#d946ef",
        },
        {
          id: "cat13",
          nombre: "Talleres Mecánicos",
          color: "#0ea5e9",
        },
        {
          id: "cat14",
          nombre: "Cementerios",
          color: "#475569",
        },
      ];

      /*
       * Intentamos Firebase durante máximo 8 segundos.
       *
       * Si Firebase no responde, NO bloqueamos toda la aplicación.
       */
      let categoriesData = await withTimeout(
        getCategorias(),
        8000,
        []
      );

      /*
       * Si Firebase devuelve categorías, utilizamos Firebase.
       *
       * Si devuelve vacío o tarda demasiado, utilizamos las
       * categorías locales para que la aplicación pueda arrancar.
       */
      if (!categoriesData || categoriesData.length === 0) {
        console.warn(
          "Fusa Explor: no se pudieron cargar categorías desde Firebase. Usando categorías locales."
        );

        categoriesData = localCategories;
      }

      /*
       * ==========================================================
       * 2. DEDUPLICAR CATEGORÍAS
       * ==========================================================
       */

      const uniqueCategories = categoriesData.reduce<Categoria[]>(
        (acc, current) => {
          if (!current || !current.nombre) {
            return acc;
          }

          const normName = current.nombre
            .trim()
            .toLowerCase();

          /*
           * No mostrar categorías antiguas/eventos.
           */
          if (
            current.id === "cat5" ||
            normName.includes("evento")
          ) {
            return acc;
          }

          const exists = acc.some(
            (item) =>
              item.id === current.id ||
              item.nombre.trim().toLowerCase() === normName
          );

          if (!exists) {
            acc.push(current);
          }

          return acc;
        },
        []
      );

      /*
       * Si por alguna razón el filtrado dejó cero categorías,
       * usamos las categorías locales.
       */
      if (uniqueCategories.length === 0) {
        setCategorias(localCategories);
      } else {
        setCategorias(uniqueCategories);
      }

      /*
       * ==========================================================
       * 3. CARGAR LUGARES
       * ==========================================================
       */

      let lugaresReceived = false;

      unsubscribeLugares = subscribeToLugares(
        (lugaresData) => {
          if (cancelled) return;

          lugaresReceived = true;

          const sanitized = (lugaresData || []).map((l) => {
            let lng = l.lng;

            if (typeof lng === "number" && lng > 0) {
              lng = -lng;
            } else if (typeof lng === "string") {
              const numLng = parseFloat(lng);

              if (!isNaN(numLng)) {
                lng = numLng > 0 ? -numLng : numLng;
              } else {
                lng = -74.3638;
              }
            } else if (
              lng === undefined ||
              lng === null
            ) {
              lng = -74.3638;
            }

            let lat = l.lat;

            if (typeof lat === "string") {
              const numLat = parseFloat(lat);

              if (!isNaN(numLat)) {
                lat = numLat;
              } else {
                lat = 4.3361;
              }
            } else if (
              lat === undefined ||
              lat === null
            ) {
              lat = 4.3361;
            }

            return {
              ...l,
              lat: Number(lat),
              lng: Number(lng),
            };
          });

          setLugares(sanitized);

          /*
           * Firebase respondió correctamente.
           * Podemos quitar el skeleton.
           */
          setLoading(false);
        }
      );

      /*
       * ==========================================================
       * 4. SEGURIDAD CONTRA FIREBASE BLOQUEADO
       * ==========================================================
       *
       * Si subscribeToLugares nunca responde, no dejamos
       * al usuario atrapado indefinidamente en el skeleton.
       */

      setTimeout(() => {
        if (cancelled) return;

        if (!lugaresReceived) {
          console.warn(
            "Fusa Explor: Firebase lugares no respondió. Continuando con datos vacíos."
          );

          setLugares([]);
          setLoading(false);
        }
      }, 8000);

      /*
       * ==========================================================
       * 5. FALLBACK ABSOLUTO
       * ==========================================================
       *
       * Incluso si algo inesperado ocurre, la aplicación
       * debe poder salir del estado de carga.
       */

      setTimeout(() => {
        if (cancelled) return;

        setLoading(false);
      }, 10000);

    } catch (error) {
      console.error(
        "Fusa Explor: error cargando datos:",
        error
      );

      /*
       * Si Firebase falla completamente, mostramos las
       * categorías locales y dejamos entrar al Dashboard.
       */

      setCategorias([
        {
          id: "cat1",
          nombre: "Sitios de Interés",
          color: "#1d4ed8",
        },
        {
          id: "cat2",
          nombre: "Dónde comer",
          color: "#ef4444",
        },
        {
          id: "cat3",
          nombre: "Centros Comerciales",
          color: "#8b5cf6",
        },
        {
          id: "cat4",
          nombre: "Hospedaje",
          color: "#10b981",
        },
        {
          id: "cat6",
          nombre: "Tiendas",
          color: "#f59e0b",
        },
        {
          id: "cat7",
          nombre: "Droguerías",
          color: "#ec4899",
        },
        {
          id: "cat8",
          nombre: "Para salir",
          color: "#6366f1",
        },
        {
          id: "cat9",
          nombre: "Iglesias",
          color: "#78350f",
        },
        {
          id: "cat10",
          nombre: "Parqueaderos",
          color: "#475569",
        },
        {
          id: "cat12",
          nombre: "Belleza",
          color: "#d946ef",
        },
        {
          id: "cat13",
          nombre: "Talleres Mecánicos",
          color: "#0ea5e9",
        },
        {
          id: "cat14",
          nombre: "Cementerios",
          color: "#475569",
        },
      ]);

      setLugares([]);
      setLoading(false);
    }
  };

  fetchData();

  return () => {
    cancelled = true;

    if (unsubscribeLugares) {
      unsubscribeLugares();
    }
  };
}, [user]);

  useEffect(() => {
    if (!loading && typeof (window as any).showAgent === 'function') {
      (window as any).showAgent();
    }
  }, [loading]);

  const openInGoogleMaps = (lugar: Lugar) => {
    setNavigatingLugar(lugar);
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={`flex flex-col h-[100dvh] max-w-lg mx-auto relative overflow-hidden pb-20 transition-all duration-300 border-x-[3px] border-black shadow-2xl ${darkMode ? 'bg-[#181524] text-white halftone-bg-dark' : 'bg-white text-slate-800 halftone-bg'}`}>
    
      <header className={`sticky top-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 border-b-[4px] border-black ${darkMode ? 'bg-[#581c87]' : 'bg-[#8a2be2]'}`}>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-comic italic tracking-wider text-white" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>FUSA EXPLOR</span>
        </div>
        <div className="flex items-center gap-2">
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-full border-[3px] border-black bg-purple-300 flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
            title={darkMode ? "Estilo Claro" : "Estilo Oscuro"}
            id="fusa-theme-toggle"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-black"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
          </button>
          
          <button 
            onClick={() => setCurrentView('perfil')} 
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-[3px] border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all ml-1 relative"
            title="Mi Perfil / Reseñas"
          >
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-black rotate-45 transform skew-x-12 z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
            {user.avatar ? (
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover z-10 relative" />
            ) : (
              <User size={20} className="text-black z-10 relative" />
            )}
          </button>
        </div>
      </header>

      <main ref={mainContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {currentView === 'inicio' && (
          <div className="p-4">
      
            <AnimatePresence>
              {showAdPopup && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAdPopup(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="relative bg-white border-[4px] border-black p-4 rounded-3xl max-w-xs w-full shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col gap-3 overflow-hidden select-none halftone-bg"
                    onClick={(e) => e.stopPropagation()}
                  >
                  
                    <div className="absolute top-2 left-4 z-20 transform -rotate-3">
                      <span className="bg-[#a855f7] border-[2px] border-black text-white px-3 py-1 font-comic text-xs tracking-wider shadow-[2px_2px_0_#000] block">
                        ANUNCIO
                      </span>
                    </div>
 
              
                    <button 
                      onClick={() => setShowAdPopup(false)}
                      className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                      title="Cerrar"
                    >
                      <X size={16} strokeWidth={3} className="text-black" />
                    </button>
 
                  
                    <div 
                      onClick={handleAdClick}
                      className="border-[3px] border-black rounded-2xl overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,0.15)] bg-slate-100 aspect-[3/4] relative cursor-pointer group"
                    >
                      <img 
                        src={activeAdLugar ? activeAdLugar.anuncioImagen : saharaAdImg} 
                        alt={adTargetLugar ? adTargetLugar.nombre : "Anuncio"} 
                        className="w-full h-full object-cover filter contrast-[1.15] saturate-[1.25] group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 halftone-bg opacity-10 mix-blend-multiply pointer-events-none"></div>
                      <div className="absolute bottom-2 right-2 bg-yellow-400 text-black border-2 border-black text-[10px] px-2.5 py-1 rounded-lg uppercase shadow-[2px_2px_0_#000] tracking-wider font-comic">
                        Tocar para ver ➔
                      </div>
                    </div>
 
                  
                    <div className="text-center mt-1">
                      <button 
                        onClick={handleAdClick}
                        className="w-full bg-[#c084fc] hover:bg-[#d8b4fe] border-[3px] border-black py-2.5 rounded-xl text-black text-sm uppercase shadow-[3px_3px_0_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer font-comic tracking-widest flex items-center justify-center gap-2 comic-pow-effect"
                        >
                        <span>¡IR AL LUGAR!</span>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

       
            <div className="flex flex-col gap-4">
              
        
              <div className="flex items-center gap-3">
                <span className="bg-[#a855f7] text-white border-[3px] border-black px-4 py-1 font-comic text-xl tracking-wider shadow-[3px_3px_0_#000] rotate-[-1deg]">
                  DESTACADOS
                </span>
                <div className="flex-1 h-[4px] bg-black"></div>
              </div>
              
       
              <div 
                className="relative border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] bg-white h-48 cursor-pointer group select-none overflow-hidden rounded-2xl"
                onClick={() => {
                  const listToSlide = destacados.length > 0 ? destacados : lugares;
                  const currentDestacado = listToSlide.length > 0 ? listToSlide[currentSlide % listToSlide.length] : null;
                  if (currentDestacado) setSelectedLugar(currentDestacado);
                }}
                onTouchStart={(e) => {
                  setTouchStartX(e.touches[0].clientX);
                }}
                onTouchEnd={(e) => {
                  if (touchStartX === null) return;
                  const diffX = touchStartX - e.changedTouches[0].clientX;
                  const listToSlide = destacados.length > 0 ? destacados : lugares;
                  if (listToSlide.length > 1 && Math.abs(diffX) > 40) {
                    if (diffX > 0) {
                   
                      setCurrentSlide(prev => (prev + 1) % listToSlide.length);
                    } else {
              
                      setCurrentSlide(prev => (prev - 1 + listToSlide.length) % listToSlide.length);
                    }
                  }
                  setTouchStartX(null);
                }}
              >
                {(() => {
                  const listToSlide = destacados.length > 0 ? destacados : lugares;
                  const place = listToSlide.length > 0 ? listToSlide[currentSlide % listToSlide.length] : null;
                  if (!place) return null;
                  return (
                    <>
                      <img 
                        src={place.imagen} 
                        alt={place.nombre} 
                        className="w-full h-full object-cover filter contrast-125 saturate-150 grayscale-[10%]" 
                        referrerPolicy="no-referrer"
                      />
                      {/* Comic halftone on image */}
                      <div className="absolute inset-0 halftone-bg opacity-20 mix-blend-multiply pointer-events-none"></div>

                      {/* Prominent Star Rating Badge - Top Left (unobscured by arrows) */}
                      <div className="absolute top-3 left-3 z-30 bg-[#facc15] border-[2px] border-black px-2.5 py-1 text-xs font-black text-black flex items-center gap-1.5 shadow-[2px_2px_0_#000] rounded-lg">
                        <Star size={13} fill="#000" color="#000" />
                        <span>{Number(place.puntuacion || 0).toFixed(1)}</span>
                      </div>

                      {/* Bottom Title Container */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3.5 z-10 pointer-events-none">
                        <h4 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-[2px_2px_0_#000] font-sans px-8 text-center truncate">
                          {place.nombre}
                        </h4>
                        {place.direccion && (
                          <p className="text-[11px] font-bold text-yellow-300 drop-shadow-[1px_1px_0_#000] text-center truncate mt-0.5 px-8">
                            📍 {place.direccion}
                          </p>
                        )}
                      </div>
                      
                      {/* Navigation Arrows */}
                      {listToSlide.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlide(prev => (prev - 1 + listToSlide.length) % listToSlide.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white hover:bg-purple-100 border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] active:translate-y-[calc(-50%+2px)] active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                            aria-label="Anterior"
                          >
                            <ChevronLeft size={22} className="text-black stroke-[3]" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlide(prev => (prev + 1) % listToSlide.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white hover:bg-purple-100 border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] active:translate-y-[calc(-50%+2px)] active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                            aria-label="Siguiente"
                          >
                            <ChevronRight size={22} className="text-black stroke-[3]" />
                          </button>
                        </>
                      )}

                      {/* Comic Explosion floating */}
                      <div className="absolute top-2 right-2 w-10 h-10 pointer-events-none z-20">
                         <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_0_rgba(0,0,0,1)] animate-bounce" style={{animationDuration: '2s'}}>
                            <path d="M50 0 L60 30 L95 20 L70 50 L95 80 L60 70 L50 100 L40 70 L5 80 L30 50 L5 20 L40 30 Z" fill="#facc15" stroke="#000" strokeWidth="4"/>
                          </svg>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Hero Image from Screenshot */}
            <div 
              onClick={() => {
                const plaza = lugares.find(l => l.id === 'l1');
                if (plaza) setSelectedLugar(plaza);
              }}
              className="relative h-96 border-[4px] border-black overflow-hidden mt-6 mb-6 shadow-[6px_6px_0_rgba(0,0,0,1)] cursor-pointer bg-white group"
            >
              <img 
                src={fusaWelcomeImg} 
                alt="Fusa" 
                className="w-full h-full object-cover grayscale-[10%] contrast-[1.2] group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = lugares.find(l => l.id === 'l1')?.imagen || "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=800";
                }}
              />
              
              {/* Comic dot halftone overlay */}
              <div className="absolute inset-0 halftone-bg opacity-30 mix-blend-multiply pointer-events-none"></div>

              {/* Action Burst "Descubre Fusa" */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-64 h-40 flex items-center justify-center z-10 pointer-events-none">
                <svg viewBox="0 0 200 200" className="absolute w-full h-full drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                   <path fill="#facc15" stroke="#000" strokeWidth="4" d="M100 10 L120 60 L180 50 L140 90 L190 130 L130 140 L150 190 L100 150 L50 190 L70 140 L10 130 L60 90 L20 50 L80 60 Z" />
                </svg>
                <div className="relative z-10 flex flex-col items-center justify-center mt-2 -rotate-3 text-center leading-none">
                  <span className="font-comic text-3xl text-white tracking-widest drop-shadow-[2px_2px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_4px_0_#000]">DESCUBRE</span>
                  <span className="font-comic text-4xl text-orange-500 tracking-widest drop-shadow-[2px_2px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_4px_0_#000]">FUSA!</span>
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 mt-32 text-center pointer-events-none">
                <div className="bg-white text-black px-4 py-1.5 border-[4px] border-black transform -rotate-2 drop-shadow-[4px_4px_0_#000] mb-2">
                   <h2 className="text-xl font-comic tracking-widest leading-none">LA CIUDAD JARDÍN</h2>
                </div>
                
                <div className="relative mt-auto mb-4 pointer-events-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentView('pahacer');
                    }}
                    className="bg-[#8a2be2] border-[4px] border-black text-white px-12 py-3 font-comic text-4xl tracking-widest shadow-[4px_4px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center relative overflow-visible"
                  >
                    <span className="drop-shadow-[2px_2px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]">¡VAMOS!</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'estados' && (() => {
          const myUserStories = (historias || []).filter(h => h.usuarioId === user.id);
          const otherUsersGrouped = storiesGroupedByUser.filter(g => g.userId !== user.id);
          const latestMyStory = myUserStories.length > 0 ? myUserStories[myUserStories.length - 1] : null;

          return (
            <div className="p-4 flex flex-col h-full relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-4xl font-comic text-black dark:text-white drop-shadow-[2px_2px_0_#fff]">ESTADOS</h2>
                <button
                  onClick={() => setShowCreateStoryModal(true)}
                 className="border-[3px] border-black bg-emerald-400 hover:bg-emerald-500 text-black px-3 py-1.5 rounded-full font-comic text-xs shadow-[2px_2px_0_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                 >
                  <Plus size={16} strokeWidth={3} />
                  <span>Añadir</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
                 {/* My status card */}
                 {myUserStories.length === 0 ? (
                   <div 
                     onClick={() => setShowCreateStoryModal(true)}
                     className="border-[3.5px] border-black bg-slate-100 dark:bg-[#221c32] relative overflow-hidden cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,1)] aspect-[3/4] rounded-2xl active:translate-y-1 active:translate-x-1 active:shadow-none transition-all group flex flex-col justify-between p-4 select-none"
                   >
                     <div className="flex-1 flex items-center justify-center relative">
                        <div className="relative">
                          {user.avatar ? (
                            <img src={user.avatar} alt="Mi perfil" className="w-16 h-16 rounded-full border-[3px] border-black object-cover shadow-[2px_2px_0_#000]" />
                          ) : (
                            <div className="w-16 h-16 rounded-full border-[3px] border-black bg-amber-300 flex items-center justify-center text-black font-comic text-3xl shadow-[2px_2px_0_#000]">
                              {(user.nombre || 'E').charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* WhatsApp Green Plus Badge */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-white shadow-[1px_1px_0_#000] group-hover:scale-110 transition-transform">
                            <Plus size={14} strokeWidth={3} />
                          </div>
                        </div>
                     </div>
                     <div className="relative z-10 text-left">
                      <span className="font-comic text-xs text-black dark:text-white drop-shadow-sm block">Añadir estado</span>
                      </div>
                     <div className="absolute inset-0 halftone-bg opacity-15 mix-blend-multiply pointer-events-none"></div>
                   </div>
                 ) : (
                   <div 
                     onClick={() => {
                       const myGroupIndex = storiesGroupedByUser.findIndex(g => g.userId === user.id);
                       if (myGroupIndex !== -1) {
                         setActiveUserIndex(myGroupIndex);
                         setActiveStoryIndex(0);
                         setStoryViewerOpen(true);
                       }
                     }}
                     className="border-[3.5px] border-black bg-white relative overflow-hidden cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,1)] aspect-[3/4] rounded-2xl active:translate-y-1 active:translate-x-1 active:shadow-none transition-all group select-none"
                   >
                     {latestMyStory?.imagen ? (
                       <img 
                         src={latestMyStory.imagen} 
                         alt="Mi Estado" 
                         className="w-full h-full object-cover filter contrast-125 saturate-150 group-hover:scale-105 transition-transform" 
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <div className={`w-full h-full bg-gradient-to-tr ${latestMyStory?.background || 'from-purple-500 to-pink-500'} flex items-center justify-center p-3`}>
                         <span className="text-xs font-bold text-white text-center leading-tight drop-shadow-md">
                           {latestMyStory?.texto}
                         </span>
                       </div>
                     )}
                     <div className="absolute inset-0 halftone-bg opacity-20 mix-blend-multiply pointer-events-none"></div>

                     {/* Profile Avatar with Green Ring top-left */}
                     <div className="absolute top-2.5 left-2.5 z-10 border-[3px] border-emerald-400 bg-black rounded-full w-11 h-11 flex items-center justify-center shadow-[2px_2px_0_#000] overflow-hidden p-0.5">
                        {user.avatar ? (
                           <img src={user.avatar} alt={user.nombre} className="w-full h-full object-cover rounded-full" />
                        ) : (
                           <span className="text-white text-sm font-black">{(user.nombre || 'E').charAt(0).toUpperCase()}</span>
                        )}
                     </div>

                     {/* Top right actions: Add another + Delete my stories */}
                     <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowCreateStoryModal(true);
                         }}
                         className="border-[2px] border-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1.5 shadow-[2px_2px_0_#000] active:scale-90 transition-transform cursor-pointer"
                         title="Añadir otro estado"
                       >
                         <Plus size={14} strokeWidth={3} />
                       </button>

                       <button
                         onClick={async (e) => {
                           e.stopPropagation();
                           if (confirm("¿Seguro que deseas eliminar tus estados?")) {
                             try {
                               for (const s of myUserStories) {
                                 await deleteHistoria(s.id);
                               }
                               setHistorias(prev => prev.filter(h => h.usuarioId !== user.id));
                               alert("Tus estados han sido eliminados con éxito 🗑️");
                             } catch (err: any) {
                               console.error("Error al eliminar estados:", err);
                               alert("Error al eliminar estados: " + (err?.message || "Intenta de nuevo."));
                             }
                           }
                         }}
                         className="border-[2px] border-black bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-[2px_2px_0_#000] active:scale-90 transition-transform cursor-pointer"
                         title="Eliminar mis estados"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>

                     <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                        <span className="bg-black/80 text-white border-[2px] border-white px-2 py-0.5 font-comic text-xs shadow-[2px_2px_0_#000] truncate block max-w-full">
                           Mi Estado
                        </span>
                     </div>
                   </div>
                 )}

                 {/* Other users status cards */}
                 {otherUsersGrouped.map((group) => {
                   const latestStory = group.stories[group.stories.length - 1];
                   const groupIndexInAll = storiesGroupedByUser.findIndex(g => g.userId === group.userId);

                   return (
                     <div 
                       key={group.userId}
                       onClick={() => {
                         if (groupIndexInAll !== -1) {
                           setActiveUserIndex(groupIndexInAll);
                           setActiveStoryIndex(0);
                           setStoryViewerOpen(true);
                         }
                       }}
                       className="border-[3.5px] border-black bg-white relative overflow-hidden cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,1)] aspect-[3/4] rounded-2xl active:translate-y-1 active:translate-x-1 active:shadow-none transition-all group select-none"
                     >
                       {latestStory.imagen ? (
                         <img 
                           src={latestStory.imagen} 
                           alt="Story" 
                           className="w-full h-full object-cover filter contrast-125 saturate-150 group-hover:scale-105 transition-transform" 
                           referrerPolicy="no-referrer"
                         />
                       ) : (
                         <div className={`w-full h-full bg-gradient-to-tr ${latestStory.background || 'from-purple-500 to-pink-500'} flex items-center justify-center p-3`}>
                           <span className="text-xs font-bold text-white text-center leading-tight drop-shadow-md">
                             {latestStory.texto}
                           </span>
                         </div>
                       )}
                       <div className="absolute inset-0 halftone-bg opacity-20 mix-blend-multiply pointer-events-none"></div>

                       {/* Delete button: solo admin puede borrar estados de otros usuarios */}
                       {(user?.rol === 'admin' || user?.correo?.endsWith('@fusaexplor.com') || user?.correo?.endsWith('@fusaexplorer.com') || user?.correo === 'riascosmarlon66@gmail.com' || user?.correo === 'mike.otavo15@gmail.com') && (
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             if (confirm(`¿Seguro que deseas eliminar los estados de ${group.usuarioNombre}?`)) {
                               try {
                                 for (const s of group.stories) {
                                   await deleteHistoria(s.id);
                                 }
                                 setHistorias(prev => prev.filter(h => h.usuarioId !== group.userId));
                                 alert("Estados eliminados con éxito 🗑️");
                               } catch (err: any) {
                                 console.error("Error al eliminar estados:", err);
                                 alert("Error al eliminar estados: " + (err?.message || "Intenta de nuevo."));
                               }
                             }
                           }}
                           className="absolute top-2.5 right-2.5 z-20 border-[2px] border-black bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-[2px_2px_0_#000] active:scale-90 transition-transform cursor-pointer"
                           title="Eliminar Estados"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}

                       {/* WhatsApp style Profile Ring top-left */}
                       <div className="absolute top-2.5 left-2.5 z-10 border-[3px] border-emerald-400 bg-black rounded-full w-11 h-11 flex items-center justify-center shadow-[2px_2px_0_#000] overflow-hidden p-0.5">
                          {group.usuarioAvatar ? (
                             <img src={group.usuarioAvatar} alt={group.usuarioNombre} className="w-full h-full object-cover rounded-full" />
                          ) : (
                             <span className="text-white text-sm font-black">{(group.usuarioNombre || 'E').charAt(0).toUpperCase()}</span>
                          )}
                       </div>

                       <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                          <span className="bg-black/80 text-white border-[2px] border-white px-2 py-0.5 font-comic text-xs shadow-[2px_2px_0_#000] truncate block max-w-full">
                            {group.usuarioNombre}
                          </span>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          );
        })()}

        {currentView === 'pahacer' && (
          <div className="p-6 pb-28">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                ¿Qué hay pa' hacer?
              </h2>
              <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${darkMode ? 'text-pink-300/50' : 'text-slate-500'}`}>
                Selecciona una categoría para explorar Fusagasugá
              </p>
            </div>

            {/* Circular Pattern Button Grid matching image.png styling */}
            {categorias.length === 0 ? (
              <div className={`rounded-[32px] border-4 border-dashed p-8 text-center ${darkMode ? 'bg-[#1b1630] border-pink-500/20 text-pink-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                <p className="font-bold uppercase tracking-widest mb-2">Aún cargando categorías</p>
                <p className="text-xs leading-relaxed">Espera un momento o recarga la página para que las categorías aparezcan correctamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-8 justify-items-center">
                {categorias.map(cat => {
                  const Icon = getCategoryIcon(cat);
                  const isSelected = selectedCategory === cat.id;
                  
                  return (
                    <button 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="flex flex-col items-center group focus:outline-none transition-all active:scale-95"
                  >
                    {/* Glowing Circular Glass Container with custom category color */}
                    <div 
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center border-[3.5px] border-black shadow-[4px_4px_0_#000] group-hover:shadow-[6px_6px_0_#000] group-hover:-translate-y-1 group-hover:scale-105 active:translate-y-1 active:shadow-none transition-all duration-300 overflow-hidden ${
                        isSelected ? 'ring-4 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: cat.color || '#8b5cf6' }}
                    >
                      {/* Glossy Liquid Sheen Reflection overlay */}
                      <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-full" />
                      
                      {/* Inner Circular Shadow accent */}
                      <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />

                      <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                        <Icon size={32} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Bold dynamic category label */}
                    <span className={`text-[11px] font-black uppercase tracking-wide mt-3 text-center max-w-[85px] leading-tight transition-colors ${
                      darkMode ? 'text-pink-100 group-hover:text-pink-400' : 'text-slate-800 group-hover:text-primary'
                    }`}>
                      {cat.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

            {selectedCategory && (
              <div ref={resultsRef} className={`mt-10 pt-4 border-t transition-colors ${darkMode ? 'border-pink-500/10' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-comic-bold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {categorias.find(c => c.id === selectedCategory)?.nombre}
                  </h3>
                  <button onClick={() => {
                    setSelectedCategory(null);
                    setTimeout(() => {
                      mainContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 50);
                  }} className="text-xs font-bold text-primary uppercase">Cerrar</button>
                </div>
                <div className="space-y-4">
                  {lugares.filter(l => l.categoriaId === selectedCategory).map(place => (
                    <motion.div 
                      key={place.id}
                      onClick={() => setSelectedLugar(place)}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-3xl shadow-sm flex gap-4 cursor-pointer relative group border transition-all ${
                        darkMode ? 'bg-[#221c32] border-pink-500/10' : 'bg-white border-slate-50'
                      }`}
                    >
                      <div className={`relative flex-none p-1 rounded-[22px] shadow-sm border transition-all self-center ${
                        darkMode ? 'bg-[#181524] border-pink-500/10' : 'bg-white border-slate-100'
                      }`}>
                        <div className="w-20 h-20 aspect-square rounded-2xl overflow-hidden relative">
                          <img src={place.imagen} className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9.5px] font-black text-white flex items-center gap-1 border border-white/20 shadow-md z-10">
                          <Star size={10} fill="#ffb800" color="#ffb800" />
                          {Number(place.puntuacion || 0).toFixed(1)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold transition-colors ${darkMode ? 'text-purple-300' : 'text-slate-800'}`}>{place.nombre}</h4>
                        <p className={`text-xs mt-1 transition-colors ${darkMode ? 'text-purple-300/60' : 'text-slate-500'}`}>{place.direccion}</p>
                        <div className="flex gap-2 mt-2 items-center justify-between">
                           <div className="flex gap-2">
                             <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(place.id); }}
                              className={`${favoritosIds.includes(place.id) ? 'text-red-500' : (darkMode ? 'text-pink-300/30 hover:text-pink-300' : 'text-slate-300 hover:text-slate-400')} transition-colors`}
                             >
                                <Heart size={16} fill={favoritosIds.includes(place.id) ? "currentColor" : "none"} />
                             </button>
                             <button 
                              onClick={(e) => { e.stopPropagation(); toggleSave(place.id); }}
                              className={`${guardadosIds.includes(place.id) ? (darkMode ? 'text-pink-300' : 'text-primary') : (darkMode ? 'text-pink-300/30 hover:text-pink-300' : 'text-slate-300 hover:text-slate-400')} transition-colors`}
                             >
                                <Bookmark size={16} fill={guardadosIds.includes(place.id) ? "currentColor" : "none"} />
                             </button>
                           </div>
                           {(user?.rol === 'admin' || user?.correo?.endsWith('@fusaexplor.com') || user?.correo?.endsWith('@fusaexplorer.com') || user?.correo === 'riascosmarlon66@gmail.com' || user?.correo === 'mike.otavo15@gmail.com') && (
                             <button
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 if (confirm(`¿Seguro que deseas eliminar "${place.nombre}"?`)) {
                                   try {
                                     await deleteLugar(place.id);
                                     setLugares(prev => prev.filter(l => l.id !== place.id));
                                     if (selectedLugar?.id === place.id) setSelectedLugar(null);
                                     alert("Lugar eliminado con éxito 🗑️");
                                   } catch (err: any) {
                                     alert("Error al eliminar lugar: " + (err?.message || "Intenta de nuevo."));
                                   }
                                 }
                               }}
                               className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                               title="Eliminar lugar"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'guardados' && (
          <div className="p-6">
            <button onClick={() => setCurrentView('menu')} className={`mb-4 flex items-center gap-2 font-bold ${darkMode ? 'text-pink-300' : 'text-slate-500'}`}>
              <ArrowLeft size={20} />
              Volver al Menú
            </button>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-pink-200' : 'text-slate-800'}`}>Guardados</h2>
            {lugares.filter(l => guardadosIds.includes(l.id)).length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {lugares.filter(l => guardadosIds.includes(l.id)).map(place => (
                  <motion.div 
                    key={place.id}
                    onClick={() => setSelectedLugar(place)}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-[32px] shadow-sm flex gap-4 cursor-pointer border transition-all ${darkMode ? 'bg-[#221c32] border-pink-500/10' : 'bg-white border-slate-50'}`}
                  >
                    <div className={`relative flex-none p-1 rounded-[22px] shadow-sm border transition-all self-center ${
                      darkMode ? 'bg-[#181524] border-pink-500/10' : 'bg-white border-slate-100'
                    }`}>
                      <div className="w-20 h-20 aspect-square rounded-2xl overflow-hidden relative">
                        <img src={place.imagen} className="w-full h-full object-cover rounded-2xl" />
                      </div>
                      <div className="absolute -top-1 -right-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9.5px] font-black text-white flex items-center gap-1 border border-white/20 shadow-md z-10">
                        <Star size={10} fill="#ffb800" color="#ffb800" />
                        {Number(place.puntuacion || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className={`font-bold text-lg transition-colors ${darkMode ? 'text-purple-300' : 'text-slate-800'}`}>{place.nombre}</h4>
                      <p className={`text-xs mt-1 flex items-center gap-1 transition-colors ${darkMode ? 'text-purple-300/60' : 'text-slate-500'}`}>
                        <MapPin size={12} />
                        {place.direccion}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSave(place.id); }} 
                        className="text-primary hover:bg-primary/5 p-2 rounded-xl transition-colors"
                      >
                        <Bookmark size={24} fill="currentColor" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(place.id); }} 
                        className={`${favoritosIds.includes(place.id) ? 'text-red-500' : 'text-slate-200'} p-2 rounded-xl transition-colors`}
                      >
                        <Heart size={20} fill={favoritosIds.includes(place.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <Bookmark size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">No tienes lugares guardados</p>
              </div>
            )}
          </div>
        )}
        
        {currentView === 'favoritos' && (
          <div className="p-6">
            <button onClick={() => setCurrentView('menu')} className={`mb-4 flex items-center gap-2 font-bold ${darkMode ? 'text-pink-300' : 'text-slate-500'}`}>
              <ArrowLeft size={20} />
              Volver al Menú
            </button>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-pink-200' : 'text-slate-800'}`}>Mis Favoritos</h2>
            {lugares.filter(l => favoritosIds.includes(l.id)).length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {lugares.filter(l => favoritosIds.includes(l.id)).map(place => (
                  <motion.div 
                    key={place.id}
                    onClick={() => setSelectedLugar(place)}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-[32px] shadow-sm flex gap-4 cursor-pointer border transition-all ${darkMode ? 'bg-[#221c32] border-pink-500/10' : 'bg-white border-slate-50'}`}
                  >
                    <div className={`relative flex-none p-1 rounded-[22px] shadow-sm border transition-all self-center ${
                      darkMode ? 'bg-[#181524] border-pink-500/10' : 'bg-white border-slate-100'
                    }`}>
                      <div className="w-20 h-20 aspect-square rounded-2xl overflow-hidden relative">
                        <img src={place.imagen} className="w-full h-full object-cover rounded-2xl" />
                      </div>
                      <div className="absolute -top-1 -right-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9.5px] font-black text-white flex items-center gap-1 border border-white/20 shadow-md z-10">
                        <Star size={10} fill="#ffb800" color="#ffb800" />
                        {Number(place.puntuacion || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className={`font-bold text-lg transition-colors ${darkMode ? 'text-purple-300' : 'text-slate-800'}`}>{place.nombre}</h4>
                      <p className={`text-xs mt-1 flex items-center gap-1 transition-colors ${darkMode ? 'text-purple-300/60' : 'text-slate-500'}`}>
                        <MapPin size={12} />
                        {place.direccion}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(place.id); }} 
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      >
                        <Heart size={24} fill="currentColor" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSave(place.id); }} 
                        className={`${guardadosIds.includes(place.id) ? 'text-primary' : 'text-slate-200'} p-2 rounded-xl transition-colors`}
                      >
                        <Bookmark size={20} fill={guardadosIds.includes(place.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <Heart size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">Aún no tienes favoritos</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'clima' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentView('inicio')} 
                className={`p-2 rounded-2xl transition-all ${darkMode ? 'bg-pink-900/20 text-pink-300' : 'bg-slate-100 text-slate-600'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className={`font-extrabold text-2xl ${darkMode ? 'text-white' : 'text-slate-800'}`}>Clima en Vivo</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {['Fusagasugá', 'Bogotá', 'Ibagué', 'Melgar'].map((cityName) => {
                const isSelected = activeWeatherCity === cityName;
                const cityData = citiesWeatherData[cityName];
                return (
                  <button
                    key={cityName}
                    onClick={() => setActiveWeatherCity(cityName)}
                    className={`flex-none px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 border ${
                      isSelected
                        ? (darkMode 
                            ? 'bg-pink-500 text-white border-pink-400' 
                            : 'bg-teal-600 text-white border-teal-500 shadow-md')
                        : (darkMode 
                            ? 'bg-[#221c32] text-pink-200 border-pink-500/10 hover:bg-[#2c2440]' 
                            : 'bg-white text-slate-700 border-slate-100 shadow-xs hover:bg-slate-50')
                    }`}
                  >
                    <span>{cityName}</span>
                    {cityData && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isSelected 
                          ? (darkMode ? 'bg-pink-600 text-pink-100' : 'bg-teal-700 text-teal-100')
                          : (darkMode ? 'bg-pink-950/40 text-pink-300' : 'bg-slate-100 text-slate-500')
                      }`}>
                        {cityData.temp}°C
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={`p-6 rounded-[36px] shadow-xl relative overflow-hidden border transition-all duration-300 ${
              darkMode 
                ? 'bg-linear-to-b from-[#2d2545] to-[#1e1a2f] border-pink-500/10 text-white' 
                : 'bg-linear-to-b from-teal-500 to-sky-600 text-white border-transparent'
            }`}>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight opacity-90">{activeWeatherCity}</h3>
                    <p className="text-xs opacity-75">
                      {activeWeatherCity === 'Fusagasugá' || activeWeatherCity === 'Bogotá' ? 'Cundinamarca, CO' : 'Tolima, CO'}
                    </p>
                  </div>
                  <button 
                    onClick={() => fetchWeather(true)} 
                    disabled={refreshingWeather}
                    className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      darkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-white/25 text-white'
                    }`}
                    title="Actualizar clima ahora"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>En Vivo</span>
                    <RefreshCw size={11} className={`${refreshingWeather ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="my-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-7xl font-light font-sans tracking-tighter">
                      {weatherData ? `${weatherData.temp}°` : '22°'}
                    </h1>
                    <p className="text-sm font-bold mt-1 opacity-95">
                      {weatherData ? weatherData.des : 'Ligeramente nublado'}
                    </p>
                  </div>
                  <div className="relative">
                    {getWeatherIcon(weatherData?.code || 0, 84, "opacity-95")}
                  </div>
                </div>

                <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${darkMode ? 'border-pink-500/10' : 'border-white/20'}`}>
                  <div className="text-center">
                    <span className="text-[10px] opacity-75 uppercase font-bold block">Sensación</span>
                    <span className="font-bold text-lg">{weatherData ? `${weatherData.apparentTemp}°C` : '23°C'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] opacity-75 uppercase font-bold block">Humedad</span>
                    <span className="font-bold text-lg">{weatherData ? `${weatherData.humidity}%` : '68%'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] opacity-75 uppercase font-bold block">Viento</span>
                    <span className="font-bold text-lg">{weatherData ? `${weatherData.windSpeed} km/h` : '10 km/h'}</span>
                  </div>
                </div>
              </div>
            </div>

           {NEARBY_ZONES[activeWeatherCity] && (
              <div className="space-y-3">
                <h3 className={`text-base font-comic-bold px-1 ${darkMode ? 'text-pink-200' : 'text-slate-800'}`}>Comparativa de Zonas Comunes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {NEARBY_ZONES[activeWeatherCity].map((zone) => {
                    const zoneWeather = nearbyZonesWeather[zone.name];
                    const delta = zoneWeather && weatherData ? zoneWeather.temp - weatherData.temp : null;
                    return (
                      <div key={zone.name} className={`p-4 rounded-3xl border transition-all ${darkMode ? 'bg-[#211d33] border-pink-500/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{zone.name}</span>
                          {delta !== null && (
                            <span className={`text-xs font-bold ${delta > 0 ? 'text-amber-500' : delta < 0 ? 'text-sky-500' : 'text-amber-400'}`}>
                              {delta > 0 ? `+${delta}°C` : delta < 0 ? `${delta}°C` : 'Igual'}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] ${darkMode ? 'text-purple-200/60' : 'text-slate-400'} mb-2`}>{zone.label}</p>
                        <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {zoneWeather ? `${zoneWeather.temp}°C` : 'Cargando...'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`p-5 rounded-[30px] border transition-all ${
              darkMode 
                ? 'bg-purple-950/20 border-pink-500/10 text-pink-200' 
                : 'bg-amber-50 border-amber-100 text-amber-900'
            }`}>
              <h4 className="font-extrabold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9333ea]"></span>
                Recomendaciones
              </h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-[#ffd3e8]/80' : 'text-slate-700'}`}>
                {weatherData && weatherData.temp > 22 ? (
                  `☀️ ${activeWeatherCity} goza de un espectacular sol y clima cálido. Es el momento perfecto para realizar actividades al aire libre, pasear por los miradores o disfrutar de refrescos locales.`
                ) : (
                  `☔ ¡Clima fresco o lluvias suaves en ${activeWeatherCity}! Es el pretexto perfecto para visitar recintos cubiertos de interés cultural, degustar café de origen o probar la comida caliente tradicional.`
                )}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className={`text-base font-comic-bold px-1 ${darkMode ? 'text-pink-200' : 'text-slate-800'}`}>Pronóstico Semanal</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                {weatherData?.forecast.map((f, i) => (
                  <div 
                    key={i} 
                    className={`flex-none w-24 p-4 rounded-3xl border text-center transition-all ${
                      darkMode 
                        ? 'bg-[#211d33] border-pink-500/10' 
                        : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <span className={`text-xs font-bold block mb-2 ${darkMode ? 'text-[#ffd3e8]/75' : 'text-slate-400'}`}>{f.day}</span>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(f.code, 24)}
                    </div>
                    <span className={`text-base font-black block ${darkMode ? 'text-white' : 'text-slate-800'}`}>{f.temp}°C</span>
                    <span className={`text-[9px] font-medium block overflow-hidden text-ellipsis whitespace-nowrap mt-1 ${darkMode ? 'text-purple-200/50' : 'text-slate-400'}`}>
                      {f.des}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'perfil' && (
          <div className="p-4">
            <button onClick={() => setCurrentView('inicio')} className={`mb-4 flex items-center gap-2 font-bold ${darkMode ? 'text-pink-300' : 'text-slate-500'}`}>
              <ArrowLeft size={20} />
              Volver
            </button>
            <ProfileView user={user} lugares={lugares} darkMode={darkMode} />
          </div>
        )}

        {currentView === 'menu' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center mb-8 pt-4">
               {user.avatar ? (
                 <img src={user.avatar} alt={user.nombre} className={`w-24 h-24 rounded-full object-cover mb-3 shadow-md border-2 ${
                   darkMode ? 'border-pink-500/30' : 'border-white'
                 }`} />
               ) : (
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-4xl mb-3 ${
                   darkMode ? 'bg-pink-900/20 text-pink-300 border border-pink-500/20' : 'bg-primary/10 text-primary'
                 }`}>
                   {(user.nombre || 'E').charAt(0).toUpperCase()}
                 </div>
               )}
               <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{user.nombre}</h2>
               <p className={`${darkMode ? 'text-purple-200/60' : 'text-slate-500'} text-sm`}>{user.correo}</p>
            </div>
            
            <h2 className={`text-lg font-comic-bold mb-2 ${darkMode ? 'text-pink-200' : 'text-slate-800'}`}>Ajustes</h2>
            
            {/* Mi Perfil */}
            <button 
              onClick={() => setCurrentView('perfil')}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                darkMode ? 'bg-[#221c32] border-pink-500/10 text-pink-200' : 'bg-white border-slate-100 shadow-sm text-slate-800'
              }`}
            >
               <div className="flex items-center gap-3">
                 <User size={20} className={darkMode ? "text-pink-300" : "text-slate-400"} />
                 <span className="font-medium text-sm">Mi Perfil / Reseñas</span>
               </div>
               <ChevronRight size={20} className={darkMode ? "text-pink-300" : "text-slate-300"} />
            </button>

            {/* Lugares Guardados */}
            <button 
              onClick={() => setCurrentView('guardados')}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                darkMode ? 'bg-[#221c32] border-pink-500/10 text-pink-200' : 'bg-white border-slate-100 shadow-sm text-slate-800'
              }`}
            >
               <div className="flex items-center gap-3">
                 <Bookmark size={20} className={darkMode ? "text-pink-300" : "text-slate-400"} />
                 <span className="font-medium text-sm">Lugares Guardados</span>
               </div>
               <ChevronRight size={20} className={darkMode ? "text-pink-300" : "text-slate-300"} />
            </button>

            {/* Mis Favoritos */}
            <button 
              onClick={() => setCurrentView('favoritos')}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                darkMode ? 'bg-[#221c32] border-pink-500/10 text-pink-200' : 'bg-white border-slate-100 shadow-sm text-slate-800'
              }`}
            >
               <div className="flex items-center gap-3">
                 <Heart size={20} className={darkMode ? "text-pink-300" : "text-red-400"} />
                 <span className="font-medium text-sm">Mis Favoritos</span>
               </div>
               <ChevronRight size={20} className={darkMode ? "text-pink-300" : "text-slate-300"} />
            </button>

            {user.rol === 'admin' && (
               <button 
                onClick={() => { setLugarToEdit(null); setShowLugarModal(true); }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                  darkMode ? 'bg-[#221c32] border-pink-500/10 text-pink-200' : 'bg-white border-slate-100 shadow-sm text-slate-800'
                }`}
               >
                  <div className="flex items-center gap-3">
                    <Plus size={20} className={darkMode ? "text-pink-300" : "text-primary"} />
                    <span className="font-medium text-sm">Agregar nuevo lugar</span>
                  </div>
                  <ChevronRight size={20} className={darkMode ? "text-pink-300" : "text-slate-300"} />
               </button>
            )}
            
            <button 
              onClick={handleLogout} 
              className={`w-full p-4 rounded-[18px] flex items-center gap-3 font-bold border transition-all ${
                darkMode ? 'bg-red-950/20 text-red-400 border-red-500/10 hover:bg-red-900/30' : 'bg-red-50 text-red-500 border-transparent hover:bg-red-100/50'
              }`}
            >
               <LogOut size={20} />
               Cerrar Sesión
            </button>
          </div>
        )}
      </main>

      {/* Footer bar - completely transparent container with pointer-events-none to let clicks pass through */}
      {/* Footer bar - equal measure buttons */}
      <nav className={`absolute bottom-3 left-3 right-3 z-40 px-2 py-1.5 flex items-center justify-between gap-1 rounded-[28px] border backdrop-blur-xl shadow-2xl transition-all duration-300 pointer-events-none ${
        darkMode 
          ? 'bg-[#181524]/90 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]' 
          : 'bg-white/90 border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.15)]'
      }`}>
        <NavButton label="Inicio" icon={Home} active={currentView === 'inicio'} onClick={() => setCurrentView('inicio')} darkMode={darkMode} />
        <NavButton label="Clima" icon={CloudSun} active={currentView === 'clima'} onClick={() => setCurrentView('clima')} darkMode={darkMode} />
        <NavButton label="Estados" icon={CircleDashed} active={currentView === 'estados'} onClick={() => setCurrentView('estados')} darkMode={darkMode} />
        <NavButton label="Pa' Hacer" icon={Martini} active={currentView === 'pahacer'} onClick={() => setCurrentView('pahacer')} darkMode={darkMode} />
        <NavButton label="Menu" icon={MoreHorizontal} active={currentView === 'menu'} onClick={() => setCurrentView('menu')} darkMode={darkMode} />
      </nav>

      {/* Place Detail Overlay */}
      <AnimatePresence>
        {selectedLugar && (
          <PlaceDetail 
            lugar={selectedLugar} 
            user={user}
            onClose={() => setSelectedLugar(null)}
            onDelete={async (id) => {
              try {
                await deleteLugar(id);
                setLugares(prev => prev.filter(l => l.id !== id));
                setSelectedLugar(null);
                alert("Lugar eliminado con éxito 🗑️");
              } catch (error: any) {
                console.error("Error deleting place:", error);
                alert("Error al eliminar lugar: " + (error?.message || "Intenta de nuevo."));
              }
            }}
            onEdit={(lugar) => {
              setLugarToEdit(lugar);
              setShowLugarModal(true);
            }}
            onOpenMap={openInGoogleMaps}
            isFavorited={favoritosIds.includes(selectedLugar.id)}
            onToggleFavorite={() => toggleFavorite(selectedLugar.id)}
            isSaved={guardadosIds.includes(selectedLugar.id)}
            onToggleSave={() => toggleSave(selectedLugar.id)}
            userLocation={userLocation}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* In-App Navigation Browser */}
      <AnimatePresence>
        {navigatingLugar && (
          <InAppBrowser 
            lugar={navigatingLugar} 
            onClose={() => setNavigatingLugar(null)} 
            userLocation={userLocation}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>



      {/* Modal for admin adds */}
      <AnimatePresence>
        {showLugarModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowLugarModal(false)}
               className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className={`relative w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90dvh] border transition-colors duration-300 ${
                 darkMode ? 'bg-[#1e1a30] text-pink-100 border-pink-500/10' : 'bg-white text-slate-800 border-[#eaeaea]'
               }`}
            >
               <LugarForm categorias={categorias} onSuccess={() => setShowLugarModal(false)} lugar={lugarToEdit || undefined} user={user} darkMode={darkMode} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Botón Flotante de Fusa Guía */}
      <div className="absolute bottom-24 right-5 z-40 flex flex-col items-end gap-3">
        <button 
          onClick={() => setShowAssistant(!showAssistant)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all ${!showAssistant ? 'comic-pow-effect' : ''} ${
            showAssistant 
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : (darkMode 
                  ? 'bg-pink-600 text-white hover:bg-pink-500 border border-pink-400/20 shadow-pink-500/10' 
                  : 'bg-primary text-white hover:bg-purple-700 shadow-purple-500/10')
          }`}
          title="Fusa Guía Local"
        >
          {showAssistant ? (
            <X size={26} />
          ) : (
            <div className="relative">
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
              </span>
              <MessageSquare size={24} />
            </div>
          )}
        </button>
      </div>

      {/* Panel de Chat de Fusa Guía Local */}
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`absolute bottom-[92px] left-4 right-4 z-40 rounded-[32px] overflow-hidden flex flex-col h-[460px] max-h-[60dvh] shadow-[0_12px_40px_rgba(0,0,0,0.18)] border ${
              darkMode ? 'bg-[#1c182d] border-pink-500/15' : 'bg-white border-slate-150'
            }`}
          >
            {/* Header del Chat */}
            <div className={`p-4 flex items-center justify-between transition-colors ${
              darkMode ? 'bg-[#221c32] text-pink-200 border-b border-pink-500/10' : 'bg-primary text-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${
                  darkMode ? 'bg-pink-900/30 text-pink-300 border border-pink-500/20' : 'bg-white/10'
                }`}>
                  🌸
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight m-0">Fusa Guía</h3>
                  <p className="text-[10px] opacity-80 font-bold m-0 tracking-widest uppercase">Canal de Consulta de Fusa Explor</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAssistant(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-pink-900/30 text-pink-300' : 'hover:bg-white/10 text-white'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl relative ${
                    msg.role === 'user'
                      ? (darkMode 
                          ? 'bg-pink-500/20 text-pink-100 border border-pink-500/10 rounded-tr-none' 
                          : 'bg-primary/10 text-primary rounded-tr-none font-medium')
                      : (darkMode 
                          ? 'bg-[#221c32] text-purple-100 border border-pink-500/10 rounded-tl-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none')
                  }`}>
                    {parseMarkdown(msg.content)}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 ${
                    darkMode ? 'bg-[#221c32] text-pink-300 border border-pink-500/10' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Fusa Guía está escribiendo</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Preguntas Sugeridas */}
            {chatMessages.length === 1 && !chatLoading && (
              <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { text: '¿Qué comer?', cat: 'cat2' },
                  { text: 'Sitios interés', cat: 'cat1' },
                  { text: 'Vida nocturna', cat: 'cat8' },
                  { text: 'El clima fresquito', q: '¿Cómo es el clima en Fusagasugá?' }
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (tag.cat) {
                        setChatInput(`Recomiéndame algunos sitios excelentes cargados en la categoría de "${tag.text}" en Fusa Explor`);
                      } else if (tag.q) {
                        setChatInput(tag.q);
                      }
                    }}
                    className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full border transition-all ${
                      darkMode 
                        ? 'bg-[#221c32] border-pink-500/10 text-pink-300 hover:bg-pink-900/30' 
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tag.text}
                  </button>
                ))}
              </div>
            )}

            {/* Formulario de Entrada */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
              className={`p-3 border-t flex gap-2 items-center transition-colors ${
                darkMode ? 'bg-[#221c32] border-pink-500/10' : 'bg-white border-slate-150'
              }`}
            >
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                placeholder="Pregúntale a Fusa Guía..."
                className={`flex-1 text-xs px-4 py-2.5 rounded-full outline-none border transition-all ${
                  darkMode 
                    ? 'bg-[#1c182d] border-pink-500/10 text-[#ffd3e8] focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20' 
                    : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-primary/40 focus:ring-1 focus:ring-primary/20'
                }`}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
                  chatInput.trim() && !chatLoading
                    ? (darkMode ? 'bg-pink-600 text-white hover:bg-pink-500 shadow-md' : 'bg-primary text-white hover:bg-purple-700 shadow-md')
                    : 'text-slate-400 bg-slate-100/50 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateStoryModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateStoryModal(false)}
               className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className={`relative w-full max-w-md rounded-t-[40px] sm:rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-[85dvh] border transition-colors duration-300 ${
                 darkMode ? 'bg-[#1e1a30] text-pink-100 border-pink-500/10' : 'bg-white text-slate-800 border-[#eaeaea]'
               }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black tracking-tight">Crear Nuevo Estado</h3>
                <button 
                  onClick={() => setShowCreateStoryModal(false)}
                  className={`p-2 rounded-full transition-all ${
                    darkMode ? 'bg-pink-900/20 text-pink-300 hover:bg-pink-900/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className={`grid grid-cols-2 p-1.5 rounded-2xl mb-6 border ${
                darkMode ? 'bg-[#151125] border-pink-500/5' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setNewStoryType('image')}
                  className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    newStoryType === 'image' 
                      ? 'bg-pink-600 text-white shadow-md' 
                      : (darkMode ? 'text-pink-300/60 hover:text-pink-200' : 'text-slate-500 hover:text-slate-800')
                  }`}
                >
                  📸 Con Foto / Imagen
                </button>
                <button
                  onClick={() => setNewStoryType('text')}
                  className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    newStoryType === 'text' 
                      ? 'bg-pink-600 text-white shadow-md' 
                      : (darkMode ? 'text-pink-300/60 hover:text-pink-200' : 'text-slate-500 hover:text-slate-800')
                  }`}
                >
                  ✏️ Con Texto
                </button>
              </div>

              {/* Form Body */}
              {newStoryType === 'image' ? (
                <div className="space-y-4">
                  <div>
                    <span className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
                      darkMode ? 'text-pink-300/80' : 'text-slate-400'
                    }`}>Selecciona tu imagen</span>
                    
                    <div className={`relative h-56 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group hover:border-pink-500 transition-all ${
                      darkMode ? 'bg-[#29233b] border-pink-500/10' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {newStoryImage ? (
                        <>
                          <img src={newStoryImage} alt="Story Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => setNewStoryImage(null)}
                              className="p-2.5 bg-red-600 rounded-2xl text-white shadow-lg active:scale-90 transition-transform"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 p-4">
                          <div className={`p-3.5 rounded-2xl shadow-sm ${darkMode ? 'bg-[#221c32] text-pink-350' : 'bg-white text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-center">Toca para cargar una foto</p>
                          <input type="file" accept="image/*" onChange={handleStoryFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
                      darkMode ? 'text-pink-300/80' : 'text-slate-400'
                    }`}>Comentario (Opcional)</label>
                    <input 
                      type="text"
                      value={newStoryText}
                      onChange={e => setNewStoryText(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className={`w-full text-xs px-4 py-3 rounded-2xl outline-none border transition-all ${
                        darkMode 
                          ? 'bg-[#151125] border-pink-500/10 text-pink-100 focus:border-pink-500/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Text preview block */}
                  <div className={`h-48 rounded-3xl bg-gradient-to-tr ${newStoryBg} flex items-center justify-center p-6 text-center shadow-inner relative overflow-hidden`}>
                    <textarea
                      value={newStoryText}
                      onChange={e => setNewStoryText(e.target.value.slice(0, 150))}
                      placeholder="¿Qué estás pensando?"
                      rows={3}
                      className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-white/60 text-lg font-bold text-center focus:ring-0 leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-4 text-[10px] text-white/70 font-bold font-mono">
                      {newStoryText.length}/150
                    </div>
                  </div>

                  {/* Gradient picker */}
                  <div>
                    <span className={`block text-[10px] font-black uppercase tracking-widest mb-2.5 ml-2 ${
                      darkMode ? 'text-pink-300/80' : 'text-slate-400'
                    }`}>Color de Fondo</span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                      {gradients.map((g, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewStoryBg(g)}
                          className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr ${g} border-2 transition-all duration-200 ${
                            newStoryBg === g ? 'border-white scale-110 shadow-md ring-2 ring-pink-500/50' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Select (Required) */}
              <div className="mt-4">
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
                  darkMode ? 'text-pink-300/80' : 'text-slate-400'
                }`}>Lugar (Obligatorio) 📍</label>
                <select
                  value={newStoryLugar}
                  onChange={e => setNewStoryLugar(e.target.value)}
                  className={`w-full text-xs px-4 py-3 rounded-2xl outline-none border transition-all ${
                    darkMode 
                      ? 'bg-[#151125] border-pink-500/10 text-pink-100 focus:border-pink-500/30' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'
                  }`}
                >
                  <option value="" disabled>Selecciona el lugar donde estás...</option>
                  {lugares.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Post Button */}
              <div className="mt-8">
                <button
                  onClick={handlePostStory}
                  disabled={isSubmittingStory}
                  className="w-full py-4 rounded-3xl bg-pink-600 hover:bg-pink-700 active:scale-[0.98] transition-all text-white font-black text-sm uppercase tracking-widest shadow-lg disabled:opacity-50"
                >
                  {isSubmittingStory ? 'Publicando estado...' : 'Publicar en mis Estados'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive WhatsApp-style Story Viewer */}
      <AnimatePresence>
        {storyViewerOpen && (() => {
          const userGroup = storiesGroupedByUser[activeUserIndex];
          if (!userGroup) return null;
          const activeStory = userGroup.stories[activeStoryIndex];
          if (!activeStory) return null;

          const isOwnStory = activeStory.usuarioId === user.id || userGroup.userId === user.id;
          const isAdminUser = user.rol === 'admin' || user.correo?.endsWith('@fusaexplor.com') || user.correo?.endsWith('@fusaexplorer.com') || user.correo === 'riascosmarlon66@gmail.com' || user.correo === 'mike.otavo15@gmail.com' || user.correo === 'mike.otavo@fusaexplor.com';
          const canDeleteStory = isOwnStory || isAdminUser;

          return (
            <div className="fixed inset-0 z-[130] bg-[#090810] flex flex-col justify-between select-none">
              {/* Top Progress Bars and Info Header */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-[140] pointer-events-none">
                {/* Horizontal Progress Bars */}
                <div className="flex gap-1.5 mb-4 px-1">
                  {userGroup.stories.map((s, idx) => {
                    let fillPercent = 0;
                    if (idx < activeStoryIndex) fillPercent = 100;
                    else if (idx === activeStoryIndex) fillPercent = storyProgress;

                    return (
                      <div key={s.id} className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-75 ease-linear"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* User Header */}
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <img 
                      src={userGroup.usuarioAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} 
                      alt={userGroup.usuarioNombre} 
                      className="w-10 h-10 rounded-full border border-white/20 object-cover"
                    />
                    <div>
                      <h4 className="text-white font-extrabold text-sm">{userGroup.usuarioNombre}</h4>
                      <p className="text-[10px] text-white/60 font-medium">Hace unas horas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Delete button: Only story publisher or admin can delete */}
                    {canDeleteStory && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("¿Seguro que deseas eliminar este estado?")) {
                            try {
                              const storyToDeleteId = activeStory.id;
                              await deleteHistoria(storyToDeleteId);
                              setHistorias(prev => prev.filter(h => h.id !== storyToDeleteId));
                              alert("Estado eliminado con éxito 🗑️");
                              if (userGroup.stories.length > 1) {
                                handleNextStory();
                              } else {
                                setStoryViewerOpen(false);
                              }
                            } catch (error) {
                              console.error("Error al eliminar estado:", error);
                              alert("No se pudo eliminar el estado o no tienes permisos suficientes.");
                            }
                          }
                        }}
                        className="p-2 px-3 rounded-full bg-red-600/80 hover:bg-red-600 text-white active:scale-90 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-lg border border-red-500/40"
                        title="Eliminar Estado"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}

                    <button
                      onClick={() => setStoryViewerOpen(false)}
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-90 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Left / Right Absolute Tap Areas */}
              <div className="absolute inset-y-0 left-0 w-1/4 z-[135]" onClick={handlePrevStory} />
              <div className="absolute inset-y-0 right-0 w-1/4 z-[135]" onClick={handleNextStory} />

              {/* Main Content Area */}
              <div className="flex-1 w-full flex items-center justify-center relative p-4 pb-28">
                {activeStory.imagen ? (
                  <div className="w-full h-full max-h-[75vh] rounded-[36px] overflow-hidden shadow-2xl relative bg-slate-900/40">
                    <img 
                      src={activeStory.imagen} 
                      alt="Estado" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    
                    {activeStory.lugarNombre && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg z-[138] flex items-center gap-2 cursor-pointer hover:bg-black/80 transition-colors pointer-events-auto"
                           onClick={(e) => {
                             e.stopPropagation();
                             setStoryViewerOpen(false);
                             setSelectedLugar(lugares.find(l => l.id === activeStory.lugarId) || null);
                           }}>
                        <MapPin size={16} className="text-pink-400" />
                        <span className="text-white text-xs font-bold whitespace-nowrap">{activeStory.lugarNombre}</span>
                      </div>
                    )}

                    {activeStory.texto && (
                      <div className="absolute bottom-12 inset-x-0 px-6 py-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-center z-[138]">
                        <p className="text-white text-base font-semibold max-w-sm mx-auto drop-shadow-md leading-relaxed">
                          {activeStory.texto}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full max-h-[75vh] rounded-[36px] bg-gradient-to-tr ${activeStory.background || 'from-purple-500 to-pink-500'} flex items-center justify-center p-8 text-center shadow-inner relative overflow-hidden`}>
                    
                    {activeStory.lugarNombre && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/30 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg z-[138] flex items-center gap-2 cursor-pointer hover:bg-black/50 transition-colors pointer-events-auto"
                           onClick={(e) => {
                             e.stopPropagation();
                             setStoryViewerOpen(false);
                             setSelectedLugar(lugares.find(l => l.id === activeStory.lugarId) || null);
                           }}>
                        <MapPin size={16} className="text-white" />
                        <span className="text-white text-xs font-bold whitespace-nowrap">{activeStory.lugarNombre}</span>
                      </div>
                    )}

                    <p className="text-white text-2xl font-black leading-relaxed tracking-tight max-w-xs break-words drop-shadow-md">
                      {activeStory.texto}
                    </p>
                  </div>
                )}
              </div>

              {/* Instagram-style Floating Comments Overlay (root modal level, persistent on story for 24h) */}
              <div className="absolute bottom-20 left-4 right-4 z-[165] pointer-events-auto flex flex-col-reverse gap-2 max-h-52 overflow-y-auto no-scrollbar">
                <AnimatePresence>
                  {((activeStory?.comentarios) || []).map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex items-center gap-2.5 bg-black/90 backdrop-blur-md border border-purple-500/60 px-4 py-2.5 rounded-2xl max-w-[90%] shadow-[0_8px_30px_rgba(168,85,247,0.5)] self-start"
                    >
                      <img 
                        src={comment.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} 
                        alt={comment.author} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-purple-400 flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-black text-purple-300 leading-tight truncate">
                          {comment.author}
                        </span>
                        <span className="text-xs font-extrabold text-white leading-tight break-words">
                          {comment.text}
                        </span>
                      </div>
                      <Heart size={16} className="fill-purple-500 text-purple-300 ml-1 flex-shrink-0 animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Floating Purple Hearts Animation */}
              <AnimatePresence>
                {floatingHearts.map(h => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -280, scale: 2, rotate: Math.random() * 40 - 20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="absolute bottom-24 z-[170] text-4xl pointer-events-none drop-shadow-[0_0_16px_rgba(168,85,247,0.9)]"
                    style={{ left: `${h.x}%` }}
                  >
                    💜
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Toast Feedback */}
              <AnimatePresence>
                {storyToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-purple-950/95 border border-purple-400 text-purple-100 px-5 py-2.5 rounded-full font-black text-xs shadow-2xl z-[170] flex items-center gap-2 backdrop-blur-md pointer-events-none"
                  >
                    <Heart size={16} className="text-purple-300 fill-purple-400 animate-pulse" />
                    <span>{storyToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Comment & Purple Heart Bar */}
              <div className="absolute bottom-3 inset-x-3 z-[150] pointer-events-auto max-w-md mx-auto">
                {isOwnStory ? (
                  <div className="flex items-center justify-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-purple-500/40 rounded-full py-3.5 px-6 shadow-2xl text-purple-200 text-xs font-black text-center">
                    <Sparkles size={16} className="text-purple-400 animate-spin-slow" />
                    <span>Tu propio estado en Fusa</span>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!storyCommentText.trim()) return;
                      handleAddStoryComment(
                        storyCommentText,
                        user.nombre || userGroup.usuarioNombre || 'Usuario',
                        user.avatar || userGroup.usuarioFoto
                      );
                      setStoryCommentText('');
                    }}
                    className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-purple-500/50 rounded-full p-1.5 pl-4 shadow-2xl"
                  >
                    <input 
                      type="text"
                      value={storyCommentText}
                      onChange={(e) => setStoryCommentText(e.target.value)}
                      placeholder={`Responder a ${userGroup.usuarioNombre}...`}
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-xs font-bold"
                    />
                    
                    {/* Single Purple Heart Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSendPurpleHeart();
                        setStoryToast(`Reaccionaste con 💜 a ${userGroup.usuarioNombre}`);
                        setTimeout(() => setStoryToast(null), 2500);
                      }}
                      className="p-2 rounded-full text-purple-300 hover:text-purple-100 hover:bg-purple-500/30 active:scale-90 transition-all cursor-pointer"
                      title="Enviar Corazón Morado"
                    >
                      <Heart size={22} className="fill-purple-500 text-purple-300 animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                    </button>

                    <button
                      type="submit"
                      disabled={!storyCommentText.trim()}
                      className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-30 active:scale-90 transition-all shadow-lg cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

const LugarForm = ({ 
  categorias, 
  onSuccess, 
  lugar, 
  user,
  darkMode = false 
}: { 
  categorias: Categoria[], 
  onSuccess: () => void, 
  lugar?: Lugar, 
  user?: Usuario,
  darkMode?: boolean 
}) => {
  const [formData, setFormData] = useState({
    nombre: lugar?.nombre || '',
    direccion: lugar?.direccion || '',
    lat: lugar?.lat !== undefined ? lugar.lat : '',
    lng: lugar?.lng !== undefined ? lugar.lng : '',
    categoriaId: lugar?.categoriaId || categorias[0]?.id || '',
    descripcion: lugar?.descripcion || '',
    imagen: lugar?.imagen || '',
    imagenes: lugar?.imagenes || [] as string[],
    puntuacion: lugar?.puntuacion ?? 0,
    numReseñas: lugar?.numReseñas ?? 0,
    destacado: lugar?.destacado ?? false,
    destacadoDuracion: lugar?.destacadoDuracion || '1d',
    destacadoHasta: lugar?.destacadoHasta || '',
    anuncioActivo: lugar?.anuncioActivo ?? false,
    anuncioImagen: lugar?.anuncioImagen || '',
    anuncioDuracion: lugar?.anuncioDuracion || '1d',
    anuncioHasta: lugar?.anuncioHasta || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(lugar?.imagen || null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(lugar?.imagenes || []);
  const [anuncioPreview, setAnuncioPreview] = useState<string | null>(lugar?.anuncioImagen || null);
  const [searchingOSM, setSearchingOSM] = useState(false);

  const geocodeAddressOSM = async () => {
    if (!formData.direccion.trim()) {
      alert("Por favor escribe una dirección primero para buscarla.");
      return;
    }
    setSearchingOSM(true);
    try {
      const query = `${formData.direccion}, Fusagasugá, Cundinamarca, Colombia`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const result = data[0];
          const latVal = parseFloat(result.lat);
          const lngVal = parseFloat(result.lon);
          setFormData(prev => ({ ...prev, lat: latVal, lng: lngVal }));
          setMapsUrlTemp(`${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`);
          alert(`Ubicación encontrada en OpenStreetMap:\n${result.display_name}`);
        } else {
          const query2 = `${formData.direccion}, Fusagasugá`;
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query2)}&format=json&limit=1`);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.length > 0) {
              const result2 = data2[0];
              const latVal = parseFloat(result2.lat);
              const lngVal = parseFloat(result2.lon);
              setFormData(prev => ({ ...prev, lat: latVal, lng: lngVal }));
              setMapsUrlTemp(`${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`);
              alert(`Ubicación encontrada:\n${result2.display_name}`);
              return;
            }
          }
          alert("No se encontraron coordenadas exactas en OpenStreetMap. Intenta con una calle, carrera, o sector más conocido de Fusagasugá.");
        }
      } else {
        alert("No se pudo conectar con el servidor de OpenStreetMap.");
      }
    } catch (err) {
      console.error("OSM Error:", err);
      alert("Error buscando la dirección en OpenStreetMap.");
    } finally {
      setSearchingOSM(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setImagePreview(compressed);
        setFormData(prev => ({ ...prev, imagen: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(base64);
      newImages.push(compressed);
    }

    setGalleryPreviews(prev => [...prev, ...newImages]);
    setFormData(prev => ({ ...prev, imagenes: [...prev.imagenes, ...newImages] }));
  };

  const handleAnuncioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setAnuncioPreview(compressed);
        setFormData(prev => ({ ...prev, anuncioImagen: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== index) }));
  };

  const [mapsUrlTemp, setMapsUrlTemp] = useState(lugar ? `${lugar.lat}, ${lugar.lng}` : '');

  const autoParseCoords = (url: string) => {
    setMapsUrlTemp(url);
    if (!url) return;

    // Supports:
    // 1. URL with @lat,lng e.g. @4.3361,-74.3638 or @4,3361,-74,3638
    // 2. URL query q=lat,lng
    // 3. Raw latitude and longitude separated by comma (with space or without, supporting comma decimals too!)
    
    let lat: number | null = null;
    let lng: number | null = null;

    const atMatch = url.match(/@(-?\d+[\.,]\d+),(-?\d+[\.,]\d+)/);
    const qMatch = url.match(/[?&]q=(-?\d+[\.,]\d+),(-?\d+[\.,]\d+)/);
    const pathMatch = url.match(/\/place\/(-?\d+[\.,]\d+),(-?\d+[\.,]\d+)/);
    const genericCoordMatch = url.match(/(-?\d+[\.,]\d+)\s*,\s*(-?\d+[\.,]\d+)/);

    let matched: string[] | null = null;
    if (atMatch) matched = atMatch;
    else if (qMatch) matched = qMatch;
    else if (pathMatch) matched = pathMatch;
    else if (genericCoordMatch) matched = genericCoordMatch;

    if (matched) {
      const rawLat = matched[1].replace(',', '.');
      const rawLng = matched[2].replace(',', '.');
      lat = parseFloat(rawLat);
      lng = parseFloat(rawLng);
    } else {
      // Try fallback regex for two space-separated values that might have decimals with dots/commas
      const fallbackMatch = url.trim().match(/^([+-]?\d+[\.,]\d+)\s+([+-]?\d+[\.,]\d+)$/);
      if (fallbackMatch) {
        lat = parseFloat(fallbackMatch[1].replace(',', '.'));
        lng = parseFloat(fallbackMatch[2].replace(',', '.'));
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Automatically correct positive longitude to negative for Colombia
      if (lng > 0) {
        lng = -lng;
      }
      setFormData(prev => ({ ...prev, lat: lat!, lng: lng! }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!formData.imagen) {
      alert("Por favor selecciona una imagen principal");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const placeText = `${formData.nombre} - ${formData.descripcion} - ${formData.direccion}`;
      const moderation = await moderarContenidoFrontend(placeText, formData.imagen);
      if (!moderation.aprobado) {
        alert(`⚠️ Tu publicación viola las normas de la comunidad:\nMotivo: ${moderation.motivo}\nCategoría: ${moderation.categoriaInfraccion}`);
        setIsSubmitting(false);
        return;
      }
      let finalDestacadoHasta = '';
      if (formData.destacado) {
        const durationMap = {
          '1d': 1 * 24 * 60 * 60 * 1000,
          '5d': 5 * 24 * 60 * 60 * 1000,
          '15d': 15 * 24 * 60 * 60 * 1000,
          '1m': 30 * 24 * 60 * 60 * 1000
        };
        const durationMs = durationMap[formData.destacadoDuracion as '1d' | '5d' | '15d' | '1m'] || 1 * 24 * 60 * 60 * 1000;
        finalDestacadoHasta = new Date(Date.now() + durationMs).toISOString();
      }

      let finalAnuncioHasta = '';
      if (formData.anuncioActivo) {
        if (!formData.anuncioImagen) {
          alert("Por favor selecciona una imagen promocional para el anuncio");
          setIsSubmitting(false);
          return;
        }
        const anuncioDurationMap = {
          '1d': 1 * 24 * 60 * 60 * 1000,
          '2d': 2 * 24 * 60 * 60 * 1000,
          '5d': 5 * 24 * 60 * 60 * 1000,
          '15d': 15 * 24 * 60 * 60 * 1000,
          '1m': 30 * 24 * 60 * 60 * 1000
        };
        const durMs = anuncioDurationMap[formData.anuncioDuracion as '1d' | '2d' | '5d' | '15d' | '1m'] || 1 * 24 * 60 * 60 * 1000;
        finalAnuncioHasta = new Date(Date.now() + durMs).toISOString();
      }

      let finalLat = Number(String(formData.lat).replace(',', '.'));
      let finalLng = Number(String(formData.lng).replace(',', '.'));
      if (isNaN(finalLat) || formData.lat === '' || formData.lat === null) {
        alert("Por favor ingresa la latitud o búscala con OSM / Google Maps.");
        setIsSubmitting(false);
        return;
      }
      if (isNaN(finalLng) || formData.lng === '' || formData.lng === null) {
        alert("Por favor ingresa la longitud o búscala con OSM / Google Maps.");
        setIsSubmitting(false);
        return;
      }
      if (finalLng > 0) {
        finalLng = -finalLng;
      }

      const cleanData = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        lat: finalLat,
        lng: finalLng,
        categoriaId: formData.categoriaId,
        descripcion: formData.descripcion,
        imagen: formData.imagen,
        imagenes: formData.imagenes,
        puntuacion: Number(formData.puntuacion),
        numReseñas: Number(formData.numReseñas),
        destacado: Boolean(formData.destacado),
        destacadoDuracion: formData.destacado ? formData.destacadoDuracion : '',
        destacadoHasta: finalDestacadoHasta,
        anuncioActivo: Boolean(formData.anuncioActivo),
        anuncioImagen: formData.anuncioActivo ? formData.anuncioImagen : '',
        anuncioDuracion: formData.anuncioActivo ? formData.anuncioDuracion : '',
        anuncioHasta: finalAnuncioHasta
      };

      if (lugar) {
        await updateLugar(lugar.id, cleanData);
      } else {
        await addLugar({
          ...cleanData,
          propietarioId: auth.currentUser.uid
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving place", error);
      alert("Hubo un error al guardar la ubicación: " + (error.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Close Button inside form */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-black">
        <h2 className="text-xl font-comic tracking-widest uppercase font-black">
          {lugar ? 'Editar Ubicación' : 'Nueva Ubicación'}
        </h2>
        <button 
          type="button" 
          onClick={onSuccess}
          className="w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
          title="Cerrar Editor"
        >
          <X size={16} strokeWidth={3} className="text-black" />
        </button>
      </div>

      {/* Main Image Upload Area */}
      <div>
        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
          darkMode ? 'text-pink-300/80' : 'text-slate-400'
        }`}>Foto Principal</label>
        <div className={`relative h-48 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors ${
          darkMode ? 'bg-[#29233b] border-pink-500/10' : 'bg-slate-50 border-slate-200'
        }`}>
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setFormData(p => ({ ...p, imagen: '' })); }}
                  className="p-3 bg-white rounded-full shadow-xl text-red-500 hover:scale-105 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>
            </>
          ) : (
            <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2">
              <div className={`p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform ${
                darkMode ? 'bg-[#221c32]' : 'bg-white'
              }`}>
                <PlusCircle size={32} className="text-primary" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest text-center px-4 ${
                darkMode ? 'text-pink-300/50' : 'text-slate-400'
              }`}>Toca para cargar la portada</p>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Gallery Photos Area */}
      <div>
        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
          darkMode ? 'text-pink-300/80' : 'text-slate-400'
        }`}>Fotos de Referencia (Galería)</label>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <label className={`flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
            darkMode ? 'bg-[#29233b] border-pink-500/10 hover:border-pink-500' : 'bg-slate-50 border-slate-200 hover:border-primary'
          }`}>
            <Plus size={24} className={darkMode ? 'text-pink-350' : 'text-slate-400'} />
            <input type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
          </label>
          
          {galleryPreviews.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden group">
              <img src={img} alt="Gallery item" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute top-1 right-1 p-1 bg-white rounded-lg shadow-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
            darkMode ? 'text-pink-300/80' : 'text-slate-400'
          }`}>Nombre del Lugar</label>
          <input 
            required
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
              darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
            }`}
            placeholder="Ej: Casona Coburgo"
          />
        </div>
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
            darkMode ? 'text-pink-300/80' : 'text-slate-400'
          }`}>Dirección</label>
          <div className="flex gap-2">
            <input 
              required
              value={formData.direccion}
              onChange={e => setFormData({...formData, direccion: e.target.value})}
              className={`flex-1 border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
              placeholder="Ej: Carrera 12 # 7-56, Fusagasugá"
            />
            <button
              type="button"
              onClick={geocodeAddressOSM}
              disabled={searchingOSM}
              className="px-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {searchingOSM ? (
                <RotateCw className="animate-spin" size={16} />
              ) : (
                <Compass size={16} />
              )}
              <span>OSM</span>
            </button>
          </div>
        </div>
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
            darkMode ? 'text-pink-300/80' : 'text-slate-400'
          }`}>¿Cómo llegar? (Enlace Google Maps o Coordenadas)</label>
          <div className="relative">
            <input 
              value={mapsUrlTemp}
              onChange={e => autoParseCoords(e.target.value)}
              className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold pr-12 ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
              placeholder="Pega el link de Google Maps o coordenadas..."
            />
            {mapsUrlTemp && formData.lat !== '' && formData.lng !== '' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 p-1.5 rounded-full text-white shadow-sm animate-bounce">
                <Check size={16} strokeWidth={4} />
              </div>
            )}
          </div>
          <p className="text-[10px] mt-1.5 text-slate-400 leading-normal pl-2 font-medium">
            💡 <strong>Tip:</strong> Puedes buscar la dirección con el botón <strong>OSM</strong>, pegar un enlace de Google Maps, o ingresar las coordenadas directamente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
              darkMode ? 'text-pink-300/80' : 'text-slate-400'
            }`}>Latitud</label>
            <input 
              required
              type="text"
              inputMode="decimal"
              value={formData.lat}
              onChange={e => {
                // Allow only numbers, dot, comma, and minus sign
                const val = e.target.value.replace(/[^0-9\.,-]/g, '');
                setFormData({...formData, lat: val as any});
              }}
              placeholder="Ej: 4.3361"
              className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
              darkMode ? 'text-pink-300/80' : 'text-slate-400'
            }`}>Longitud</label>
            <input 
              required
              type="text"
              inputMode="decimal"
              value={formData.lng}
              onChange={e => {
                // Allow only numbers, dot, comma, and minus sign
                const val = e.target.value.replace(/[^0-9\.,-]/g, '');
                setFormData({...formData, lng: val as any});
              }}
              placeholder="Ej: -74.3638"
              className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* OSM Map Preview to visually confirm exact placement */}
        {(() => {
          const cleanLat = parseFloat(String(formData.lat).replace(',', '.'));
          const cleanLng = parseFloat(String(formData.lng).replace(',', '.'));
          const isValid = !isNaN(cleanLat) && !isNaN(cleanLng) && cleanLat !== 0 && cleanLng !== 0;
          if (!isValid) return null;
          return (
            <div className="relative border-4 border-black rounded-[32px] overflow-hidden shadow-[6px_6px_0_#000] mt-2 animate-fadeIn">
              <div className={`px-4 py-2 font-black text-[10px] uppercase border-b-4 border-black flex justify-between items-center ${
                darkMode ? 'bg-[#29233b] text-pink-300' : 'bg-slate-100 text-slate-800'
              }`}>
                <span>🗺️ Mapa de Ubicación (Fusagasugá)</span>
                <span className="font-mono bg-black/10 px-2 py-0.5 rounded text-pink-500">
                  {cleanLat.toFixed(4)}, {cleanLng.toFixed(4)}
                </span>
              </div>
              <iframe
                title="Vista previa de ubicación"
                width="100%"
                height="180"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${cleanLng - 0.003}%2C${cleanLat - 0.003}%2C${cleanLng + 0.003}%2C${cleanLat + 0.003}&layer=mapnik&marker=${cleanLat}%2C${cleanLng}`}
                className="w-full h-[180px] grayscale-[10%]"
              />
            </div>
          );
        })()}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
            darkMode ? 'text-pink-300/80' : 'text-slate-400'
          }`}>Categoría</label>
          <select 
            value={formData.categoriaId}
            onChange={e => setFormData({...formData, categoriaId: e.target.value})}
            className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none ${
              darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
            }`}
          >
            {categorias.map(c => (
              <option key={c.id} value={c.id} className={darkMode ? 'bg-[#1e1a30] text-white' : 'bg-white text-slate-800'}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
            darkMode ? 'text-pink-300/80' : 'text-slate-400'
          }`}>Descripción</label>
          <textarea 
            required
            value={formData.descripcion}
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
            className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium h-28 resize-none ${
              darkMode ? 'bg-[#29233b] text-purple-100 focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-600 focus:bg-white'
            }`}
            placeholder="Describe qué hace especial este lugar..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
              darkMode ? 'text-pink-300/80' : 'text-slate-400'
            }`}>Puntuación</label>
            <input 
              type="number"
              step="0.1"
              min="0"
              max="5"
              required
              value={formData.puntuacion}
              onChange={e => setFormData({...formData, puntuacion: Number(e.target.value)})}
              className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-2 ${
              darkMode ? 'text-pink-300/80' : 'text-slate-400'
            }`}>Nº Reseñas</label>
            <input 
              type="number"
              min="0"
              required
              value={formData.numReseñas}
              onChange={e => setFormData({...formData, numReseñas: Number(e.target.value)})}
              className={`w-full border-none py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-slate-50 text-slate-800 focus:bg-white'
              }`}
            />
          </div>
        </div>
        
        {user?.rol === 'admin' && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              darkMode ? 'bg-pink-950/20 border-pink-500/10 text-pink-300' : 'bg-red-50 border-red-100 text-red-600'
            }`}>
              <input 
                type="checkbox"
                id="destacado"
                checked={formData.destacado}
                onChange={e => setFormData({...formData, destacado: e.target.checked})}
                className="w-5 h-5 accent-red-500 rounded focus:ring-red-500"
              />
              <label htmlFor="destacado" className="text-sm font-bold">
                Lugar Destacado (Publicidad)
              </label>
            </div>
            
            {formData.destacado && (
              <div className="animate-fadeIn p-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5">
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${
                  darkMode ? 'text-pink-300/80' : 'text-slate-500'
                }`}>
                  Duración del Destacado
                </label>
                <select 
                  value={formData.destacadoDuracion}
                  onChange={e => setFormData({...formData, destacadoDuracion: e.target.value as any})}
                  className={`w-full border-none py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${
                    darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  <option value="1d">1 Día</option>
                  <option value="5d">5 Días</option>
                  <option value="15d">15 Días</option>
                  <option value="1m">1 Mes</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Sección de Anuncio Promocional */}
        <div className="space-y-4 pt-4 border-t border-dashed border-slate-200 dark:border-pink-500/10">
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            darkMode ? 'bg-pink-950/20 border-pink-500/10 text-pink-300' : 'bg-yellow-50 border-yellow-100 text-yellow-700'
          }`}>
            <input 
              type="checkbox"
              id="anuncioActivo"
              checked={formData.anuncioActivo}
              onChange={e => setFormData({...formData, anuncioActivo: e.target.checked})}
              className="w-5 h-5 accent-yellow-500 rounded focus:ring-yellow-500"
            />
            <label htmlFor="anuncioActivo" className="text-sm font-bold flex items-center gap-1.5">
              🚀 Activar Campaña de Anuncio Emergente
            </label>
          </div>
          
          {formData.anuncioActivo && (
            <div className="animate-fadeIn p-4 rounded-2xl border border-dashed border-yellow-500/30 bg-yellow-500/5 space-y-4">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${
                  darkMode ? 'text-pink-300/80' : 'text-slate-500'
                }`}>
                  Imagen Promocional del Anuncio
                </label>
                <div className={`relative h-32 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group hover:border-yellow-500/50 transition-colors ${
                  darkMode ? 'bg-[#29233b] border-pink-500/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  {anuncioPreview ? (
                    <>
                      <img src={anuncioPreview} alt="Preview Anuncio" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={() => { setAnuncioPreview(null); setFormData(p => ({ ...p, anuncioImagen: '' })); }}
                          className="p-2 bg-white rounded-full shadow-xl text-red-500 hover:scale-105 transition-transform"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-1.5">
                      <PlusCircle size={24} className="text-yellow-500" />
                      <p className={`text-[10px] font-black uppercase tracking-widest text-center px-4 ${
                        darkMode ? 'text-pink-300/50' : 'text-slate-400'
                      }`}>Cargar Banner de Anuncio</p>
                      <input type="file" accept="image/*" onChange={handleAnuncioFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${
                  darkMode ? 'text-pink-300/80' : 'text-slate-500'
                }`}>
                  Duración de la Campaña de Anuncio
                </label>
                <select 
                  value={formData.anuncioDuracion}
                  onChange={e => setFormData({...formData, anuncioDuracion: e.target.value as any})}
                  className={`w-full border-none py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all font-bold ${
                    darkMode ? 'bg-[#29233b] text-white focus:bg-[#2f2845]' : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  <option value="1d">1 Día</option>
                  <option value="2d">2 Días</option>
                  <option value="5d">5 Días</option>
                  <option value="15d">15 Días</option>
                  <option value="1m">1 Mes</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white py-5 rounded-[24px] font-black shadow-xl shadow-primary/30 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] disabled:opacity-50"
      >
        {isSubmitting ? (lugar ? 'ACTUALIZANDO...' : 'PUBLICANDO...') : (lugar ? 'GUARDAR CAMBIOS' : 'REPUBLICAR PUNTO')}
      </button>
    </form>
  );
};

const NavButton = ({ icon: Icon, active, onClick, label, darkMode }: { icon: any, active?: boolean, onClick?: () => void, label?: string, darkMode?: boolean }) => (
  <button 
    onClick={onClick}
    className={`pointer-events-auto relative flex-1 h-14 max-w-[76px] flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 cursor-pointer ${
      active 
        ? 'scale-105 font-black' 
        : 'opacity-70 hover:opacity-100 hover:scale-102'
    }`}
  >
    {/* Liquid Active Background Glass Pill with motion transition */}
    {active && (
      <motion.div 
        layoutId="liquidActivePill"
        className={`absolute inset-0 rounded-[18px] -z-10 backdrop-blur-lg ${
          darkMode 
            ? 'bg-purple-900/70 border border-pink-500/30 shadow-[0_4px_16px_rgba(236,72,153,0.35)]' 
            : 'bg-purple-100 border border-purple-300 shadow-[0_4px_16px_rgba(138,43,226,0.2)]'
        }`}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      />
    )}
    
    <div className={`transition-all duration-300 flex items-center justify-center ${
      active 
        ? (darkMode ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' : 'text-purple-700 drop-shadow-[0_0_6px_rgba(138,43,226,0.5)]')
        : (darkMode ? 'text-slate-350' : 'text-slate-600')
    }`}>
       <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    
    {label && (
      <span className={`text-[10px] font-sans font-extrabold tracking-tight transition-colors duration-300 whitespace-nowrap leading-none mt-1 ${
        active 
          ? (darkMode ? 'text-pink-300' : 'text-purple-800')
          : (darkMode ? 'text-slate-400' : 'text-slate-500')
      }`}>
        {label}
      </span>
    )}
  </button>
);

interface ComicAlertData {
  title?: string;
  message: string;
  type?: 'warning' | 'error' | 'info' | 'success';
}

const ComicAlertModal = ({
  alertData,
  onClose
}: {
  alertData: ComicAlertData | null;
  onClose: () => void;
}) => {
  if (!alertData) return null;

  const { title, message, type = 'warning' } = alertData;

  let mainText = message;
  let motivoText = '';
  let categoriaText = '';

  const lines = message.split('\n');
  const parsedLines: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('motivo:')) {
      motivoText = line.substring(line.indexOf(':') + 1).trim();
    } else if (line.toLowerCase().startsWith('categoría:') || line.toLowerCase().startsWith('categoria:')) {
      categoriaText = line.substring(line.indexOf(':') + 1).trim();
    } else {
      parsedLines.push(line);
    }
  }

  if (parsedLines.length > 0) {
    mainText = parsedLines.join('\n');
  }

  const isViolation = message.includes('viola') || message.includes('normas') || message.includes('infraccion') || message.includes('bloquea');

  const headerBg = isViolation || type === 'error' ? 'bg-[#ff2a6d]' : type === 'warning' ? 'bg-[#ffe600]' : 'bg-[#00f0ff]';
  const headerTextColor = isViolation || type === 'error' ? 'text-white' : 'text-black';
  const soundBadge = isViolation ? '¡BOOM! 💥' : type === 'error' ? '¡OUCH! ⚡' : type === 'warning' ? '¡OJO! ⚠️' : '¡ZAP! 🌟';
  const defaultTitle = isViolation ? '¡INFRACCIÓN DE NORMAS!' : type === 'error' ? '¡ALERTA DE ERROR!' : type === 'warning' ? '¡ATENCIÓN!' : '¡AVISO CÓMIC!';

  return (
    <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.6, rotate: 6, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative w-full max-w-md bg-white border-[5px] border-black rounded-[32px] shadow-[12px_12px_0_#000] overflow-hidden"
      >
        {/* Halftone Overlay */}
        <div className="absolute inset-0 halftone-bg opacity-15 pointer-events-none z-0"></div>

        {/* Comic Header */}
        <div className={`${headerBg} ${headerTextColor} border-b-[5px] border-black px-6 py-4 flex items-center justify-between relative z-10`}>
          <div className="flex items-center gap-2">
            <span className="font-comic text-xl sm:text-2xl tracking-wider uppercase drop-shadow-[2px_2px_0_#000]">
              {title || defaultTitle}
            </span>
          </div>
          <span className="bg-black text-white font-comic text-xs px-3 py-1 rounded-full border-2 border-white rotate-[3deg] shadow-[2px_2px_0_rgba(255,255,255,0.5)] uppercase tracking-wider shrink-0">
            {soundBadge}
          </span>
        </div>

        {/* Comic Body */}
        <div className="p-6 relative z-10 flex flex-col items-center gap-4 text-center">
          {/* Main Message Speech Bubble */}
          <div className="relative w-full bg-[#fffbeb] border-[4px] border-black rounded-2xl p-4 shadow-[5px_5px_0_#000] text-slate-900 font-extrabold text-sm sm:text-base leading-relaxed text-left">
            <p className="font-sans font-black text-base text-slate-900 whitespace-pre-line leading-snug">
              {mainText}
            </p>
          </div>

          {/* If Motivo is specified, highlight in a comic callout box */}
          {motivoText && (
            <div className="w-full bg-red-100 border-[3px] border-black rounded-2xl p-3.5 shadow-[4px_4px_0_#000] text-left flex flex-col gap-1">
              <span className="font-comic text-xs text-red-600 uppercase tracking-wider flex items-center gap-1">
                📌 MOTIVO DE LA RESTRICCIÓN:
              </span>
              <p className="text-xs sm:text-sm font-bold text-red-950 leading-snug">
                {motivoText}
              </p>
            </div>
          )}

          {/* If Categoría is specified, highlight with comic badge */}
          {categoriaText && (
            <div className="w-full flex items-center justify-between bg-yellow-200 border-[3px] border-black rounded-xl px-4 py-2 shadow-[3px_3px_0_#000]">
              <span className="font-comic text-xs uppercase text-black">
                🏷️ CATEGORÍA:
              </span>
              <span className="bg-black text-yellow-300 font-comic text-xs uppercase px-3 py-1 rounded-lg border-2 border-black tracking-widest shadow-[1px_1px_0_#000]">
                {categoriaText}
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            type="button"
            className="w-full mt-2 bg-[#8a2be2] hover:bg-[#9d3bf3] text-white border-[4px] border-black rounded-2xl py-3.5 px-6 font-comic text-2xl uppercase tracking-widest shadow-[5px_5px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 comic-pow-effect"
          >
            <span>¡ENTENDIDO!</span>
            <span className="text-yellow-300 text-3xl font-black">💥</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<{ user: FirebaseUser | null, profile: Usuario | null, loading: boolean }>({
    user: null,
    profile: null,
    loading: true
  });

  const [comicAlert, setComicAlert] = useState<ComicAlertData | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;
    (window as any).alert = (msg: any) => {
      const text = String(msg || '');
      let title = '¡ATENCIÓN!';
      let type: 'warning' | 'error' | 'info' | 'success' = 'info';

      if (text.includes('viola') || text.includes('normas') || text.includes('bloquea') || text.includes('⚠️')) {
        title = '¡INFRACCIÓN DE NORMAS! 🛑';
        type = 'warning';
      } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('rechazad')) {
        title = '¡OUCH! OCURRIÓ UN ERROR 💥';
        type = 'error';
      } else if (text.toLowerCase().includes('debes') || text.toLowerCase().includes('requerid') || text.toLowerCase().includes('falta') || text.toLowerCase().includes('selecciona') || text.toLowerCase().includes('obligatorio')) {
        title = '¡ATENCIÓN EXPLORADOR! ⚡';
        type = 'warning';
      } else if (text.toLowerCase().includes('éxito') || text.toLowerCase().includes('encontrad')) {
        title = '¡GENIAL! 🎉';
        type = 'success';
      }

      setComicAlert({ title, message: text, type });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (!session.loading) {
      if (!session.user) {
        if (typeof (window as any).hideAgent === 'function') {
          (window as any).hideAgent();
        }
      }
    }
  }, [session.user, session.loading]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      
      if (user) {
        setSession(prev => ({ ...prev, user, loading: true }));
        try {
          let profile = await getUsuario(user.uid);
          const isAdminEmail = user.email?.endsWith('@fusaexplor.com') || 
                              user.email?.endsWith('@fusaexplorer.com') ||
                              user.email === 'riascosmarlon66@gmail.com' || 
                              user.email === 'mike.otavo15@gmail.com' ||
                              user.email === 'mike.otavo@fusaexplor.com';
          
          if (!profile) {
            await createUsuario(user.uid, {
              nombre: user.displayName || user.email?.split('@')[0] || 'Explorador',
              correo: user.email || '',
              rol: isAdminEmail ? 'admin' : 'usuario',
              avatar: user.photoURL || ''
            });
            profile = await getUsuario(user.uid);
          } else {
            if (isAdminEmail && profile.rol !== 'admin') {
              try {
                await updateUsuario(user.uid, { rol: 'admin' });
                profile.rol = 'admin';
              } catch (e) {
                console.error("Could not self-upgrade to admin", e);
              }
            }
          }

          const fallbackProfile: Usuario = profile || {
            id: user.uid,
            nombre: user.displayName || user.email?.split('@')[0] || 'Explorador',
            correo: user.email || '',
            rol: isAdminEmail ? 'admin' : 'usuario',
            avatar: user.photoURL || ''
          };
          
          // Subscribe in real-time to profile doc so changes display live!
          const userDocRef = doc(db, 'usuarios', user.uid);
          unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const currentProfile = { id: snap.id, ...snap.data() } as Usuario;
              setSession({ user, profile: currentProfile, loading: false });
            } else {
              setSession({ user, profile: fallbackProfile, loading: false });
            }
          }, (err) => {
            console.error("Profile onSnapshot error:", err);
            setSession({ user, profile: fallbackProfile, loading: false });
          });
          
        } catch (err) {
          console.error("Auth process error:", err);
          const isAdminEmail = user.email?.endsWith('@fusaexplor.com') || user.email === 'riascosmarlon66@gmail.com' || user.email === 'mike.otavo15@gmail.com';
          setSession({ 
            user, 
            profile: {
              id: user.uid,
              nombre: user.displayName || user.email?.split('@')[0] || 'Explorador',
              correo: user.email || '',
              rol: isAdminEmail ? 'admin' : 'usuario',
              avatar: user.photoURL || ''
            }, 
            loading: false 
          });
        }
      } else {
        setSession({ user: null, profile: null, loading: false });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  if (session.loading) {
    if (session.user) {
      return <DashboardSkeleton />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2a0e4a] via-[#5b21b6] to-[#a78bfa] relative overflow-hidden">
        <div className="absolute inset-0 halftone-bg-dark pointer-events-none z-0"></div>
        <div className="relative z-10">
          <LoadingOrchid />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden ${!session.user ? 'bg-[#2a0e4a]' : 'bg-[#d8b4fe] halftone-bg'}`}>
      <AnimatePresence mode="wait">
        {!session.user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <LoginView />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {session.user && (
              <DashboardView 
                user={session.profile || { 
                  id: session.user.uid, 
                  nombre: session.user.displayName || session.user.email?.split('@')[0] || 'Cargando...',
                  correo: session.user.email || '',
                  rol: (session.user.email?.endsWith('@fusaexplor.com') || session.user.email === 'riascosmarlon66@gmail.com' || session.user.email === 'mike.otavo15@gmail.com') ? 'admin' : 'usuario',
                  avatar: session.user.photoURL || ''
                }} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comicAlert && (
          <ComicAlertModal 
            alertData={comicAlert} 
            onClose={() => setComicAlert(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
