import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Inicio from './sections/Inicio'
import NuevaDeteccion from './sections/NuevaDeteccion'
import Historial from './sections/Historial'
import Informacion from './sections/Informacion'
import Usuarios from './sections/Usuarios'
import AdminPanel from './sections/AdminPanel'

// Mapa: nombre de sección → componente React correspondiente
const SECCIONES = {
  inicio:          <Inicio />,
  nueva_deteccion: <NuevaDeteccion />,
  historial:       <Historial />,
  usuarios:        <Usuarios />,
  informacion:     <Informacion />,
  admin:           <AdminPanel />,
}

export default function Dashboard({ seccion }) {
  const location = useLocation()  // Para saber la URL actual (resalta el ítem activo)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar 
        seccionActiva={location.pathname} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-wrapper">
        {/* Botón hamburguesa para móvil */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        
        <Topbar />

        <main className="main-content">
          {SECCIONES[seccion] ?? <p style={{ color: '#888' }}>Sección no encontrada.</p>}
        </main>
      </div>
    </div>
  )
}
