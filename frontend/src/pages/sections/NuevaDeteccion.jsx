import { useState, useRef, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function NuevaDeteccion() {
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [progreso, setProgreso] = useState(0)
  const [fecha, setFecha] = useState(getTodayDateString())
  const [dateMode, setDateMode] = useState('hoy') // 'hoy', 'manual'
  const [zona, setZona] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [zonasOptions, setZonasOptions] = useState([])

  useEffect(() => {
    async function cargarZonas() {
      try {
        const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
        const API_URL = apiBase ? `${apiBase}/api` : '/api';
        const res = await fetch(`${API_URL}/zonas`)
        const data = await res.json()
        if (data.success) {
          setZonasOptions(data.data)
        }
      } catch (err) {
        console.error('Error al cargar zonas de monitoreo:', err)
      }
    }
    cargarZonas()
  }, [])
  
  const inputRef = useRef(null)
  
  // Obtener tema actual para ToastContainer
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem('tema')
    return guardado || 'dark'
  })
  
  useEffect(() => {
    const handleThemeChange = () => {
      const nuevoTema = localStorage.getItem('tema') || 'dark'
      setTema(nuevoTema)
    }
    
    window.addEventListener('storage', handleThemeChange)
    const interval = setInterval(() => {
      const nuevoTema = localStorage.getItem('tema') || 'dark'
      if (nuevoTema !== tema) setTema(nuevoTema)
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleThemeChange)
      clearInterval(interval)
    }
  }, [tema])

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const archivoSeleccionado = e.dataTransfer.files[0]
    if (archivoSeleccionado) {
      procesarArchivo(archivoSeleccionado)
    }
  }

  function handleArchivo(e) {
    const archivoSeleccionado = e.target.files[0]
    if (archivoSeleccionado) {
      procesarArchivo(archivoSeleccionado)
    }
  }

  function procesarArchivo(archivoSeleccionado) {
    // Validación de tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (archivoSeleccionado.size > maxSize) {
      toast.error('❌ El archivo excede el tamaño máximo permitido (5MB)')
      return
    }
    
    // Validación de extensión
    const extensionesValidas = ['.jpg', '.jpeg', '.png', '.tif', '.tiff']
    const nombreArchivo = archivoSeleccionado.name.toLowerCase()
    const extensionValida = extensionesValidas.some(ext => nombreArchivo.endsWith(ext))
    
    if (!extensionValida) {
      toast.error('❌ Formato no válido. Solo se permiten JPG, PNG y TIF')
      return
    }
    
    setArchivo(archivoSeleccionado)
    const lector = new FileReader()
    lector.onload = ev => setPreview(ev.target.result)
    lector.readAsDataURL(archivoSeleccionado)
    setResultado(null)
    setProgreso(0)
    setError('')
    toast.info('📁 Imagen cargada correctamente')
  }

  async function handleAnalizar() {
    if (!archivo) {
      toast.warning('⚠️ Por favor, cargue una imagen satelital primero.')
      return
    }

    setAnalizando(true)
    setProgreso(20)
    setResultado(null)
    setError('')

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const formData = new FormData()
      formData.append('imagen', archivo)
      formData.append('fecha', fecha)
      formData.append('zona', zona)
      formData.append('usuario', localStorage.getItem('usuario') || 'admin')

      setProgreso(50)

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData
      })

      setProgreso(85)

      const data = await response.json()

      if (data.success) {
        setResultado(data)
        setProgreso(100)
        toast.success('✅ Análisis completado exitosamente')
      } else {
        toast.error(data.message || 'No se pudo analizar la imagen.')
        setError(data.message || 'No se pudo analizar la imagen.')
      }

    } catch (err) {
      console.error(err)
      toast.error('❌ Error de conexión al conectar con el servidor de análisis.')
      setError('Error de conexión al conectar con el servidor de análisis.')
    } finally {
      setAnalizando(false)
    }
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
    
      <h1 className="seccion-titulo">Nueva Detección</h1>
      <p className="seccion-subtitulo">
        Carga una captura multiespectral para procesar mediante la Red Neuronal Convolucional (CNN).
      </p>

      <div className="row g-4">
        
        {/* Columna Izquierda: Input y Carga */}
        <div className="col-md-6">
          <div className="card-custom" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ color: 'var(--color-texto)', marginBottom: 16, fontSize: '1.05rem', fontWeight: 700 }}>
              📁 Adquisición Espectral de Imagen
            </h5>

            {/* Radar Sweep Upload Box - Solo se muestra si NO hay preview */}
            {!preview && (
              <div 
                className="zona-carga" 
                onClick={() => inputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  position: 'relative',
                  border: isDragging ? '2px dashed var(--color-acento)' : '2px dashed rgba(6, 182, 212, 0.25)',
                  background: isDragging ? 'rgba(6, 182, 212, 0.08)' : 'rgba(0, 0, 0, 0.15)',
                  padding: '44px 20px',
                  overflow: 'hidden',
                  borderRadius: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              >
                {/* Radar sweep scanning line overlay */}
                <div className="radar-sweep-line" style={{ display: isDragging ? 'block' : 'none' }} />

                <span className="zona-carga-icon" style={{ 
                  transform: isDragging ? 'scale(1.2)' : 'scale(1)', 
                  transition: 'transform 0.2s', 
                  fontSize: '2.8rem' 
                }}>
                  🛰️
                </span>
                <p style={{ color: 'var(--color-texto)', margin: '12px 0 0', fontWeight: 600, fontSize: '0.9rem' }}>
                  {isDragging ? '¡Soltar imagen orbital!' : 'Arrastra tu archivo aquí o haz clic para buscar'}
                </p>
                <p style={{ color: 'var(--color-texto-muted)', fontSize: '0.78rem', marginTop: 6 }}>
                  Formatos recomendados: JPG, PNG o TIF multiespectral
                </p>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleArchivo}
            />

            {/* Vista previa compacta - Solo se muestra si HAY preview */}
            {preview && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-exito)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    ✓ Imagen cargada - Lista para análisis
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setArchivo(null);
                      setPreview(null);
                      setResultado(null);
                      setProgreso(0);
                      setError('');
                      if (inputRef.current) inputRef.current.value = '';
                    }}
                    style={{
                      background: 'var(--border-glass)',
                      border: '1px solid var(--border-glass-light)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      color: 'var(--color-texto)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-card-hover)';
                      e.currentTarget.style.borderColor = 'var(--color-acento)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--border-glass)';
                      e.currentTarget.style.borderColor = 'var(--border-glass-light)';
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Cambiar imagen
                  </button>
                </div>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#040712',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }}>
                  <img
                    src={preview}
                    alt="Vista previa orbital"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  {/* Scanner overlay effect on preview */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'var(--color-acento)',
                    boxShadow: '0 0 10px var(--color-acento)',
                    animation: 'scanLine 2.5s ease-in-out infinite'
                  }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              <div className="row g-2 mb-3">
                <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Fecha de Captura</label>
                  <div style={{ display: 'flex', gap: 4, background: 'var(--bg-glass-overlay)', padding: 3, borderRadius: 8, border: '1px solid var(--border-glass-themed)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode('hoy');
                        setFecha(getTodayDateString());
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        border: dateMode === 'hoy' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                        borderRadius: 6,
                        background: dateMode === 'hoy' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: dateMode === 'hoy' ? 'var(--color-acento)' : 'var(--color-texto-muted)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateMode('manual')}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        border: dateMode === 'manual' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                        borderRadius: 6,
                        background: dateMode === 'manual' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: dateMode === 'manual' ? 'var(--color-acento)' : 'var(--color-texto-muted)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Manual
                    </button>
                  </div>
                  {dateMode === 'manual' ? (
                    <input
                      type="date"
                      className="input-custom"
                      value={fecha}
                      onChange={e => setFecha(e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: 8, marginBottom: 0, marginTop: 4 }}
                    />
                  ) : (
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'var(--bg-glass-overlay-light)',
                      border: '1px solid var(--border-glass-themed-light)',
                      fontSize: '0.76rem',
                      color: 'var(--color-acento)',
                      fontWeight: 700,
                      textAlign: 'center',
                      marginTop: 4
                    }}>
                      🕒 {fecha}
                    </div>
                  )}
                </div>
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Zona Geográfica</label>
                  <select
                    className="input-custom"
                    value={zona}
                    onChange={e => setZona(e.target.value)}
                    style={{ marginBottom: 0, outline: 'none' }}
                  >
                    <option value="">Selecciona...</option>
                    {zonasOptions.map(z => (
                      <option key={z.id} value={z.nombre}>{z.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="btn-principal"
                onClick={handleAnalizar}
                disabled={analizando}
                style={{ width: '100%', justifyContent: 'center', height: 44, borderRadius: 10 }}
              >
                {analizando ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'orbitRotate 1.5s linear infinite' }}>
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    </svg>
                    <span>Ejecutando diagnóstico...</span>
                  </>
                ) : (
                  <>
                    <span>🔍 Ejecutar Análisis Espectral</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Reporte y Gráficas de Confianza */}
        <div className="col-md-6">
          <div className="card-custom" style={{ minHeight: '400px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
              📊 Lectura de Diagnóstico IA
            </h5>

            {analizando && (
              <div style={{ margin: 'auto 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-texto-muted)', fontSize: '0.86rem', marginBottom: 12 }}>
                  Procesando firmas espectrales en red neuronal...
                </p>
                <div className="barra-wrapper">
                  <div className="barra-fill" style={{ width: `${progreso}%` }} />
                </div>
                <span style={{ color: 'var(--color-acento)', fontSize: '0.9rem', fontWeight: 700, display: 'block', marginTop: 10 }}>
                  {progreso}%
                </span>
              </div>
            )}

            {error && (
              <div style={{ margin: 'auto 0', textAlign: 'center', padding: 20 }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }}>❌</span>
                <p style={{ color: 'var(--color-peligro)', margin: 0, fontWeight: 600 }}>{error}</p>
              </div>
            )}

            {resultado && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.5s ease' }}>
                
                {/* Diagnóstico Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass-themed)', paddingBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-texto-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Resultado del Diagnóstico
                    </span>
                    <h4 style={{
                      color: resultado.clase_tecnica === 'oil' ? 'var(--color-peligro)' : 'var(--color-primario)',
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      margin: '4px 0 0'
                    }}>
                      {resultado.clase_tecnica === 'oil' ? '🚨 ' : '🌿 '} {resultado.resultado}
                    </h4>
                  </div>
                  <span className={`badge-estado badge-${resultado.nivel_alerta.toLowerCase()}`}>
                    Severidad: {resultado.nivel_alerta}
                  </span>
                </div>

                {/* SVG Orbital Dona de Confianza */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', margin: '14px 0' }}>
                  
                  {/* Glowing orbital tracker circle */}
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'relative' }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="transparent"
                      stroke="var(--border-glass-themed-light)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="transparent"
                      stroke={resultado.clase_tecnica === 'oil' ? 'var(--color-peligro)' : 'var(--color-primario)'}
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - resultado.confianza / 100)}
                      style={{
                        transition: 'stroke-dashoffset 1.5s ease-in-out',
                        strokeLinecap: 'round'
                      }}
                    />
                  </svg>
                  
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-texto)', display: 'block', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                      {resultado.confianza}%
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-texto-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Confianza IA
                    </span>
                  </div>
                </div>

                {/* Probability comparison bars */}
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-peligro)', fontWeight: 600 }}>Probabilidad de Hidrocarburo:</span>
                      <span style={{ color: 'var(--color-texto)', fontWeight: 700 }}>{resultado.probabilidad_derrame}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-glass)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${resultado.probabilidad_derrame}%`, background: 'var(--color-peligro)', borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-primario)', fontWeight: 600 }}>Probabilidad de Zona Limpia:</span>
                      <span style={{ color: 'var(--color-texto)', fontWeight: 700 }}>{resultado.probabilidad_sin_derrame}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-glass)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${resultado.probabilidad_sin_derrame}%`, background: 'var(--color-primario)', borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                </div>

                {/* Metadata details block */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 12, 
                  background: 'var(--color-card)', 
                  padding: 14, 
                  borderRadius: 12, 
                  fontSize: '0.84rem',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div>
                    <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.76rem' }}>Zona Registrada</span>
                    <strong style={{ color: 'var(--color-texto)' }}>{zona || 'No especificada'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-muted)', display: 'block', fontSize: '0.76rem' }}>Fecha de Registro</span>
                    <strong style={{ color: 'var(--color-texto)' }}>{fecha || 'No especificada'}</strong>
                  </div>
                </div>

                {/* Emergency Protocol Notification widget */}
                <div style={{
                  padding: 18,
                  borderRadius: 12,
                  background: resultado.clase_tecnica === 'oil' 
                    ? 'rgba(239, 68, 68, 0.07)' 
                    : 'rgba(16, 185, 129, 0.07)',
                  border: resultado.clase_tecnica === 'oil' 
                    ? '1px dashed rgba(239, 68, 68, 0.35)' 
                    : '1px dashed rgba(16, 185, 129, 0.35)',
                  boxShadow: resultado.clase_tecnica === 'oil' ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none',
                  animation: resultado.clase_tecnica === 'oil' ? 'alertPulse 2s infinite' : 'none'
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: resultado.clase_tecnica === 'oil' ? 'var(--color-peligro)' : 'var(--color-primario)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8
                  }}>
                    📢 Protocolo de Emergencia ({resultado.nivel_alerta})
                  </span>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-texto)', lineHeight: 1.5, fontWeight: 500 }}>
                    {resultado.recomendacion}
                  </p>
                </div>

              </div>
            )}

            {!analizando && !resultado && !error && (
              <div style={{ textAlign: 'center', margin: 'auto 0', padding: '40px 20px', color: 'var(--color-texto-muted)' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>🤖</span>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  El diagnóstico espectral y el reporte del modelo se presentarán aquí una vez procesada la captura.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .radar-sweep-line {
          position: absolute;
          width: 200%;
          height: 200%;
          background: linear-gradient(0deg, rgba(6, 182, 212, 0.1) 0%, transparent 60%);
          top: -50%;
          left: -50%;
          transform-origin: center center;
          animation: sweepRadar 4s infinite linear;
          pointer-events: none;
        }
        @keyframes sweepRadar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes alertPulse {
          0% { border-color: rgba(239, 68, 68, 0.35); background-color: rgba(239, 68, 68, 0.05); }
          50% { border-color: rgba(239, 68, 68, 0.65); background-color: rgba(239, 68, 68, 0.12); }
          100% { border-color: rgba(239, 68, 68, 0.35); background-color: rgba(239, 68, 68, 0.05); }
        }
      `}</style>
    </>
  )
}
