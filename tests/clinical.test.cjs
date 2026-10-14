'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../dist/clinical.js');
const base = { drug:'apixaban', indication:'af', age:68, sex:'male', hypertension:true, bleedingRisk:'low', crcl:85, inr:2.5 };
const p = overrides => C.makePlan({...base,...overrides});

test('2025 CHA₂DS₂-VA: no sex point; age/event points never double-count',()=>{
  for(const [age,expected] of [[64,0],[65,1],[74,1],[75,2]]){
    assert.equal(C.cha2ds2va({age,sex:'male'}),expected);
    assert.equal(C.cha2ds2va({age,sex:'female'}),expected);
    assert.equal(C.cha2ds2va({age}),expected);
  }
  assert.equal(C.cha2ds2va({age:80,heartFailure:true,hypertension:true,diabetes:true,vascularDisease:true,strokeHistory:true,systemicEmbolism:true}),8);
  assert.equal(C.cha2ds2va({age:45,strokeHistory:true,systemicEmbolism:true}),2);
  for(const age of ['',null,12,121])assert.equal(C.cha2ds2va({age}),null);
});

test('Cockcroft–Gault: units and unrounded thresholds',()=>{
  const m={age:68,sex:'male',weightKg:72,creatinine:1,creatinineUnit:'mg/dL'};
  assert.equal(C.cockcroftGault(m),72);
  assert.equal(C.cockcroftGault({...m,sex:'female'}),61.199999999999996);
  assert.equal(C.cockcroftGault({...m,creatinine:88.4,creatinineUnit:'umol/L'}),72);
  for(const input of [{creatinine:''},{creatinine:0},{creatinineUnit:'mg/L'},{weightKg:-2},{sex:''}])assert.equal(C.cockcroftGault({...m,...input}),null);
  assert.ok(C.cockcroftGault({...m,creatinine:72/29.999})<30);
});

test('Table 2: AF is low-moderate or high, exact 3 months is resolved',()=>{
  assert.equal(C.thromboticRisk(base).level,'lowModerate');
  const score6={...base,age:80,heartFailure:true,diabetes:true,strokeHistory:true,strokeMonths:6};
  assert.equal(C.thromboticRisk(score6).score,7);
  assert.equal(C.thromboticRisk(score6).level,'high');
  for(const [strokeMonths,expected] of [[2.99,'high'],[3,'lowModerate'],[6,'lowModerate']])assert.equal(C.thromboticRisk({...base,strokeHistory:true,strokeMonths}).level,expected);
  for(const flags of [{rheumaticMitral:true},{perioperativeStroke:true}])assert.equal(C.thromboticRisk({...base,...flags}).level,'high');
  assert.equal(C.thromboticRisk({...base,strokeHistory:true}).level,'unknown');
  assert.equal(C.thromboticRisk({...base,age:40,hypertension:false}).level,'unknown');
});

test('Table 2: current valve criteria replace old age/diabetes and 6-month rules',()=>{
  const v={...base,indication:'valve',valveType:'aorticBileaflet'};
  assert.equal(C.thromboticRisk(v).level,'lowModerate');
  assert.equal(C.thromboticRisk({...v,age:80,diabetes:true,atrialFibrillation:true}).level,'lowModerate');
  for(const extra of [{valveType:'mitral'},{valveType:'aorticOld'},{valveThrombosis:true},{perioperativeStroke:true},{strokeHistory:true,strokeMonths:2.99}])assert.equal(C.thromboticRisk({...v,...extra}).level,'high');
  assert.equal(C.thromboticRisk({...v,strokeHistory:true,strokeMonths:3}).level,'lowModerate');
  assert.equal(C.thromboticRisk({...v,valveType:'tricuspid'}).level,'unknown');
});

test('Table 2: TEV boundaries, active cancer, severe thrombophilia and APS',()=>{
  const v={indication:'vte',thrombophilia:'none'};
  for(const [vteMonths,expected] of [[0,'high'],[2.99,'high'],[3,'lowModerate'],[12,'lowModerate'],[24,'lowModerate']])assert.equal(C.thromboticRisk({...v,vteMonths}).level,expected);
  for(const flags of [{activeCancer:true,cancerType:'highVte'},{thrombophilia:'severe'},{antiphospholipidSyndrome:true}])assert.equal(C.thromboticRisk({...v,vteMonths:24,...flags}).level,'high');
  for(const flags of [{recurrentVte:true},{thrombophilia:'nonsevere'}])assert.equal(C.thromboticRisk({...v,vteMonths:24,...flags}).level,'lowModerate');
});

