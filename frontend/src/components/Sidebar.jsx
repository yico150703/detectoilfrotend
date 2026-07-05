import { Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MENU_ITEMS = [
  { 
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ), 
    label: 'Inicio', 
    ruta: '/inicio' 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ), 
    label: 'Nueva Detección', 
    ruta: '/nueva-deteccion' 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ), 
    label: 'Historial', 
    ruta: '/historial' 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ), 
    label: 'Usuarios', 
    ruta: '/usuarios' 
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
    label: 'Panel Admin',
    ruta: '/admin'
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ), 
    label: 'Información', 
    ruta: '/informacion' 
  },
]

export default function Sidebar({ seccionActiva, isOpen, onClose }) {
  const navigate = useNavigate()

  function cerrarSesion() {
    localStorage.removeItem('usuario')
    localStorage.removeItem('nombre')
    localStorage.removeItem('rol')
    navigate('/')
    onClose?.()
  }

  const rol = localStorage.getItem('rol') || 'usuario'
  const itemsFiltrados = MENU_ITEMS.filter(item => {
    if ((item.ruta === '/usuarios' || item.ruta === '/admin') && rol !== 'admin') {
      return false
    }
    return true
  })

  function handleNavigation(ruta) {
    navigate(ruta)
    onClose?.()
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Header con botón de cierre en móvil */}
        <div className="sidebar-header">
          {/* Radar Logo / Brand - Custom SVG with IA + Oil theme */}
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" style={{ position: 'relative', width: 44, height: 44 }}>
              <svg viewBox="0 0 100 100" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                
                {/* Anillo exterior con efecto scanner */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="url(#logoGradient)" 
                  strokeWidth="3" 
                  strokeDasharray="4 4"
                  opacity="0.8"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="360 50 50"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* La Gota de petróleo - Path dibujado manualmente */}
                <path 
                  d="M50 20 C50 20 30 45 30 60 A20 20 0 0 0 70 60 C70 45 50 20 50 20 Z" 
                  fill="url(#logoGradient)"
                  opacity="0.9"
                />
                
                {/* El "Ojo" IA dentro de la gota */}
                <circle cx="50" cy="55" r="12" fill="#0f172a" opacity="0.8" />
                <circle cx="50" cy="55" r="5" fill="#22d3ee">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title" style={{ background: 'linear-gradient(90deg, #0ea5e9, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DetectOil</span>
              <small style={{ color: 'var(--color-acento)', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                CONSOLA SATELITAL
              </small>
            </div>
          </div>
          
          {/* Botón de cierre solo visible en móvil */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
            <X size={24} />
          </button>
        </div>

        {/* Menú de Enlaces */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itemsFiltrados.map(item => {
            const isActive = seccionActiva === item.ruta
            return (
              <button
                key={item.ruta}
                className={`sidebar-link ${isActive ? 'activo' : ''}`}
                onClick={() => handleNavigation(item.ruta)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {/* Active vertical neon glow line */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    height: '70%',
                    width: '3px',
                    backgroundColor: 'var(--color-acento)',
                    boxShadow: '0 0 10px var(--color-acento)',
                    borderRadius: '0 4px 4px 0'
                  }} />
                )}
                <span className="nav-icon-wrapper" style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Logout al fondo */}
        <div className="sidebar-separador">
          <button className="sidebar-link logout" onClick={cerrarSesion}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Estilos dinámicos para los elementos de navegación */}
        <style>{`
          .sidebar-link:hover .nav-icon-wrapper {
            opacity: 1 !important;
            color: var(--color-acento);
            transform: scale(1.08);
            transition: all 0.2s ease;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 149;
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .sidebar-close-btn {
            display: none;
            background: transparent;
            border: none;
            color: var(--color-texto);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.2s ease;
          }
          .sidebar-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          @media (max-width: 1024px) {
            .sidebar-close-btn {
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        `}</style>
      </nav>
    </>
  )
}
