# Product Requirements Document

## Nombre del producto

Nutrivon

## Tipo de producto

Web SaaS para nutriólogos.

## Objetivo

Permitir a los nutriólogos crear planes alimenticios personalizados en menos tiempo, con cálculos correctos y presentación profesional.

## Funciones principales del MVP

### Autenticación

- registro
- login
- recuperación de contraseña

### Perfil del nutriólogo

- nombre
- especialidad
- logotipo
- colores de marca

### Gestión de pacientes

- crear paciente
- historial clínico
- objetivos nutricionales
- progreso

### Cálculo energético

Métodos disponibles:

- Harris Benedict
- Mifflin St Jeor
- FAO/OMS

Variables:

- peso
- altura
- edad
- sexo
- actividad física
- objetivo nutricional

### Distribución de macronutrientes

El nutriólogo define:

- proteínas
- grasas
- carbohidratos

El sistema calcula:

- gramos
- porcentaje
- calorías

### Conversión a equivalentes

Sistema basado en:

SMAE (Sistema Mexicano de Alimentos Equivalentes)

### Constructor de menú

El nutriólogo crea:

- desayuno
- colación
- comida
- cena

Agregando alimentos desde la base.

### Base de alimentos

Fuentes:

- SMAE dataset
- alimentos personalizados del nutriólogo
- consultas externas opcionales

### Vista previa del menú

Vista tipo tarjeta para paciente.

### Exportación

PDF con:

- logotipo
- colores del nutriólogo
- plan estructurado

### Historial de planes

Cada paciente guarda versiones de su plan.

## Funciones futuras

- IA para sugerir menús
- generación automática de recetas
- imágenes de alimentos
- enlace interactivo para pacientes
- seguimiento con métricas