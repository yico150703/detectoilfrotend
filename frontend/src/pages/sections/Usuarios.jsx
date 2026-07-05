import { useState, useEffect, useCallback } from 'react'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [registrando, setRegistrando] = useState(false)

  // Campos para restablecer contraseña
  const [resetUser, setResetUser] = useState('')
  const [resetClave, setResetClave] = useState('')
  const [reseteando, setReseteando] = useState(false)

  const usuarioLogueado = localStorage.getItem('usuario') || ''

  async function handleResetPassword(e) {
    e.preventDefault()
    setReseteando(true)
    setError('')
    setSuccess('')

    if (!resetUser || !resetClave.trim()) {
      setError('Por favor, selecciona un usuario e ingresa la nueva contraseña.')
      setReseteando(false)
      return
    }

    if (resetClave.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.')
      setReseteando(false)
      return
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const response = await fetch(`${API_URL}/usuarios/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: resetUser, clave_nueva: resetClave })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || `Contraseña de @${resetUser} actualizada con éxito.`)
        setResetUser('')
        setResetClave('')
      } else {
        setError(data.message || 'No se pudo restablecer la contraseña.')
      }
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor para restablecer contraseña.')
    } finally {
      setReseteando(false)
    }
  }

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';
      
      const response = await fetch(`${API_URL}/usuarios`)
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios.')
      }
      const data = await response.json()
      if (data.success) {
        setUsuarios(data.data)
      } else {
        setError(data.message || 'No se pudo cargar la lista de usuarios.')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión con el servidor al obtener los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  async function handleRegistrar(e) {
    e.preventDefault()
    setRegistrando(true)
    setError('')
    setSuccess('')

    if (!usuario.trim() || !contrasena.trim()) {
      setError('El usuario y la contraseña son obligatorios.')
      setRegistrando(false)
      return
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, usuario, contrasena })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Usuario registrado con éxito.')
        setNombre('')
        setUsuario('')
        setContrasena('')
        await cargarUsuarios()
      } else {
        setError(data.message || 'No se pudo registrar el usuario.')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión al intentar registrar el usuario.')
    } finally {
      setRegistrando(false)
    }
  }

  async function handleEliminar(id, username) {
    if (username === 'admin') {
      alert('❌ El usuario principal "admin" no puede ser eliminado.')
      return
    }

    if (username === usuarioLogueado) {
      alert('❌ No puedes eliminar tu propia cuenta mientras estás en sesión.')
      return
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
      const API_URL = apiBase ? `${apiBase}/api` : '/api';

      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Usuario eliminado con éxito.')
        await cargarUsuarios()
      } else {
        setError(data.message || 'No se pudo eliminar el usuario.')
      }
    } catch (err) {
      console.error(err)
      setError('Error al intentar eliminar el usuario.')
    }
  }

  return (
    <>
      <h1 className="seccion-titulo">Gestión de Cuentas</h1>
      <p className="seccion-subtitulo">Administra los accesos de red y credenciales de los operadores del sistema</p>

      {/* Alertas de Mensaje */}
      {success && <div className="alert-box alert-success">✅ {success}</div>}
      {error && <div className="alert-box alert-danger">❌ {error}</div>}

      <div className="row g-4">
        
        {/* Tabla de Usuarios Registrados */}
        <div className="col-md-7">
          <div className="card-custom" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
              👥 Cuentas de Operadores Registrados
            </h5>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-table-row">
                    <div className="skeleton skeleton-avatar" style={{ width: '36px', height: '36px' }} />
                    <div className="skeleton skeleton-table-cell" style={{ width: '25%' }} />
                    <div className="skeleton skeleton-table-cell" style={{ width: '30%' }} />
                    <div className="skeleton skeleton-table-cell" style={{ width: '25%' }} />
                    <div className="skeleton skeleton-text short" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="tabla-custom-wrapper" style={{ flex: 1 }}>
                <table className="tabla-custom">
                  <thead>
                    <tr>
                      <th>Operador</th>
                      <th>Identificador</th>
                      <th>Fecha Registro</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length > 0 ? (
                      usuarios.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: user.usuario === 'admin' ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.78rem'
                              }}>
                                {user.nombre.charAt(0).toUpperCase()}
                              </div>
                              <strong style={{ color: 'var(--color-texto)' }}>{user.nombre}</strong>
                            </div>
                          </td>
                          <td>
                            <code style={{ background: 'var(--border-glass)', padding: '3px 8px', borderRadius: 6, color: 'var(--color-acento)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                              @{user.usuario}
                            </code>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-texto-muted)' }}>
                            {user.fecha_registro.split(' ')[0]}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn-principal btn-sm"
                              style={{
                                background: user.usuario === 'admin' || user.usuario === usuarioLogueado 
                                  ? 'var(--border-glass)' 
                                  : 'rgba(239, 68, 68, 0.12)',
                                color: user.usuario === 'admin' || user.usuario === usuarioLogueado 
                                  ? 'var(--color-texto-subtle)' 
                                  : 'var(--color-peligro)',
                                border: '1px solid ' + (user.usuario === 'admin' || user.usuario === usuarioLogueado ? 'var(--border-glass)' : 'rgba(239,68,68,0.2)'),
                                cursor: user.usuario === 'admin' || user.usuario === usuarioLogueado ? 'not-allowed' : 'pointer',
                                boxShadow: 'none'
                              }}
                              onClick={() => handleEliminar(user.id, user.usuario)}
                              disabled={user.usuario === 'admin' || user.usuario === usuarioLogueado}
                              title={
                                user.usuario === 'admin' 
                                  ? 'Administrador maestro protegido' 
                                  : user.usuario === usuarioLogueado 
                                  ? 'Sesión de red activa' 
                                  : 'Dar de baja'
                              }
                            >
                              Dar de baja
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-texto-muted)', padding: 30 }}>
                          No hay usuarios registrados en el sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Registro de Cuentas */}
        <div className="col-md-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-custom" style={{ marginBottom: 0 }}>
            <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
              ➕ Crear Credencial de Red
            </h5>
            
            <form onSubmit={handleRegistrar} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Nombre Completo</label>
                <input
                  type="text"
                  className="input-custom"
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Nombre de Usuario (Red ID)</label>
                <input
                  type="text"
                  className="input-custom"
                  placeholder="Ej. cmendoza"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Clave de Acceso Inicial</label>
                <input
                  type="password"
                  className="input-custom"
                  placeholder="Mínimo 4 caracteres"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-principal"
                style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                disabled={registrando}
              >
                {registrando ? '⏳ Registrando credencial...' : '➕ Habilitar Operador'}
              </button>
            </form>
          </div>

          {/* Restablecer Contraseña (Admin) */}
          <div className="card-custom">
            <h5 style={{ color: 'var(--color-texto)', marginBottom: 20, fontSize: '1.05rem', fontWeight: 700 }}>
              🔑 Restablecer Contraseña
            </h5>
            <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Seleccionar Operador</label>
                <select
                  className="input-custom"
                  value={resetUser}
                  onChange={e => setResetUser(e.target.value)}
                  style={{ marginBottom: 0, outline: 'none' }}
                  required
                >
                  <option value="">Selecciona un usuario...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.usuario}>
                      {u.nombre} (@{u.usuario})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Nueva Contraseña de Acceso</label>
                <input
                  type="password"
                  className="input-custom"
                  placeholder="Escribe la nueva contraseña"
                  value={resetClave}
                  onChange={e => setResetClave(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-principal"
                style={{ width: '100%', marginTop: 8, justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-acento), #0891b2)' }}
                disabled={reseteando}
              >
                {reseteando ? '⏳ Actualizando clave...' : '💾 Restablecer Clave'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  )
}
