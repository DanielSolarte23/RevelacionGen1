# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # instalar dependencias
npm run dev       # desarrollo con auto-reload (nodemon)
npm start         # producción
```

No hay suite de pruebas configurada.

## Variables de entorno

Crear `.env` en la raíz (excluido de git). Referencia en `.env.example`:

```
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/revelacion

# Números con código de país, sin + ni espacios (ej: 573001234567)
WHATSAPP_DANIEL=57XXXXXXXXXX
WHATSAPP_LISSETH=57XXXXXXXXXX

PARENT_DAD_NAME=Daniel
PARENT_MOM_NAME=Lisseth
```

## Arquitectura

App Express de un solo archivo (`app.js`) para una invitación digital de **revelación de género** con temática Dragon Ball. Padres: **Daniel Solarte** y **Lisseth Muñoz**.

### Flujo de confirmación

1. El invitado abre la página → ve un **intro overlay** con animación de las 7 esferas.
2. Pulsa "DESCUBRIR" → se reproduce el audio (`/audio/narrador.mp3`) y aparece el contenido.
3. Elige su predicción (tarjeta Niño 💙 / Niña 💗) → se abre un **modal**.
4. Completa nombre, teléfono opcional y número de asistentes.
5. Elige **"Papá Daniel"** o **"Mamá Lisseth"** → el frontend llama `POST /confirm`.
6. El backend guarda en MongoDB y devuelve una `whatsappUrl`.
7. El frontend abre WhatsApp con mensaje prellenado y actualiza el contador.

### Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Página de invitación |
| POST | `/confirm` | Guarda invitado, devuelve `{ success, whatsappUrl }` |
| GET | `/api/stats` | JSON con contadores (totalGuests, teamBoy, teamGirl) |
| GET | `/admin/revelacion` | Panel admin (sin autenticación — ruta oculta) |
| DELETE | `/admin/guests/:id` | Elimina invitado por ObjectId |

### Modelo Guest (`models/Guest.js`)

- Campos: `name`, `phone`, `numberOfGuests`, `prediction` (boy/girl), `confirmedWith` (daniel/lisseth)
- Índice único en `phone` (sparse — permite nulos)
- Virtuales: `predictionDisplay`, `confirmedWithDisplay`
- Duplicados por teléfono devuelven HTTP 400 con `error.code === 11000`

### Prevención de duplicados

Doble capa: índice único en MongoDB por teléfono + flag `rv_confirmado` en `localStorage` del navegador.

### Assets que el usuario debe proveer

| Ruta | Contenido |
|------|-----------|
| `public/img/goku-bebe.png` | Imagen equipo niño |
| `public/img/pan-bebe.png` | Imagen equipo niña |
| `public/audio/narrador.mp3` | Audio de fondo (narrador Dragon Ball) |

Si los archivos no existen, el CSS tiene fallbacks con emoji para que la página no se rompa.

### Tema visual

- Fuentes: **Bangers** (títulos) + **Rajdhani** (cuerpo) — Google Fonts
- Colores: fondo `#0a0a1a`, oro `#FFD700`, naranja `#FF6B00`, azul equipo `#1E88E5`, rosa equipo `#E91E63`
- Sin librerías CSS externas — todo en `public/css/style.css`
