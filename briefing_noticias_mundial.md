# Briefing — Auto-publicador de noticias CrazyDeportes

## Contexto
Sitio de noticias del Mundial FIFA 2026: **crazydeportes.com**
El sandbox YA tiene acceso al dominio (configurado en Ajustes > Salida de red).

## Lo que ya funciona
- La API publica noticias directo vía `curl` o `fetch` desde el sandbox
- Se probó y funcionó: 3 noticias publicadas hoy (13 jun 2026)

## API Endpoints

### Publicar noticia
```bash
curl -s -X POST https://crazydeportes.com/api/articles.php \
  -H "Content-Type: application/json" \
  -d '{ ...JSON del artículo... }'
```

### Ver todas las noticias
```bash
curl -s https://crazydeportes.com/api/articles.php
```

### Eliminar noticia
```bash
curl -s -X DELETE "https://crazydeportes.com/api/articles.php?id=ID"
```

## Estructura del artículo (JSON)
```json
{
  "title": "Título llamativo ~70 chars",
  "excerpt": "Resumen 1-2 oraciones para la tarjeta",
  "body": "Párrafo 1\n\nPárrafo 2\n\nPárrafo 3\n\nPárrafo 4\n\nCierre con CTA a CrazyDeportes",
  "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
  "category": "noticias",
  "categoryIcon": "🔥",
  "categoryLabel": "GOLEADA",
  "author": "CrazyDeportes",
  "time": "Hace 10 min"
}
```

## Categorías válidas
| category | icon | label |
|----------|------|-------|
| noticias | 📰 | NOTICIAS |
| selecciones | 🏳️ | SELECCIONES |
| sedes | 🏟️ | SEDES |
| analisis | 📊 | ANÁLISIS |
| fichajes | 💊 | LESIÓN / FICHAJES |

## Imágenes — URLs de Unsplash que funcionan
Usar directamente en el campo `image` (no hace falta upload):
- `https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80` (estadio)
- `https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80` (balón)
- `https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80` (jugador)
- `https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80` (fútbol)
- `https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80` (cancha)
- `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80` (análisis)

## Tarea a configurar (SCHEDULE)
Publicar **3 noticias** del Mundial FIFA 2026 automáticamente cada X horas.

### Flujo por ejecución:
1. `WebSearch` — buscar noticias más importantes del momento
2. Redactar 3 artículos en español (con keywords en inglés para SEO)
3. Publicar cada uno con `curl POST` a la API
4. Verificar con `curl GET` que aparecen

### Estilo editorial:
- Títulos llamativos, mayúsculas parciales, emojis en categoryLabel
- Body: 5 párrafos (qué pasó → detalles → cita/contexto → qué sigue → CTA)
- Priorizar: goles, polémicas, lesiones, sorpresas, récords
- Keywords SEO: "World Cup 2026", "FIFA", "USMNT", "soccer" mezclados en el texto

## Instrucción para la nueva conversación
> Eres el editor automatizado de CrazyDeportes (crazydeportes.com), sitio de noticias del Mundial FIFA 2026.
> El sandbox puede conectar directo a la API del sitio.
> Tu trabajo: buscar las 3 noticias más importantes del momento, redactarlas y publicarlas vía curl a https://crazydeportes.com/api/articles.php
> Después configura un scheduled task en Cowork para repetir esto cada X horas automáticamente.
