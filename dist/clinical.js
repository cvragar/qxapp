/* QxApp · Spanish multidisciplinary consensus 2025.
 * Vivas et al. DOI 10.1016/j.recesp.2025.07.008: tables 2/3, figure 2, pp. 4–7.
 * Pure functions. No persistence, identifiers, network or dose prescriptions.
 * Figure 2 shows LAST DOSE days; stopDays counts COMPLETE days before D0.
 * A minimal-risk procedure has a separate dose-omission strategy (table 3).
 */
(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./procedures.js') : root.QXProcedures);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.QXClinical = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (procedures) {
  'use strict';
  var SOURCE = Object.freeze({year: 2025, short: 'Vivas et al. · Consenso multidisciplinar 2025 · Rev Esp Cardiol', detail: 'Tabla 2 (riesgo trombótico), figura 2 (calendario), tabla 3 (riesgo mínimo) y texto, pp. 4–7', url: 'https://doi.org/10.1016/j.recesp.2025.07.008'});
  var DRUGS = Object.freeze({
    acenocumarol: {label:'Acenocumarol',family:'avk'}, warfarina:{label:'Warfarina',family:'avk'},
    dabigatran:{label:'Dabigatrán',family:'doac'}, rivaroxaban:{label:'Rivaroxabán',family:'doac'},
    apixaban:{label:'Apixabán',family:'doac'}, edoxaban:{label:'Edoxabán',family:'doac'}
  });
  function number(v) { if(v===null||v===undefined||typeof v==='boolean'||(typeof v==='string'&&v.trim()===''))return null;var n=Number(v);return Number.isFinite(n)?n:null; }
  function validAge(v){var n=number(v);return n!==null&&n>=18&&n<=120?n:null;}
  function yes(v){return v===true;}
  var REQUIRED_BOOLEAN_FIELDS = Object.freeze([
    'neuraxial','antiplatelet','multipleAnticoagulants','renalUnstable','activeBleeding',
    'severeLiverDisease','pregnancy','activeCancer','bleedingModifiers','rheumaticMitral',
    'antiphospholipidSyndrome','heartFailure','hypertension','diabetes','vascularDisease',
    'strokeHistory','systemicEmbolism','perioperativeStroke','intracardiacThrombus',
    'floatingAorticThrombus','recentCardioembolicStroke','valveThrombosis'
  ]);
  function owns(input,key){return Object.prototype.hasOwnProperty.call(input,key);}
  // Validate before deriving catalogue controls so unknown facts never become false.
  function prepareInput(input,requireSafety){
    var errors=[],value=Object.create(null);
    if(!input||typeof input!=='object'||Array.isArray(input)){
      errors.push('La entrada debe ser un objeto con los datos clínicos explícitos.');
    }else Object.assign(value,input);
    if(requireSafety){
      REQUIRED_BOOLEAN_FIELDS.forEach(function(key){
        if(!owns(value,key)||typeof value[key]!=='boolean')errors.push('Confirma el dato '+key+' con un booleano true o false.');
      });
      if(!owns(value,'specialProcedure')||typeof value.specialProcedure!=='string')errors.push('Indica specialProcedure como texto; usa una cadena vacía si no hay protocolo adicional.');
    }else if(owns(value,'specialProcedure')&&typeof value.specialProcedure!=='string'){
      errors.push('El protocolo adicional del procedimiento debe ser texto.');
    }
    if(!owns(value,'urgency')||['elective','urgent'].indexOf(value.urgency)===-1)errors.push('Indica urgency como elective o urgent.');
    if(owns(value,'urgent')&&(typeof value.urgent!=='boolean'||value.urgent!==(value.urgency==='urgent'))){
      errors.push('El indicador urgent debe ser booleano y coincidir con urgency.');
    }
    value.urgent=value.urgency==='urgent';
    if(owns(value,'aorticFloatingThrombus')&&typeof value.aorticFloatingThrombus!=='boolean'){
      errors.push('El indicador aorticFloatingThrombus debe ser booleano.');
    }
    var id='',procedure=null;
    if(owns(value,'procedureId')){
      if(typeof value.procedureId!=='string')errors.push('El identificador del procedimiento debe ser texto.');
      else id=value.procedureId;
    }
    if(owns(value,'procedure')&&value.procedure!==null){
      if(!value.procedure||typeof value.procedure!=='object'||Array.isArray(value.procedure)||!owns(value.procedure,'id')||typeof value.procedure.id!=='string'||!value.procedure.id){
        errors.push('El procedimiento debe identificar una entrada del catálogo.');
      }else if(id&&id!==value.procedure.id){
        errors.push('Los identificadores del procedimiento no coinciden.');
      }else id=value.procedure.id;
    }
    if(id){
      procedure=Array.isArray(procedures)?procedures.find(function(p){return p.id===id;}):null;
      if(!procedure)errors.push('No se ha podido verificar el procedimiento en el catálogo.');
      else{
        if(value.bleedingRisk&&value.bleedingRisk!==procedure.risk)errors.push('El riesgo hemorrágico no coincide con el procedimiento del catálogo.');
        value.bleedingRisk=procedure.risk;
        value.neuraxial=yes(value.neuraxial)||yes(procedure.neuraxial);
        value.pregnancy=yes(value.pregnancy)||yes(procedure.pregnancy);
        if(procedure.specialProtocol)value.specialProcedure=procedure.specialProtocol;
      }
    }
    return {input:value,errors:errors};
  }
  function invalidDecision(errors){return {route:'review',title:'Revisar los datos clínicos',text:errors.join(' ')};}
  function risk(level,reasons,score){return {level:level,label:{lowModerate:'Bajo-moderado',high:'Alto',unknown:'Sin determinar'}[level],reasons:reasons,score:score===undefined?null:score,source:SOURCE};}
  /** CHA2DS2-VA, maximum 8. Sex is not a component of the 2025 score. */
  function cha2ds2va(input){input=input||{};var age=validAge(input.age);if(age===null)return null;return(age>=75?2:age>=65?1:0)+(yes(input.heartFailure)?1:0)+(yes(input.hypertension)?1:0)+(yes(input.diabetes)?1:0)+(yes(input.vascularDisease)?1:0)+(yes(input.strokeHistory)||yes(input.systemicEmbolism)?2:0);}
  /** Cockcroft–Gault, mL/min. Keep the unrounded result at renal boundaries. */
  function cockcroftGault(input){input=input||{};var age=validAge(input.age),weight=number(input.weightKg),scr=number(input.creatinine);if(age===null||weight===null||weight<=0||weight>500||scr===null||scr<=0)return null;if(['female','male'].indexOf(input.sex)===-1)return null;if(input.creatinineUnit==='umol/L'||input.creatinineUnit==='µmol/L')scr/=88.4;else if(input.creatinineUnit!=='mg/dL')return null;var result=((140-age)*weight)/(72*scr)*(input.sex==='female'?0.85:1);return Number.isFinite(result)&&result>0?result:null;}

  function thromboticRisk(input){
    input=input||{};var months=number(input.strokeMonths),score=null,reasons=[];
    if(yes(input.perioperativeStroke))reasons.push('Ictus durante un periodo perioperatorio previo.');
    if(yes(input.antiphospholipidSyndrome))reasons.push('Síndrome antifosfolipídico.');
    if(input.thrombophilia==='severe')reasons.push('Trombofilia grave.');
    if(yes(input.intracardiacThrombus))reasons.push('Trombo intracavitario.');
    if(yes(input.aorticFloatingThrombus)||yes(input.floatingAorticThrombus))reasons.push('Trombo aórtico flotante.');
    if(yes(input.recentCardioembolicStroke))reasons.push('Ictus cardioembólico hace menos de 3 meses.');
    if(input.indication==='af'){
      score=cha2ds2va(input);
      if(yes(input.rheumaticMitral))reasons.push('Valvulopatía reumática mitral.');
      if(yes(input.strokeHistory)&&months!==null&&months>=0&&months<3)reasons.push('Ictus o AIT hace menos de 3 meses.');
      if(score!==null&&score>=7)reasons.push('CHA₂DS₂-VA ≥7.');
      if(reasons.length)return risk('high',reasons,score);
      if(score===null)return risk('unknown',['Completa la edad para calcular CHA₂DS₂-VA.']);
      if(yes(input.strokeHistory)&&(months===null||months<0))return risk('unknown',['Indica el tiempo desde el último ictus o AIT.'],score);
      if(score===0)return risk('unknown',['La tabla 2 clasifica CHA₂DS₂-VA 1–6 y ≥7. Con 0 puntos, revisar la indicación de anticoagulación.'],score);
      return risk('lowModerate',['CHA₂DS₂-VA 1–6, sin ictus/AIT reciente (<3 meses) ni otros criterios de alto riesgo.'],score);
    }
    if(input.indication==='valve'){
      if(input.valveType==='mitral')reasons.push('Prótesis mecánica mitral.');
      if(input.valveType==='aorticOld')reasons.push('Prótesis aórtica de generación antigua (bola enjaulada o disco basculante).');
      if(['aorticOld','aorticBileaflet'].indexOf(input.valveType)!==-1){
        if(yes(input.valveThrombosis))reasons.push('Antecedente de trombosis valvular.');
        if(yes(input.strokeHistory)&&months!==null&&months>=0&&months<3)reasons.push('Prótesis aórtica con ictus/AIT hace menos de 3 meses.');
      }
      if(reasons.length)return risk('high',reasons);
      if(input.valveType!=='aorticBileaflet')return risk('unknown',['La tabla 2 de 2025 no clasifica esta posición o tipo de prótesis; precisa valoración especializada.']);
      if(yes(input.strokeHistory)&&(months===null||months<0))return risk('unknown',['Indica el tiempo desde el último ictus o AIT.']);
      return risk('lowModerate',['Prótesis aórtica bidisco sin ictus/AIT reciente, ictus perioperatorio previo ni trombosis valvular previa.']);
    }
    if(input.indication==='vte'){
      var vteMonths=number(input.vteMonths);
      if(vteMonths!==null&&vteMonths>=0&&vteMonths<3)reasons.push('Tromboembolia venosa hace menos de 3 meses.');
      if(yes(input.activeCancer)&&input.cancerType==='highVte')reasons.push('Antecedente de TEV con cáncer activo de alto riesgo de TEV, según la nota de la tabla 2.');
      if(reasons.length)return risk('high',reasons);
      if(yes(input.activeCancer)&&input.cancerType!=='highVte')return risk('unknown',['Cáncer activo: precisar el tipo y la valoración oncológica del riesgo de TEV. La nota de la tabla 2 no clasifica todos los tumores como alto riesgo.']);
      if(vteMonths===null||vteMonths<0)return risk('unknown',['Indica el tiempo desde el último episodio de TEV.']);
      if(['none','nonsevere','severe'].indexOf(input.thrombophilia)===-1)return risk('unknown',['Completa la presencia y gravedad de la trombofilia.']);
      return risk('lowModerate',['TEV hace ≥3 meses, incluido TEV recurrente o trombofilia no grave, sin criterios de alto riesgo.']);
    }
    if(reasons.length)return risk('high',reasons);
    return risk('unknown',['La indicación necesita clasificación individual en la tabla 2.']);
  }

  /** The decision is derived from facts, never from a user's preferred interruption. */
  function managementDecision(input){
    var prepared=prepareInput(input,false);
    if(prepared.errors.length){
      if(!input||!Object.keys(input).length)return{route:'pending',title:'Completa el contexto',text:'Indica la urgencia y el procedimiento antes de definir la estrategia.'};
      return invalidDecision(prepared.errors);
    }
    return decisionFromFacts(prepared.input);
  }
  function decisionFromFacts(input){
    if(yes(input.urgent))return{route:'review',title:'Valoración urgente',text:'Suspender el anticoagulante y evaluar de inmediato la urgencia, la última toma, la hemostasia y la necesidad de reversión. El calendario electivo no es aplicable.'};
    if(yes(input.neuraxial)||(typeof input.specialProcedure==='string'&&input.specialProcedure.trim()))return{route:'review',title:'Aplicar el protocolo específico',text:'La técnica indicada requiere una estrategia individual; no debe heredar el calendario genérico.'};
    if(['minimal','low','moderate','high','lowModerate'].indexOf(input.bleedingRisk)===-1)return{route:'pending',title:'Selecciona el procedimiento',text:'El algoritmo determinará la estrategia a partir del riesgo hemorrágico y del contexto clínico.'};
    if(input.bleedingRisk==='minimal')return{route:'minimal',title:'Mantener con ajuste de tomas',text:'El riesgo mínimo lleva a la estrategia de la tabla 3: omitir la toma del día del procedimiento y ajustar las tomas previas según el fármaco; no significa mantener todas las dosis.'};
    return{route:'interrupt',title:'Interrumpir antes del procedimiento',text:'El procedimiento no es de riesgo hemorrágico mínimo. El consenso propone suspender el anticoagulante; el intervalo depende del fármaco, la función renal o el INR y el riesgo de sangrado.'};
  }

  function makePlan(input){
    var prepared=prepareInput(input,true);input=prepared.input;
    var drug=Object.prototype.hasOwnProperty.call(DRUGS,input.drug)?DRUGS[input.drug]:null;
    var r=prepared.errors.length?risk('unknown',['Completa y corrige los datos clínicos antes de clasificar el riesgo.']):thromboticRisk(input);
    var d=prepared.errors.length?invalidDecision(prepared.errors):decisionFromFacts(input);
    var plan={status:'review',title:'Valoración individual necesaria',risk:r,decision:d,blockers:[],warnings:[],interruption:d.route==='minimal'?'minimal':d.route==='interrupt'?'yes':null,lastDoseDay:null,lastDoseLabel:null,stopDays:null,bridge:{indicated:false,label:'No determinado',text:''},restart:{hours:null,label:null,text:''},steps:[],source:SOURCE,validatedForCurrentPractice:false};
    var b=plan.blockers,w=plan.warnings;
    w.push('Implementación del consenso de 2025 pendiente de validación clínica independiente. Confirmar el plan con el equipo responsable y la hemostasia antes del reinicio.');
    if(prepared.errors.length){
      b.push.apply(b,prepared.errors);
      plan.steps=[{label:'Revisar',title:'No se calcula un calendario automático',text:b.join(' ')}];
      return plan;
    }
    var crcl=number(input.crcl),inr=number(input.inr);
    if(!drug)b.push('Selecciona un anticoagulante oral incluido en el algoritmo.');
    if(validAge(input.age)===null)b.push('Completa una edad adulta válida (18–120 años); este algoritmo no contempla pacientes pediátricos.');
    if(typeof input.specialProcedure==='string'&&input.specialProcedure.trim())b.push('Protocolo específico del procedimiento: '+input.specialProcedure.trim());
    if(yes(input.urgent))b.push(d.text);
    if(yes(input.neuraxial))b.push('Las técnicas neuroaxiales, la punción lumbar y los catéteres epidurales requieren un protocolo específico de anestesia.');
    if(yes(input.antiplatelet))b.push('Anticoagulante más antiagregante: integrar el algoritmo de antiagregación y el contexto coronario antes de concretar el plan combinado.');
    if(yes(input.multipleAnticoagulants))b.push('Hay más de un anticoagulante: revisar el tratamiento y las transiciones.');
    if(yes(input.renalUnstable))b.push('Función renal inestable o lesión renal aguda: no puede fijarse el calendario con una estimación aislada.');
    if(yes(input.activeBleeding))b.push('Hemorragia activa: se requiere valoración asistencial inmediata.');
    if(yes(input.severeLiverDisease))b.push('Hepatopatía grave: individualizar la farmacocinética y la hemostasia.');
    if(yes(input.pregnancy))b.push('Embarazo: aplicar un protocolo específico de anticoagulación.');
    if(d.route==='pending')b.push('Selecciona el riesgo hemorrágico del procedimiento.');
    if(input.bleedingRisk==='lowModerate')b.push('La figura 2 diferencia riesgo bajo de moderado-alto para el intervalo de retirada. Concreta si el procedimiento es bajo o moderado.');
    if(r.level==='unknown')b.push.apply(b,r.reasons);
    if(yes(input.activeCancer)&&input.cancerType!=='highVte')b.push('Cáncer activo sin clasificación específica de alto riesgo de TEV: individualizar con el equipo responsable antes de definir el calendario y la terapia puente.');
    if(yes(input.activeCancer))w.push('La nota de la tabla 2 destaca cáncer de páncreas, síndromes mieloproliferativos, tumor cerebral primario, cáncer gástrico y esofágico como contextos de alto riesgo de TEV.');
    if(yes(input.bleedingModifiers)){
      w.push('Los factores personales de sangrado pueden modificar la estrategia del procedimiento y deben incorporarse a la decisión clínica.');
      if(d.route!=='minimal'||(drug&&drug.family==='avk'))b.push('Hay factores personales que aumentan el sangrado. Individualizar el riesgo y el intervalo antes de aplicar el calendario del procedimiento.');
    }
    if(drug&&drug.family==='doac'){
      if(input.indication==='valve')b.push('ACOD y prótesis mecánica: verificar la idoneidad del tratamiento con el especialista.');
      if(yes(input.rheumaticMitral))b.push('ACOD y valvulopatía reumática mitral: revisar la idoneidad del tratamiento.');
      if(yes(input.antiphospholipidSyndrome))b.push('ACOD y síndrome antifosfolipídico: revisar la idoneidad del tratamiento.');
      if(crcl===null||crcl<=0||crcl>250)b.push('Introduce un ClCr válido, en mL/min, calculado por Cockcroft–Gault y no normalizado a 1,73 m².');
      else if(input.drug==='dabigatran'&&crcl<=30)b.push('El texto de 2025 no recomienda dabigatrán con ClCr ≤30 mL/min; revisar el tratamiento.');
      else if(crcl<15)b.push('ClCr <15 mL/min: fuera del intervalo de uso contemplado en este algoritmo.');
      else if(crcl===30&&d.route==='interrupt')b.push('La figura 2 deja sin asignar el límite exacto de ClCr 30 mL/min para los inhibidores de Xa (>30 y <30). Confirmar un intervalo individual.');
      if(crcl!==null&&crcl>=15&&crcl<30)w.push('Insuficiencia renal importante: confirmar estabilidad renal y adecuación del fármaco.');
      plan.bridge={indicated:false,label:'Sin terapia puente',text:'El consenso de 2025 no recomienda terapia puente con HBPM ni HNF en pacientes tratados con ACOD, incluido el riesgo trombótico alto.'};
      if(d.route==='minimal'&&((crcl!==null&&crcl<50)||yes(input.bleedingModifiers)))b.push('Riesgo mínimo con factores que pueden aumentar el sangrado: la tabla 3 propone considerar una suspensión corta de ACOD de 24–48 h. Individualizar el intervalo; no se asigna automáticamente la pauta mínima.');
    }
    if(drug&&drug.family==='avk'){
      if(inr===null||inr<=0||inr>20)b.push('Introduce un INR válido; para el calendario de retirada, medirlo aproximadamente 7 días antes.');
      else if(d.route==='minimal'&&(inr<2||inr>2.5))b.push('La tabla 3 propone INR previo 2–2,5 para riesgo mínimo, por valorar según el procedimiento. Con el INR introducido, confirmar el objetivo y la estrategia de forma individual.');
      else if(d.route==='interrupt'&&inr>3)b.push('INR >3: el consenso exige ampliar la suspensión según el INR; no aporta un número fijo de días para esta situación.');
    }
    if(b.length){plan.steps=[{label:'Revisar',title:'No se calcula un calendario automático',text:b.join(' ')}];return plan;}
    plan.status='ready';
    if(d.route==='minimal'){
      var twiceDaily=input.drug==='dabigatran'||input.drug==='apixaban';
      plan.title='Mantener con ajuste de tomas';
      plan.lastDoseLabel=twiceDaily?'Última toma: 24 h antes':'Omitir el día 0';
      plan.bridge={indicated:false,label:'Sin terapia puente',text:'La estrategia de riesgo mínimo no sustituye el anticoagulante por heparina.'};
      plan.restart={hours:null,label:'Mañana del día siguiente',text:'Reintroducir lo antes posible tras confirmar hemostasia, preferentemente la mañana del día siguiente. '+(twiceDaily?'Con ACOD cada 12 h, valorar la primera noche del procedimiento según el riesgo trombótico y la hemostasia.':'')};
      if(drug.family==='avk')plan.steps.push({label:'Antes',title:'Comprobar el INR previo',text:'Objetivo orientativo de la tabla 3: INR 2–2,5, ajustado al procedimiento y al objetivo terapéutico individual.'});
      if(twiceDaily)plan.steps.push({label:'Día −1',title:'Omitir la toma de la noche anterior',text:'Para el ACOD pautado cada 12 h, la tabla 3 propone una última toma 24 h antes de la intervención. Concretar el horario real de la cirugía y de las dosis.'});
      plan.steps.push({label:'Día 0',title:'No tomar el anticoagulante oral',text:'Omitir la toma del día del procedimiento según la tabla 3. Asegurar medidas de hemostasia y confirmar la estrategia con el equipo que realiza la técnica.'});
      plan.steps.push({label:'Después',title:'Reintroducir tras confirmar hemostasia',text:plan.restart.text});
      return plan;
    }
    var day,interval;
    if(drug.family==='avk'){
      day=input.drug==='warfarina'?(inr<2?-5:-6):(inr<2?-3:-4);
      plan.bridge=r.level==='high'?{indicated:true,label:'Valorar terapia puente',text:'Solo en pacientes seleccionados con AVK y riesgo tromboembólico alto. Acordar la indicación y la pauta con el equipo responsable; valorar diferir la intervención si es posible. No se calculan dosis de heparina.'}:{indicated:false,label:'Sin terapia puente',text:'No se recomienda terapia puente para riesgo tromboembólico bajo-moderado.'};
    }else if(input.drug==='dabigatran'){
      // The diagram prints >80 and 50–79: use the longer interval at exactly 80.
      interval=crcl>80?2:crcl>=50?3:4;
      if(crcl===80)w.push('ClCr exactamente 80 mL/min: la figura 2 imprime >80 y 50–79; se adopta el intervalo más largo de la fila 50–79. Confirmar esta decisión de implementación con el protocolo local.');
      day=-(interval+(input.bleedingRisk==='low'?0:1));
    }else{interval=crcl>30?2:3;day=-(interval+(input.bleedingRisk==='low'?0:1));}
    plan.title='Interrumpir '+drug.label.toLowerCase();plan.lastDoseDay=day;plan.stopDays=-day-1;
    var high=input.bleedingRisk==='high';
    plan.restart={hours:high?[48,72]:[0,24],label:high?'48–72 h':'En las primeras 24 h',text:(high?'La figura 2 propone reiniciar a las 48–72 h en alto riesgo hemorrágico.':'La figura 2 propone reiniciar en las primeras 24 h.')+' Siempre según hemostasia; si no se alcanza competencia hemostática, retrasar y reevaluar. '+(drug.family==='avk'?'El texto aconseja reiniciar el AVK lo antes posible por su efecto diferido. Si se ha indicado puente, individualizar también el reinicio de heparina según hemostasia.':'No se utiliza terapia puente con heparina.')};
    plan.steps.push({label:'Día '+day,title:'Última dosis de '+drug.label.toLowerCase(),text:'Último día de administración antes del procedimiento. Quedan '+plan.stopDays+' días completos sin el anticoagulante antes del día 0. Confirmar las horas y la frecuencia reales de las tomas.'});
    plan.steps.push({label:'Antes',title:plan.bridge.label,text:plan.bridge.text});
    if(drug.family==='avk')plan.steps.push({label:'Preoperatorio',title:'Control de INR inmediatamente antes',text:'Objetivo general del texto de 2025: INR <1,2; algunos procedimientos aceptan <1,5. Si no se alcanza, reevaluar con el equipo. No se recomienda vitamina K preoperatoria de rutina en cirugía electiva.'});
    plan.steps.push({label:'Día 0',title:'Intervención',text:'Confirmar última toma, estrategia acordada y condiciones de hemostasia. No administrar el anticoagulante antes del procedimiento.'});
    plan.steps.push({label:high?'+48–72 h':'Primeras 24 h',title:'Valorar reinicio',text:plan.restart.text});
    return plan;
  }
  return Object.freeze({version:'0.3.0-consensus-2025',requiredBooleanFields:REQUIRED_BOOLEAN_FIELDS,SOURCE:SOURCE,DRUGS:DRUGS,cha2ds2va:cha2ds2va,cockcroftGault:cockcroftGault,thromboticRisk:thromboticRisk,managementDecision:managementDecision,makePlan:makePlan});
});
