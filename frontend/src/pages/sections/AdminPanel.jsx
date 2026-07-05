import { useState, useEffect } from 'react'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('zonas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // State for Zonas
  const [zonas, setZonas] = useState([])
  const [nombreZona, setNombreZona] = useState('')
  const [latitud, setLatitud] = useState('')
  const [longitud, setLongitud] = useState('')
  const [nivelRiesgo, setNivelRiesgo] = useState('bajo')
  const [descZona, setDescZona] = useState('')
  const [encargadoZona, setEncargadoZona] = useState('')
  const [editingZonaId, setEditingZonaId] = useState(null)

  // State for Satellites
  const [satelites, setSatelites] = useState([])

  // State for Protocols
  const [protocolos, setProtocolos] = useState([])
  const [selectedProt, setSelectedProt] = useState(null)
  const [protComentario, setProtComentario] = useState('')
  const [protEstado, setProtEstado] = useState('pendiente')

  const usuarioLogueado = localStorage.getItem('usuario') || 'admin'

  const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
  const API_URL = apiBase ? `${apiBase}/api` : '/api';

  // Loaders
  async function cargarZonas() {
    try {
      const res = await fetch(`${API_URL}/zonas`)
      const data = await res.json()
      if (data.success) setZonas(data.data)
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor para cargar las zonas.')
    }
  }

  async function cargarSatelites() {
    try {
      const res = await fetch(`${API_URL}/satelites`)
      const data = await res.json()
      if (data.success) setSatelites(data.data)
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor para cargar los satélites.')
    }
  }

  async function cargarProtocolos() {
    try {
      const res = await fetch(`${API_URL}/protocolos`)
      const data = await res.json()
      if (data.success) setProtocolos(data.data)
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor para cargar los protocolos.')
    }
  }

  useEffect(() => {
    setError('')
    setSuccess('')
    if (activeTab === 'zonas') {
      cargarZonas()
    } else if (activeTab === 'satelites') {
      cargarSatelites()
    } else if (activeTab === 'protocolos') {
      cargarProtocolos()
    }
  }, [activeTab])

  // CRUD Zonas
  async function handleSubmitZona(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const payload = {
      nombre: nombreZona,
      latitud: latitud ? parseFloat(latitud) : 0.0,
      longitud: longitud ? parseFloat(longitud) : 0.0,
      nivel_riesgo: nivelRiesgo,
      descripcion: descZona,
      encargado: encargadoZona
    }

    try {
      let response
      if (editingZonaId) {
        response = await fetch(`${API_URL}/zonas/${editingZonaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${API_URL}/zonas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(data.message)
        setNombreZona('')
        setLatitud('')
        setLongitud('')
        setNivelRiesgo('bajo')
        setDescZona('')
        setEncargadoZona('')
        setEditingZonaId(null)
        await cargarZonas()
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error(err)
      setError('Error al enviar los datos de la zona.')
    } finally {
      setLoading(false)
    }
  }

  function handleEditZona(z) {
    setEditingZonaId(z.id)
    setNombreZona(z.nombre)
    setLatitud(z.latitud)
    setLongitud(z.longitud)
    setNivelRiesgo(z.nivel_riesgo)
    setDescZona(z.descripcion)
    setEncargadoZona(z.encargado)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleEliminarZona(id) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta zona de monitoreo?')) return
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_URL}/zonas/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        await cargarZonas()
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error(err)
      setError('Error al eliminar la zona.')
    }
  }

  // Satellites Control
  async function handleCalibrarSatelite(id) {
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_URL}/satelites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activo', calibracion: '100%' })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        await cargarSatelites()
      }
    } catch (err) {
      console.error(err)
      setError('Error al calibrar satélite.')
    }
  }

  async function handleToggleSatelite(id, actualEstado) {
    setError('')
    setSuccess('')
    const nuevoEstado = actualEstado === 'activo' ? 'inactivo' : 'activo'
    const nuevaCalib = nuevoEstado === 'activo' ? '95%' : '0%'
    try {
      const res = await fetch(`${API_URL}/satelites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, calibracion: nuevaCalib })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        await cargarSatelites()
      }
    } catch (err) {
      console.error(err)
      setError('Error al cambiar el estado del satélite.')
    }
  }

  // Protocols Control
  function handleSelectProtocolo(p) {
    setSelectedProt(p)
    setProtEstado(p.estado)
    setProtComentario(p.comentarios)
  }

  async function handleUpdateProtocolo(e) {
    e.preventDefault()
    if (!selectedProt) return
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/protocolos/${selectedProt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: protEstado,
          comentarios: protComentario,
          operador: usuarioLogueado
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        setSelectedProt(null)
        setProtComentario('')
        await cargarProtocolos()
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error(err)
      setError('Error al actualizar el protocolo de mitigación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="seccion-titulo">Panel de Administración</h1>
      <p className="seccion-subtitulo">
        Consola exclusiva para la configuración de la red de monitoreo y protocolos de mitigación de derrames.
      </p>

      {/* Alertas */}
      {success && <div className="alert-box alert-success">✅ {success}</div>}
      {error && <div className="alert-box alert-danger">❌ {error}</div>}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        background: 'var(--bg-glass-overlay-light)',
        padding: 6,
        borderRadius: 12,
        border: '1px solid var(--border-glass-themed-light)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveTab('zonas')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'zonas' ? 'var(--color-primario)' : 'transparent',
            color: activeTab === 'zonas' ? '#fff' : 'var(--color-texto-muted)',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📍 Zonas de Monitoreo
        </button>
        <button
          onClick={() => setActiveTab('protocolos')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'protocolos' ? 'var(--color-primario)' : 'transparent',
            color: activeTab === 'protocolos' ? '#fff' : 'var(--color-texto-muted)',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🛡️ Protocolos de Mitigación
        </button>
        <button
          onClick={() => setActiveTab('satelites')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'satelites' ? 'var(--color-primario)' : 'transparent',
            color: activeTab === 'satelites' ? '#fff' : 'var(--color-texto-muted)',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🛰️ Satélites y Sensores
        </button>
      </div>

      {/* ======================= TAB: ZONAS ======================= */}
      {activeTab === 'zonas' && (
        <div className="row g-4">
          {/* Formulario */}
          <div className="col-md-4">
            <div className="card-custom">
              <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
                {editingZonaId ? '✏️ Editar Zona Geográfica' : '➕ Añadir Zona Geográfica'}
              </h5>
              <form onSubmit={handleSubmitZona} style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Nombre del Sector</label>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="Ej. Cuenca Río Napo"
                    value={nombreZona}
                    onChange={e => setNombreZona(e.target.value)}
                    required
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Latitud</label>
                    <input
                      type="number"
                      step="any"
                      className="input-custom"
                      placeholder="-0.4285"
                      value={latitud}
                      onChange={e => setLatitud(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Longitud</label>
                    <input
                      type="number"
                      step="any"
                      className="input-custom"
                      placeholder="-77.0125"
                      value={longitud}
                      onChange={e => setLongitud(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Nivel de Riesgo Base</label>
                  <select
                    className="input-custom"
                    value={nivelRiesgo}
                    onChange={e => setNivelRiesgo(e.target.value)}
                    style={{ marginBottom: 0 }}
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Encargado de Monitoreo</label>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="Nombre del ingeniero/a"
                    value={encargadoZona}
                    onChange={e => setEncargadoZona(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Descripción / Observaciones</label>
                  <textarea
                    className="input-custom"
                    placeholder="Detalles sobre infraestructura cercana..."
                    value={descZona}
                    onChange={e => setDescZona(e.target.value)}
                    style={{ minHeight: '80px', marginBottom: 0, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button type="submit" className="btn-principal" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    {editingZonaId ? '💾 Guardar' : '➕ Crear Zona'}
                  </button>
                  {editingZonaId && (
                    <button
                      type="button"
                      className="btn-principal"
                      style={{ background: 'var(--border-glass)', border: '1px solid var(--border-glass-light)', color: 'var(--color-texto)' }}
                      onClick={() => {
                        setEditingZonaId(null)
                        setNombreZona('')
                        setLatitud('')
                        setLongitud('')
                        setNivelRiesgo('bajo')
                        setDescZona('')
                        setEncargadoZona('')
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Tabla de Zonas */}
          <div className="col-md-8">
            <div className="card-custom" style={{ minHeight: '380px' }}>
              <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
                📍 Red de Cobertura Geográfica Vigilada
              </h5>
              <div className="tabla-custom-wrapper">
                <table className="tabla-custom">
                  <thead>
                    <tr>
                      <th>Nombre de Zona</th>
                      <th>Coordenadas</th>
                      <th>Riesgo</th>
                      <th>Supervisor</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zonas.length > 0 ? (
                      zonas.map(z => (
                        <tr key={z.id}>
                          <td>
                            <strong style={{ color: 'var(--color-texto)' }}>{z.nombre}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--color-texto-muted)' }}>
                              {z.descripcion || 'Sin observaciones adicionales.'}
                            </p>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-texto-muted)' }}>
                            {z.latitud.toFixed(4)}, {z.longitud.toFixed(4)}
                          </td>
                          <td>
                            <span className={`badge-estado badge-${z.nivel_riesgo}`}>
                              {z.nivel_riesgo.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.86rem', color: 'var(--color-texto)' }}>{z.encargado}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                className="btn-principal btn-sm"
                                onClick={() => handleEditZona(z)}
                                style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-acento)', border: '1px solid rgba(6,182,212,0.2)' }}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-principal btn-sm"
                                onClick={() => handleEliminarZona(z.id)}
                                style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-peligro)', border: '1px solid rgba(239,68,68,0.2)' }}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--color-texto-muted)' }}>
                          No hay zonas de monitoreo registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB: PROTOCOLOS ======================= */}
      {activeTab === 'protocolos' && (
        <div className="row g-4">
          {/* Formulario de Actualización */}
          <div className="col-md-4">
            <div className="card-custom">
              <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
                🛡️ Control de Mitigación de Incidentes
              </h5>
              {selectedProt ? (
                <form onSubmit={handleUpdateProtocolo} style={{ display: 'grid', gap: 14 }}>
                  <div style={{ borderLeft: '3px solid var(--color-primario)', paddingLeft: 10, marginBottom: 4 }}>
                    <small style={{ color: 'var(--color-texto-muted)', fontSize: '0.7rem', display: 'block' }}>Incidencia Activa</small>
                    <strong style={{ color: 'var(--color-texto)', fontSize: '0.86rem' }}>
                      {selectedProt.deteccion.lugar} ({selectedProt.deteccion.fecha})
                    </strong>
                    <span className={`badge-estado badge-${selectedProt.deteccion.nivel}`} style={{ display: 'block', width: 'fit-content', marginTop: 4, fontSize: '0.62rem', padding: '2px 6px' }}>
                      Gravedad: {selectedProt.deteccion.nivel}
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Estado del Protocolo</label>
                    <select
                      className="input-custom"
                      value={protEstado}
                      onChange={e => setProtEstado(e.target.value)}
                      style={{ marginBottom: 0 }}
                    >
                      <option value="pendiente">🔴 Pendiente</option>
                      <option value="en_curso">🟡 En Curso</option>
                      <option value="mitigado">🟢 Mitigado / Resuelto</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Bitácora de Mitigación y Comentarios</label>
                    <textarea
                      className="input-custom"
                      placeholder="Indique las acciones de contingencia ejecutadas..."
                      value={protComentario}
                      onChange={e => setProtComentario(e.target.value)}
                      required
                      style={{ minHeight: '120px', marginBottom: 0, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button type="submit" className="btn-principal" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                      {loading ? 'Guardando...' : '💾 Registrar Cambios'}
                    </button>
                    <button
                      type="button"
                      className="btn-principal"
                      style={{ background: 'var(--border-glass)', border: '1px solid var(--border-glass-light)', color: 'var(--color-texto)' }}
                      onClick={() => setSelectedProt(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-texto-muted)', fontSize: '0.84rem' }}>
                  💡 Seleccione un incidente de derrame en la tabla lateral para registrar el plan de acción, contingencia o marcar como resuelto.
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Protocolos */}
          <div className="col-md-8">
            <div className="card-custom" style={{ minHeight: '380px' }}>
              <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
                🚨 Registro de Contingencias y Alertas
              </h5>
              <div className="tabla-custom-wrapper">
                <table className="tabla-custom">
                  <thead>
                    <tr>
                      <th>Zona de Alerta</th>
                      <th>Severidad</th>
                      <th>Estado del Plan</th>
                      <th>Bitácora / Comentario</th>
                      <th>Operador</th>
                      <th style={{ textAlign: 'center', width: '90px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocolos.length > 0 ? (
                      protocolos.map(p => (
                        <tr key={p.id}>
                          <td>
                            <strong style={{ color: 'var(--color-texto)' }}>{p.deteccion.lugar}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--color-texto-muted)' }}>
                              Fecha Detección: {p.deteccion.fecha}
                            </p>
                          </td>
                          <td>
                            <span className={`badge-estado badge-${p.deteccion.nivel}`}>
                              {p.deteccion.nivel.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-estado badge-${p.estado === 'pendiente' ? 'alto' : p.estado === 'en_curso' ? 'amarillo' : 'verde'}`} style={{ textTransform: 'capitalize' }}>
                              {p.estado === 'pendiente' ? '🔴 Pendiente' : p.estado === 'en_curso' ? '🟡 En Curso' : '🟢 Mitigado'}
                            </span>
                          </td>
                          <td>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-texto)', whiteSpace: 'normal', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {p.comentarios || 'Sin observaciones todavía.'}
                            </p>
                            <small style={{ color: 'var(--color-texto-muted)', fontSize: '0.68rem', display: 'block', marginTop: 2 }}>
                              Actualizado: {p.fecha_actualizacion}
                            </small>
                          </td>
                          <td style={{ fontSize: '0.86rem', color: 'var(--color-texto)' }}>@{p.operador}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                className="btn-principal btn-sm"
                                onClick={() => handleSelectProtocolo(p)}
                                style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-acento)', border: '1px solid rgba(6,182,212,0.2)', whiteSpace: 'nowrap' }}
                              >
                                Administrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--color-texto-muted)' }}>
                          No hay reportes de derrames activos que requieran protocolos de mitigación.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB: SATÉLITES ======================= */}
      {activeTab === 'satelites' && (
        <div className="card-custom" style={{ minHeight: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h5 style={{ color: 'var(--color-texto)', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              🛰️ Telemetría Satelital y Calibración de Sensores
            </h5>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-exito)', padding: '4px 10px', borderRadius: 99, fontWeight: 700 }}>
              ESTADO SATELITAL GLOBAL: NOMINAL
            </span>
          </div>

          <div className="tabla-custom-wrapper">
            <table className="tabla-custom">
              <thead>
                <tr>
                  <th>Satélite / Sensor</th>
                  <th>Espectro de Sensor</th>
                  <th>Resolución</th>
                  <th>Fiabilidad Sensor</th>
                  <th>Último Paso</th>
                  <th>Estado Conexión</th>
                  <th style={{ textAlign: 'center', width: '220px' }}>Controles de Red</th>
                </tr>
              </thead>
              <tbody>
                {satelites.length > 0 ? (
                  satelites.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: 'var(--color-texto)' }}>{s.nombre}</strong>
                      </td>
                      <td style={{ fontSize: '0.86rem', color: 'var(--color-texto)' }}>{s.tipo}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{s.resolucion}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '0.88rem', color: parseFloat(s.calibracion) > 90 ? 'var(--color-exito)' : 'var(--color-amarillo)' }}>
                            {s.calibracion}
                          </strong>
                          <div style={{ width: 60, height: 4, background: 'var(--border-glass)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: s.calibracion, background: parseFloat(s.calibracion) > 90 ? 'var(--color-exito)' : 'var(--color-amarillo)' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--color-texto-muted)' }}>{s.ultima_pasada}</td>
                      <td>
                        <span className={`badge-estado badge-${s.estado === 'activo' ? 'bajo' : 'alto'}`} style={{ color: s.estado === 'activo' ? 'var(--color-exito)' : 'var(--color-peligro)', background: 'transparent', borderWidth: 0, fontWeight: 700, padding: 0 }}>
                          ● {s.estado.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn-principal btn-sm"
                            onClick={() => handleCalibrarSatelite(s.id)}
                            disabled={s.estado !== 'activo'}
                            style={{
                              background: 'rgba(6, 182, 212, 0.12)',
                              color: 'var(--color-acento)',
                              border: '1px solid rgba(6,182,212,0.2)',
                              opacity: s.estado !== 'activo' ? 0.4 : 1,
                              cursor: s.estado !== 'activo' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ⚡ Calibrar
                          </button>
                          <button
                            className="btn-principal btn-sm"
                            onClick={() => handleToggleSatelite(s.id, s.estado)}
                            style={{
                              background: s.estado === 'activo' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: s.estado === 'activo' ? 'var(--color-peligro)' : 'var(--color-exito)',
                              border: s.estado === 'activo' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {s.estado === 'activo' ? '🛑 Desconectar' : '🟢 Conectar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--color-texto-muted)' }}>
                      No hay satélites registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
