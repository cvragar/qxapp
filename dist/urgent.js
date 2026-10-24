/* QxApp · Circuito urgente independiente del calendario electivo.
 * Consenso 2025, figuras 4 y 5; fichas EMA de Praxbind y Ondexxya.
 * Las rutas orientan la valoración hospitalaria; nunca autorizan una intervención.
 */
(function (root, factory) {
  var commonJS = typeof module === 'object' && module.exports;
  var api = factory(commonJS ? require('./clinical.js') : root.QXClinical,
    commonJS ? require('./procedures.js') : root.QXProcedures);
  if (commonJS) module.exports = api;
  if (root) root.QXUrgent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (clinical, procedures) {
  'use strict';
  var SOURCE = Object.freeze({
    year: 2025,
    short: 'Vivas et al. · Consenso multidisciplinar 2025 · Rev Esp Cardiol',
    detail: 'Cirugía urgente: figuras 4 (AVK) y 5 (ACOD), y texto. Antídotos: fichas técnicas EMA de Praxbind y Ondexxya, consultadas el 24/10/2026.',
    url: 'https://doi.org/10.1016/j.recesp.2025.07.008',
    idarucizumabUrl: 'https://www.ema.europa.eu/en/documents/product-information/praxbind-epar-product-information_en.pdf',
    andexanetUrl: 'https://www.ema.europa.eu/en/documents/product-information/ondexxya-epar-product-information_en.pdf'
  });
  var SAFETY = Object.freeze({
    uBleeding: 'hemorragia activa', uUnstable: 'inestabilidad hemodinámica',
    uNeuraxial: 'técnica neuroaxial', uAntiplatelet: 'antiagregación concomitante',
    uMultiple: 'más de un anticoagulante', uLiver: 'hepatopatía grave', uPregnancy: 'embarazo'
  });
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  function value(o, k) { return has(o, k) ? o[k] : undefined; }
  function numeric(v) {
    if (typeof v !== 'number' && typeof v !== 'string') return null;
    if (typeof v === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(v.trim())) return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function fresh() {
    var s = {uPriority:'',uCanDelay:'',uDoseKnown:'',uDoseMg:'',uLastDoseKnown:'',uLastDoseHours:'',
      uRenalKnown:'',uCrcl:'',uRenalUnstable:'',uInrKnown:'',uInr:'',
      uLevelStatus:'',uLevel:'',uLevelRepresentative:'',uQualitative:'unavailable',uConfirmed:false};
    Object.keys(SAFETY).forEach(function (k) { s[k] = ''; });
    return s;
  }
  function inspect(input) {
    var errors = [], data = Object.create(null), procedure = null;
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) {
      errors.push('Introduce los datos urgentes en un objeto con campos propios explícitos.');
    } else {
      Object.keys(input).forEach(function (k) {
        var descriptor = Object.getOwnPropertyDescriptor(input, k);
        if (descriptor && has(descriptor, 'value')) data[k] = descriptor.value;
        else errors.push('Los datos clínicos deben ser valores, no propiedades calculadas.');
      });
    }
    function option(key, allowed, label) {
      if (!has(data, key) || typeof data[key] !== 'string' || allowed.indexOf(data[key]) === -1)
        errors.push('Completa ' + label + ' con una de las opciones indicadas.');
    }
    function numberField(key, min, max, inclusiveMin, label) {
      var n = numeric(value(data, key));
      if (n === null || (inclusiveMin ? n < min : n <= min) || n > max)
        errors.push('Introduce un valor válido para ' + label + '.');
    }
    option('urgency', ['urgent'], 'el contexto de cirugía urgente');
    if (has(data, 'urgent') && data.urgent !== true) errors.push('El indicador urgent, si se envía, debe ser true y coincidir con urgency.');
    var drug = clinical && clinical.DRUGS && typeof value(data, 'drug') === 'string' && has(clinical.DRUGS, data.drug) ? clinical.DRUGS[data.drug] : null;
    if (!drug) errors.push('Selecciona un anticoagulante oral incluido en el circuito urgente.');
    numberField('age', 18, 120, true, 'la edad adulta (18–120 años)');
    option('uPriority', ['emergency', 'urgent', 'deferred'], 'la prioridad de la intervención');
    option('uCanDelay', ['yes', 'no', 'unknown'], drug && drug.family === 'avk' ? 'la posibilidad de demorar al menos 6 horas' : 'la posibilidad de una demora clínicamente viable para reevaluar');
    if (drug && drug.family === 'avk' && data.uPriority === 'emergency' && data.uCanDelay !== 'no')
      errors.push('Una intervención emergente (<6 h) no puede marcarse como demorable al menos 6 h. Revisa la prioridad.');
    if (data.uPriority === 'deferred' && data.uCanDelay !== 'yes')
      errors.push('Una intervención urgente diferida (>24 h) debe admitir una demora para reevaluar. Revisa la prioridad.');
    Object.keys(SAFETY).forEach(function (k) { option(k, ['yes','no','unknown'], SAFETY[k]); });
    option('uDoseKnown', ['known','unknown'], 'si se conoce la dosis');
    if (data.uDoseKnown === 'known') numberField('uDoseMg', 0, Number.MAX_VALUE, false, 'la dosis en mg');
    option('uLastDoseKnown', ['known','unknown'], 'si se conoce la última toma');
    if (data.uLastDoseKnown === 'known') numberField('uLastDoseHours', 0, Number.MAX_VALUE, true, 'las horas desde la última toma');
    if (drug && drug.family === 'avk') {
      option('uInrKnown', ['known','unknown'], 'la disponibilidad del INR actual');
      if (data.uInrKnown === 'known') numberField('uInr', 0, 20, false, 'el INR actual (0–20)');
    }
    if (drug && drug.family === 'doac') {
      option('uRenalKnown', ['known','unknown'], 'la disponibilidad del aclaramiento de creatinina');
      if (data.uRenalKnown === 'known') numberField('uCrcl', 0, 250, true, 'el ClCr (0–250 mL/min)');
      option('uRenalUnstable', ['yes','no','unknown'], 'la estabilidad de la función renal');
      option('uLevelStatus', ['known','unavailable','pending'], 'la disponibilidad del nivel específico del fármaco');
      if (data.uLevelStatus === 'known') {
        numberField('uLevel', 0, Number.MAX_VALUE, true, 'el nivel específico en ng/mL');
        option('uLevelRepresentative', ['yes','no','unknown'], 'si la muestra representa el efecto anticoagulante actual');
      }
      option('uQualitative', ['within','above','unavailable'], 'la prueba de coagulación orientativa');
      if (['apixaban','edoxaban'].indexOf(data.drug) !== -1 && data.uQualitative !== 'unavailable')
        errors.push('TP y TTPa no permiten excluir el efecto de apixabán o edoxabán; no utilices esta prueba como criterio de seguridad.');
    }
    if (!has(data, 'uConfirmed') || data.uConfirmed !== true) errors.push('Confirma que has revisado los datos urgentes y las situaciones especiales.');
    var id = '';
    if (has(data, 'procedureId')) {
      if (typeof data.procedureId !== 'string') errors.push('El identificador del procedimiento debe ser texto.');
      else id = data.procedureId;
    }
    if (has(data, 'procedure') && data.procedure !== null) {
      var nested = data.procedure, nestedId = null;
      if (nested && typeof nested === 'object' && !Array.isArray(nested) &&
          (Object.getPrototypeOf(nested) === Object.prototype || Object.getPrototypeOf(nested) === null))
        nestedId = Object.getOwnPropertyDescriptor(nested, 'id');
      if (!nestedId || !has(nestedId, 'value') || typeof nestedId.value !== 'string' || !nestedId.value)
        errors.push('El procedimiento debe identificar una entrada verificable del catálogo.');
      else if (id && id !== nestedId.value) errors.push('Los identificadores del procedimiento no coinciden.');
      else id = nestedId.value;
    }
    if (id) {
      procedure = Array.isArray(procedures) ? procedures.find(function (p) { return p.id === id; }) : null;
      if (!procedure) errors.push('No se ha podido verificar el procedimiento en el catálogo.');
    }
    return {data:data,drug:drug,procedure:procedure,errors:errors};
  }
  function validate(input) { return inspect(input).errors; }
  function makePlan(input) {
    var checked = inspect(input), s = checked.data, drug = checked.drug;
    var plan = {status:'review',title:'Completar la valoración urgente',pathway:'incomplete',
      decision:{route:'review',text:'Revisa los datos antes de interpretar el algoritmo urgente.'},
      blockers:checked.errors.slice(),warnings:[],steps:[],source:SOURCE,waitHours:null,
      lastDoseDay:null,lastDoseLabel:null,stopDays:null,restart:{hours:null,label:null,text:''},
      bridge:{indicated:false,label:'No se calcula en este circuito',text:''},validatedForCurrentPractice:false};
    plan.warnings.push('Orientación para valoración hospitalaria por el equipo responsable. No autoriza por sí sola la cirugía ni sustituye la comprobación de la hemostasia.');
    plan.warnings.push('No se genera calendario electivo, terapia puente ni reinicio automático. El reinicio requiere estabilidad clínica, hemostasia y una decisión individual.');
    if (checked.errors.length) return plan;
    function add(label,title,text) { plan.steps.push({label:label,title:title,text:text}); }
    function route(pathway,title,text) {
      plan.pathway = pathway; plan.title = title;
      plan.decision = {route:'urgent',text:text}; plan.status = 'urgent';
    }
    add('Ahora','Suspender el anticoagulante oral y valorar la urgencia',
      'Confirmar prioridad, última toma, dosis, hemograma y hemostasia; coordinar Cirugía, Anestesia y el equipo responsable de la anticoagulación. No retrasar la atención necesaria para completar la herramienta.');
    Object.keys(SAFETY).forEach(function (k) {
      if (s[k] === 'unknown') plan.blockers.push('No se ha podido confirmar: ' + SAFETY[k] + '.');
      if (s[k] === 'yes') plan.blockers.push('Requiere un protocolo individual: ' + SAFETY[k] + '.');
    });
    if (s.uCanDelay === 'unknown') plan.blockers.push(drug.family === 'avk' ? 'El equipo debe concretar si la intervención admite una demora de al menos 6 h.' : 'El equipo debe concretar si la intervención admite una demora clínicamente viable para reevaluar el efecto anticoagulante.');
    if (s.uDoseKnown === 'unknown') plan.blockers.push('La dosis es desconocida: verificar la pauta y la conciliación del tratamiento.');
    if (s.uLastDoseKnown === 'unknown') plan.blockers.push('La última toma es desconocida: no inferir ausencia de efecto anticoagulante.');
    if (checked.procedure) {
      if (checked.procedure.neuraxial) plan.blockers.push('El catálogo identifica una técnica neuroaxial: aplicar su protocolo específico aunque se haya marcado que no.');
      if (checked.procedure.pregnancy || checked.procedure.id === 'gyn-caesarean') plan.blockers.push('El procedimiento requiere un protocolo obstétrico específico.');
      if (checked.procedure.specialProtocol) plan.blockers.push('Protocolo específico del procedimiento: ' + checked.procedure.specialProtocol);
    }
    if (drug.family === 'doac') {
      plan.warnings.push('Utilizar un nivel específico calibrado para el anticoagulante seleccionado, expresado en ng/mL. Un TP/TTPa normal no demuestra ausencia de efecto anticoagulante.');
      if (s.uRenalKnown === 'unknown') plan.blockers.push('Función renal desconocida: no aplicar los criterios temporales de eliminación.');
      if (s.uRenalUnstable !== 'no') plan.blockers.push('Función renal inestable o no confirmada: la estimación aislada no permite fijar una espera segura.');
      if (s.uRenalKnown === 'known' && numeric(s.uCrcl) <= 0) plan.blockers.push('ClCr nulo: requiere valoración especializada de la eliminación del fármaco.');
      if (s.uLevelStatus === 'known' && s.uLevelRepresentative !== 'yes')
        plan.blockers.push('No se confirma que la muestra represente el efecto anticoagulante actual. Verificar extracción, absorción y ausencia de tomas posteriores; un valor previo al pico no excluye un efecto posterior.');
      if (s.uLevelStatus === 'known' && numeric(s.uLevel) < 30) {
        if (s.uQualitative === 'above') plan.blockers.push('Nivel específico <30 ng/mL con TP/TTPa por encima del umbral: revisar la discordancia y otras causas de coagulopatía antes de decidir.');
        if (s.uLastDoseKnown === 'known' && numeric(s.uLastDoseHours) === 0) plan.blockers.push('Última toma en este momento: un nivel bajo puede preceder a la absorción. Confirmar el momento de la muestra y repetir la valoración; no asumir ausencia de efecto posterior.');
      }
      if (s.drug !== 'dabigatran') plan.warnings.push('Andexanet alfa no está indicado como pretratamiento de cirugía urgente. Su indicación EMA se limita a hemorragia potencialmente mortal o no controlada con apixabán o rivaroxabán; no está indicado para edoxabán y debe evitarse antes de heparinización.');
    }
    if (plan.blockers.length) {
      plan.pathway = 'specialist'; plan.title = 'Valoración urgente con situaciones pendientes';
      plan.decision.text = 'Los datos desconocidos o las situaciones especiales impiden una propuesta automática; realizar valoración hospitalaria inmediata.';
      add('Prioridad','Completar y resolver la valoración individual',plan.blockers.join(' '));
      return plan;
    }
    if (drug.family === 'avk') {
      if (s.uInrKnown !== 'known') {
        plan.blockers.push('Obtener un INR actual: un resultado antiguo o desconocido no permite elegir la rama de reversión.');
        plan.title = 'Obtener INR actual'; plan.pathway = 'avk-inr-unknown';
        add('Hemostasia','Solicitar INR y valoración inmediata',plan.blockers[0]); return plan;
      }
      if (numeric(s.uInr) < 1.5) {
        route('avk-inr-below','INR inferior a 1,5: valorar la intervención',
          'La figura 4 no exige demora por el AVK con INR <1,5. Confirmar que el procedimiento acepta este umbral y que existen condiciones clínicas y hemostáticas adecuadas.');
        add('Decisión del equipo','Comprobar las condiciones para intervenir',plan.decision.text);
      } else if (s.uCanDelay === 'yes') {
        route('avk-delay','Reversión del AVK con demora y recontrol',
          'Con INR ≥1,5 y posibilidad de demorar al menos 6 h, la figura 4 propone vitamina K intravenosa y control posterior de INR.');
        plan.waitHours = 6;
        add('Reversión hospitalaria','Vitamina K 10 mg IV','Administración por el equipo asistencial según el protocolo y las precauciones de la ficha técnica.');
        add('A las 6–8 h','Repetir el INR y reevaluar','La figura señala un control a las 6 h y el texto a las 6–8 h. El transcurso del tiempo no autoriza la cirugía: volver a comprobar el INR y el objetivo del procedimiento.');
      } else {
        route('avk-no-delay','Reversión inmediata del AVK: valorar CCP',
          'Con INR ≥1,5 y sin posibilidad de demorar al menos 6 h, el consenso propone vitamina K IV y valorar concentrado de complejo protrombínico (CCP).');
        add('Reversión hospitalaria','Vitamina K 10 mg IV y valorar CCP',
          'Seleccionar y administrar el CCP conforme al INR actual, peso, producto disponible y ficha técnica. Esta herramienta no calcula su dosis. Comprobar la respuesta hemostática con el equipo responsable.');
      }
      return plan;
    }
    var level = numeric(s.uLevel), hours = numeric(s.uLastDoseHours), crcl = numeric(s.uCrcl);
    if (s.uLevelStatus === 'known' && level < 30) {
      route('doac-level-below','Nivel específico inferior a 30 ng/mL: valoración contextual',
        'Se cumple el umbral de la figura 5 para considerar la intervención. Confirmar que la muestra es válida y representa la situación actual, el método está calibrado para este fármaco y no hay condiciones del procedimiento que exijan otro umbral.');
      add('Decisión del equipo','Revisar el nivel y la hemostasia',plan.decision.text);
      plan.warnings.push('Un valor bajo aislado no es una autorización universal; una toma muy reciente puede requerir repetir la medición según absorción y criterio del laboratorio.');
      return plan;
    }
    var temporal = s.drug === 'dabigatran' ? hours > 24 && crcl > 50 : hours > 16 && crcl > 30;
    var qualitative = ['dabigatran','rivaroxaban'].indexOf(s.drug) === -1 || s.uQualitative === 'within';
    if (s.uCanDelay === 'yes' && s.uLevelStatus === 'unavailable' && temporal && qualitative) {
      route('doac-consensus-criteria','Criterios temporales del consenso cumplidos',
        s.drug === 'dabigatran' ? 'Figura 5: última toma hace >24 h, ClCr >50 mL/min y ratio TTPa ≤1,2.' :
          'Figura 5: última toma hace >16 h y ClCr >30 mL/min.' + (s.drug === 'rivaroxaban' ? ' Además, ratio TP ≤1,2.' : ' TP/TTPa no se utiliza para excluir el efecto de este fármaco.'));
      add('Decisión del equipo','Confirmar la estrategia con Anestesia y Cirugía',plan.decision.text + ' Estos criterios orientan la valoración, pero no demuestran ausencia de efecto anticoagulante. Confirmar el nivel específico si está disponible y el contexto del procedimiento.');
      return plan;
    }
    if (s.uLevelStatus === 'pending') {
      plan.warnings.push('El nivel específico está pendiente: incorporar el resultado cuando llegue. No sustituirlo por una prueba rutinaria normal.');
    } else if (s.uLevelStatus === 'known') {
      plan.warnings.push('Nivel específico ≥30 ng/mL: no se cumple el umbral estricto <30 de la figura 5, incluido el valor exacto de 30.');
    } else {
      plan.warnings.push('No se cumplen todos los criterios orientativos de la figura 5; las igualdades de 24 h/50 mL/min para dabigatrán y 16 h/30 mL/min para inhibidores de Xa no cumplen sus comparadores estrictos.');
    }
    if (s.uCanDelay === 'yes') {
      route('doac-delay-reassess','Demorar si es viable y reevaluar el efecto anticoagulante',
        'El equipo confirma que existe margen de demora. Mantener suspendido el anticoagulante y reevaluar la eliminación y la hemostasia antes de decidir la intervención.');
      add('Durante la demora','Solicitar o repetir el nivel específico',
        'Acordar la demora y la repetición de la analítica según última toma, función renal, absorción, urgencia y recursos disponibles. No se asigna una espera fija de 24 o 48 h ni se considera suficiente el paso del tiempo.');
    } else if (s.drug === 'dabigatran') {
      route('dabigatran-no-delay','Sin demora posible: valorar idarucizumab',
        'Si se necesita revertir el efecto de dabigatrán para una cirugía urgente o un procedimiento de emergencia, valorar idarucizumab en el medio hospitalario.');
      add('Reversión específica','Idarucizumab 5 g IV (2 × 2,5 g)',
        'La ficha técnica autoriza este uso para cirugía urgente/procedimientos de emergencia. Confirmar la necesidad de reversión, administración conforme a ficha, respuesta y vigilancia con el equipo responsable.');
    } else {
      route('xa-no-delay','Sin demora posible: valoración especializada de reversión',
        'Valorar con Anestesia/Hematología una estrategia hemostática; el consenso contempla CCP cuando corresponde. La selección y la pauta requieren el protocolo hospitalario y la ficha del producto.');
      add('Reversión hospitalaria','Valorar CCP con el equipo responsable',
        'No se calcula dosis ni se prescribe automáticamente un agente de reversión. Andexanet alfa no se propone como pretratamiento de cirugía urgente; para edoxabán tampoco tiene indicación EMA.');
    }
    if (s.uLevelStatus === 'pending') {
      plan.status = 'review'; plan.decision.route = 'review';
      plan.blockers.push('Nivel específico pendiente: la propuesta queda condicionada a valoración inmediata y al resultado, sin retrasar una actuación vital.');
    }
    return plan;
  }
  return Object.freeze({version:'0.4.0-urgent-consensus-2025',SOURCE:SOURCE,fresh:fresh,validate:validate,makePlan:makePlan});
});