test('Cancer footnote does not silently classify every active tumour as high risk',()=>{
  for(const cancerType of ['',undefined,'other']){
    const flags={indication:'vte',vteMonths:24,thrombophilia:'none',activeCancer:true,cancerType};
    assert.equal(C.thromboticRisk(flags).level,'unknown');
    assert.equal(p({...flags,drug:'warfarina'}).status,'review');
  }
  const recent={indication:'vte',vteMonths:1,thrombophilia:'none',activeCancer:true,cancerType:'other'};
  assert.equal(C.thromboticRisk(recent).level,'high');
  assert.equal(p(recent).status,'review');
});

test('Other table-2 high-risk indications can be represented without guessing a score',()=>{
  for(const flag of ['perioperativeStroke','intracardiacThrombus','aorticFloatingThrombus','recentCardioembolicStroke','antiphospholipidSyndrome'])assert.equal(C.thromboticRisk({indication:'other',[flag]:true}).level,'high');
});

test('Severe thrombophilia and APS are high risk across indications, including AF treated with AVK',()=>{
  for(const flags of [{thrombophilia:'severe'},{antiphospholipidSyndrome:true}]){
    assert.equal(C.thromboticRisk({...base,...flags}).level,'high');
    assert.equal(p({...flags,drug:'warfarina'}).bridge.indicated,true);
  }
});

test('Algorithm owns continuation: arbitrary interruption preference cannot override procedure',()=>{
  assert.equal(C.managementDecision({bleedingRisk:'minimal'}).route,'minimal');
  for(const bleedingRisk of ['low','moderate','high'])assert.equal(C.managementDecision({bleedingRisk,interruption:'no'}).route,'interrupt');
  assert.deepEqual(p({interruption:'no'}),p({interruption:'yes'}));
  assert.equal(p({bleedingRisk:'minimal',interruption:'yes'}).interruption,'minimal');
  assert.equal(C.managementDecision({}).route,'pending');
  assert.equal(C.managementDecision({...base,urgent:true}).route,'review');
});

test('Table 3: minimum risk omits D0, BID DOAC evening before, no generic day calendar',()=>{
  for(const drug of Object.keys(C.DRUGS)){
    const plan=p({drug,bleedingRisk:'minimal'});
    assert.equal(plan.status,'ready');assert.equal(plan.lastDoseDay,null);assert.equal(plan.stopDays,null);assert.equal(plan.bridge.indicated,false);
    assert.ok(plan.steps.some(x=>x.title==='No tomar el anticoagulante oral'));
    assert.equal(plan.steps.some(x=>x.title==='Omitir la toma de la noche anterior'),['dabigatran','apixaban'].includes(drug));
    assert.equal(plan.restart.label,'Mañana del día siguiente');
  }
  assert.equal(p({bleedingRisk:'minimal',crcl:40}).status,'review');
  assert.equal(p({bleedingRisk:'minimal',bleedingModifiers:true}).status,'review');
  assert.equal(p({drug:'warfarina',bleedingRisk:'minimal',inr:2.6}).status,'review');
});

test('Figure 2 dabigatran: final administration day, not first omitted day',()=>{
  for(const [crcl,low,higher] of [[100,-2,-3],[80.01,-2,-3],[80,-3,-4],[79.99,-3,-4],[50,-3,-4],[49.99,-4,-5],[30.01,-4,-5]]){
    for(const [bleedingRisk,day] of [['low',low],['moderate',higher],['high',higher]]){
      const plan=p({drug:'dabigatran',crcl,bleedingRisk});
      assert.equal(plan.status,'ready');assert.equal(plan.lastDoseDay,day);assert.equal(plan.stopDays,-day-1);assert.equal(plan.bridge.indicated,false);
    }
  }
  assert.ok(p({drug:'dabigatran',crcl:80}).warnings.some(x=>x.includes('exactamente 80')));
  assert.equal(p({drug:'dabigatran',crcl:30}).status,'review');
});

