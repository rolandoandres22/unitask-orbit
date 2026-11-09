#  UniTask - Orbit — Plataforma de Gestión de Tareas y Estudio Universitario Gamificado

**UniTask** es una plataforma web integral diseñada para ayudar a estudiantes universitarios a organizar sus tareas académicas, cooperar en grupos de estudio y mantenerse motivados a través de un sistema de gamificación con rangos, niveles de experiencia (XP), racha de días y recompensas.

##  Características Principales

* **Gestión de Tareas:**
  * Creación, edición, completado y cancelación de tareas individuales y grupales.
  * Asignación de prioridades (`ALTA`, `MEDIA`, `BAJA`) con sistema de recompensas dinámico en experiencia ($XP$).

* **Gamificación y Niveles:**
  * Sistema de rangos académicos dinámicos (`E`, `D`, `C`, `B`, `A`, `S`) en base a $XP$ acumulado.
  * Sumar $XP$ y subir de rango en tiempo real.
  * Cálculo de racha diaria de estudio.
  * Widget interactivo de **Ruleta de Consejos** académicos y productivos.

* **Grupos de Estudio:**
  * Creación de grupos de trabajo con asignación automática del creador como **LÍDER** los invitados como **MIEMBRO**.
  * Sistema de invitaciones con estados (`PENDIENTE`, `ACEPTADA`, `RECHAZADA`).
  * Asignación de misiones grupales por parte del LIDER a integrantes específicos.

* **Red de Estudiantes:**
  * Búsqueda global de usuarios por Nombre Completo o `#user_tag` único.
  * Sistema bidireccional de solicitudes de amistad.

* **Dashboard y Analíticas:**
  * Métricas completas de efectividad, distribución por prioridad y evolución histórica de actividad.

##  Tecnologías Utilizadas

### **Backend**
* **Node.js** con **TypeScript** y **Express**.
* **Supabase** (PostgreSQL, Auth y almacenamiento).
* Despliegue listo para **Vercel Serverless Functions** o en Local.

### **Frontend**
* HTML5, CSS3 y JavaScript.
* Estructura SPA/Multipágina basada en Vistas Modularizadas (`pages/`).
* Comunicación mediante `fetch` dinámico consumiendo los endpoints REST (`/api/*`).

##  Inicialización de la Base de Datos (`config/schema.sql`)

Para clonar la estructura completa de la base de datos (tablas, rangos iniciales, procedimientos RPC y triggers automáticos), sigue estos pasos desde la web de Supabase:

1. Entra a tu proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2. En el menú lateral izquierdo, selecciona **SQL Editor**.
3. Haz clic en el botón **New query**.
4. Abre el archivo `config/schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor SQL de Supabase.
5. Haz clic en el botón **Run** (botón verde en la parte superior derecha).
6. ¡Listo! Se habrán creado todas las tablas, claves foráneas, rangos iniciales, funciones RPC y triggers de gamificación.

##  Estructura del Proyecto

```
unitask/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                # Clientes Supabase (público y admin)
│   │   │   └── schema.sql           # Script DDL completo (Tablas, RPC y Triggers)
│   │   ├── controllers/             # Controladores de la API REST
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── groupController.ts
│   │   │   ├── friendController.ts
│   │   │   ├── ruletaController.ts
│   │   │   └── estadisticasController.ts
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts    # Verificación de Bearer JWT
│   │   ├── routes/                  # Definición de rutas Express
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   ├── groupRoutes.ts
│   │   │   ├── friendRoutes.ts
│   │   │   ├── ruletaRoutes.ts
│   │   │   └── estadisticasRoutes.ts
│   │   ├── services/                # Capa de modelo y consultas a Supabase
│   │   │   ├── authService.ts
│   │   │   ├── taskService.ts
│   │   │   ├── groupService.ts
│   │   │   ├── friendService.ts
│   │   │   ├── ruletaService.ts
│   │   │   └── estadisticasService.ts
│   │   └── app.ts                   # Servidor Express principal
│   ├── server.ts                    # Punto de entrada del backend
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                        # Aplicación cliente web
    ├── css/                         # Estilos globales de la aplicación
    ├── js/                          # Lógica y scripts globales / Helpers de API
    ├── pages/                       # Vistas y módulos de la interfaz de usuario
    │   ├── amigos/                  # Módulo Red de Estudiantes
    │   │   ├── css/
    │   │   ├── js/
    │   │   └── amigos.html
    │   ├── css/                     # Estilos compartidos de maquetación
    │   │   ├── header.css           # Barra superior de navegación y perfil
    │   │   └── menu.css             # Menú lateral principal
    │   ├── dashboard/               # Panel Principal / Misiones Prioritarias
    │   │   ├── css/
    │   │   ├── js/
    │   │   └── dashboard.html
    │   ├── estadisticas/            # Módulo de Analíticas y Gráficos
    │   │   ├── css/
    │   │   ├── js/
    │   │   └── estadisticas.html
    │   ├── grupos/                  # Módulo de Escuadrones y Trabajo Grupal
    │   │   ├── css/
    │   │   ├── js/
    │   │   └── grupos.html
    │   ├── perfil/                  # Ficha del Estudiante y Ajustes de Cuenta
    │   │   ├── css/
    │   │   ├── js/
    │   │   └── perfil.html
    │   └── tareas/                  # Gestor General de Tareas e Historial
    │       ├── css/
    │       ├── js/
    │       └── tareas.html
    ├── index.html                   # Página de Inicio / Landing & Autenticación
    ├── .gitignore
    └── vercel.json                  # Configuración de rutas para despliegue en Versel
```


## Guía Paso a Paso para Levantar el Servidor Local

### 1. Requisitos Previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:

- **Git:** Para clonar el repositorio desde GitHub.
- **Node.js:** Versión 18 o superior.
- **npm:** Gestor de paquetes incluido con Node.js.
- **Supabase:** Proyecto activo con URL y claves de acceso.

### 2. Clonación del Repositorio

Abre una terminal (Git Bash, PowerShell o CMD) y ejecuta el siguiente comando para descargar el código fuente del proyecto:

```bash
git clone https://github.com/rolandoandres22/unitask-orbit.git
```

Una vez finalizada la descarga, accede al directorio del proyecto:

```bash
cd unitask-orbit
```

### 3. Configuración de Variables de Entorno

Dentro de la carpeta `backend/`, crea un archivo llamado `.env` con las siguientes variables:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_publica
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_admin
```

**Importante:** Reemplaza los valores de ejemplo por las credenciales de tu proyecto de Supabase. Nunca compartas la clave `SUPABASE_SERVICE_ROLE_KEY` ni incluyas el archivo `.env` en el repositorio público.

### 4. Instalación de Dependencias

Desde la raíz del proyecto clonado, accede a la carpeta del backend:

```bash
cd backend
```

Instala las dependencias necesarias:

```bash
npm install
```

### 5. Ejecución en Entorno de Desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm run dev
```

El servidor estará disponible en:

`http://localhost:3000`

### 6. Compilación para Producción (Build)

Para compilar el código TypeScript y ejecutar la versión de producción:

```bash
npm run build
npm start
```


##  Notas sobre el Despliegue en Vercel

1. **Configuración `vercel.json`:**
   Asegúrate de incluir el archivo `vercel.json` para redirigir las solicitudes a Express:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/**",
      "use": "@vercel/static"
    },
    {
      "src": "backend/server.ts",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/server.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ]
}
```

##  Licencia y Créditos

Desarrolado por Rolando Andrés Palermo como Trabajo Final de Grado (TFG) para la Licenciatura en Informática. 
Universidad Siglo 21.
