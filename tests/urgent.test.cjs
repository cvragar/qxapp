'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../dist/urgent.js');
const C = require('../dist/clinical.js');
const procedures = require('../dist/procedures.js');
const base = {
  ...U.fresh(), urgency:'urgent',drug:'apixaban',age:68,
  uPriority:'urgent',uCanDelay:'yes',uBleeding:'no',uUnstable:'no',uNeuraxial:'no',
  uAntiplatelet:'no',uMultiple:'no',uLiver:'no',uPregnancy:'no',
  uDoseKnown:'known',uDoseMg:5,uLastDoseKnown:'known',uLastDoseHours:20,
  uRenalKnown:'known',uCrcl:80,uRenalUnstable:'no',
  uInrKnown:'known',uInr:2,uLevelStatus:'unavailable',uLevelRepresentative:'yes',uQualitative:'unavailable',uConfirmed:true
};
const p = changes => U.makePlan({...base,...changes});
const valid = changes => U.validate({...base,...changes});
const avk = changes => p({drug:'warfarina',...changes});

test('Urgent defaults require explicit facts and independent confirmation',()=>{
  assert.equal(U.fresh().uBleeding,''); assert.equal(U.fresh().uConfirmed,false);
  assert.notStrictEqual(U.fresh(),U.fresh());
  assert.deepEqual(U.validate(base),[]);
  assert.equal(p().status,'urgent'); assert.notEqual(p().status,'ready');
  assert.equal(U.makePlan(U.fresh()).status,'review');
});

test('Input schema rejects missing, inherited, coercible and contradictory data',()=>{
  for (const input of [undefined,null,[],true,'urgent',Object.create(base)]) {
    assert.equal(U.makePlan(input).status,'review'); assert.ok(U.validate(input).length);
  }
  const nullProto = Object.assign(Object.create(null),base);
  assert.deepEqual(U.validate(nullProto),[]);
  for (const key of ['urgency','drug','age','uPriority','uCanDelay','uBleeding','uUnstable','uNeuraxial','uAntiplatelet','uMultiple','uLiver','uPregnancy','uDoseKnown','uLastDoseKnown','uRenalKnown','uRenalUnstable','uLevelStatus','uQualitative','uConfirmed']) {
    const input={...base};delete input[key];assert.ok(U.validate(input).length,key);
  }
  for(const changes of [{urgency:'elective'},{urgent:false},{urgent:'true'},{drug:'constructor'},
    {drug:'toString'},{drug:'__proto__'},{uConfirmed:'true'},{uConfirmed:1},{uBleeding:false},
    {uBleeding:0},{uBleeding:''},{uBleeding:'false'},{drug:'warfarina',uPriority:'emergency',uCanDelay:'yes'},
    {drug:'warfarina',uPriority:'emergency',uCanDelay:'unknown'},{uPriority:'deferred',uCanDelay:'no'},
    {uPriority:'deferred',uCanDelay:'unknown'}]) assert.ok(valid(changes).length,JSON.stringify(changes));
  const getter={...base};Object.defineProperty(getter,'age',{enumerable:true,get(){throw Error('must not execute');}});
  assert.equal(U.makePlan(getter).status,'review');
});

test('Numbers are finite scalar decimals, never blank, boolean, arrays or objects',()=>{
  for (const key of ['age','uDoseMg','uLastDoseHours','uCrcl']) {
    for(const value of ['', ' ',true,false,null,undefined,[],[5],{},NaN,Infinity,'NaN','0x20'])
      assert.ok(valid({[key]:value}).length,key+':'+String(value));
  }
  for(const changes of [{age:17.99},{age:120.01},{uDoseMg:0},{uDoseMg:-1},{uLastDoseHours:-0.1},{uCrcl:-1},{uCrcl:250.1},
    {drug:'warfarina',uInr:0},{drug:'warfarina',uInr:20.01},{uLevelStatus:'known',uLevel:-1}])
    assert.ok(valid(changes).length,JSON.stringify(changes));
  assert.deepEqual(valid({age:'68',uDoseMg:'5',uLastDoseHours:'0',uCrcl:'0'}),[]);
  assert.equal(p({uCrcl:0}).status,'review');
});

test('Unknown and special safety states remain review, even with reassuring results',()=>{
  for(const key of ['uBleeding','uUnstable','uNeuraxial','uAntiplatelet','uMultiple','uLiver','uPregnancy']) {
    for(const value of ['yes','unknown']) {
      const plan=p({[key]:value,uLevelStatus:'known',uLevel:0});
      assert.equal(plan.status,'review',key);assert.equal(plan.pathway,'specialist');
      assert.ok(plan.blockers.length);assert.equal(plan.waitHours,null);
    }
  }
  for(const changes of [{uCanDelay:'unknown'},{uDoseKnown:'unknown'},{uLastDoseKnown:'unknown'},
    {uRenalKnown:'unknown'},{uRenalUnstable:'yes'},{uRenalUnstable:'unknown'}])
    assert.equal(p({...changes,uLevelStatus:'known',uLevel:0}).status,'review');
});

