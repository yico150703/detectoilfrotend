# ============================================================
# app.py — Backend principal DetectOil IA
# Framework: Flask
# ============================================================

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf
import numpy as np
import json
import re
from pathlib import Path
import psycopg2
from urllib.parse import urlparse, parse_qs
import random
from werkzeug.security import generate_password_hash, check_password_hash

# Creamos la aplicación Flask
app = Flask(__name__)

# Habilitamos CORS para conectar React con Flask
# Permitir orígenes específicos (vuelve a configurar con tus dominios reales)
ALLOWED_ORIGINS = [
    "https://detectoilfrotend.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    re.compile(r"^https://.*\.vercel\.app$"),
]

# Para pruebas rápidas puedes usar '*' pero en producción restringe a tus dominios.
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# ============================================================
# CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
# ============================================================

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:LTVkJ42YAvaGLCK3zreh@158.220.114.139:5566/historialdb?schema=public"
)

def get_db_connection():
    try:
        parsed = urlparse(DATABASE_URL)
        queries = parse_qs(parsed.query)
        schema = queries.get('schema', ['public'])[0]
        
        # Limpiamos el parámetro 'schema' para evitar que falle libpq
        clean_query = ""
        query_params = []
        for k, v in queries.items():
            if k != 'schema':
                for val in v:
                    query_params.append(f"{k}={val}")
        if query_params:
            clean_query = "?" + "&".join(query_params)
            
        clean_url = parsed._replace(query=clean_query.lstrip('?')).geturl()
        
        conn = psycopg2.connect(clean_url)
        
        if schema:
            with conn.cursor() as cur:
                if re.match(r'^[a-zA-Z0-9_]+$', schema):
                    cur.execute(f'SET search_path TO "{schema}";')
                else:
                    cur.execute('SET search_path TO "public";')
        return conn
    except Exception as e:
        print(f"Error de conexión a la base de datos: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                # Crear tabla zonas_monitoreo primero (referenciada por historial)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS zonas_monitoreo (
                        id SERIAL PRIMARY KEY,
                        nombre VARCHAR(150) UNIQUE NOT NULL,
                        latitud NUMERIC,
                        longitud NUMERIC,
                        nivel_riesgo VARCHAR(50) DEFAULT 'bajo',
                        descripcion TEXT,
                        encargado VARCHAR(150),
                        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)

                # Crear tabla historial
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS historial (
                        id SERIAL PRIMARY KEY,
                        fecha VARCHAR(100),
                        lugar VARCHAR(255),
                        area VARCHAR(50),
                        confianza VARCHAR(50),
                        nivel VARCHAR(50),
                        resultado VARCHAR(100),
                        probabilidad_derrame NUMERIC,
                        probabilidad_sin_derrame NUMERIC,
                        recomendacion TEXT,
                        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Crear tabla usuarios
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS usuarios (
                        id SERIAL PRIMARY KEY,
                        usuario VARCHAR(150) UNIQUE NOT NULL,
                        contrasena VARCHAR(256) NOT NULL,
                        nombre VARCHAR(150),
                        rol VARCHAR(50) DEFAULT 'usuario',
                        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Crear tabla alertas_protocolos (referencia a historial)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS alertas_protocolos (
                        id SERIAL PRIMARY KEY,
                        historial_id INTEGER REFERENCES historial(id) ON DELETE CASCADE,
                        estado VARCHAR(50) DEFAULT 'pendiente',
                        comentarios TEXT,
                        operador VARCHAR(150) DEFAULT 'admin',
                        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Crear tabla satelites_sensores
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS satelites_sensores (
                        id SERIAL PRIMARY KEY,
                        nombre VARCHAR(100) UNIQUE NOT NULL,
                        tipo VARCHAR(50),
                        resolucion VARCHAR(50),
                        estado VARCHAR(50) DEFAULT 'activo',
                        calibracion VARCHAR(50) DEFAULT '100%',
                        ultima_pasada VARCHAR(100)
                    );
                """)

                # Asegurar columna rol si la tabla ya existía
                try:
                    cur.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';")
                except Exception as migration_e:
                    print(f"Migración de rol ignorada o no compatible: {migration_e}")

                # Asegurar columna usuario en historial si la tabla ya existía
                try:
                    cur.execute("ALTER TABLE historial ADD COLUMN IF NOT EXISTS usuario VARCHAR(150) DEFAULT 'admin';")
                except Exception as migration_historial_e:
                    print(f"Migración de usuario en historial ignorada o no compatible: {migration_historial_e}")

                # Asegurar columna zona_id en historial para relación con zonas_monitoreo
                try:
                    cur.execute("ALTER TABLE historial ADD COLUMN IF NOT EXISTS zona_id INTEGER;")
                except Exception as migration_zona_e:
                    print(f"Migración de zona_id en historial ignorada o no compatible: {migration_zona_e}")
                
                # Semilla de usuario admin por defecto
                cur.execute("SELECT COUNT(*) FROM usuarios")
                if cur.fetchone()[0] == 0:
                    hashed_pw = generate_password_hash("1234")
                    cur.execute("""
                        INSERT INTO usuarios (usuario, contrasena, nombre, rol)
                        VALUES (%s, %s, %s, %s)
                    """, ("admin", hashed_pw, "Administrador", "admin"))
                else:
                    # Asegurar que admin tenga el rol 'admin'
                    cur.execute("UPDATE usuarios SET rol = 'admin' WHERE usuario = 'admin'")

                # Semilla de zonas de monitoreo críticas
                cur.execute("SELECT COUNT(*) FROM zonas_monitoreo")
                if cur.fetchone()[0] == 0:
                    zonas_seed = [
                        ('Loreto, Perú', -3.7491, -73.2538, 'alto', 'Cuenca del río Amazonas, zona de alta sensibilidad ecológica y tráfico de crudo.', 'Ing. Carlos Mendoza'),
                        ('Napo, Ecuador', -0.4285, -77.0125, 'medio', 'Sector de explotación petrolera en la provincia del Napo y afluentes.', 'Dra. Elena Rivas'),
                        ('Sucumbíos, Ecuador', 0.0886, -76.8858, 'alto', 'Área fronteriza con alta actividad de refinamiento e infraestructura de oleoductos.', 'Ing. Alberto Ortiz'),
                        ('Putumayo, Colombia', 0.9856, -76.4382, 'medio', 'Monitoreo de ductos principales y afluentes sensibles del río Putumayo.', 'Lic. Sofía Duarte')
                    ]
                    for z in zonas_seed:
                        cur.execute("""
                            INSERT INTO zonas_monitoreo (nombre, latitud, longitud, nivel_riesgo, descripcion, encargado)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, z)

                # Semilla de satélites y sensores activos
                cur.execute("SELECT COUNT(*) FROM satelites_sensores")
                if cur.fetchone()[0] == 0:
                    sat_seed = [
                        ('Sentinel-2A', 'Óptico', '10m', 'activo', '98.5%', 'Hace 30 minutos'),
                        ('Sentinel-1B', 'Radar SAR', '20m', 'activo', '99.1%', 'Hace 2 horas'),
                        ('Landsat-9', 'Óptico', '15m', 'activo', '95.2%', 'Hace 5 horas'),
                        ('SAOCOM-1B', 'Radar Banda L', '30m', 'calibrando', '88.0%', 'Hace 1 día')
                    ]
                    for s in sat_seed:
                        cur.execute("""
                            INSERT INTO satelites_sensores (nombre, tipo, resolucion, estado, calibracion, ultima_pasada)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, s)

                conn.commit()
            print("Base de datos inicializada correctamente (tablas y semillas satelitales listas)")
        except Exception as e:
            print(f"Error al inicializar la base de datos: {e}")
        finally:
            conn.close()

# Inicializamos la base de datos al arrancar
init_db()

# ============================================================
# CARGA DEL MODELO ENTRENADO (Lazy Loading)
# ============================================================

MODEL_PATH = Path("models/detectoil_model.keras")
CLASSES_PATH = Path("models/class_names.json")

model = None
class_names = None

def load_model_if_needed():
    """Carga el modelo solo cuando se necesita (lazy loading)"""
    global model, class_names
    if model is None:
        print("Cargando modelo...")
        model = tf.keras.models.load_model(MODEL_PATH)
        with open(CLASSES_PATH, "r") as f:
            class_names = json.load(f)
        print("Modelo cargado correctamente")
        print("Clases:", class_names)


# ============================================================
# RUTA DE PRUEBA
# ============================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Backend DetectOil IA funcionando correctamente"
    })


# ============================================================
# RUTA LOGIN (Autenticación con Base de Datos)
# ============================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    usuario = data.get("usuario")
    clave = data.get("clave")

    if not usuario or not clave:
        return jsonify({
            "success": False,
            "message": "Falta ingresar el usuario o la contraseña."
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo establecer conexión con la base de datos."
        }), 500

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT contrasena, nombre, rol FROM usuarios WHERE usuario = %s", (usuario,))
            row = cur.fetchone()
            if row:
                contrasena_hash, nombre, rol = row
                if check_password_hash(contrasena_hash, clave):
                    return jsonify({
                        "success": True,
                        "usuario": usuario,
                        "nombre": nombre,
                        "rol": rol or "usuario"
                    })
        return jsonify({
            "success": False,
            "message": "Usuario o contraseña incorrectos."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al procesar la autenticación: {str(e)}"
        }), 500
    finally:
        conn.close()


# ============================================================
# ENDPOINTS PARA GESTIÓN DE USUARIOS
# ============================================================

@app.route("/api/usuarios", methods=["GET"])
def get_usuarios():
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, usuario, nombre, fecha_registro FROM usuarios ORDER BY id ASC")
            rows = cur.fetchall()
            
            usuarios_list = []
            for row in rows:
                usuarios_list.append({
                    "id": row[0],
                    "usuario": row[1],
                    "nombre": row[2] or "Sin nombre",
                    "fecha_registro": row[3].strftime("%Y-%m-%d %H:%M:%S") if row[3] else "No registrada"
                })
            
            return jsonify({
                "success": True,
                "data": usuarios_list
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al consultar usuarios: {str(e)}"
        }), 500
    finally:
        conn.close()


@app.route("/api/usuarios", methods=["POST"])
def create_usuario():
    data = request.get_json()
    usuario = data.get("usuario")
    contrasena = data.get("contrasena")
    nombre = data.get("nombre", "")

    if not usuario or not contrasena:
        return jsonify({
            "success": False,
            "message": "El nombre de usuario y la contraseña son requeridos."
        }), 400

    # Validar formato simple del usuario (sólo alfanumérico y guiones)
    if not re.match(r'^[a-zA-Z0-9_-]+$', usuario):
        return jsonify({
            "success": False,
            "message": "El nombre de usuario sólo puede contener letras, números, guiones y guiones bajos."
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500

    try:
        hashed_pw = generate_password_hash(contrasena)
        with conn.cursor() as cur:
            # Verificar si ya existe
            cur.execute("SELECT COUNT(*) FROM usuarios WHERE usuario = %s", (usuario,))
            if cur.fetchone()[0] > 0:
                return jsonify({
                    "success": False,
                    "message": f"El nombre de usuario '{usuario}' ya está registrado."
                }), 400

            cur.execute("""
                INSERT INTO usuarios (usuario, contrasena, nombre)
                VALUES (%s, %s, %s)
            """, (usuario, hashed_pw, nombre))
            conn.commit()
            return jsonify({
                "success": True,
                "message": f"Usuario '{usuario}' registrado correctamente."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al registrar usuario: {str(e)}"
        }), 500
    finally:
        conn.close()


@app.route("/api/usuarios/<int:user_id>", methods=["DELETE"])
def delete_usuario(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500

    try:
        with conn.cursor() as cur:
            # Obtener el nombre de usuario
            cur.execute("SELECT usuario FROM usuarios WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({
                    "success": False,
                    "message": "Usuario no encontrado."
                }), 404
            
            usuario = row[0]
            
            # Impedir eliminar el administrador principal
            if usuario == "admin":
                return jsonify({
                    "success": False,
                    "message": "El usuario administrador principal 'admin' no puede ser eliminado del sistema."
                }), 400

            cur.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
            conn.commit()
            return jsonify({
                "success": True,
                "message": f"Usuario '{usuario}' eliminado correctamente."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al eliminar usuario: {str(e)}"
        }), 500
    finally:
        conn.close()


@app.route("/api/usuarios/change-password", methods=["POST"])
def change_password():
    data = request.get_json()
    usuario = data.get("usuario")
    clave_actual = data.get("clave_actual")
    clave_nueva = data.get("clave_nueva")

    if not usuario or not clave_actual or not clave_nueva:
        return jsonify({
            "success": False,
            "message": "Todos los campos son requeridos."
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500

    try:
        with conn.cursor() as cur:
            # Buscar el usuario
            cur.execute("SELECT contrasena FROM usuarios WHERE usuario = %s", (usuario,))
            row = cur.fetchone()
            if not row:
                return jsonify({
                    "success": False,
                    "message": "Usuario no encontrado."
                }), 404
            
            hashed_pw = row[0]
            # Validar la contraseña antigua
            if not check_password_hash(hashed_pw, clave_actual):
                return jsonify({
                    "success": False,
                    "message": "La contraseña actual es incorrecta."
                }), 400
                
            # Generar hash de la nueva contraseña y actualizar
            new_hashed_pw = generate_password_hash(clave_nueva)
            cur.execute("UPDATE usuarios SET contrasena = %s WHERE usuario = %s", (new_hashed_pw, usuario))
            conn.commit()
            return jsonify({
                "success": True,
                "message": "Contraseña cambiada exitosamente."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al cambiar la contraseña: {str(e)}"
        }), 500
    finally:
        conn.close()


@app.route("/api/usuarios/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    usuario = data.get("usuario")
    clave_nueva = data.get("clave_nueva")

    if not usuario or not clave_nueva:
        return jsonify({
            "success": False,
            "message": "Falta especificar el usuario o la nueva contraseña."
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500

    try:
        with conn.cursor() as cur:
            # Actualizar contraseña sin pedir clave actual (función de administrador)
            new_hashed_pw = generate_password_hash(clave_nueva)
            cur.execute("UPDATE usuarios SET contrasena = %s WHERE usuario = %s", (new_hashed_pw, usuario))
            conn.commit()
            return jsonify({
                "success": True,
                "message": f"Contraseña del usuario @{usuario} actualizada exitosamente."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al restablecer la contraseña: {str(e)}"
        }), 500
    finally:
        conn.close()


# ============================================================
# ENDPOINTS PARA MÉTRICAS Y ACTIVIDAD (Dashboard Inicio)
# ============================================================

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500
    
    try:
        with conn.cursor() as cur:
            # 1. Total análisis realizados (todos los registros en el historial)
            cur.execute("SELECT COUNT(*) FROM historial")
            total_analisis = cur.fetchone()[0]

            # 2. Total derrames detectados (nivel alto o medio)
            cur.execute("SELECT COUNT(*) FROM historial WHERE nivel IN ('alto', 'medio')")
            derrames = cur.fetchone()[0]
            
            # 3. Alertas críticas (donde nivel = 'alto')
            cur.execute("SELECT COUNT(*) FROM historial WHERE nivel = 'alto'")
            alertas_criticas = cur.fetchone()[0]
            
            # 4. Suma de área afectada en km²
            # Extraemos la parte numérica (ej: '3.2 km²' -> 3.2)
            cur.execute("""
                SELECT SUM(
                    CAST(
                        NULLIF(
                            SPLIT_PART(area, ' ', 1), 
                            ''
                        ) AS NUMERIC
                    )
                ) 
                FROM historial 
                WHERE area IS NOT NULL AND area LIKE '%km%'
            """)
            area_sum = cur.fetchone()[0]
            area_sum = round(float(area_sum), 1) if area_sum is not None else 0.0
            
            # 5. Confianza promedio de la IA (ej: '91.23%' -> 91.23)
            cur.execute("""
                SELECT AVG(
                    CAST(
                        NULLIF(
                            RTRIM(confianza, '%'), 
                            ''
                        ) AS NUMERIC
                    )
                ) 
                FROM historial 
                WHERE confianza IS NOT NULL
            """)
            avg_conf = cur.fetchone()[0]
            avg_conf = round(float(avg_conf), 1) if avg_conf is not None else 0.0
            
            return jsonify({
                "success": True,
                "total_analisis": total_analisis,
                "derrames": derrames,
                "alertas_criticas": alertas_criticas,
                "area_afectada": area_sum,
                "precision_promedio": avg_conf
            })
    except Exception as e:
        return jsonify({
            "success": True,
            "total_analisis": 0,
            "derrames": 0,
            "alertas_criticas": 0,
            "area_afectada": 0.0,
            "precision_promedio": 0.0,
            "note": f"Fallback: {str(e)}"
        })
    finally:
        conn.close()


@app.route("/api/actividad", methods=["GET"])
def get_actividad():
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT fecha, lugar, area, nivel 
                FROM historial 
                ORDER BY id DESC 
                LIMIT 5
            """)
            rows = cur.fetchall()
            
            actividad_list = []
            for row in rows:
                actividad_list.append({
                    "fecha": row[0],
                    "lugar": row[1],
                    "area": row[2],
                    "nivel": row[3]
                })
            
            return jsonify({
                "success": True,
                "data": actividad_list
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al consultar la actividad: {str(e)}"
        }), 500
    finally:
        conn.close()


# ============================================================
# RUTA DE PREDICCIÓN
# ============================================================

@app.route("/api/predict", methods=["POST"])
def predict():
    # Cargar modelo solo cuando se necesita
    load_model_if_needed()
    
    if "imagen" not in request.files:
        return jsonify({
            "success": False,
            "message": "No se envió ninguna imagen."
        }), 400

    file = request.files["imagen"]

    # Datos opcionales enviados desde el frontend
    fecha = request.form.get("fecha", "No especificada")
    zona = request.form.get("zona", "No especificada")
    usuario = request.form.get("usuario", "admin")

    try:
        # Abrimos la imagen, la convertimos a escala de grises y la redimensionamos
        img = Image.open(file).convert("L")
        img = img.resize((128, 128))

        # Convertimos la imagen a arreglo numérico
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=-1)
        img_array = np.expand_dims(img_array, axis=0)

        # Predicción del modelo
        prediccion = model.predict(img_array)[0][0]

        # Como el modelo usa sigmoid:
        # cercano a 0 = no_oil
        # cercano a 1 = oil
        probabilidad_derrame = float(prediccion)
        probabilidad_sin_derrame = 1 - probabilidad_derrame

        if probabilidad_derrame >= 0.5:
            resultado = "Derrame detectado"
            clase_tecnica = "oil"
            confianza = probabilidad_derrame
        else:
            resultado = "Sin indicios de derrame"
            clase_tecnica = "no_oil"
            confianza = probabilidad_sin_derrame

        # Nivel de alerta según probabilidad
        if probabilidad_derrame >= 0.75:
            nivel_alerta = "Alto"
            recomendacion = "Se recomienda realizar una verificación adicional y reportar la posible presencia de hidrocarburos en la zona monitoreada."
        elif probabilidad_derrame >= 0.5:
            nivel_alerta = "Medio"
            recomendacion = "Se identifican posibles indicios de derrame. Se recomienda continuar con el monitoreo y validar la imagen."
        else:
            nivel_alerta = "Bajo"
            recomendacion = "No se identifican indicios relevantes de derrame. Se recomienda mantener el monitoreo preventivo."

        # Guardar en base de datos de historial
        conn = get_db_connection()
        new_historial_id = None
        nombre_lugar = zona if zona and zona != "No especificada" else "No especificada"
        
        if conn:
            try:
                with conn.cursor() as cur:
                    # Si es derrame, generamos un área simulada realista (e.g. 1.0 a 6.0 km²), de lo contrario 0 km²
                    if clase_tecnica == 'oil':
                        area_val = f"{round(random.uniform(1.0, 6.0), 1)} km²"
                    else:
                        area_val = "0 km²"
                    
                    confianza_str = f"{round(confianza * 100, 2)}%"
                    nivel_val = nivel_alerta.lower()
                    
                    # Buscar la zona en la BD para obtener su ID y nombre real
                    zona_id = None
                    if zona and zona != "No especificada":
                        try:
                            if str(zona).isdigit():
                                cur.execute("SELECT id, nombre FROM zonas_monitoreo WHERE id = %s", (int(zona),))
                            else:
                                cur.execute("SELECT id, nombre FROM zonas_monitoreo WHERE nombre = %s", (zona,))
                            z_row = cur.fetchone()
                            if z_row:
                                zona_id = z_row[0]
                                nombre_lugar = z_row[1]
                        except Exception as z_err:
                            print(f"Error al buscar zona: {z_err}")
                    
                    cur.execute("""
                        INSERT INTO historial (fecha, lugar, area, confianza, nivel, resultado, probabilidad_derrame, probabilidad_sin_derrame, recomendacion, usuario, zona_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        fecha if fecha and fecha != "No especificada" else "No especificada",
                        nombre_lugar,
                        area_val,
                        confianza_str,
                        nivel_val,
                        resultado,
                        round(probabilidad_derrame * 100, 2),
                        round(probabilidad_sin_derrame * 100, 2),
                        recomendacion,
                        usuario,
                        zona_id
                    ))
                    new_historial_id = cur.fetchone()[0]
                    
                    # Si el nivel es medio o alto, crear un protocolo de mitigación automático
                    if nivel_val in ['alto', 'medio']:
                        comentarios_iniciales = f"Protocolo de emergencia activado automáticamente por alerta de nivel {nivel_val.upper()} tras análisis satelital en la zona {nombre_lugar}."
                        cur.execute("""
                            INSERT INTO alertas_protocolos (historial_id, estado, comentarios, operador)
                            VALUES (%s, %s, %s, %s)
                        """, (new_historial_id, 'pendiente', comentarios_iniciales, usuario))

                    conn.commit()
            except Exception as e:
                print(f"Error al guardar historial en BD: {e}")
            finally:
                conn.close()

        return jsonify({
            "success": True,
            "resultado": resultado,
            "clase_tecnica": clase_tecnica,
            "confianza": round(confianza * 100, 2),
            "probabilidad_derrame": round(probabilidad_derrame * 100, 2),
            "probabilidad_sin_derrame": round(probabilidad_sin_derrame * 100, 2),
            "nivel_alerta": nivel_alerta,
            "fecha": fecha,
            "zona": nombre_lugar,
            "recomendacion": recomendacion
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al procesar la imagen: {str(e)}"
        }), 500


# ============================================================
# RUTA DE HISTORIAL
# ============================================================

@app.route("/api/historial", methods=["GET"])
def get_historial():
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos de historial."
        }), 500
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT h.id, h.fecha, h.lugar, h.area, h.confianza, h.nivel, h.resultado, 
                       h.probabilidad_derrame, h.probabilidad_sin_derrame, h.recomendacion, h.usuario,
                       ap.estado, ap.comentarios, ap.operador, ap.id
                FROM historial h
                LEFT JOIN alertas_protocolos ap ON h.id = ap.historial_id
                ORDER BY h.id DESC
            """)
            rows = cur.fetchall()
            
            historial_list = []
            for row in rows:
                historial_list.append({
                    "id": f"#{row[0]:03d}" if isinstance(row[0], int) else f"#{row[0]}",
                    "id_numerico": row[0],
                    "fecha": row[1],
                    "lugar": row[2],
                    "area": row[3],
                    "confianza": row[4],
                    "nivel": row[5],
                    "resultado": row[6],
                    "probabilidad_derrame": float(row[7]) if row[7] is not None else 0.0,
                    "probabilidad_sin_derrame": float(row[8]) if row[8] is not None else 0.0,
                    "recomendacion": row[9],
                    "usuario": row[10] if row[10] else "admin",
                    "protocolo": {
                        "estado": row[11] if row[11] else "no_aplica",
                        "comentarios": row[12] if row[12] else "",
                        "operador": row[13] if row[13] else "",
                        "id": row[14] if row[14] else None
                    }
                })
            
            return jsonify({
                "success": True,
                "data": historial_list
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al consultar el historial: {str(e)}"
        }), 500
    finally:
        conn.close()


@app.route("/api/historial/<int:rec_id>", methods=["DELETE"])
def delete_historial(rec_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "No se pudo conectar a la base de datos."
        }), 500
    
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM historial WHERE id = %s", (rec_id,))
            conn.commit()
            return jsonify({
                "success": True,
                "message": f"Detección #{rec_id} eliminada exitosamente."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al eliminar la detección: {str(e)}"
        }), 500
    finally:
        conn.close()


