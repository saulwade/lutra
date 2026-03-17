# Nutrivon – Visión General

Nutrivon es una SaaS B2B para nutriólogos que centraliza:
- Gestión de pacientes con datos antropométricos
- Cálculo de requerimientos energéticos (Mifflin-St Jeor, Harris-Benedict)
- Construcción de planes alimenticios con base SMAE
- Exportación de planes en PDF con branding del nutriólogo

## Stack

- Frontend: Next.js 16, React 19, Tailwind CSS v4
- UI: shadcn/ui, lucide-react
- Backend: Convex (serverless + realtime)
- Auth: Clerk
- Hosting: Vercel

## Módulos MVP

1. Auth (Clerk)
2. Perfil del nutriólogo
3. Pacientes (CRUD + antropometría)
4. Motor de cálculo energético
5. Constructor de planes alimenticios
6. Base SMAE (2,870 alimentos)
7. Recetas
8. Preview + PDF