test('Catalog identity cannot be fabricated or weaken special-procedure controls',()=>{
  const special=procedures.find(p=>p.neuraxial||p.specialProtocol);
  assert.ok(special);
  assert.equal(p({procedureId:special.id,procedure:{id:special.id,neuraxial:false,specialProtocol:''}}).status,'review');
  for(const input of [{procedureId:'invented'},{procedure:{id:'invented'}},{procedure:{name:'Simple'}},
    {procedureId:special.id,procedure:{id:'other'}},{procedureId:123}]) assert.ok(valid(input).length);
  const accessor={};Object.defineProperty(accessor,'id',{get(){throw Error('must not execute');}});
  assert.equal(p({procedure:accessor}).status,'review');
  assert.equal(p({procedure:Object.create({id:special.id})}).status,'review');
});

test('AVK threshold is strictly below 1.5; current INR is mandatory',()=>{
  for(const drug of ['warfarina','acenocumarol']) {
    assert.equal(p({drug,uInr:1.49}).pathway,'avk-inr-below');
    for(const uInr of [1.5,2,20]) assert.equal(p({drug,uInr}).pathway,'avk-delay');
    assert.equal(p({drug,uInrKnown:'unknown'}).status,'review');
  }
  const noDelay=avk({uInr:1.49,uCanDelay:'no',uPriority:'emergency'});
  assert.equal(noDelay.pathway,'avk-inr-below');assert.equal(noDelay.waitHours,null);
  assert.match(noDelay.decision.text,/confirmar|Confirmar/);
});

test('AVK reversal separates a repeat INR after 6–8 h from an irreversible time-based pass',()=>{
  const delay=avk({uInr:1.5});assert.equal(delay.pathway,'avk-delay');assert.equal(delay.waitHours,6);
  assert.match(delay.steps.map(s=>s.text).join(' '),/tiempo no autoriza/);
  assert.match(delay.steps.map(s=>s.title).join(' '),/10 mg IV/);
  const now=avk({uCanDelay:'no',uPriority:'emergency'});
  assert.equal(now.pathway,'avk-no-delay');assert.equal(now.waitHours,null);
  assert.match(now.steps.map(s=>s.text).join(' '),/no calcula su dosis/);
});

test('Specific DOAC level must be calibrated and strictly below 30 ng/mL',()=>{
  for(const drug of ['dabigatran','rivaroxaban','apixaban','edoxaban']) {
    for(const uLevel of [0,29.999]) assert.equal(p({drug,uLevelStatus:'known',uLevel}).pathway,'doac-level-below');
    for(const uLevel of [30,30.001,100]) {
      const plan=p({drug,uLevelStatus:'known',uLevel,uLastDoseHours:100,uQualitative:['dabigatran','rivaroxaban'].includes(drug)?'within':'unavailable'});
      assert.equal(plan.pathway,'doac-delay-reassess');assert.equal(plan.waitHours,null);
    }
    assert.equal(p({drug,uLevelStatus:'pending',uLevel:0}).status,'review');
  }
  const beforeAbsorption=p({uLevelStatus:'known',uLevel:0,uLastDoseHours:0});
  assert.equal(beforeAbsorption.status,'review');assert.match(beforeAbsorption.blockers.join(' '),/preceder a la absorción/);
  for(const drug of ['dabigatran','rivaroxaban']) {
    const discordant=p({drug,uLevelStatus:'known',uLevel:0,uQualitative:'above'});
    assert.equal(discordant.status,'review');assert.match(discordant.blockers.join(' '),/discordancia/);
  }
});

test('A measured level requires explicit confirmation that the sample represents current effect',()=>{
  for(const uLevelRepresentative of ['',undefined,null,false,true,0,'false','normal'])
    assert.ok(valid({uLevelStatus:'known',uLevel:0,uLevelRepresentative}).length);
  for(const uLevelRepresentative of ['no','unknown']) {
    for(const uLastDoseHours of [0.01,0.5,20,100]) {
      const plan=p({uLevelStatus:'known',uLevel:0,uLevelRepresentative,uLastDoseHours});
      assert.equal(plan.status,'review');assert.notEqual(plan.pathway,'doac-level-below');
      assert.match(plan.blockers.join(' '),/muestra represente/);
    }
  }
  assert.equal(p({uLevelStatus:'known',uLevel:0,uLevelRepresentative:'yes'}).pathway,'doac-level-below');
  assert.equal(U.fresh().uLevelRepresentative,'');
});

test('Dabigatran qualitative route requires all strict figure-5 thresholds',()=>{
  const d={drug:'dabigatran',uQualitative:'within',uLastDoseHours:24.001,uCrcl:50.001};
  assert.equal(p(d).pathway,'doac-consensus-criteria');
  for(const c of [{uLastDoseHours:24},{uLastDoseHours:23.999},{uCrcl:50},{uCrcl:49.999},{uQualitative:'above'},{uQualitative:'unavailable'}])
    assert.equal(p({...d,...c}).pathway,'doac-delay-reassess');
  assert.match(p(d).steps.map(s=>s.text).join(' '),/no demuestran ausencia/);
});

