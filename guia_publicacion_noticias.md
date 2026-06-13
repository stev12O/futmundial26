# 📰 Guía Completa — Sistema de Noticias CrazyDeportes

## Almacenamiento del Servidor

| Recurso | Usado | Total | Disponible |
|---------|-------|-------|------------|
| **Disco** | 3.99 GB | 200 GB | **~196 GB libres** |
| **Archivos** | 66,774 | 600,000 | ~533,000 libres |
| **Plan** | Business | Hostinger | — |

> [!TIP]
> Con 196 GB libres puedes subir ~40,000 imágenes de 5MB cada una. Espacio de sobra.

---

## API Endpoints

Tu sitio tiene 2 endpoints PHP que permiten publicar noticias **sin usar git ni el admin web**:

### 1. Subir Imagen
```
POST https://crazydeportes.com/api/upload.php
Content-Type: multipart/form-data

Campo: image (archivo de imagen, max 5MB, formatos: jpg/png/gif/webp)
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "url": "https://crazydeportes.com/uploads/img_1718293000_a1b2c3d4.jpg",
    "filename": "img_1718293000_a1b2c3d4.jpg"
  }
}
```

### 2. Publicar Noticia
```
POST https://crazydeportes.com/api/articles.php
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "El título de la noticia",
  "excerpt": "Resumen corto de 1-2 oraciones para las tarjetas",
  "body": "El artículo completo. Usa doble salto de línea para separar párrafos.\n\nSegundo párrafo aquí.\n\nTercer párrafo aquí.",
  "image": "https://crazydeportes.com/uploads/img_xxx.jpg",
  "category": "noticias",
  "categoryIcon": "📰",
  "categoryLabel": "NOTICIAS",
  "author": "CrazyDeportes",
  "time": "Hace 5 min"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "article": { ...datos del artículo creado... }
}
```

### 3. Eliminar Noticia
```
DELETE https://crazydeportes.com/api/articles.php?id=1718293000000
```

### 4. Leer Todas las Noticias
```
GET https://crazydeportes.com/api/articles.php
```

---

## Campos del Artículo

| Campo | Requerido | Tipo | Descripción |
|-------|-----------|------|-------------|
| `title` | ✅ Sí | string | Título principal. Debe ser llamativo, ~60-80 caracteres |
| `excerpt` | ✅ Sí | string | Resumen de 1-2 oraciones. Se ve en las tarjetas del inicio |
| `body` | ✅ Sí | string | Artículo completo. Separar párrafos con `\n\n` |
| `image` | ✅ Sí | string (URL) | URL de la imagen (subida primero con upload.php) |
| `category` | ✅ Sí | string | Una de las categorías válidas (ver abajo) |
| `categoryIcon` | ✅ Sí | string | Emoji de la categoría |
| `categoryLabel` | ✅ Sí | string | Nombre en MAYÚSCULAS de la categoría |
| `author` | ✅ Sí | string | Nombre del autor |
| `time` | Opcional | string | Cuándo se publicó (ej: "Hace 5 min", "13 Jun 2026") |
| `id` | Auto | number | Se genera automático si no se envía |

---

## Categorías Válidas

| category | categoryIcon | categoryLabel | Cuándo usarla |
|----------|-------------|---------------|--------------|
| `noticias` | 📰 | NOTICIAS | Noticias generales del mundial |
| `selecciones` | 🏳️ | SELECCIONES | Noticias de un equipo/selección |
| `sedes` | 🏟️ | SEDES | Sobre estadios y ciudades sede |
| `analisis` | 📊 | ANÁLISIS | Análisis tácticos, predicciones |
| `fichajes` | 💰 | FICHAJES | Convocatorias, lesiones, cambios |

---

## Estilo Editorial — Qué tipo de noticias publicar

### Temática: Mundial FIFA 2026 (USA, México, Canadá)

