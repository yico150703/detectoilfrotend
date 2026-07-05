// ============================================================
// App.jsx — Componente raíz: define las rutas de la app
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom'
import Login     from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

// useAuth: verifica si hay sesión activa en localStorage
function useAuth() {
  return localStorage.getItem('usuario') !== null
}

// ProtectedRoute: redirige al login si no hay sesión
function ProtectedRoute({ children }) {
  return useAuth() ? children : <Navigate to="/" replace />
}

// AdminRoute: redirige al inicio si no es administrador
function AdminRoute({ children }) {
  const rol = localStorage.getItem('rol') || 'usuario'
  return useAuth() && rol === 'admin' ? children : <Navigate to="/inicio" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Ruta pública: Login */}
      <Route path="/" element={<Login />} />
      
      {/* Ruta pública: Registro */}
      <Route path="/registro" element={<Registro />} />

      {/* Rutas protegidas: solo accesibles con sesión activa */}
      <Route path="/inicio"           element={<ProtectedRoute><Dashboard seccion="inicio"          /></ProtectedRoute>} />
      <Route path="/nueva-deteccion"  element={<ProtectedRoute><Dashboard seccion="nueva_deteccion" /></ProtectedRoute>} />
      <Route path="/historial"        element={<ProtectedRoute><Dashboard seccion="historial"        /></ProtectedRoute>} />
      <Route path="/usuarios"         element={<ProtectedRoute><Dashboard seccion="usuarios"         /></ProtectedRoute>} />
      <Route path="/informacion"      element={<ProtectedRoute><Dashboard seccion="informacion"      /></ProtectedRoute>} />
      <Route path="/admin"            element={<AdminRoute><Dashboard seccion="admin"            /></AdminRoute>} />

      {/* Cualquier ruta desconocida redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
