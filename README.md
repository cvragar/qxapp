# QxApp · Anticoagulación perioperatoria

[**Abrir la web**](https://cvragar.github.io/qxapp/)

Asistente web independiente basado en el consenso español de 2025. Versión 0.2, octubre de 2026.

**Solución provisional ante la falta de acceso a la aplicación original QxAApp. Todos los derechos de la aplicación original y del contenido de referencia están reservados a la Sociedad Española de Cardiología (SEC). Esta web es independiente y no está avalada por la SEC.**

## Base clínica

Vivas D et al. *Abordaje del tratamiento antitrombótico durante el perioperatorio y el periprocedimiento: documento de consenso 2025.* Revista Española de Cardiología. DOI: [10.1016/j.recesp.2025.07.008](https://doi.org/10.1016/j.recesp.2025.07.008). [Documento completo](https://www.aeu.es/wp-content/uploads/libros/DocumentoConsensoAntitrombotico2025.pdf).

El motor utiliza la tabla 2 (riesgo trombótico), la tabla 3 (procedimientos de riesgo mínimo), la figura 2 y el texto de retirada/reinicio. El catálogo incluye 102 procedimientos de 19 especialidades y conserva referencias al suplemento de 2025 y al artículo principal cuando este aclara la categoría. No se incluyen copias de los artículos ni de los gráficos originales en este repositorio.

Versión para revisión profesional, pendiente de validación clínica independiente. Las pruebas comprueban la implementación del algoritmo; no equivalen a validación asistencial.

## Recorrido

1. Tratamiento anticoagulante y carácter programado o urgente.
2. Procedimiento y clasificación hemorrágica. **El algoritmo sugiere el manejo**, sin selector voluntario para mantener o interrumpir.
3. Indicación y riesgo trombótico según 2025, con CHA₂DS₂-VA en fibrilación auricular.
4. Datos clínicos, función renal Cockcroft–Gault e INR cuando corresponde.
5. Sugerencia, calendario, consideración de puente, reinicio condicionado a hemostasia y referencias. Resumen copiable e impresión/PDF.

El riesgo mínimo tiene una vía propia: evitar la retirada sistemática de varios días no significa administrar todas las tomas sin cambios. La tabla 3 contempla omisiones alrededor del procedimiento y ajustes según el fármaco y el contexto clínico.

Se conservan las categorías hemorrágicas bajo y moderado del suplemento porque la figura 2 diferencia sus tiempos, aunque el texto agrupa ambos riesgos para describir la incidencia de sangrado.

El motor deriva a revisión individual las urgencias, técnicas neuroaxiales, combinaciones de antitrombóticos, función renal inestable y situaciones fuera de su alcance. No calcula dosis de heparina, reversión urgente ni la rama de antiagregación aislada.

## Privacidad

No se solicitan datos identificativos. No hay servidor clínico, cookies, almacenamiento local, analítica, fuentes remotas ni bibliotecas externas. Los datos introducidos permanecen en memoria y desaparecen al recargar o cerrar la pestaña. Los enlaces bibliográficos solo se abren por acción del usuario.

## Desarrollo

Web estática sin instalación ni compilación. Servir `dist/` con cualquier servidor HTTP estático.

```sh
node tests/clinical.test.cjs
node --check dist/app.js
node --check dist/procedures.js
python3 -m http.server 4173 --directory dist
```

- `dist/clinical.js`: funciones clínicas puras, independientes de la interfaz.
- `dist/procedures.js`: catálogo con trazabilidad de cada entrada.
- `dist/app.js`: asistente y validación de datos.
- `dist/index.html` y `dist/style.css`: interfaz, referencias e impresión.
- `tests/clinical.test.cjs`: escenarios y límites de las reglas clínicas.
- `.github/workflows/pages.yml`: verifica y publica `dist/` en GitHub Pages con cada cambio en `main`.

La copia de GitHub excluye la configuración privada del alojamiento de desarrollo.
