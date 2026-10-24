# QxApp · Anticoagulación perioperatoria

[**Abrir la web**](https://cvragar.github.io/qxapp/)

Asistente web independiente basado en el consenso español de 2025. Versión 0.4, octubre de 2026.

**Solución provisional ante la falta de acceso a la aplicación original QxAApp. Todos los derechos de la aplicación original y del contenido de referencia están reservados a la Sociedad Española de Cardiología (SEC). Esta web es independiente y no está avalada por la SEC.**

## Base clínica

Vivas D et al. *Abordaje del tratamiento antitrombótico durante el perioperatorio y el periprocedimiento: documento de consenso 2025.* Revista Española de Cardiología. DOI: [10.1016/j.recesp.2025.07.008](https://doi.org/10.1016/j.recesp.2025.07.008). [Documento completo](https://www.aeu.es/wp-content/uploads/libros/DocumentoConsensoAntitrombotico2025.pdf).

El motor utiliza la tabla 2 (riesgo trombótico), la tabla 3 (procedimientos de riesgo mínimo), la figura 2 y el texto de retirada/reinicio. El circuito urgente utiliza las figuras 4 y 5, con comprobación de las fichas técnicas EMA de los reversores. El catálogo incluye 102 procedimientos de 19 especialidades y conserva referencias al suplemento de 2025 y al artículo principal cuando este aclara la categoría. No se incluyen copias de los artículos ni de los gráficos originales en este repositorio.

Versión para revisión profesional, pendiente de validación clínica independiente. Las pruebas comprueban la implementación del algoritmo; no equivalen a validación asistencial.

## Recorrido programado

1. Tratamiento anticoagulante y carácter programado o urgente.
2. Procedimiento y clasificación hemorrágica. **El algoritmo sugiere el manejo**, sin selector voluntario para mantener o interrumpir.
3. Indicación y riesgo trombótico según 2025, con CHA₂DS₂-VA en fibrilación auricular.
4. Datos clínicos, función renal Cockcroft–Gault e INR cuando corresponde.
5. Sugerencia, calendario, consideración de puente, reinicio condicionado a hemostasia y referencias. Resumen copiable e impresión/PDF.

El riesgo mínimo tiene una vía propia: evitar la retirada sistemática de varios días no significa administrar todas las tomas sin cambios. La tabla 3 contempla omisiones alrededor del procedimiento y ajustes según el fármaco y el contexto clínico.

Se conservan las categorías hemorrágicas bajo y moderado del suplemento porque la figura 2 diferencia sus tiempos, aunque el texto agrupa ambos riesgos para describir la incidencia de sangrado.

## Recorrido urgente

La selección «Urgente o emergente» abre cinco pasos propios: tratamiento, prioridad y seguridad, última toma y función renal, coagulación y propuesta urgente. El resultado cambia según el fármaco, la posibilidad real de demora y los datos introducidos; los campos de planificación electiva no se requieren ni se heredan.

- AVK: INR actual, posibilidad de demora, reversión hospitalaria y reevaluación del INR.
- ACOD: última toma, función renal estable, nivel específico cuando está disponible y pruebas orientativas aplicables a cada fármaco.
- Las respuestas desconocidas se registran expresamente y conducen a revisión. Una prueba normal no se convierte en una autorización para operar.
- El motor no genera calendario electivo, terapia puente ni reinicio automático para la urgencia. Tampoco calcula dosis individuales de CCP o heparina, ni desarrolla la antiagregación aislada.
- Cambiar el fármaco o pasar entre programada y urgente reinicia los datos y el avance. Editar una respuesta invalida la confirmación final. Cambiar el nivel o los datos de la última toma también invalida la valoración de la muestra. Tanto el botón Continuar como la navegación lateral revalidan los pasos previos.

Las técnicas neuroaxiales, combinaciones de antitrombóticos, hemorragia activa, inestabilidad, función renal inestable y demás situaciones especiales requieren valoración individual. La herramienta no debe retrasar la atención urgente.

**Precisión farmacológica:** andexanet alfa no se propone como pretratamiento de una cirugía urgente; se respetan las limitaciones de [Ondexxya (EMA)](https://www.ema.europa.eu/en/documents/product-information/ondexxya-epar-product-information_en.pdf). La reversión de dabigatrán para cirugía urgente se contrasta con [Praxbind (EMA)](https://www.ema.europa.eu/en/documents/product-information/praxbind-epar-product-information_en.pdf). Fichas consultadas el 24/10/2026.

## Privacidad

No se solicitan datos identificativos. No hay servidor clínico, cookies, almacenamiento local, analítica, fuentes remotas ni bibliotecas externas. Los datos introducidos permanecen en memoria y desaparecen al recargar o cerrar la pestaña. Los enlaces bibliográficos solo se abren por acción del usuario.

## Desarrollo

Web estática sin instalación ni compilación. Servir `dist/` con cualquier servidor HTTP estático.

```sh
node tests/clinical.test.cjs
node tests/urgent.test.cjs
node --check dist/app.js
node --check dist/urgent.js
node --check dist/procedures.js
python3 -m http.server 4173 --directory dist
```

- `dist/clinical.js`: funciones clínicas puras, independientes de la interfaz.
- `dist/urgent.js`: motor urgente independiente, con contrato explícito y resultados condicionados.
- `dist/procedures.js`: catálogo con trazabilidad de cada entrada.
- `dist/app.js`: asistente y validación de datos.
- `dist/index.html` y `dist/style.css`: interfaz, referencias e impresión.
- `tests/clinical.test.cjs`: regresión de las reglas electivas y de la revisión de seguridad.
- `tests/urgent.test.cjs`: ramas urgentes, límites numéricos, datos desconocidos, entradas mal formadas, propiedades heredadas y separación de calendarios.
- `.github/workflows/pages.yml`: verifica y publica `dist/` en GitHub Pages con cada cambio en `main`.

La copia de GitHub excluye la configuración privada del alojamiento de desarrollo.

## Contrato de la API electiva 0.3 (conservado)

`QXClinical.makePlan(input)` valida los datos antes de calcular un calendario. La versión `0.3.0-consensus-2025` introduce un cambio incompatible para integraciones que omitían indicadores o enviaban valores como `"true"`, `"false"`, `1` o `0`. Esas entradas devuelven `status: 'review'`, los motivos en `blockers` y ningún tiempo de última toma, suspensión o reinicio.

- Todos los campos de `QXClinical.requiredBooleanFields` son obligatorios y deben ser booleanos reales. `false` expresa una ausencia comprobada; un dato desconocido no debe convertirse en `false`. La lista exportada y sus elementos se muestran en el ejemplo siguiente.
- `urgency` es obligatorio: `'elective'` o `'urgent'`. El alias opcional `urgent` debe ser booleano y coincidir con `urgency`; una contradicción requiere revisión.
- `specialProcedure` es obligatorio y debe ser texto. Usar `''` cuando no exista un protocolo adicional. Un texto no vacío bloquea el calendario genérico.
- `floatingAorticThrombus` es el indicador obligatorio del trombo aórtico flotante. El alias opcional `aorticFloatingThrombus` también debe ser booleano; un `true` en cualquiera de los dos conserva el criterio de riesgo.
- Para usar el catálogo, proporcionar `procedureId` o `procedure: {id: '…'}`. Si se envían ambos, deben coincidir. El motor consulta su propio catálogo y deriva el riesgo hemorrágico, la condición neuroaxial, el protocolo específico y el embarazo cuando corresponda; no confía en los metadatos del objeto recibido. Un ID desconocido o un `bleedingRisk` no vacío que contradiga el catálogo requiere revisión. En clasificación manual, omitir ambos campos o usar `procedureId: ''` y `procedure: null`, e indicar `bleedingRisk`.

Ejemplo de integración con datos ficticios, tras comprobar expresamente los antecedentes y las situaciones señaladas:

```js
const QXClinical = require('./dist/clinical.js');
const plan = QXClinical.makePlan({
  drug: 'apixaban', indication: 'af', age: 68, crcl: 85,
  urgency: 'elective', bleedingRisk: 'low', specialProcedure: '',
  thrombophilia: 'none',
  neuraxial: false, antiplatelet: false, multipleAnticoagulants: false,
  renalUnstable: false, activeBleeding: false, severeLiverDisease: false,
  pregnancy: false, activeCancer: false, bleedingModifiers: false,
  rheumaticMitral: false, antiphospholipidSyndrome: false,
  heartFailure: false, hypertension: true, diabetes: false,
  vascularDisease: false, strokeHistory: false, systemicEmbolism: false,
  perioperativeStroke: false, intracardiacThrombus: false,
  floatingAorticThrombus: false, recentCardioembolicStroke: false,
  valveThrombosis: false
});
```

Los demás requisitos clínicos siguen dependiendo del fármaco y la indicación, por ejemplo INR para AVK o tiempo desde un evento previo. Las funciones auxiliares (`cha2ds2va`, `thromboticRisk`, `cockcroftGault` y `managementDecision`) son componentes de cálculo o de la interfaz; sus resultados no sustituyen un plan validado por `makePlan`.

En el navegador, cargar `procedures.js` antes de `clinical.js` y después `urgent.js` y `app.js`, como hace `index.html`. Con CommonJS, `clinical.js` importa el catálogo automáticamente. El catálogo y sus entradas están congelados. La interfaz inicializa las casillas sin marcar como booleanos explícitos y conserva las confirmaciones de revisión de los datos.


## Contrato de la API urgente 0.4

`QXUrgent.makePlan(input)` usa un contrato independiente. `QXClinical.makePlan()` conserva su comportamiento de seguridad: una urgencia nunca devuelve un plan electivo listo. Las funciones `fresh()` y `validate(input)` ofrecen los valores iniciales sin respuestas clínicas preseleccionadas y los errores de estructura, respectivamente.

El motor urgente exige datos propios explícitos, no acepta propiedades heredadas ni getters y valida los tipos antes de decidir. Se requieren `urgency: 'urgent'`, `drug`, edad adulta y los campos `u*` aplicables. `uConfirmed` debe ser el booleano `true`.

| Campos | Valores |
| --- | --- |
| `uPriority` | `emergency`, `urgent`, `deferred` |
| `uCanDelay` | `yes`, `no`, `unknown`. AVK: demora de al menos 6 h; ACOD: margen clínico para reevaluar. Emergencia AVK exige `no`; urgencia diferida exige `yes` |
| `uBleeding`, `uUnstable`, `uNeuraxial`, `uAntiplatelet`, `uMultiple`, `uLiver`, `uPregnancy` | `yes`, `no`, `unknown` |
| `uDoseKnown`, `uLastDoseKnown` | `known` o `unknown`; si `known`, aportar `uDoseMg` y `uLastDoseHours`, respectivamente |
| AVK: `uInrKnown` | `known` o `unknown`; si `known`, aportar `uInr` actual |
| ACOD: `uRenalKnown` | `known` o `unknown`; si `known`, aportar `uCrcl` |
| ACOD: `uRenalUnstable` | `yes`, `no`, `unknown` |
| ACOD: `uLevelStatus` | `known`, `pending`, `unavailable`; si `known`, aportar `uLevel` en ng/mL |
| ACOD: `uLevelRepresentative` | Si el nivel está disponible: `yes`, `no`, `unknown`. Confirmar muestra actual, absorción considerada y ausencia de tomas posteriores; `no` o `unknown` requieren revisión |
| ACOD: `uQualitative` | `within` (ratio ≤1,2), `above` (>1,2), `unavailable`; solo dabigatrán/TTPa o rivaroxabán/TP. Para apixabán y edoxabán debe ser `unavailable` |

El resultado lleva `status: 'urgent'` para una propuesta orientativa o `'review'` ante una valoración pendiente. Nunca devuelve `'ready'`; `lastDoseDay`, `stopDays` y `restart.hours` permanecen `null`. `waitHours` únicamente señala el recontrol del INR en la rama correspondiente, no un permiso para intervenir al transcurrir ese tiempo. Cada resultado incluye `pathway`, `decision`, `blockers`, `warnings`, `steps` y `source`.

No se reutilizan INR, ClCr ni confirmaciones del formulario electivo. Si una integración proporciona un procedimiento, el motor resuelve sus restricciones desde el catálogo, sin confiar en metadatos enviados por el llamador. Las dosis y los datos de última toma se recogen para conciliación; no se emplean para calcular dosis de reversores.

### Verificación de esta versión

Se mantienen las 29 pruebas electivas, incluida la matriz de 3.168 combinaciones de indicadores ausentes o mal formados de la corrección de seguridad del 24/10/2026. El circuito urgente añade 16 pruebas de ramas, límites y validación; incluye niveles discordantes, muestra no representativa, imposibilidad de demora y contradicciones de prioridad.

La comprobación interactiva cubre navegación completa AVK/ACOD, cambio de contexto y fármaco, invalidación de confirmaciones, navegación lateral, copia del resumen y regresión del recorrido programado. Estas pruebas verifican la implementación y no sustituyen validación clínica independiente.
