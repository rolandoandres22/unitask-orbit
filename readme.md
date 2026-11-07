# 🎓 UniTask - Orbit — Plataforma de Gestión de Tareas y Estudio Universitario Gamificado

**UniTask** es una plataforma web integral diseñada para ayudar a estudiantes universitarios a organizar sus tareas académicas, cooperar en grupos de estudio y mantenerse motivados a través de un sistema de gamificación con rangos, niveles de experiencia (XP), racha de días y recompensas.

## 🚀 Características Principales

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

## 🛠️ Tecnologías Utilizadas

### **Backend**
* **Node.js** con **TypeScript** y **Express**.
* **Supabase** (PostgreSQL, Auth y almacenamiento).
* Despliegue listo para **Vercel Serverless Functions** o en Local.

### **Frontend**
* HTML5, CSS3 y JavaScript.
* Estructura SPA/Multipágina basada en Vistas Modularizadas (`pages/`).
* Comunicación mediante `fetch` dinámico consumiendo los endpoints REST (`/api/*`).

## 🗄️ Inicialización de la Base de Datos (`config/schema.sql`)

Para clonar la estructura completa de la base de datos (tablas, rangos iniciales, procedimientos RPC y triggers automáticos), sigue estos pasos desde la web de Supabase:

1. Entra a tu proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2. En el menú lateral izquierdo, selecciona **SQL Editor**.
3. Haz clic en el botón **New query**.
4. Abre el archivo `config/schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor SQL de Supabase.
5. Haz clic en el botón **Run** (botón verde en la parte superior derecha).
6. ¡Listo! Se habrán creado todas las tablas, claves foráneas, rangos iniciales, funciones RPC y triggers de gamificación.

## 📂 Estructura del Proyecto

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
│   ├── vercel.json                  # Configuración de Rewrites para Vercel
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

## 💻 Guía Paso a Paso para Levantar el Servidor Local

### **1. Requisitos Previos**

* **Node.js** (v18 o superior).
* **npm** o **yarn**.
* Proyecto activo en **Supabase** (con URL y claves de servicio).

### **2. Configuración de Variables de Entorno**

Crea un archivo `.env` en la raíz de la carpeta `backend/` con las siguientes variables:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_publica
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_admin
```

### **3. Instalación de Dependencias**

Navega a la carpeta del backend e instala los módulos requeridos:

```bash
cd backend
npm install
```

### **4. Ejecución en Entorno de Desarrollo**

Ejecuta el servidor con recarga en vivo:

```bash
npm run dev
```

El servidor estará escuchando en `http://localhost:3000`.

### **5. Compilación para Producción (Build)**

Para verificar la compilación TypeScript a código JavaScript nativo en formato ESM:

```bash
npm run build
npm start
```

## ⚡ Notas sobre el Despliegue en Vercel

1. **Extensiones ESM Obligatorias:**
   Dado que el backend utiliza ES Modules (`"type": "module"` en `package.json`), **todas las importaciones locales** en TypeScript deben incluir la extensión `.js` al final de la ruta del archivo (ejemplo: `import { db } from '../config/db.js';`). Esto previene el error `ERR_MODULE_NOT_FOUND` al ejecutar funciones Serverless en Vercel.

2. **Configuración `vercel.json`:**
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

## 🛡️ Licencia y Créditos

Desarrollado para el proyecto **UniTask**. TFG - Rolando Andres Palermo - Lic. en Informatica - Universidad Siglo 21