test('Figure 2 factor-Xa agents: renal rows and explicit unassigned 30 boundary',()=>{
  for(const drug of ['apixaban','rivaroxaban','edoxaban']){
    for(const [crcl,low,higher] of [[100,-2,-3],[30.01,-2,-3],[29.99,-3,-4],[15,-3,-4]]){
      assert.equal(p({drug,crcl}).lastDoseDay,low);
      assert.equal(p({drug,crcl,bleedingRisk:'moderate'}).lastDoseDay,higher);
      assert.equal(p({drug,crcl,bleedingRisk:'high'}).lastDoseDay,higher);
    }
    for(const crcl of [30,14.99])assert.equal(p({drug,crcl}).status,'review');
  }
});

test('AVK: figure-2 normal INR, text shorter subtherapeutic, no invented high-INR day',()=>{
  for(const [drug,low,normal] of [['acenocumarol',-3,-4],['warfarina',-5,-6]]){
    assert.equal(p({drug,inr:1.9}).lastDoseDay,low);
    for(const inr of [2,2.5,3])assert.equal(p({drug,inr}).lastDoseDay,normal);
    const elevated=p({drug,inr:3.1});assert.equal(elevated.status,'review');assert.equal(elevated.lastDoseDay,null);
    assert.ok(p({drug}).steps.some(x=>x.text.includes('INR <1,2')));
  }
});

test('2025 bridge: consider only selected high-risk AVK, never routine ACOD bridge',()=>{
  const high={strokeHistory:true,strokeMonths:1};
  const plan=p({...high,drug:'warfarina'});assert.equal(plan.bridge.indicated,true);assert.match(plan.bridge.label,/Valorar/);
  assert.equal(p({drug:'warfarina'}).bridge.indicated,false);
  for(const drug of ['dabigatran','apixaban','rivaroxaban','edoxaban'])assert.equal(p({...high,drug}).bridge.indicated,false);
  assert.equal(p({drug:'warfarina',indication:'vte',vteMonths:24,thrombophilia:'none',antiphospholipidSyndrome:true}).bridge.indicated,true);
  assert.equal(p({indication:'vte',vteMonths:24,thrombophilia:'none',antiphospholipidSyndrome:true}).status,'review');
});

test('Figure 2 restart is within 24 h, or 48–72 h with high risk, conditional on hemostasis',()=>{
  assert.deepEqual(p({bleedingRisk:'moderate'}).restart.hours,[0,24]);
  assert.deepEqual(p({bleedingRisk:'high'}).restart.hours,[48,72]);
  assert.match(p({bleedingRisk:'high'}).restart.text,/hemostasia/);
});

test('Excluded or ambiguous cases never leak an automatic timing or restart',()=>{
  for(const input of [{age:''},{age:12},{bleedingModifiers:true},{specialProcedure:'Protocolo específico'},{urgent:true},{neuraxial:true},{antiplatelet:true},{renalUnstable:true},{crcl:''},{crcl:0},{crcl:NaN},{drug:'dabigatran',crcl:29.99},{indication:'valve',valveType:'mitral'},{rheumaticMitral:true},{antiphospholipidSyndrome:true},{multipleAnticoagulants:true},{activeBleeding:true},{severeLiverDisease:true},{pregnancy:true},{drug:'unknown'},{bleedingRisk:''},{bleedingRisk:'lowModerate'},{drug:'warfarina',inr:''}]){
    const plan=p(input);assert.equal(plan.status,'review',JSON.stringify(input));assert.equal(plan.lastDoseDay,null);assert.equal(plan.stopDays,null);assert.equal(plan.restart.hours,null);assert.ok(plan.blockers.length);
  }
});

test('Pure, source-tagged 2025 rules do not claim clinical validation',()=>{
  const frozen=Object.freeze({...base});assert.deepEqual(C.makePlan(frozen),C.makePlan(frozen));
  assert.equal(p().source.year,2025);assert.equal(p().validatedForCurrentPractice,false);assert.equal(p().historical,undefined);
});