**Temas que generan tráfico:**
- 🔥 Resultados de partidos (goles, resúmenes, polémicas)
- ⚽ Noticias de selecciones (convocatorias, lesiones, declaraciones)
- 📊 Predicciones y análisis previos a partidos
- 🏟️ Info de estadios y sedes
- 🌟 Historias de jugadores estrella
- 📺 Dónde ver los partidos (horarios por país)

**Para tráfico de USA (pagan más ads):**
- Escribir títulos bilingüe o en inglés
- Mencionar USMNT (selección de USA), ciudades americanas
- Usar keywords: "World Cup 2026", "FIFA", "soccer", "USMNT"

### Formato del artículo (body):
```
Primer párrafo: Lo más importante de la noticia (quién, qué, cuándo, dónde)

Segundo párrafo: Detalles y contexto

Tercer párrafo: Declaraciones o citas

Cuarto párrafo: Qué sigue / próximo partido

Quinto párrafo: Cierre con CTA (sigue en CrazyDeportes)
```

---

## Ejemplo con curl (para automatizar desde terminal)

### Paso 1: Subir imagen
```bash
curl -X POST https://crazydeportes.com/api/upload.php \
  -F "image=@/ruta/a/mi/imagen.jpg"
```

### Paso 2: Publicar noticia (usando la URL de la imagen)
```bash
curl -X POST https://crazydeportes.com/api/articles.php \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Argentina golea 3-0 a Australia en su debut mundialista",
    "excerpt": "La Albiceleste arrancó con pie derecho en el Mundial 2026 con goles de Messi, Álvarez y Garnacho.",
    "body": "La selección Argentina demostró su poderío ante Australia en el SoFi Stadium de Los Ángeles.\n\nLionel Messi abrió el marcador al minuto 23 con un golazo de tiro libre que dejó sin reacción al portero australiano.\n\nJulián Álvarez amplió la ventaja al 45+2 con un cabezazo inapelable tras centro de Molina.\n\nAlejandro Garnacho cerró la cuenta al 78 con una jugada individual espectacular por la banda izquierda.\n\nArgentina enfrentará a Dinamarca en su segundo partido el próximo jueves.",
    "image": "https://crazydeportes.com/uploads/img_xxx.jpg",
    "category": "selecciones",
    "categoryIcon": "🏳️",
    "categoryLabel": "SELECCIONES",
    "author": "CrazyDeportes",
    "time": "Hace 10 min"
  }'
```

---

## Cómo automatizar con Claude/AI

### Opción 1: Claude desde Cowork (Recomendada)
Dale a Claude estas instrucciones:

```
Eres el editor de CrazyDeportes (crazydeportes.com), un sitio de noticias 
del Mundial FIFA 2026. Tu trabajo es publicar noticias usando la API.

Para publicar:
1. Busca noticias recientes del Mundial 2026
2. Escribe el artículo en español (con keywords en inglés para SEO)
3. Descarga una imagen relevante
4. Súbela con: curl -X POST https://crazydeportes.com/api/upload.php -F "image=@imagen.jpg"
5. Publica con: curl -X POST https://crazydeportes.com/api/articles.php -H "Content-Type: application/json" -d '{ JSON del artículo }'

Categorías: noticias, selecciones, sedes, analisis, fichajes
Formato del body: separar párrafos con \n\n
```

### Opción 2: Script automatizado
Crea un script que se ejecute cada hora buscando noticias nuevas y publicándolas.

---

## Dónde aparece cada noticia

Cuando publicas un artículo, automáticamente aparece en:

1. **Página de inicio** → tarjeta con imagen + título + resumen
2. **Página de noticias** (`noticias.html`) → lista completa
3. **Página individual** → `crazydeportes.com/noticia.html?id=XXXXX` (con el body completo)
4. **Sidebar** de otras noticias → como "Más Noticias"

**No necesitas hacer git push.** La API escribe directamente en el servidor.
