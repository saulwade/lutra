# Database Schema

Database: Convex Database
Tipo: Document Database

Las relaciones se manejan por ids.

---

## users

Gestionado principalmente por Clerk.

Campos adicionales en Convex:

_id
clerkId
email
name
role
createdAt

---

## nutritionists

_id
userId
name
brandColor
logoUrl
specialty
createdAt

---

## patients

_id
nutritionistId
name
age
sex
height
weight
activityLevel
goal
notes
createdAt

---

## plans

_id
patientId
nutritionistId
calories
protein
fat
carbs
createdAt

---

## meals

_id
planId
name
order
createdAt

---

## mealFoods

_id
mealId
foodId
grams
portion
createdAt

---

## foods

Base alimentaria.

Fuente:

SMAE dataset

_id
name
group
calories
protein
fat
carbs
equivalents
source
createdAt

---

## recipes

_id
nutritionistId
name
description
instructions
createdAt

---

## recipeFoods

_id
recipeId
foodId
grams

---

## foodSearchCache

Alimentos obtenidos de APIs externas.

_id
name
calories
protein
fat
carbs
source
createdAt