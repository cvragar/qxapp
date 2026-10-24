/*
 * Selección de procedimientos del consenso de Vivas et al. (2025).
 * DOI: 10.1016/j.recesp.2025.07.008
 * Tabla 1 del material adicional, páginas PDF 1-20, revisada visualmente.
 * La nota a identifica riesgo mínimo dentro de la columna «Bajo».
 * Las categorías restantes conservan las columnas bajo/moderado/alto.
 * No se extrapola riesgo mínimo a toda la categoría de riesgo bajo.
 * continuationEligible se conserva por compatibilidad: true sólo para mínimo;
 * la conducta real se calcula en clinical.js según fármaco y contexto clínico.
 */
(function (root, factory) {
  const procedures = factory();
  if (typeof module === 'object' && module.exports) module.exports = procedures;
  if (root) root.QXProcedures = procedures;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sourceUrl = 'https://static.elsevier.es/multimedia/03008932/0000007900000001/v1_202512290506/S0300893225014101/v1_202512290506/es/main.assets/mmc1.pdf';
  const minimal = 'Riesgo mínimo identificado con la nota a del suplemento de 2025. La conducta depende del anticoagulante y de los factores clínicos.';
  const dental = 'La extensión, el contexto sistémico y los medios de la consulta condicionan el sangrado. Aplicar medidas hemostáticas locales (nota f).';
  const intermediateAsHigh = 'La nota b considera el riesgo intermedio, pero permite manejarlo como alto por la gravedad potencial de la hemorragia. Se aplica la categoría alta de la tabla.';
  const rows = [
    // id, especialidad, procedimiento, riesgo, página PDF, nota, neuroaxial
    ['anes-local','Anestesiología','Infiltración anestésica local','minimal',1,minimal],
    ['anes-ocular','Anestesiología','Anestesia ocular tópica o peribulbar','minimal',2,minimal],
    ['anes-infiltration','Anestesiología','Infiltraciones articulares, musculoesqueléticas, sacroiliacas o en punto gatillo','low',2,'No corresponde a infiltración epidural ni a bloqueo con catéter.'],
    ['anes-superficial','Anestesiología','Bloqueo superficial o fascial sin catéter, en territorio compresible','low',1,'Incluye antebrazo, digital, tobillo, safeno, poplíteo, femoral, axilar, ilioinguinal, iliohipogástrico, transverso abdominal y fascia lata. Con catéter pasa a alto riesgo (nota c).'],
    ['anes-deep','Anestesiología','Bloqueo profundo de plexos o perivascular no compresible, sin catéter','moderate',1,'Incluye plexo celíaco, ganglio estrellado, ciático proximal, obturador, infraclavicular, supraclavicular, intercostal e interescalénico. Con catéter pasa a alto riesgo (nota c).'],
    ['anes-catheter','Anestesiología','Bloqueo superficial o profundo con catéter','high',20,'Todo bloqueo superficial o profundo con catéter se considera de alto riesgo (nota c). Requiere protocolo anestésico específico.'],
    ['anes-neuraxial','Anestesiología','Anestesia neuroaxial: espinal, epidural o catéter epidural','high',1,'Aplicar protocolo específico de anestesia neuroaxial, incluida la retirada de catéteres.',true],
    ['anes-retrobulbar','Anestesiología','Anestesia ocular retrobulbar','high',1,'No confundir con la anestesia tópica o peribulbar.'],

    ['vascular-phlebectomy','Angiología y cirugía vascular','Safenectomía, microflebectomías, termoablación safena o fístula arteriovenosa no terciaria','low',2,'La fístula compleja o terciaria se clasifica como moderada.'],
    ['vascular-infrainguinal-small','Angiología y cirugía vascular','Cirugía endovascular infrainguinal con introductor de hasta 6 F','low',2,'La categoría cambia con el tamaño del introductor y el sector tratado.'],
    ['vascular-endovascular','Angiología y cirugía vascular','Reparación endovascular de aneurisma aórtico o bypass extraanatómico','moderate',2,'No incluye cirugía abierta de aneurisma aórtico.'],
    ['vascular-open','Angiología y cirugía vascular','Cirugía vascular abierta aórtica, aortoiliaca o toracoabdominal','high',2,''],

    ['cardio-coronary-diagnostic','Cardiología intervencionista','Coronariografía diagnóstica radial o femoral','minimal',3,minimal],
    ['cardio-pci-radial','Cardiología intervencionista','Intervención coronaria percutánea transradial','minimal',3,minimal],
    ['cardio-pci-femoral','Cardiología intervencionista','Intervención coronaria percutánea transfemoral','low',3,'Clasificación de 2025: bajo riesgo, sin nota a de riesgo mínimo.'],
    ['cardio-device','Cardiología intervencionista','Implante transvenoso de marcapasos, DAI o resincronizador; recambio de generador','minimal',4,minimal + ' No incluye extracción compleja de electrodos ni marcapasos sin cables.'],
    ['cardio-holter','Cardiología intervencionista','Implante de Holter subcutáneo','minimal',4,minimal],
    ['cardio-ep-study','Cardiología intervencionista','Estudio electrofisiológico diagnóstico o ablación de taquicardia supraventricular','minimal',4,minimal],
    ['cardio-af-ablation','Cardiología intervencionista','Ablación de fibrilación auricular con aislamiento de venas pulmonares','minimal',4,minimal + ' Coordinar la pauta periprocedimiento con electrofisiología.'],
    ['cardio-mitral','Cardiología intervencionista','Valvuloplastia mitral, reparación mitral borde a borde o cierre de orejuela','high',3,intermediateAsHigh],
    ['cardio-tavi','Cardiología intervencionista','Implante de válvula aórtica transcatéter (TAVI)','high',3,'La nota d permite individualizar según la experiencia y resultados locales; esta herramienta conserva la categoría alta de la tabla.'],
    ['cardio-aortic-valvuloplasty','Cardiología intervencionista','Valvuloplastia aórtica','high',3,intermediateAsHigh],
    ['cardio-lead-extraction','Cardiología intervencionista','Extracción compleja de electrodos o implante de marcapasos sin cables','high',4,'La extracción simple figura por separado en cirugía cardiovascular.'],

    ['cv-window','Cirugía cardiovascular','Ventana pericárdica subxifoidea o por toracotomía','moderate',5,''],
    ['cv-elective','Cirugía cardiovascular','Revascularización coronaria o cirugía valvular aislada mitral/aórtica/tricuspídea','moderate',4,'La cirugía combinada, multivalvular, emergente o en reintervención se clasifica como alta.'],
    ['cv-redo','Cirugía cardiovascular','Reintervención cardiaca mayor o pericardiectomía','high',5,''],

    ['general-skin','Cirugía general y del aparato digestivo','Cirugía menor de piel y tejido subcutáneo con anestesia local','low',5,'La fila de cirugía general se clasifica como baja; no lleva la nota a de riesgo mínimo. La biopsia escisional de cirugía plástica tiene una entrada propia.'],
    ['general-abscess','Cirugía general y del aparato digestivo','Drenaje de absceso superficial','low',5,'No incluye drenaje de absceso intraabdominal o pélvico.'],
    ['general-hernia','Cirugía general y del aparato digestivo','Cirugía de hernia inguinal, umbilical o epigástrica','moderate',5,''],
    ['general-proctology','Cirugía general y del aparato digestivo','Cirugía proctológica: hemorroides, fístula o fisura anal','moderate',5,''],
    ['general-elective','Cirugía general y del aparato digestivo','Colecistectomía laparoscópica','moderate',5,'La tabla de 2025 no incluye una categoría específica de apendicectomía.'],
    ['general-colorectal','Cirugía general y del aparato digestivo','Cirugía mayor de cáncer colorrectal','high',5,'La cirugía mayor abdominal oncológica se clasifica como alta en 2025.'],
    ['general-hepatopancreatic','Cirugía general y del aparato digestivo','Hepatectomía o pancreatectomía oncológica','high',5,''],
    ['general-anastomosis','Cirugía general y del aparato digestivo','Resección intestinal o cirugía gastrointestinal con anastomosis','high',5,'Incluye cirugía bariátrica con anastomosis.'],

    ['plastic-biopsy','Cirugía plástica y reconstructiva','Biopsia escisional cutánea','minimal',6,minimal],
    ['plastic-graft','Cirugía plástica y reconstructiva','Tumor cutáneo menor con injerto o colgajo local','low',6,''],
    ['plastic-breast','Cirugía plástica y reconstructiva','Cirugía estética de mama o del contorno corporal','high',6,''],
    ['plastic-major','Cirugía plástica y reconstructiva','Linfadenectomía cervical, axilar o inguinal; reimplante de extremidad','high',6,''],

    ['thoracic-sympathectomy','Cirugía torácica','Simpatectomía por hiperhidrosis','low',7,''],
    ['thoracic-lung','Cirugía torácica','Lobectomía, neumonectomía o decorticación pulmonar','high',7,''],

    ['endo-diagnostic','Endoscopia digestiva','Gastroscopia, colonoscopia o sigmoidoscopia diagnóstica sin biopsia','minimal',5,'El artículo principal (página 5) identifica la endoscopia sin biopsia como riesgo mínimo. No incluye toma de biopsias, polipectomía ni resección mucosa.'],
    ['endo-diagnostic-biopsy','Endoscopia digestiva','Gastroscopia, colonoscopia o sigmoidoscopia con biopsia mucosa','low',5,'El artículo principal (página 5) sitúa la endoscopia con biopsia en bajo/moderado, mientras el suplemento la incluye con nota a. Se adopta riesgo bajo según el texto principal, sin aplicar automáticamente la pauta mínima; confirmar la técnica con endoscopia.'],
    ['endo-ercp-stent','Endoscopia digestiva','CPRE con stent o dilatación papilar con balón, sin esfinterotomía','low',7,'Con esfinterotomía la categoría es alta.'],
    ['endo-ultrasound','Endoscopia digestiva','Ecoendoscopia sin PAAF','low',8,'La PAAF, biopsia o intervención guiada por ecoendoscopia es de alto riesgo.'],
    ['endo-small-polyp','Endoscopia digestiva','Polipectomía de pólipo menor de 1 cm','low',8,'La tabla separa pólipos <1 cm y >1 cm; el tamaño exactamente 1 cm requiere valoración específica.'],
    ['endo-polypectomy','Endoscopia digestiva','Polipectomía de pólipo mayor de 1 cm, resección mucosa o disección submucosa','high',7,'Para pólipos menores de 1 cm existe una entrada de riesgo bajo. El tamaño exactamente 1 cm requiere valoración específica.'],
    ['endo-one-cm-polyp','Endoscopia digestiva','Polipectomía de pólipo de exactamente 1 cm o tamaño no precisado','high',7,'La tabla no resuelve el umbral exacto de 1 cm. No generar un calendario hasta que endoscopia concrete el riesgo.'],
    ['endo-sphincterotomy','Endoscopia digestiva','CPRE con esfinterotomía biliar o pancreática','high',7,''],
    ['endo-gastrostomy','Endoscopia digestiva','Gastrostomía, yeyunostomía o colostomía endoscópica percutánea','high',7,''],
    ['endo-puncture','Endoscopia digestiva','Ecoendoscopia con PAAF o biopsia','high',8,''],

    ['gyn-hysteroscopy','Ginecología y obstetricia','Histeroscopia, conización o biopsia cervical','low',8,''],
    ['gyn-hysterectomy','Ginecología y obstetricia','Histerectomía simple o quistectomía ovárica','moderate',8,'La histerectomía radical tiene categoría alta.'],
    ['gyn-caesarean','Ginecología y obstetricia','Cesárea programada sin factores de riesgo de hemorragia puerperal','moderate',9,'La cesárea urgente o con factores de riesgo hemorrágico figura como alta. El embarazo exige valoración obstétrica específica.'],
    ['gyn-radical','Ginecología y obstetricia','Histerectomía radical, miomectomía o linfadenectomía pélvica/paraórtica','high',8,''],

    ['intensive-picc','Medicina intensiva','Catéter central de inserción periférica (PICC)','minimal',9,minimal],
    ['intensive-cvc','Medicina intensiva','Colocación o retirada de catéter venoso central','low',9,'Los catéteres venosos de alto flujo figuran como moderados.'],
    ['intensive-highflow','Medicina intensiva','Colocación o retirada de catéter venoso de alto flujo','moderate',9,''],

    ['pulm-bronchoscopy','Neumología','Broncoscopia diagnóstica, lavado broncoalveolar o cepillado bronquial','low',10,'No incluye biopsia bronquial o transbronquial.'],
    ['pulm-thoracentesis-us','Neumología','Toracocentesis con control ecográfico','low',10,''],
    ['pulm-thoracentesis','Neumología','Toracocentesis sin control ecográfico','moderate',10,''],
    ['pulm-ebus','Neumología','Ecobroncoscopia con punción transbronquial (EBUS-PAAF)','moderate',10,'No confundir con biopsia endobronquial, transbronquial o criobiopsia.'],
    ['pulm-biopsy','Neumología','Biopsia endobronquial, transbronquial o criobiopsia','high',10,''],

    ['neuro-peripheral','Neurocirugía','Biopsia muscular o de nervio periférico bajo anestesia local','low',11,''],
    ['neuro-lumbar','Neurocirugía','Punción lumbar','moderate',11,'Neurocirugía la clasifica como moderada; radiología, medicina intensiva y urgencias la clasifican como alta. Requiere protocolo específico.',true],
    ['neuro-intracranial','Neurocirugía','Craneotomía, craniectomía o biopsia cerebral/medular','high',11,''],

    ['dental-examination','Odontología y cirugía maxilofacial','Exploración dental o radiografía dental convencional','minimal',11,minimal + ' No incluye sondaje periodontal.'],
    ['dental-restorative','Odontología y cirugía maxilofacial','Empaste, reconstrucción, prótesis dental u ortodoncia','minimal',12,minimal],
    ['dental-root-canal','Odontología y cirugía maxilofacial','Endodoncia: tratamiento de conductos','minimal',12,minimal + ' No incluye apicectomía ni resección radicular quirúrgica.'],
    ['dental-extraction','Odontología y cirugía maxilofacial','Extracción dentaria convencional','low',12,'La extracción quirúrgica extensa o complicada tiene categoría moderada.'],
    ['dental-complex-extraction','Odontología y cirugía maxilofacial','Extracción dental quirúrgica extensa o complicada','moderate',11,'Probable riesgo de sangrado. Aplicar medidas hemostáticas locales.'],
    ['dental-implant','Odontología y cirugía maxilofacial','Implante dental o cirugía periodontal poco extensa y con bajo riesgo de sangrado','low',13,dental],
    ['dental-complex-implant','Odontología y cirugía maxilofacial','Implantes múltiples o cirugía periodontal extensa/complicada','moderate',13,dental],
    ['dental-orthognathic','Odontología y cirugía maxilofacial','Osteoplastia/ostectomía por deformidad ortognática','high',11,''],

    ['ophth-topical','Oftalmología','Procedimiento oftalmológico con anestesia tópica','minimal',14,minimal + ' Verificar la técnica y el procedimiento concretos.'],
    ['ophth-cataract','Oftalmología','Cirugía de catarata mediante facoemulsificación','minimal',5,'El artículo principal (página 5, estratificación hemorrágica) identifica expresamente la facoemulsificación como riesgo mínimo.'],
    ['ophth-extracapsular','Oftalmología','Cirugía extracapsular de catarata','moderate',14,'No confundir con facoemulsificación.'],
    ['ophth-intravitreal','Oftalmología','Inyección intravítrea o fotocoagulación láser','low',15,''],
    ['ophth-vitrectomy','Oftalmología','Vitrectomía, especialmente en retinopatía diabética proliferativa','high',14,'La tabla sitúa la vitrectomía en alto riesgo y advierte de resangrado en retinopatía diabética proliferativa.'],
    ['ophth-phacovitrectomy','Oftalmología','Facovitrectomía o cirugía de membrana epirretiniana','moderate',15,''],

    ['ent-tubes','Otorrinolaringología y cirugía de cabeza y cuello','Colocación de tubos ventilatorios transtimpánicos','minimal',15,minimal],
    ['ent-laryngeal','Otorrinolaringología y cirugía de cabeza y cuello','Microcirugía endolaríngea de lesiones benignas','minimal',16,minimal],
    ['ent-tonsils','Otorrinolaringología y cirugía de cabeza y cuello','Amigdalectomía, adenoidectomía o faringoplastia','moderate',15,''],
    ['ent-oncology','Otorrinolaringología y cirugía de cabeza y cuello','Cirugía oncológica de cavidad oral, orofaringe, laringe o senos paranasales','high',15,''],

    ['radio-superficial','Radiología vascular e intervencionista','BAG de tiroides, mama, parótida o ganglio superficial','low',16,'La PAAF superficial lleva nota a de riesgo mínimo y tiene una entrada propia.'],
    ['radio-superficial-fna','Radiología vascular e intervencionista','PAAF de tiroides, mama, parótida o ganglio superficial','minimal',16,minimal + ' Excluye órganos profundos.'],
    ['radio-paracentesis','Radiología vascular e intervencionista','Paracentesis guiada por ecografía','low',17,'La paracentesis sin control ecográfico figura como moderada en medicina intensiva y urgencias.'],
    ['radio-paracentesis-no-us','Radiología vascular e intervencionista','Paracentesis sin control ecográfico','moderate',9,'Clasificación de medicina intensiva y urgencias.'],
    ['radio-catheter','Radiología vascular e intervencionista','Catéter venoso central tunelizado o no tunelizado; reservorio subcutáneo','low',17,'No extrapolar a catéter venoso de alto flujo de medicina intensiva, que figura como moderado.'],
    ['radio-drain-exchange','Radiología vascular e intervencionista','Recambio de drenaje biliar, nefrostomía o absceso con tracto maduro','minimal',16,minimal + ' No incluye colocación inicial ni nuevo trayecto.'],
    ['radio-organ-biopsy','Radiología vascular e intervencionista','Biopsia con aguja gruesa hepática o renal','high',16,'La biopsia hepática transyugular figura como moderada en radiología y requiere valoración del contexto hepático.'],
    ['radio-deep-biopsy','Radiología vascular e intervencionista','BAG intraabdominal, retroperitoneal, de pared torácica o pulmonar','high',16,''],

    ['ortho-arthrocentesis','Traumatología y cirugía ortopédica','Punción articular o artrocentesis','minimal',18,minimal],
    ['ortho-arthroscopy','Traumatología y cirugía ortopédica','Artroscopia de rodilla, cadera u hombro','low',18,'Incluye plastia de cruzados, descompresión subacromial y reparación del manguito.'],
    ['ortho-primary','Traumatología y cirugía ortopédica','Artroplastia primaria de cadera o rodilla','moderate',18,'La bilateral y la revisión protésica se clasifican como altas.'],
    ['ortho-hip-fracture','Traumatología y cirugía ortopédica','Cirugía de fractura de cadera','moderate',18,'Nota g: se recomienda intervenir en 24-48 h del ingreso, adaptando bloqueo y anestesia a la hemostasia. Requiere circuito urgente específico.'],
    ['ortho-revision','Traumatología y cirugía ortopédica','Artroplastia bilateral o revisión de prótesis de cadera/rodilla','high',18,''],

    ['uro-cystoscopy','Urología','Cistoscopia o derivación retrógrada','low',19,'No incluye resección endoscópica de vejiga o próstata.'],
    ['uro-prostate-biopsy','Urología','Biopsia de próstata','moderate',19,''],
    ['uro-endoscopic','Urología','Cirugía endoscópica de vejiga/próstata o cirugía percutánea renal','moderate',19,''],
    ['uro-resection','Urología','Cirugía exerética urológica o trasplante renal','high',19,'Incluye resección oncológica y no oncológica.'],

    ['other-aspiration','Otros procedimientos','Aspirado de médula ósea o inyección intramuscular','low',19,'El aspirado no equivale a biopsia de médula ósea.'],
    ['other-marrow-biopsy','Otros procedimientos','Biopsia de médula ósea','moderate',19,'Clasificación de 2025: riesgo moderado.']
  ];
  const specialProtocols = {
    'anes-deep': 'Bloqueo profundo o no compresible: aplicar el protocolo anestésico específico antes de establecer la pauta.',
    'anes-catheter': 'Un bloqueo con catéter requiere protocolo anestésico específico para su colocación y retirada.',
    'neuro-lumbar': 'Punción espinal con categorías distintas según especialidad. Acordar el riesgo y aplicar el protocolo específico antes de establecer la retirada.',
    'endo-one-cm-polyp': 'Tamaño de pólipo en el umbral de 1 cm o desconocido: endoscopia debe precisar la categoría antes de calcular la retirada.',
    'ortho-hip-fracture': 'Fractura de cadera: seguir el circuito de cirugía en 24-48 h del ingreso; no aplicar una demora electiva automática.'
  };
  const mainArticleIds = new Set(['ophth-cataract','endo-diagnostic','endo-diagnostic-biopsy']);
  return Object.freeze(rows.map(([id,specialty,name,risk,sourcePage,note,neuraxial]) => Object.freeze({
    id,specialty,name,risk,note,sourcePage,sourceYear:2025,
    sourceUrl:mainArticleIds.has(id) ? 'https://www.aeu.es/wp-content/uploads/libros/DocumentoConsensoAntitrombotico2025.pdf' : sourceUrl,
    sourceType:mainArticleIds.has(id) ? 'article' : 'supplement',
    sourceDetail:mainArticleIds.has(id) ? 'Artículo principal, página 5, estratificación del riesgo hemorrágico' : 'Tabla 1 del material adicional, página ' + sourcePage,
    continuationEligible:risk === 'minimal' ? true : null,
    ...(id === 'gyn-caesarean' ? {pregnancy:true} : {}),
    ...(neuraxial ? {neuraxial:true} : {}),
    ...(specialProtocols[id] ? {specialProtocol:specialProtocols[id]} : {})
  })));
});
