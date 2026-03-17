# Claude Development Guide

Este repositorio contiene el código para Nutrivon.

Claude debe seguir estas reglas.

---

# Tech Stack

Frontend

Next.js
React
TailwindCSS

UI Components

shadcn/ui

Icons

lucide-react

Forms

react-hook-form

Validation

zod

Dates

date-fns

---

# Backend

Convex

Convex maneja:

database
queries
mutations
realtime updates
backend logic

No usar APIs REST tradicionales.

Usar funciones de Convex.

---

# Auth

Clerk

Clerk maneja:

signup
login
sessions
OAuth

Convex se conecta con Clerk para identificar usuarios.

---

# Database

Convex Database

Tipo:

document database.

---

# Hosting

Vercel

Deploy automático desde GitHub.

---

# Arquitectura

Browser
↓
Next.js frontend
↓
Convex queries / mutations
↓
Convex Database

Clerk maneja autenticación.

---

# Reglas de desarrollo

1. No inventar lógica nutricional.
2. Usar base SMAE para equivalentes.
3. Mantener funciones pequeñas y claras.
4. Usar queries para lectura.
5. Usar mutations para escritura.
6. Validar datos con Zod.

---

# Estructura del proyecto

/app
/components
/convex
/lib
/styles

---

# Prioridad

Construir primero el MVP:

1. Auth
2. Pacientes
3. Cálculo energético
4. Constructor de menú
5. Exportación PDF

IA se implementa después.

---

# Base alimentaria

Fuentes:

1. dataset SMAE
2. alimentos personalizados
3. búsqueda externa opcional