test('Factor-Xa temporal thresholds are strict; TP is only used for rivaroxaban',()=>{
  for(const drug of ['rivaroxaban','apixaban','edoxaban']) {
    const d={drug,uLastDoseHours:16.001,uCrcl:30.001,uQualitative:drug==='rivaroxaban'?'within':'unavailable'};
    assert.equal(p(d).pathway,'doac-consensus-criteria');
    for(const c of [{uLastDoseHours:16},{uLastDoseHours:15.999},{uCrcl:30},{uCrcl:29.999}])
      assert.equal(p({...d,...c}).pathway,'doac-delay-reassess');
  }
  for(const uQualitative of ['above','unavailable']) assert.equal(p({drug:'rivaroxaban',uQualitative}).pathway,'doac-delay-reassess');
  for(const drug of ['apixaban','edoxaban']) for(const uQualitative of ['within','above','normal','prolonged'])
    assert.ok(valid({drug,uQualitative}).length);
});

test('No-delay DOAC reversal is drug-specific and never automatic andexanet',()=>{
  const b={uCanDelay:'no',uPriority:'emergency',uLastDoseHours:2};
  const d=p({...b,drug:'dabigatran'});assert.equal(d.pathway,'dabigatran-no-delay');
  assert.match(d.steps.map(s=>s.title).join(' '),/5 g IV \(2 × 2,5 g\)/);
  for(const drug of ['rivaroxaban','apixaban','edoxaban']) {
    const plan=p({...b,drug});assert.equal(plan.pathway,'xa-no-delay');
    assert.match(plan.warnings.join(' '),/no está indicado como pretratamiento/);
    assert.match(plan.warnings.join(' '),/no está indicado para edoxabán/);
    assert.equal(plan.waitHours,null);
  }
});

test('Temporal criteria never bypass the non-deferrable branch; a representative specific level is separate',()=>{
  for(const drug of ['dabigatran','rivaroxaban','apixaban','edoxaban']) {
    const data={drug,uPriority:'emergency',uCanDelay:'no',uLastDoseHours:100,uCrcl:100,
      uQualitative:['dabigatran','rivaroxaban'].includes(drug)?'within':'unavailable'};
    const plan=p(data);
    assert.notEqual(plan.pathway,'doac-consensus-criteria');
    assert.equal(plan.pathway,drug==='dabigatran'?'dabigatran-no-delay':'xa-no-delay');
    assert.equal(p({...data,uLevelStatus:'known',uLevel:20,uLevelRepresentative:'yes'}).pathway,'doac-level-below');
    assert.deepEqual(valid({...data,uCanDelay:'yes'}),[]);
    assert.equal(p({...data,uCanDelay:'yes'}).pathway,'doac-consensus-criteria');
    assert.equal(p({...data,uPriority:'deferred',uCanDelay:'yes'}).pathway,'doac-consensus-criteria');
  }
});

test('DOAC delay is any clinically viable reassessment interval, not the AVK six-hour threshold',()=>{
  const plan=p({uPriority:'emergency',uCanDelay:'yes',uLastDoseHours:15});
  assert.equal(plan.pathway,'doac-delay-reassess');assert.equal(plan.waitHours,null);
  assert.doesNotMatch(plan.decision.text+' '+plan.blockers.join(' '),/6 h/);
  assert.equal(p({uPriority:'emergency',uCanDelay:'unknown'}).status,'review');
  assert.match(p({uPriority:'emergency',uCanDelay:'unknown'}).blockers.join(' '),/demora clínicamente viable/);
  assert.ok(valid({drug:'warfarina',uPriority:'emergency',uCanDelay:'yes'}).length);
});

test('All routes keep elective timing, restart and bridge disabled',()=>{
  const changes=[{}, {uConfirmed:false},{uBleeding:'yes'}, {drug:'warfarina',uInr:1.4},
    {drug:'warfarina',uInr:2},{drug:'warfarina',uInr:2,uCanDelay:'no'},
    {uLevelStatus:'known',uLevel:29},{uLevelStatus:'known',uLevel:30},
    {uLevelStatus:'pending'}, {drug:'dabigatran',uCanDelay:'no'}, {uCanDelay:'no',uLastDoseHours:0}];
  for(const input of changes) {
    const plan=p({...input,procedureDate:'2030-01-01',interruption:'no',lastDoseDay:-1});
    assert.notEqual(plan.status,'ready');assert.equal(plan.lastDoseDay,null);assert.equal(plan.stopDays,null);
    assert.equal(plan.restart.hours,null);assert.equal(plan.bridge.indicated,false);
    assert.equal(plan.validatedForCurrentPractice,false);assert.equal(plan.source.year,2025);
  }
});

test('Module is pure and never changes the legacy clinical engine',()=>{
  const input=Object.freeze({...base});assert.deepEqual(U.makePlan(input),U.makePlan(input));
  assert.deepEqual(input,base);
  assert.equal(C.makePlan({urgency:'urgent',urgent:true,drug:'apixaban'}).status,'review');
});
