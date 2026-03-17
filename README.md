# Nutrivon

SaaS para nutriólogos — gestión de pacientes, cálculo energético, planes SMAE y exportación PDF.

## Stack

- **Next.js 16** + **React 19** + **Tailwind CSS v4**
- **Convex** (backend serverless + realtime DB)
- **Clerk** (autenticación)
- **Vercel** (hosting)

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
# Edita .env.local con tus claves de Clerk y Convex
```

### 3. Inicializar Convex

```bash
npx convex dev
```

Esto genera `convex/_generated/` con tipos reales y reemplaza los stubs.

### 4. Sembrar la base SMAE

```bash
npm run smae:normalize   # Normaliza el JSON raw
npm run smae:seed        # Carga 2,870 alimentos a Convex
```

### 5. Correr en desarrollo

```bash
# Terminal 1
npx convex dev

# Terminal 2
npm run dev
```

Abre http://localhost:3000

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run convex:dev` | Backend Convex |
| `npm run smae:normalize` | Normaliza SMAE JSON |
| `npm run smae:seed` | Carga SMAE a Convex |

## Estructura

```
convex/          Backend (queries, mutations, schema)
src/app/         Next.js App Router
src/components/  UI components (shadcn + layout)
src/features/    Feature modules (patients, plans, foods, recipes)
src/lib/         Utils, schemas, nutrition calculator
src/hooks/       React hooks
src/data/        SMAE normalizado (JSON)
src/scripts/     Scripts de normalización y seed
docs/            Documentación del proyecto
```

## Notas importantes

- Los archivos `convex/_generated/*.ts` son **stubs** hasta correr `npx convex dev`
- La base SMAE incluye 2,870 alimentos del Sistema Mexicano de Alimentos Equivalentes
- El motor de cálculo usa Mifflin-St Jeor por defecto (configurable por paciente)
- El middleware de Clerk protege todas las rutas excepto `/`, `/login`, `/signup`
