import { useState } from 'react'

export default function PerfilAjustesModal({ isOpen, onClose, initialTab = 'perfil' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [claveActual, setClaveActual] = useState('')
  const [claveNueva, setClaveNueva] = useState('')
  const [claveConfirmar, setClaveConfirmar] = useState('')
  const [cambiando, setCambiando] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Ajustes de telemetría (Visual Mock)
  const [sensor, setSensor] = useState('sentinel2')
  const [frecuencia, setFrecuencia] = useState('diaria')
  const [alertasCorreo, setAlertasCorreo] = useState(true)
  const [filtrarNubes, setFiltrarNubes] = useState(true)

  if (!isOpen) return null

  const usuario = localStorage.getItem('usuario') || 'admin'
  const nombre = localStorage.getItem('nombre') || 'Administrador'
  const rol = localStorage.getItem('rol') || 'usuario'

  async function handleCambiarClave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (claveNueva !== claveConfirmar) {
      setError('La nueva contraseña y la confirmación no coinciden.')
      return
    }

    if (claveNueva.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.')
      return
    }

    setCambiando(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const response = await fetch(`${API_URL}/usuarios/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario,
          clave_actual: claveActual,
          clave_nueva: claveNueva
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('¡Contraseña actualizada exitosamente!')
        setClaveActual('')
        setClaveNueva('')
        setClaveConfirmar('')
      } else {
        setError(data.message || 'No se pudo cambiar la contraseña.')
      }
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor.')
    } finally {
      setCambiando(false)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        className="card-custom" 
        style={{
          maxWidth: '580px',
          width: '100%',
          background: 'var(--color-card)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-xl)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 24,
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div style={{
          background: 'var(--bg-glass-overlay-light)',
          borderBottom: '1px solid var(--border-glass-themed)',
          padding: '24px 28px 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, color: 'var(--color-texto)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--color-acento)' }}>⚙️</span> Configuración de Cuenta
            </h4>
            <button 
              onClick={onClose} 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-texto-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--color-texto)'}
              onMouseLeave={e => e.target.style.color = 'var(--color-texto-muted)'}
            >
              &times;
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <button
              onClick={() => setActiveTab('perfil')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'perfil' ? '2.5px solid var(--color-acento)' : '2.5px solid transparent',
                color: activeTab === 'perfil' ? 'var(--color-texto)' : 'var(--color-texto-muted)',
                fontWeight: 600,
                padding: '10px 4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              👤 Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab('ajustes')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'ajustes' ? '2.5px solid var(--color-acento)' : '2.5px solid transparent',
                color: activeTab === 'ajustes' ? 'var(--color-texto)' : 'var(--color-texto-muted)',
                fontWeight: 600,
                padding: '10px 4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              🛠️ Ajustes del Sistema
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '28px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
          {activeTab === 'perfil' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              
              {/* Profile Avatar Container with Orbit and Scan Lines */}
              <div style={{ position: 'relative', width: 140, height: 140, display: 'grid', placeItems: 'center' }}>
                {/* Rotating orbital ring */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px dashed rgba(6, 182, 212, 0.4)',
                  animation: 'orbitRotate 15s linear infinite'
                }} />
                
                {/* Outer solid glow ring */}
                <div style={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(6, 182, 212, 0.15)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.05)'
                }} />

                {/* Avatar core */}
                <div style={{
                  position: 'relative',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)',
                  border: '2.5px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }}>
                  {usuario.charAt(0).toUpperCase()}

                  {/* Laser green scanning line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                    animation: 'scanLine 2.2s ease-in-out infinite'
                  }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h5 style={{ color: 'var(--color-texto)', margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{nombre}</h5>
                <span 
                  className={`badge-estado badge-${rol === 'admin' ? 'alto' : 'bajo'}`} 
                  style={{ marginTop: 8, fontSize: '0.68rem', padding: '4px 12px' }}
                >
                  Rol: {rol}
                </span>
              </div>

              {/* High-tech profile variables cards */}
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 10,
                marginTop: 10
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--bg-glass-overlay-light)',
                  border: '1px solid var(--border-glass-themed)',
                  padding: '12px 18px',
                  borderRadius: 12
                }}>
                  <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.84rem' }}>Identificador</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.88rem' }}>@{usuario}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--bg-glass-overlay-light)',
                  border: '1px solid var(--border-glass-themed)',
                  padding: '12px 18px',
                  borderRadius: 12
                }}>
                  <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.84rem' }}>Privilegios de Cuenta</span>
                  <strong style={{ 
                    color: rol === 'admin' ? 'var(--color-peligro)' : 'var(--color-primario)',
                    fontSize: '0.88rem'
                  }}>
                    {rol === 'admin' ? 'Acceso de Administrador Total' : 'Analista Operativo de Telemetría'}
                  </strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--bg-glass-overlay-light)',
                  border: '1px solid var(--border-glass-themed)',
                  padding: '12px 18px',
                  borderRadius: 12
                }}>
                  <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.84rem' }}>Estación Satelital Asignada</span>
                  <strong style={{ color: 'var(--color-acento)', fontSize: '0.88rem' }}>Loreto - Napo (Perú)</strong>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Formulario de Cambio de Contraseña */}
              <form onSubmit={handleCambiarClave} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 24 }}>
                <h6 style={{ color: 'var(--color-acento)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, fontWeight: 700 }}>
                  🔒 Actualizar Contraseña
                </h6>

                {success && <div style={{ color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '10px 14px', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>✅ {success}</div>}
                {error && <div style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '10px 14px', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>❌ {error}</div>}

                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 6 }}>Contraseña Actual</label>
                    <input
                      type="password"
                      className="input-custom"
                      placeholder="Contraseña del sistema actual"
                      value={claveActual}
                      onChange={e => setClaveActual(e.target.value)}
                      style={{ marginBottom: 0 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 6 }}>Nueva Contraseña</label>
                      <input
                        type="password"
                        className="input-custom"
                        placeholder="Mín. 4 caract."
                        value={claveNueva}
                        onChange={e => setClaveNueva(e.target.value)}
                        style={{ marginBottom: 0 }}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 6 }}>Confirmar Contraseña</label>
                      <input
                        type="password"
                        className="input-custom"
                        placeholder="Mín. 4 caract."
                        value={claveConfirmar}
                        onChange={e => setClaveConfirmar(e.target.value)}
                        style={{ marginBottom: 0 }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-principal"
                  style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                  disabled={cambiando}
                >
                  {cambiando ? '⏳ Guardando cambios...' : '💾 Actualizar Credenciales'}
                </button>
              </form>

              {/* Preferencias Satelitales (Con Switches Táctiles CSS) */}
              <div>
                <h6 style={{ color: 'var(--color-acento)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, fontWeight: 700 }}>
                  🛰️ Parámetros de Telemetría Satelital
                </h6>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 6 }}>Sensor Activo</label>
                    <select
                      className="input-custom"
                      value={sensor}
                      onChange={e => setSensor(e.target.value)}
                      style={{ marginBottom: 0, outline: 'none' }}
                    >
                      <option value="sentinel2">Sentinel-2 (ESA)</option>
                      <option value="landsat8">Landsat-8 (NASA)</option>
                      <option value="modis">Aqua MODIS (NASA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 6 }}>Intervalo Orbital</label>
                    <select
                      className="input-custom"
                      value={frecuencia}
                      onChange={e => setFrecuencia(e.target.value)}
                      style={{ marginBottom: 0, outline: 'none' }}
                    >
                      <option value="diaria">24 Horas (Diario)</option>
                      <option value="semanal">5 Días (Óptimo Sat.)</option>
                      <option value="mensual">Mensual (Consolidado)</option>
                    </select>
                  </div>
                </div>

                {/* CSS Switches section */}
                <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-texto-muted)' }}>
                      Habilitar alertas de derrame por correo electrónico
                    </span>
                    <span className="switch-custom">
                      <input
                        type="checkbox"
                        checked={alertasCorreo}
                        onChange={e => setAlertasCorreo(e.target.checked)}
                      />
                      <span className="switch-slider" />
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-texto-muted)' }}>
                      Pre-filtrar interferencia de nubosidad tropical (&gt;30%)
                    </span>
                    <span className="switch-custom">
                      <input
                        type="checkbox"
                        checked={filtrarNubes}
                        onChange={e => setFiltrarNubes(e.target.checked)}
                      />
                      <span className="switch-slider" />
                    </span>
                  </label>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          background: 'var(--bg-glass-overlay-light)',
          borderTop: '1px solid var(--border-glass-themed)',
          padding: '18px 28px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            className="btn-principal" 
            onClick={onClose} 
            style={{ 
              background: 'var(--border-glass)', 
              color: 'var(--color-texto)', 
              boxShadow: 'none',
              border: '1px solid var(--border-glass)'
            }}
            onMouseEnter={e => e.target.style.background = 'var(--color-card-hover)'}
            onMouseLeave={e => e.target.style.background = 'var(--border-glass)'}
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  )
}
