# AnimeWB
Aplicación de escritorio para ver anime de forma gratuita.

## Requisitos Previos

- [Node.js](https://nodejs.org/) instalado en tu sistema.

## Pasos para ejecutar el proyecto

El proyecto está dividido en dos partes principales: un **backend** (API) y un **frontend** (Aplicación de escritorio con React y Electron). Necesitarás ejecutar ambos simultáneamente.

### 1. Iniciar el Backend

El backend se encarga de servir los datos para la aplicación.

1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   ```
3. Inicia el servidor (nota que el archivo es `server.js`, no `index.js`):
   ```bash
   node server.js
   ```
El backend estará ejecutándose y listo para recibir peticiones. Déjalo corriendo en esta terminal.

### 2. Iniciar el Frontend

El frontend es la interfaz de usuario construida con React y empaquetada con Electron.

1. Abre **una nueva terminal** y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   ```
3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

Esto iniciará Vite, compilará el código de React y abrirá automáticamente la ventana de la aplicación de escritorio de AnimeWB.
