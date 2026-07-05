import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function Historial() {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Obtener tema actual para ToastContainer
  const [tema] = useState(() => {
    const guardado = localStorage.getItem('tema')
    return guardado || 'dark'
  })

  const rol = localStorage.getItem('rol') || 'usuario'

  async function handleEliminarHistorial(id) {
    const numericId = typeof id === 'string' ? parseInt(id.replace('#', ''), 10) : id;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el registro #${numericId}?`)) {
      return;
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const response = await fetch(`${API_URL}/historial/${numericId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('Registro de detección eliminado con éxito.');
        setDatos(prev => prev.filter(item => {
          const itemNumId = typeof item.id === 'string' ? parseInt(item.id.replace('#', ''), 10) : item.id;
          return itemNumId !== numericId;
        }));
      } else {
        alert(data.message || 'No se pudo eliminar el registro.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar el registro.');
    }
  }

  useEffect(() => {
    async function cargarHistorial() {
      try {
        const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
        const API_URL = apiBase ? `${apiBase}/api` : '/api';
        
        const response = await fetch(`${API_URL}/historial`)
        if (!response.ok) {
          throw new Error('No se pudo establecer conexión con el servidor.')
        }
        const resData = await response.json()
        if (resData.success) {
          setDatos(resData.data)
        } else {
          setError(resData.message || 'Error al obtener el historial.')
        }
      } catch (err) {
        console.error(err)
        setError('Error de conexión al obtener el historial. Verifica que el servidor de base de datos esté activo.')
      } finally {
        setLoading(false)
      }
    }

    cargarHistorial()
  }, [])

  const datosFiltrados = datos.filter(d => {
    // Filtro de búsqueda por texto
    const fieldsToSearch = [
      d.id,
      d.fecha,
      d.lugar,
      d.area,
      d.confianza,
      d.nivel,
      d.resultado
    ].join(' ').toLowerCase();
    
    const coincideBusqueda = fieldsToSearch.includes(busqueda.toLowerCase());
    const coincideNivel = !filtroNivel || d.nivel === filtroNivel;
    const coincideFecha = !filtroFecha || d.fecha === filtroFecha;
    
    return coincideBusqueda && coincideNivel && coincideFecha;
  })

  function exportarCSV() {
    if (datosFiltrados.length === 0) {
      toast.warning('⚠️ No hay datos para exportar')
      return
    }
    
    const headers = ['ID', 'Fecha', 'Ubicación', 'Área', 'Confianza', 'Nivel', 'Resultado', 'Usuario']
    const csvContent = [
      headers.join(','),
      ...datosFiltrados.map(d => 
        [d.id, d.fecha, d.lugar, d.area, d.confianza, d.nivel, d.resultado, d.usuario].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `detecciones_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('✅ CSV exportado exitosamente')
  }

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={tema}
      />
    
      <h1 className="seccion-titulo">Historial de Detecciones</h1>
      <p className="seccion-subtitulo">Registro histórico de imágenes analizadas y diagnósticos almacenados</p>

      {/* Filtros Avanzados */}
      <div className="card-custom" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="row g-3" style={{ alignItems: 'center' }}>
          {/* Buscador de texto */}
          <div className="col-md-4">
            <label className="form-label" style={{ fontSize: '0.74rem' }}>🔍 Buscar</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.85rem' }}>🔎</span>
              <input
                type="text"
                className="input-custom"
                placeholder="ID, ubicación, fecha..."
                style={{ paddingLeft: 38, marginBottom: 0 }}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtro por Nivel */}
          <div className="col-md-3">
            <label className="form-label" style={{ fontSize: '0.74rem' }}>⚠️ Nivel de Alerta</label>
            <select
              className="input-custom"
              value={filtroNivel}
              onChange={e => setFiltroNivel(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Todos</option>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
          
          {/* Filtro por Fecha */}
          <div className="col-md-3">
            <label className="form-label" style={{ fontSize: '0.74rem' }}>📅 Fecha</label>
            <input
              type="date"
              className="input-custom"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          
          {/* Botón Exportar y Contador */}
          <div className="col-md-2" style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <button
              className="btn-principal btn-sm"
              onClick={exportarCSV}
              style={{ height: 38, fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-primario)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-primario)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.color = 'var(--color-primario)'
              }}
            >
              📥 Exportar CSV
            </button>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-texto-muted)', textAlign: 'center' }}>
              {datosFiltrados.length} de {datos.length} resultados
            </span>
          </div>
        </div>
        
        {/* Botón para limpiar filtros */}
        {(busqueda || filtroNivel || filtroFecha) && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button
              onClick={() => {
                setBusqueda('')
                setFiltroNivel('')
                setFiltroFecha('')
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-acento)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '4px 8px'
              }}
            >
              ✕ Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Database Table Container */}
      <div className="card-custom">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-table-row">
                <div className="skeleton skeleton-table-cell" />
                <div className="skeleton skeleton-table-cell" />
                <div className="skeleton skeleton-table-cell" />
                <div className="skeleton skeleton-table-cell" />
                <div className="skeleton skeleton-table-cell" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-peligro)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>⚠️</span>
            {error}
          </div>
        ) : (
          <>
            {/* Versión Desktop - Tabla tradicional */}
            <div className="hidden md:block">
              <div className="tabla-custom-wrapper">
                <table className="tabla-custom">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Fecha Captura</th>
                      <th>Ubicación / Sector</th>
                      <th>Área Afectada</th>
                      <th>Fiabilidad IA</th>
                      <th>Nivel Severidad</th>
                      <th>Protocolo</th>
                      <th>Operador</th>
                      <th style={{ textAlign: 'center', width: '165px', minWidth: '165px' }}>Ficha / Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosFiltrados.length > 0 ? (
                      datosFiltrados.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--color-acento)' }}>#{d.id}</td>
                          <td>{d.fecha}</td>
                          <td style={{ color: 'var(--color-texto)', fontWeight: 600 }}>{d.lugar}</td>
                          <td>{d.area}</td>
                          <td style={{ fontWeight: 600 }}>{d.confianza}%</td>
                          <td>
                            <span className={`badge-estado badge-${d.nivel}`}>
                              {d.nivel}
                            </span>
                          </td>
                          <td>
                            {d.protocolo && d.protocolo.estado !== 'no_aplica' ? (
                              <span className={`badge-estado badge-${d.protocolo.estado === 'pendiente' ? 'alto' : d.protocolo.estado === 'en_curso' ? 'amarillo' : 'verde'}`} style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                {d.protocolo.estado === 'pendiente' ? '🔴 Pendiente' : d.protocolo.estado === 'en_curso' ? '🟡 En Curso' : '🟢 Mitigado'}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-texto-subtle)', fontSize: '0.8rem' }}>No Aplica</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--color-texto)' }}>@{d.usuario}</td>
                          <td style={{ textAlign: 'center', width: '165px', minWidth: '165px' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <button 
                                className="btn-principal btn-sm" 
                                onClick={() => setSelectedRecord(d)}
                                style={{
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  color: 'var(--color-acento)',
                                  border: '1px solid rgba(6, 182, 212, 0.25)',
                                  boxShadow: 'none',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--color-acento)'
                                  e.currentTarget.style.color = '#fff'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)'
                                  e.currentTarget.style.color = 'var(--color-acento)'
                                }}
                              >
                                Ver Reporte
                              </button>
                              {rol === 'admin' && (
                                <button
                                  className="btn-principal btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarHistorial(d.id);
                                  }}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: 'var(--color-peligro)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 30,
                                    height: 30,
                                    padding: 0,
                                    flexShrink: 0
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--color-peligro)'
                                    e.currentTarget.style.color = '#fff'
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                                    e.currentTarget.style.color = 'var(--color-peligro)'
                                  }}
                                  title="Eliminar esta detección de la base de datos"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-texto-muted)', padding: 36 }}>
                          No se encontraron registros de telemetría coincidentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Versión Móvil - Tarjetas */}
            <div className="block md:hidden">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {datosFiltrados.length > 0 ? (
                  datosFiltrados.map(d => (
                    <div key={d.id} className="detection-card-mobile">
                      {/* Header de la tarjeta */}
                      <div className="detection-card-header">
                        <span className="detection-card-id">#{d.id}</span>
                        <span className={`badge-estado badge-${d.nivel} detection-card-badge`}>
                          {d.nivel}
                        </span>
                      </div>
                      
                      {/* Cuerpo de la tarjeta con información */}
                      <div className="detection-card-body">
                        <div className="detection-card-row">
                          <svg className="detection-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="detection-card-label">Fecha:</span>
                          <span className="detection-card-value">{d.fecha}</span>
                        </div>
                        
                        <div className="detection-card-row">
                          <svg className="detection-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="detection-card-label">Ubicación:</span>
                          <span className="detection-card-value">{d.lugar}</span>
                        </div>
                        
                        <div className="detection-card-row">
                          <svg className="detection-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <span className="detection-card-label">Área:</span>
                          <span className="detection-card-value">{d.area}</span>
                        </div>
                        
                        <div className="detection-card-row">
                          <svg className="detection-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span className="detection-card-label">Fiabilidad:</span>
                          <span className="detection-card-value">{d.confianza}%</span>
                        </div>
                        
                        <div className="detection-card-row">
                          <svg className="detection-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span className="detection-card-label">Operador:</span>
                          <span className="detection-card-value">@{d.usuario}</span>
                        </div>
                      </div>
                      
                      {/* Footer con botones de acción */}
                      <div className="detection-card-footer">
                        <button 
                          className="btn-principal btn-sm detection-card-btn"
                          onClick={() => setSelectedRecord(d)}
                        >
                          Ver Reporte
                        </button>
                        {rol === 'admin' && (
                          <button
                            className="btn-principal btn-sm detection-card-btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarHistorial(d.id);
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-texto-muted)' }}>
                    No se encontraron registros de telemetría coincidentes.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Official Spectral Incident Report Modal */}
      {selectedRecord && (
        <div style={{
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
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setSelectedRecord(null)}>
          <div className="card-custom" style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--color-card)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-xl)',
            padding: 0,
            borderRadius: 20,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ 
              background: 'var(--bg-glass-overlay-light)', 
              borderBottom: '1px solid var(--border-glass-themed)', 
              padding: '20px 24px',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-texto)', fontSize: '1.25rem' }}>🛰️ Reporte de Diagnóstico Satelital</h3>
                <small style={{ color: 'var(--color-acento)', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Ficha Oficial de Incidencia #{selectedRecord.id}
                </small>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-texto-muted)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Technical Verdict */}
              <div style={{ 
                borderLeft: `4px solid ${selectedRecord.nivel === 'alto' || selectedRecord.nivel === 'medio' ? 'var(--color-peligro)' : 'var(--color-primario)'}`,
                paddingLeft: 14,
                background: 'var(--bg-glass-overlay-light)',
                paddingTop: 8,
                paddingBottom: 8
              }}>
                <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnóstico Espectral</span>
                <strong style={{
                  color: selectedRecord.nivel === 'alto' || selectedRecord.nivel === 'medio' ? 'var(--color-peligro)' : 'var(--color-primario)',
                  fontSize: '1.15rem',
                  display: 'block',
                  marginTop: 2
                }}>
                  {selectedRecord.resultado || (selectedRecord.nivel === 'alto' || selectedRecord.nivel === 'medio' ? 'Derrame de Petróleo Detectado' : 'Zona Libre de Hidrocarburos')}
                </strong>
              </div>

              {/* Grid 1: Geographics & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Fecha de captura</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.9rem' }}>{selectedRecord.fecha}</strong>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Zona de Monitoreo</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.9rem' }}>{selectedRecord.lugar}</strong>
                </div>
              </div>

              {/* Grid 2: Area & Confidence */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Área Estimada</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.9rem' }}>{selectedRecord.area || 'N/A (Limpio)'}</strong>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Fiabilidad de la IA</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.9rem' }}>{selectedRecord.confianza}%</strong>
                </div>
              </div>

              {/* Grid 3: Probability Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Probabilidad Hidrocarburo</span>
                  <strong style={{ color: 'var(--color-peligro)', fontSize: '0.9rem' }}>
                    {selectedRecord.probabilidad_derrame ? `${selectedRecord.probabilidad_derrame}%` : selectedRecord.nivel === 'alto' ? '92%' : '4%'}
                  </strong>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 2 }}>Probabilidad Zona Limpia</span>
                  <strong style={{ color: 'var(--color-primario)', fontSize: '0.9rem' }}>
                    {selectedRecord.probabilidad_sin_derrame ? `${selectedRecord.probabilidad_sin_derrame}%` : selectedRecord.nivel === 'bajo' ? '96%' : '8%'}
                  </strong>
                </div>
              </div>

              {/* Severity Category & Analyst */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 6 }}>Nivel de Gravedad Asignado</span>
                  <span className={`badge-estado badge-${selectedRecord.nivel}`}>
                    {selectedRecord.nivel}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.74rem', marginBottom: 6 }}>Analista Registrador</span>
                  <strong style={{ color: 'var(--color-texto)', fontSize: '0.94rem', display: 'inline-block', marginTop: 4 }}>@{selectedRecord.usuario}</strong>
                </div>
              </div>

              {/* Action recommendation */}
              {selectedRecord.recomendacion && (
                <div style={{ 
                  background: 'var(--color-card)', 
                  padding: 16, 
                  borderRadius: 12, 
                  border: '1px dashed var(--border-glass)' 
                }}>
                  <span style={{ color: 'var(--color-acento)', display: 'block', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    📋 Medidas de Mitigación Recomendadas
                  </span>
                  <p style={{ color: 'var(--color-texto)', margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {selectedRecord.recomendacion}
                  </p>
                </div>
              )}

              {/* Protocolo de Mitigación (si aplica) */}
              {selectedRecord.protocolo && selectedRecord.protocolo.estado !== 'no_aplica' && (
                <div style={{
                  background: 'var(--bg-glass-overlay-light)',
                  border: '1px solid var(--border-glass-themed)',
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 4
                }}>
                  <h6 style={{ margin: '0 0 8px', color: 'var(--color-texto)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🛡️ Protocolo de Mitigación Activo
                  </h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-muted)' }}>Estado:</span>
                    <span className={`badge-estado badge-${selectedRecord.protocolo.estado === 'pendiente' ? 'alto' : selectedRecord.protocolo.estado === 'en_curso' ? 'amarillo' : 'verde'}`} style={{ textTransform: 'capitalize' }}>
                      {selectedRecord.protocolo.estado === 'pendiente' ? '🔴 Pendiente' : selectedRecord.protocolo.estado === 'en_curso' ? '🟡 En Curso' : '🟢 Mitigado'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-muted)' }}>Responsable:</span>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-texto)' }}>@{selectedRecord.protocolo.operador}</strong>
                  </div>
                  {selectedRecord.protocolo.comentarios && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-texto-muted)', display: 'block', marginBottom: 4 }}>Comentarios de Operación:</span>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-texto)', background: 'var(--bg-glass-overlay)', padding: 10, borderRadius: 6, fontStyle: 'italic', border: '1px solid var(--border-glass-themed-light)' }}>
                        "{selectedRecord.protocolo.comentarios}"
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ 
              background: 'var(--bg-glass-overlay-light)', 
              borderTop: '1px solid var(--border-glass)', 
              padding: '16px 24px', 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                className="btn-principal" 
                onClick={() => setSelectedRecord(null)} 
                style={{ 
                  background: 'var(--border-glass)', 
                  color: 'var(--color-texto)', 
                  boxShadow: 'none',
                  border: '1px solid var(--border-glass)' 
                }}
              >
                Cerrar Reporte
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