# ============================================================
# ENDPOINTS ADICIONALES (Zonas, Satélites, Protocolos)
# ============================================================

@app.route("/api/zonas", methods=["GET"])
def get_zonas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, nombre, latitud, longitud, nivel_riesgo, descripcion, encargado FROM zonas_monitoreo ORDER BY id ASC")
            rows = cur.fetchall()
            zonas = []
            for r in rows:
                zonas.append({
                    "id": r[0],
                    "nombre": r[1],
                    "latitud": float(r[2]) if r[2] is not None else 0.0,
                    "longitud": float(r[3]) if r[3] is not None else 0.0,
                    "nivel_riesgo": r[4],
                    "descripcion": r[5] or "",
                    "encargado": r[6] or "Sin asignar"
                })
            return jsonify({"success": True, "data": zonas})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/zonas", methods=["POST"])
def add_zona():
    data = request.get_json() or {}
    nombre = data.get("nombre")
    latitud = data.get("latitud", 0.0)
    longitud = data.get("longitud", 0.0)
    nivel_riesgo = data.get("nivel_riesgo", "bajo")
    descripcion = data.get("descripcion", "")
    encargado = data.get("encargado", "")

    if not nombre:
        return jsonify({"success": False, "message": "El nombre de la zona es obligatorio."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO zonas_monitoreo (nombre, latitud, longitud, nivel_riesgo, descripcion, encargado)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (nombre, latitud, longitud, nivel_riesgo, descripcion, encargado))
            conn.commit()
            return jsonify({"success": True, "message": f"Zona '{nombre}' agregada con éxito."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/zonas/<int:zona_id>", methods=["PUT"])
def update_zona(zona_id):
    data = request.get_json() or {}
    nombre = data.get("nombre")
    latitud = data.get("latitud")
    longitud = data.get("longitud")
    nivel_riesgo = data.get("nivel_riesgo")
    descripcion = data.get("descripcion")
    encargado = data.get("encargado")

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE zonas_monitoreo
                SET nombre=%s, latitud=%s, longitud=%s, nivel_riesgo=%s, descripcion=%s, encargado=%s
                WHERE id=%s
            """, (nombre, latitud, longitud, nivel_riesgo, descripcion, encargado, zona_id))
            conn.commit()
            return jsonify({"success": True, "message": "Zona actualizada con éxito."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/zonas/<int:zona_id>", methods=["DELETE"])
def delete_zona(zona_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT nombre FROM zonas_monitoreo WHERE id = %s", (zona_id,))
            z_row = cur.fetchone()
            if not z_row:
                return jsonify({"success": False, "message": "Zona no encontrada."}), 404
            
            cur.execute("DELETE FROM zonas_monitoreo WHERE id = %s", (zona_id,))
            conn.commit()
            return jsonify({"success": True, "message": f"Zona '{z_row[0]}' eliminada con éxito."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/satelites", methods=["GET"])
def get_satelites():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, nombre, tipo, resolucion, estado, calibracion, ultima_pasada FROM satelites_sensores ORDER BY id ASC")
            rows = cur.fetchall()
            satelites = []
            for r in rows:
                satelites.append({
                    "id": r[0],
                    "nombre": r[1],
                    "tipo": r[2],
                    "resolucion": r[3],
                    "estado": r[4],
                    "calibracion": r[5],
                    "ultima_pasada": r[6]
                })
            return jsonify({"success": True, "data": satelites})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/satelites/<int:sat_id>", methods=["PUT"])
def update_satelite(sat_id):
    data = request.get_json() or {}
    estado = data.get("estado")
    calibracion = data.get("calibracion")
    ultima_pasada = data.get("ultima_pasada")

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT nombre, estado, calibracion, ultima_pasada FROM satelites_sensores WHERE id = %s", (sat_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"success": False, "message": "Satélite no encontrado."}), 404
            
            new_estado = estado if estado is not None else row[1]
            new_calib = calibracion if calibracion is not None else row[2]
            new_pasada = ultima_pasada if ultima_pasada is not None else row[3]

            cur.execute("""
                UPDATE satelites_sensores
                SET estado = %s, calibracion = %s, ultima_pasada = %s
                WHERE id = %s
            """, (new_estado, new_calib, new_pasada, sat_id))
            conn.commit()
            return jsonify({"success": True, "message": f"Satélite '{row[0]}' actualizado con éxito."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/protocolos", methods=["GET"])
def get_protocolos():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ap.id, ap.historial_id, ap.estado, ap.comentarios, ap.operador, ap.fecha_actualizacion,
                       h.fecha, h.lugar, h.nivel, h.resultado
                FROM alertas_protocolos ap
                JOIN historial h ON ap.historial_id = h.id
                ORDER BY ap.id DESC
            """)
            rows = cur.fetchall()
            protocolos = []
            for r in rows:
                protocolos.append({
                    "id": r[0],
                    "historial_id": r[1],
                    "estado": r[2],
                    "comentarios": r[3] or "",
                    "operador": r[4] or "admin",
                    "fecha_actualizacion": r[5].strftime("%Y-%m-%d %H:%M:%S") if r[5] else "",
                    "deteccion": {
                        "fecha": r[6],
                        "lugar": r[7],
                        "nivel": r[8],
                        "resultado": r[9]
                    }
                })
            return jsonify({"success": True, "data": protocolos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/protocolos/<int:prot_id>", methods=["PUT"])
def update_protocolo(prot_id):
    data = request.get_json() or {}
    estado = data.get("estado")
    comentarios = data.get("comentarios")
    operador = data.get("operador", "admin")

    if not estado:
        return jsonify({"success": False, "message": "El estado del protocolo es obligatorio."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "No hay conexión a BD."}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM alertas_protocolos WHERE id = %s", (prot_id,))
            if not cur.fetchone():
                return jsonify({"success": False, "message": "Protocolo no encontrado."}), 404

            cur.execute("""
                UPDATE alertas_protocolos
                SET estado = %s, comentarios = %s, operador = %s, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (estado, comentarios, operador, prot_id))
            conn.commit()
            return jsonify({"success": True, "message": "Protocolo de mitigación actualizado con éxito."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ============================================================
# EJECUCIÓN DEL SERVIDOR
# ============================================================

if __name__ == "__main__":
    app.run(debug=True)
