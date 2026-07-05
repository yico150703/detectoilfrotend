# 🛰️ DetectOil IA — Consola de Monitoreo Espectral y Detección de Hidrocarburos

**DetectOil IA** es una plataforma científica y de telemetría satelital diseñada para el monitoreo de cuencas hidrográficas en la Amazonía (Perú, Ecuador, Colombia). Utiliza modelos de Aprendizaje Profundo (Redes Neuronales Convolucionales) para analizar firmas espectrales e imágenes de radar, detectando derrames de petróleo crudo en tiempo real y alertando a los operadores del sistema.

---

## ✨ Características Principales

### 🔐 Autenticación Completa
- **Login seguro** con validación de credenciales contra backend o localStorage
- **Registro de usuarios** con validación de campos y verificación case-insensitive
- **Roles de usuario** (admin/usuario) con permisos diferenciados
- **Usuario por defecto**: `admin` / `admin123`

### 🎨 Sistema de Temas Claro/Oscuro
- Toggle dinámico entre tema claro y oscuro desde la Topbar
- Diseño moderno con colores suaves en tema claro
- Persistencia de preferencia en localStorage
- Notificaciones Toast adaptadas al tema seleccionado

### 📊 Dashboard con Gráficos Estadísticos
- Gráfico circular (Pie): Distribución Derrames vs. No Derrames
- Gráfico de barras: Alertas por nivel (Alto, Medio, Bajo)
- Contadores animados en tiempo real
- Variables ambientales simuladas (temperatura, humedad, nivel de río)

### 🔔 Notificaciones Toast
- Reemplazo de alerts nativos por notificaciones elegantes
- Feedback visual para todas las acciones del usuario
- Temas adaptables (claro/oscuro)
- Posicionamiento configurable

### 🖼️ Nueva Detección Mejorada
- Validación de archivos (máx 5MB, solo JPG/PNG/TIF)
- Drag & drop para carga de imágenes
- Vista comparativa antes/después del análisis
- Indicadores visuales claros de resultados
- Barras de progreso de confianza IA

### 📋 Historial con Filtros Avanzados
- Buscador de texto múltiple (ID, fecha, ubicación, severidad)
- Filtro dropdown por nivel de alerta
- Filtro por fecha específica
- Contador dinámico de resultados
- **Exportación a CSV** con un clic

### 👥 Gestión de Usuarios
- Módulo administrativo para alta/baja de operadores
- Restablecimiento de contraseñas
- Visualización de lista de usuarios registrados

### 🛡️ Panel de Control y Mitigación de Emergencias (Nivel Admin)
- **Gestión de Zonas Críticas (CRUD)**: Administradores pueden añadir, editar y eliminar sectores de monitoreo de cuencas (coordenadas Lat/Lng, supervisor a cargo y nivel de riesgo base).
- **Planes de Mitigación Activos**: Inserción automática de planes de acción ante derrames (severidad Media/Alta). Permite actualizar bitácoras operacionales e incidentes (Pendiente 🔴, En Curso 🟡, Mitigado 🟢).
- **Calibración de Satélites**: Controles interactivos para calibrar sensores espectrales y desconectar/conectar telemetría satelital (Sentinel, Landsat, SAOCOM).

---

## 🚀 Arquitectura y Stack Tecnológico

El proyecto está dividido en un esquema moderno de cliente-servidor (**Frontend** y **Backend**):

### 🎨 Frontend (Consola del Operador)
* **Framework**: React.js con Vite (rápido y optimizado para desarrollo).
* **Librerías Clave**:
  - `react-router-dom`: Navegación entre páginas
  - `chart.js` + `react-chartjs-2`: Gráficos estadísticos (Pastel y Barras)
  - `react-toastify`: Notificaciones Toast modernas
* **Estilos**: Vanilla CSS con variables de diseño personalizadas (Paleta HSL, tema oscuro/claro dinámico, efectos de cristal translúcido (*glassmorphism*) y micro-animaciones en neón).
* **Componentes Clave**:
  * **Dashboard**: Panel central con telemetría en tiempo real de estaciones hidrométricas simuladas (temperatura subacuática, nivel del caudal del Río Napo y humedad relativa) y contadores animados.
  * **Nueva Detección**: Consola interactiva para cargar imágenes, ingresar metadatos y visualizar el veredicto del escaneo satelital con gráficos circulares interactivos.
  * **Historial**: Registro de telemetría de base de datos con buscadores inteligentes y un visualizador de Fichas de Incidencia Oficiales.
  * **Gestión de Cuentas**: Módulo administrativo para dar de alta/baja a operadores de red y restablecer contraseñas de seguridad.

### ⚙️ Backend (Servidor de Inferencia y Base de Datos)
* **Framework**: Flask (Python) con soporte CORS habilitado para comunicación segura.
* **Inteligencia Artificial**: TensorFlow y Keras. El modelo CNN realiza inferencia binaria (`oil` vs `no_oil`) con carga perezosa (*lazy loading*) para minimizar el consumo de memoria en el arranque.
* **Base de Datos**: PostgreSQL conectado mediante `psycopg2` para persistencia robusta de datos de usuario e incidencias de telemetría.
* **Seguridad**: Cifrado de credenciales mediante hashes seguros de contraseñas (`werkzeug.security`).

---

## 💾 Estructura de la Base de Datos

La base de datos PostgreSQL (`historialdb`) cuenta con cinco tablas relacionales autogestionadas al iniciar el servidor:

```mermaid
erDiagram
    usuarios {
        SERIAL id PK
        VARCHAR usuario UK
        VARCHAR contrasena
        VARCHAR nombre
        VARCHAR rol
        TIMESTAMP fecha_registro
    }
    zonas_monitoreo {
        SERIAL id PK
        VARCHAR nombre UK
        NUMERIC latitud
        NUMERIC longitud
        VARCHAR nivel_riesgo
        TEXT descripcion
        VARCHAR encargado
        TIMESTAMP fecha_registro
    }
    historial {
        SERIAL id PK
        VARCHAR fecha
        VARCHAR lugar
        VARCHAR area
        VARCHAR confianza
        VARCHAR nivel
        VARCHAR resultado
        NUMERIC probabilidad_derrame
        NUMERIC probabilidad_sin_derrame
        TEXT recomendacion
        VARCHAR usuario
        INTEGER zona_id FK
        TIMESTAMP fecha_registro
    }
    alertas_protocolos {
        SERIAL id PK
        INTEGER historial_id FK
        VARCHAR estado
        TEXT comentarios
        VARCHAR operador
        TIMESTAMP fecha_actualizacion
    }
    satelites_sensores {
        SERIAL id PK
        VARCHAR nombre UK
        VARCHAR tipo
        VARCHAR resolucion
        VARCHAR estado
        VARCHAR calibracion
        VARCHAR ultima_pasada
    }
    usuarios ||--o{ historial : "registra"
    zonas_monitoreo ||--o{ historial : "monitorea"
    historial ||--o| alertas_protocolos : "desencadena"
```

---

## ⚙️ Guía de Instalación y Configuración Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/yico150703/detectoilfrotend.git
cd detectoilfrotend
```

### 2. Configurar el Backend (Flask)
1. Navega a la carpeta de backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
3. Configura tus variables de entorno (opcional). Por defecto, el backend busca conectarse al servidor PostgreSQL remoto configurado en la cadena de conexión de `app.py`. Si deseas utilizar una base de datos local, configura tu `DATABASE_URL`:
   ```bash
   # En Windows (PowerShell)
   $env:DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/nombre_bd"
   
   # En Linux/macOS
   export DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/nombre_bd"
   ```
4. Inicia el servidor:
   ```bash
   python app.py
   ```
   *El backend correrá localmente en `http://127.0.0.1:5000` y creará las tablas automáticamente si no existen.*

### 3. Configurar el Frontend (React + Vite)
1. Abre una nueva terminal en la raíz del proyecto y navega a la carpeta de frontend:
   ```bash
   cd frontend
   ```
2. Instala los paquetes de Node:
   ```bash
   npm install
   ```
3. Configura las variables de entorno en el archivo `.env` del frontend:
   ```env
   VITE_API_URL=http://127.0.0.1:5000
   ```
4. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La consola interactiva se abrirá en `http://localhost:5173`.*

---

## 🔑 Cuentas por Defecto
* Al inicializar la base de datos por primera vez, se genera automáticamente una cuenta de administrador maestro para que puedas acceder al sistema:
  * **Usuario**: `admin`
  * **Contraseña**: `1234`
  * **Rol**: `admin` (Tiene permisos completos para borrar registros de historial y gestionar claves de operadores).

---

## 📡 Endpoints de la API Backend

| Método | Ruta | Descripción | Nivel de Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Comprobación de estado del servidor | Público |
| **POST** | `/api/login` | Autenticación y obtención de roles de operador | Público |
| **GET** | `/api/stats` | Métricas agregadas (alertas, áreas estimadas, promedio de precisión) | Operador / Admin |
| **GET** | `/api/actividad` | Últimas 5 detecciones registradas para el feed rápido del panel | Operador / Admin |
| **POST** | `/api/predict` | Carga de imagen espectral, inferencia CNN, registro en BD y auto-protocolización | Operador / Admin |
| **GET** | `/api/historial` | Obtención del historial de telemetría ligado a planes de acción | Operador / Admin |
| **DELETE** | `/api/historial/<id>` | Eliminación física permanente de un reporte de incidencia | Administrador |
| **GET** | `/api/usuarios` | Consulta de operadores de red registrados | Administrador |
| **POST** | `/api/usuarios` | Registro de nuevas credenciales de operadores | Administrador |
| **DELETE** | `/api/usuarios/<id>` | Baja de un operador (excluyendo a la cuenta 'admin' maestra) | Administrador |
| **POST** | `/api/usuarios/change-password` | Cambio de contraseña requiriendo clave actual | Operador / Admin |
| **POST** | `/api/usuarios/reset-password` | Restablecimiento directo de contraseña de un operador | Administrador |
| **GET** | `/api/zonas` | Obtención de la lista de zonas de monitoreo ambiental | Operador / Admin |
| **POST** | `/api/zonas` | Creación de una nueva zona geográfica de vigilancia | Administrador |
| **PUT** | `/api/zonas/<id>` | Actualización de coordenadas, supervisor y riesgo base de la zona | Administrador |
| **DELETE** | `/api/zonas/<id>` | Eliminación física de una zona de monitoreo | Administrador |
| **GET** | `/api/satelites` | Obtención de telemetría y estado de sensores satelitales | Operador / Admin |
| **PUT** | `/api/satelites/<id>` | Cambio de estado de sensor o simulación de calibración | Administrador |
| **GET** | `/api/protocolos` | Consulta de incidentes y planes de mitigación de emergencia | Operador / Admin |
| **PUT** | `/api/protocolos/<id>` | Actualización de bitácora técnica y cambio del estado de control | Administrador |

---

## ☁️ Despliegue en la Nube
El proyecto está optimizado para desplegarse fácilmente en plataformas modernas:
* **Frontend**: Diseñado para subirse de manera estática a **Vercel** o **Netlify**.
* **Backend**: Preparado para servicios de contenedores o web apps como **Render**, **Heroku** o **Railway** (usando la base de datos PostgreSQL correspondiente configurada en `DATABASE_URL`).
