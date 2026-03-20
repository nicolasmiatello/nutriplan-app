import React, { useState, useReducer, useEffect, useMemo } from "react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ALERGIAS_OPTS = ["Gluten","Lactosa","Harina integral","Huevo","Mariscos","Frutos secos","Soja","Ninguna"];
const PATOLOGIAS_OPTS = ["Diabetes tipo 2","Diabetes gestacional","Celiaquía","Hipotiroidismo","Hipertensión","SOP","Colesterol alto","Inflamación","Trombofilia","Resistencia a la insulina","Ninguna"];
const OBJETIVOS_OPTS = ["Bajar de peso","Subir masa muscular","Mantenimiento","Mejorar energía","Control glucémico","Fertilidad","Alimentación saludable general"];
const ACTIVIDAD_OPTS = ["Sedentario","Leve (1-2 días/semana)","Moderado (3-4 días/semana)","Activo (5+ días/semana)","Muy activo / deportista"];
const TIPO_PLAN_OPTS = ["Estándar","Antiinflamatorio","Sin TACC","Sin TACC (Celiaquía)","Proteico","Hipocalórico proteico","Fertilidad","Bajo en carbohidratos","FODMAPs","Vegetariano","Vegetariano + FODMAPs","Antiinflamatorio + Sin TACC","Resistencia a la insulina","Diabetes gestacional"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const initialPlanForm = { nombre:"",edad:"",peso:"",altura:"",sexo:"",objetivo:"",nivelActividad:"",alergias:[],patologias:[],preferencias:"",aversiones:"",cantidadComidas:"4",tipoPlan:"Estándar" };
const initialClinica = { motivo:"",diagnostico:"",antecedentes:"",medicacion:"",patologias:"",alergias:"",digestivo:"",sueno:"",estres:"",actividad:"" };

function uid() { return Math.random().toString(36).slice(2,9); }
function today() { return new Date().toLocaleDateString("es-AR"); }
function todayISO() { return new Date().toISOString().split("T")[0]; }
function calcIMC(peso,altura) { if(!peso||!altura) return "—"; return (parseFloat(peso)/Math.pow(parseFloat(altura)/100,2)).toFixed(1); }
function toggle(arr,val) { return arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]; }
function fmtMoney(n) { return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",minimumFractionDigits:0}).format(n||0); }

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function reducer(state,action) {
  switch(action.type) {
    case "ADD_PATIENT": return {...state,patients:[action.p,...state.patients]};
    case "DELETE_PATIENT": return {...state,patients:state.patients.filter(p=>p.id!==action.id)};
    case "ADD_MEDICION": return {...state,patients:state.patients.map(p=>p.id===action.pid?{...p,mediciones:[action.m,...p.mediciones]}:p)};
    case "ADD_NOTA": return {...state,patients:state.patients.map(p=>p.id===action.pid?{...p,notas:[action.n,...p.notas]}:p)};
    case "ADD_PLAN": return {...state,patients:state.patients.map(p=>p.id===action.pid?{...p,planes:[action.plan,...p.planes]}:p)};
    case "UPDATE_PLAN": return {...state,patients:state.patients.map(p=>p.id===action.pid?{...p,planes:p.planes.map(pl=>pl.id===action.plan.id?action.plan:pl)}:p)};
    case "UPDATE_CLINICA": return {...state,patients:state.patients.map(p=>p.id===action.pid?{...p,clinica:action.clinica}:p)};
    case "ADD_CONSULTA": return {...state,consultas:[action.c,...(state.consultas||[])]};
    case "LOAD": return {...state,patients:action.patients,consultas:action.consultas||[]};
    default: return state;
  }
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ttgnqkmhevegcldvrthw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Z25xa21oZXZlZ2NsZHZydGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDUwMjEsImV4cCI6MjA4ODM4MTAyMX0.AlbfPSk8C-IDvf_AcnFwaAkv4iLKz3Gj5w3QDw9EDSM";
const sbHeaders = { "apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates" };

async function sbLoadAll() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*&order=created_at.desc`,{headers:sbHeaders});
  if(!r.ok) return [];
  const rows = await r.json();
  return rows.map(row=>({
    id:row.id,nombre:row.nombre,edad:row.edad,sexo:row.sexo,altura:row.altura,peso:row.peso,
    telefono:row.telefono,email:row.email,fechaCreacion:row.fecha_creacion,objetivo:row.objetivo,
    clinica:row.clinica||{},mediciones:row.mediciones||[],notas:row.notas||[],planes:row.planes||[]
  }));
}

async function sbUpsert(patient) {
  const body = JSON.stringify({
    id:patient.id,nombre:patient.nombre,edad:patient.edad,sexo:patient.sexo,
    altura:patient.altura,peso:patient.peso,telefono:patient.telefono||"",email:patient.email||"",
    fecha_creacion:patient.fechaCreacion||"",objetivo:patient.objetivo||"",
    clinica:patient.clinica||{},mediciones:patient.mediciones||[],notas:patient.notas||[],planes:patient.planes||[]
  });
  await fetch(`${SUPABASE_URL}/rest/v1/patients`,{method:"POST",headers:sbHeaders,body});
}

async function sbDelete(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.${id}`,{method:"DELETE",headers:sbHeaders});
}

async function sbLoadConsultas() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/consultas?select=*&order=created_at.desc`,{headers:sbHeaders});
  if(!r.ok) return [];
  const rows = await r.json();
  return rows.map(row=>({
    id:row.id,pacienteId:row.paciente_id,pacienteNombre:row.paciente_nombre,
    fecha:row.fecha,monto:parseFloat(row.monto)||0,tipo:row.tipo,obs:row.obs||""
  }));
}

async function sbInsertConsulta(c) {
  const body = JSON.stringify({
    id:c.id,paciente_id:c.pacienteId,paciente_nombre:c.pacienteNombre,
    fecha:c.fecha,monto:c.monto||0,tipo:c.tipo||"",obs:c.obs||""
  });
  await fetch(`${SUPABASE_URL}/rest/v1/consultas`,{method:"POST",headers:sbHeaders,body});
}

// ─── GENERADOR DE PROMPT ──────────────────────────────────────────────────────
function buildPrompt(form) {
  const tp = form.tipoPlan;
  const esFertilidad = form.objetivo==="Fertilidad"||tp==="Fertilidad";
  const esAntiinflamatorio = tp==="Antiinflamatorio"||tp==="Antiinflamatorio + Sin TACC"||esFertilidad;
  const esSinTACC = tp==="Sin TACC"||tp==="Sin TACC (Celiaquía)"||tp==="Antiinflamatorio + Sin TACC";
  const esCeliaquia = tp==="Sin TACC (Celiaquía)"||form.patologias.includes("Celiaquía");
  const esProteico = tp==="Proteico"||tp==="Hipocalórico proteico";
  const esHipocalorico = tp==="Hipocalórico proteico";
  const esFODMAPs = tp==="FODMAPs"||tp==="Vegetariano + FODMAPs";
  const esVegetariano = tp==="Vegetariano"||tp==="Vegetariano + FODMAPs";
  const esResistenciaInsulina = tp==="Resistencia a la insulina"||form.patologias.includes("Resistencia a la insulina");
  const esDBTGestacional = tp==="Diabetes gestacional"||form.patologias.includes("Diabetes gestacional");
  const sinHarinaIntegral = form.alergias.includes("Harina integral");
  const sinLactosa = form.alergias.includes("Lactosa");
  const sinGluten = form.alergias.includes("Gluten")||esSinTACC||esCeliaquia;
  const tieneDiabetes = form.patologias.includes("Diabetes tipo 2");
  const tieneSOP = form.patologias.includes("SOP");
  const tieneColesterol = form.patologias.includes("Colesterol alto");
  const tieneInflamacion = form.patologias.includes("Inflamación");
  const tieneTrombofilia = form.patologias.includes("Trombofilia");

  let tituloPlan = "PLAN DE ALIMENTACIÓN";
  if(esSinTACC||esCeliaquia) tituloPlan += " SIN TACC";
  if(esFODMAPs) tituloPlan += " BAJO EN FODMAPS";
  if(esAntiinflamatorio && !esFODMAPs && !esSinTACC) tituloPlan += " ANTIINFLAMATORIO";
  if(esFertilidad) tituloPlan += " – FERTILIDAD";
  if(esVegetariano) tituloPlan += " – VEGETARIANO";
  if(esDBTGestacional) tituloPlan += " – DIABETES GESTACIONAL";
  if(esResistenciaInsulina && !esDBTGestacional) tituloPlan += " – RESISTENCIA A LA INSULINA";

  let modeloReferencia = "";

  if(esDBTGestacional) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN PARA DIABETES GESTACIONAL DE JULIETA LUPARDO

RECOMENDACIONES ESPECÍFICAS DBT GESTACIONAL:
- No pasar más de 3 horas sin comer durante el día.
- El ayuno nocturno debe ser de 8 a 10 horas como máximo (si es necesario agregar una colación nocturna).
- El grupo de hidratos de carbono debe ser preferiblemente integral y debe acompañarse con verduras, algún tipo de carne o huevo y un alimento graso.
- Pueden consumirse opciones dulces pero deben ser SIN AZÚCAR y hechas con parte de harina integral/de avena y parte con harina de coco o almendras.
- Desinfectar las verduras de hoja que se comerán crudas: lavarlas, colocarlas en un bowl con vinagre o lavandina (4 gotas por litro), dejar 15-20 min, escurrir y guardar en tupper con papel de cocina.
- Es conveniente caminar 20 minutos por día.

CEREALES Y LEGUMBRES: CONSUMIR 2 VECES POR DÍA (Almuerzo y Cena).
Opciones: ½ Plato de arroz integral/yamaní/parboil/largo fino frío o recalentado, 2 Porciones de tarta casera con 1 sola tapa, 2 Fajitas integrales (Rapiditas), 1 Papa mediana fría o recalentada (150g), 1 Batata mediana fría o recalentada (150g), ½ Plato de quínoa o 1 Hamburguesa de quínoa, 1 Choclo, 1 Milanesa, ½ Plato de lentejas/arvejas/garbanzos/porotos o 2 Hamburguesas de legumbres, ½ Plato de fideos integrales o fideos secos fríos o recalentados, 2 Empanadas (una debe ser de verdura).
Máximo 2 veces por semana: ½ Plancha de ravioles, 2 Canelones de verdura, 2 Porciones de pizza integral, ½ Plato de ñoquis. DEBEN LLEVAR VERDURA VERDE Y PROTEÍNA.
PREFERIR VERSIÓN INTEGRAL. Si es versión blanca: acompañar con carne/huevo + verduras verdes + alimento graso (crema, manteca, mayonesa, palta, frutos secos).
Si papa/batata/arroz/fideos blancos se cocinan y dejan 12hs en heladera se retarda la digestión.

LÁCTEOS: HASTA 3 PORCIONES POR DÍA. 1 Porción = 1 Vaso de leche, 2 Cdas de leche en polvo, 6 Cdas de queso untable (no diario), 2 Cdas de ricota magra, 1 Rodaja de queso fresco de un dedo de grosor, 2 Fetas de queso de máquina, 2 Cdas de queso rallado al ras, 1 Pote de yogur natural sin azúcar, 1 Yogur Ser.

CARNES: SE DEBE REPETIR CUALQUIER TIPO DE CARNE EN ALMUERZO Y CENA. Huevos: Hasta 3 unidades por día.

VERDURAS LIBRES (MÍNIMO ½ PLATO). VERDURAS CONTROLADAS (Hasta ½ Plato/día): CALABAZA, REMOLACHA, ZAPALLO Y ZANAHORIA.

FRUTAS: 2 unidades por día. Preferir en trozos. Evitar jugos. ½ palta.

DULCES: Solo sin azúcar. Mermelada light/sin azúcar 4 cditas/día. Mantequilla de maní sin azúcar 2 cditas/día. Opciones: 15-20g chocolate sin azúcar (Colonial, Torroncino, Felfort Diab, Georgalos), 1 Bocadito ÍNTEGRA, 1 Barra WIK.

ACEITES: 2 a 3 cucharadas soperas por día. 1 Cda aceite = 2 Cdas mayonesa light.

RECETAS: Pancake con 1 cda harina integral/avena + 1 cda harina coco/almendras + 1 Huevo + polvo hornear + vainilla + Stevia + 2 Cdas leche. Mugcake con harinas mixtas. Budín con ½ harina integral/avena y ½ harina coco/almendras. Galletitas 25-30 unidades.
`;
  } else if(esResistenciaInsulina) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN PARA RESISTENCIA A LA INSULINA DE JULIETA LUPARDO

RECOMENDACIONES ESPECÍFICAS:
- No pasar más de 3 o 4 horas sin comer durante el día.
- A las 2 horas de comer debe sentirse liviana y sin sueño. Si no, achicar porción.
- El grupo de hidratos de carbono debe consumirse de manera DIARIA acompañado de verduras y carne o huevo.
- Si versión blanca, debe predominar verdura verde + proteína.
- Papa, batata, arroz blanco y fideos blancos cocidos y 24hs en heladera retardan la digestión.

CEREALES Y LEGUMBRES: CONSUMIR EN EL ALMUERZO. ½ Plato de arroz integral/yamaní/parboil/largo fino, 2 Porciones de tarta con 1 sola tapa, 2-3 Fajitas integrales, 1 Papa mediana (200g), 1 Batata mediana (200g), ½ Plato de quínoa, 1 Choclo, 1 Milanesa, ½ Plato de legumbres, ½ Plato de fideos integrales, 2 Empanadas (una con verdura). Máximo 2 veces/semana: ravioles, canelones, pizza integral.

CARNES: SE PUEDE REPETIR EN ALMUERZO Y CENA. Carne roja hasta 3 veces/semana. Huevos: Hasta 2/día.
LÁCTEOS: 2 a 3 porciones/día. FRUTAS: Hasta 2 unidades. PREFERIR EN TROZOS. EVITAR JUGOS.
VERDURAS LIBRES (MÍNIMO ½ PLATO). DULCES: sin azúcar. ACEITES: 2-3 Cdas/día.

RECETAS: Pancake con 3 Cdas harina avena/integral + 1 Huevo + 4 Cdas agua/leche + vainilla + polvo hornear + edulcorante.
`;
  } else if(esFODMAPs && esVegetariano) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN VEGETARIANO BAJO EN FODMAPS DE JULIETA LUPARDO

NO INCLUIR CARNES DE NINGÚN TIPO.

CEREALES Y LEGUMBRES: CONSUMIR ½ PLATO POR DÍA (almuerzo o cena). Sin gluten la mayor parte del tiempo. Legumbres: preferir en lata bien lavadas. Lentejas turcas sin remojar 10 min.
Harinas sin gluten: trigo sarraceno, sorgo, almendras, coco, legumbres, fécula papa, maicena, arroz, quínoa.

LÁCTEOS: HASTA 3 PORCIONES. Solo reducidos en lactosa o bebida almendras/coco. Yogur reducido en lactosa (Ser 15g proteína, Milkaut 0% Lactosa, Activia zero lactosa, Yogurísimo tapa celeste, Griego La Serenísima).

VERDURAS (MÍNIMO ½ PLATO): Mayor frecuencia: Zanahoria, berenjena, zapallito, albahaca, zucchini, calabaza, apio, tomate, cebolla de verdeo, espinaca, rúcula, champiñones, brócoli. Hasta 3 veces/semana: pepino, espárragos, remolacha, chaucha, alcaucil.

FRUTAS: HASTA 2 POR DÍA. Hasta 3 veces/semana: ciruelas, durazno chico, manzana chica, sandía, pelón, pera. Frutos secos: 1 puñado/día TOSTADOS.

HUEVO: 2 a 3 por día o 1 Rodaja de tofu.
ACEITE: 2-3 CDAS POR DÍA. Semillas: chía 2 cditas/día activadas o tostadas o molidas.

RECOMENDACIONES: Primeras dos semanas sin gluten y avena según tolerancia. Tercera semana agregar pan de masa madre.

RECETAS: Pancake, Mugcake, Budín con harinas sin gluten (avena/coco/almendras/arroz). Galletitas 25-30 unidades.
`;
  } else if(esFODMAPs) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN BAJO EN FODMAPS DE JULIETA LUPARDO

CEREALES Y LEGUMBRES: CONSUMIR EN ALMUERZO Y/O CENA. Sin gluten la mayor parte del tiempo. Legumbres: preferir en lata bien lavadas, remojar 12-24hs las frescas con bicarbonato y laurel. Lentejas turcas sin remojar 10 min.

LÁCTEOS: HASTA 3 PORCIONES. Solo reducidos en lactosa o bebida almendras/coco. No consumir queso untable de manera diaria (preferir Milkaut o Tregar).

VERDURAS (MÍNIMO ½ PLATO): Mayor frecuencia: Zanahoria, zapallito, albahaca, zucchini, calabaza, apio, tomate, cebolla de verdeo, cebolla morada, espinaca, morrón y cebolla blanca en pequeñas cantidades, champiñones, brócoli. Hasta 3 veces/semana: rúcula, brócoli, pepino, espárragos, remolacha, rábano, rabanito, chaucha, alcaucil, ajo.

FRUTAS: HASTA 3 POR DÍA. Hasta 3 veces/semana: cerezas, ciruelas, durazno, manzana, sandía, pelón, pera, pomelo. Frutos secos: TOSTAR en sartén 2 min.

CARNES: SE PUEDE REPETIR EN ALMUERZO Y CENA. Milanesa empanada con avena/polenta/rebozador sin tacc. Huevos: Hasta 2/día.
ACEITE: 3-4 CDAS. Semillas: chía 1 cdita/día. Bebidas: EVITAR CON GAS. Jugo hasta 2 veces/semana.

RECOMENDACIONES: Aloe Vera Natier Máximas defensas 1 cda/día. En evento social 2 cdas antes. NO comprar Sistema Digestivo.

RECETAS: Pancake con 2 Cdas avena instantánea + 1 Cda harina arroz + 1 Huevo + polvo hornear + vainilla + Stevia.
`;
  } else if(esCeliaquia) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN SIN TACC CELIAQUÍA DE JULIETA LUPARDO

TODOS LOS PRODUCTOS DEBEN SER SIN TACC Y TENER EL LOGO OFICIAL.

CEREALES SIN TACC: CONSUMIR 1 VEZ POR DÍA EN ALMUERZO O CENA. ½ Plato arroz, ½ Plato fideos sin tacc (Soyaarroz), 2 Porciones tarta masa sin tacc, ½ Plato polenta sin tacc, 2 Empanadas masa sin tacc, 1 Papa/batata/boniato (150g), ½ Plato quínoa sin tacc, ½ Lata legumbres sin tacc, fideos quínoa/maíz/legumbres/chía sin tacc, mijo, amaranto.

CARNES: LAS CARNES Y HUEVOS NO NECESITAN LOGO. Milanesa rebozada con polenta/rebozador sin tacc/copos papa Puré Chef Maggi sin tacc. Huevos hasta 2/día.

LÁCTEOS: HASTA 3 PORCIONES. Yogur natural o griego, quesos varios, queso untable, queso semiduro.

VERDURAS: MÍNIMO ½ PLATO. Frescas sin problema. Congeladas DEBEN tener logo.
FRUTAS: 1-3/DÍA. Frescas sin problema. Congeladas con logo. Frutos secos SIN TACC.

DULCES: Mermelada sin tacc, dulce de leche sin azúcar sin tacc (Doña Magdalena, Beepure, Las Quinas), mantequilla maní. Opciones: Chocolate Águila, Colonial, Ladubbar, Ki Bar, Crudda.

OTROS: Todos condimentos DEBEN tener logo. Infusiones con logo. Gaseosas sin tacc (Cunnington) o primeras marcas.

RECOMENDACIONES: No comprar a granel. Barrio chino tiene muchos productos sin tacc. Harina algarroba (sabor chocolate), trigo sarraceno, sorgo. Acompañar preparaciones con verduras/frutas/frutos secos por falta de fibra en productos sin TACC.
`;
  } else if(esSinTACC) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN SIN TACC DE JULIETA LUPARDO

TODOS LOS PRODUCTOS DEBEN SER SIN TACC Y TENER EL LOGO.

CEREALES SIN TACC: CONSUMIR 1 VEZ POR DÍA. Arroz, fideos arroz/sin gluten, tarta masa sin tacc (La Salteña naranja), polenta sin tacc, empanadas, papa/batata/boniato, quínoa, legumbres sin tacc, fideos quínoa/maíz/legumbres/chía, mijo, amaranto. Harina trigo sarraceno, sorgo, maicena, fécula papa, harina mandioca.

LÁCTEOS: HASTA 3 PORCIONES. Leche y yogur reducidos en lactosa.
VERDURAS: MÍNIMO ½ PLATO. Todas + palta hasta 1/día.
FRUTAS: HASTA 3/DÍA. Frutos secos SIN TACC: 1 puñado.
CARNES: SE PUEDE REPETIR. LAS CARNES Y HUEVOS NO NECESITAN LOGO. Milanesa con polenta/rebozador sin tacc/copos papa Maggi. Huevos: 1/día.

DULCES: Mermelada, dulce de leche, mantequilla maní, dulce membrillo/batata light. Opciones: Chocolate Águila/Colonial/Cadbury, Flynn Paff, Pico dulce Georgalos, Vauquita, Oblea Gallo, Chocoarroz.

Condimentos con logo. Gelatina sin tacc. Aloe Vera Natier Máximas Defensas 1 cda/día (luego 2 cdas). Barrio chino para productos sin tacc. Harina algarroba (dulces), trigo sarraceno (salados). Premezcla para dulces.
`;
  } else if(esVegetariano) {
    modeloReferencia = `
MODELO DE REFERENCIA: PLAN VEGETARIANO DE JULIETA LUPARDO

NO INCLUIR CARNES DE NINGÚN TIPO.

CEREALES: CONSUMIR 1 VEZ POR DÍA. Hasta 2 veces/semana: ravioles verdura, canelones, ñoquis, lasaña, fideos blancos/integrales, polenta. Resto: arroz integral/yamaní, fideos integrales, tarta 1 tapa, fajitas integrales (Rapiditas), empanadas (una de verdura), pizza, papa chica, batata chica, choclo.
PREFERIR INTEGRAL. Si blanca: acompañar con verdura verde. Puede consumirse frío o recalentado después de 24hs en heladera.

PROTEÍNAS VEGETALES Y HUEVO: CONSUMIR 1 VEZ POR DÍA. 1 Porción = 2 Huevos, 1 Milanesa soja, 2 Salchichas soja, 1 Hamburguesa soja, ½ Plato legumbres, ½ Plato seitán, ½ Plato texturizado soja, ½ Plato quínoa, 2 Rodajas tofu.

VERDURAS LIBRES (MÍNIMO ½ PLATO). VERDURAS CONTROLADAS (HASTA ½ PLATO/DÍA): Calabaza, remolacha, zapallo, zanahoria. PALTA: hasta 2 veces/semana.

FRUTAS: 2-3 unidades. Preferir trozos. EVITAR jugos. Frutas secas: 1 puñado = reemplazo fruta fresca.

LÁCTEOS: 3 porciones/día. PREFERIR ENTEROS (salvo yogur descremado). Yogur Griego, Ser, Yogurísimo Natural, Beaudroit natural.

DULCES: Mermelada sin azúcar 4 cditas o mantequilla maní 2 cditas. 15-20g chocolate sin azúcar. DEJAR AZÚCAR PARA EVENTOS SOCIALES.

ACEITES: 4 Cdas/día. 1 Cda aceite = 2 Cdas mayonesa light.
Semillas: lino, chía, sésamo, amaranto, girasol, calabaza. Hasta 2 Cditas/día.
`;
  }

  return `Actuá como una nutricionista clínica profesional argentina llamada Julieta Lupardo (MN: 6858, MP: 3265), especializada en fertilidad, metabolismo, salud hormonal y descenso de peso.
Generá un plan de alimentación completo para tu paciente. El plan debe estar completamente adaptado a las variables seleccionadas y debe seguir tu estilo real de trabajo.

DATOS DE LA PACIENTE:
- Nombre: ${form.nombre}
- Edad: ${form.edad} años | Peso: ${form.peso} kg | Altura: ${form.altura} cm | Sexo: ${form.sexo}
- Nivel de actividad: ${form.nivelActividad}
- Objetivo principal: ${form.objetivo} (PRIORIDAD MÁXIMA)
- Tipo de plan: ${form.tipoPlan}
- Alergias/intolerancias: ${form.alergias.length?form.alergias.join(", "):"Ninguna"} → NO deben aparecer NUNCA
- Patologías: ${form.patologias.length?form.patologias.join(", "):"Ninguna"}
- Preferencias: ${form.preferencias||"No especificadas"}
- Aversiones: ${form.aversiones||"No especificadas"}
- Comidas por día: ${form.cantidadComidas}
${modeloReferencia}
${esFertilidad?`
INSTRUCCIONES ESPECIALES - FERTILIDAD:
- Enfoque antiinflamatorio: reducir inflamación sistémica
- Salud hormonal: regular estrógenos, progesterona y cortisol
- Sensibilidad a la insulina: evitar picos glucémicos
- Micronutrientes clave: folato, hierro, zinc, omega-3, vitamina D, coenzima Q10, inositol
- Alimentos beneficiosos: verduras de hoja verde, semillas de lino/chía/calabaza, palta, frutos rojos, nueces, pescado azul, legumbres, huevos, cúrcuma, jengibre
- Evitar: azúcar refinada, ultraprocesados, alcohol, exceso de cafeína, lácteos en exceso
`:""}

ESTRUCTURA DEL PLAN (seguí este orden exacto):

${tituloPlan}
FECHA: ${today()}
NOMBRE: ${form.nombre.toUpperCase()}

${esCeliaquia||esSinTACC?"TODOS LOS PRODUCTOS QUE COMPRES DEBEN SER SIN TACC Y TENER EL LOGO OFICIAL.\n":""}SELECCIÓN DE ALIMENTOS

[Usá las porciones, equivalencias, marcas y alimentos EXACTOS del modelo de referencia. Adaptá según alergias e intolerancias.]

DISTRIBUCIÓN DIARIA DE ALIMENTOS

OPCIONES DE DESAYUNO/MERIENDA
[6-8 opciones con "Infusión +" o "Yogur +". Incluir aclaración sobre untados.]

COLACIONES (en caso de ser necesarias): [5-6 opciones simples]

ALMUERZO
${esVegetariano?"Cereales o Legumbres +\nVerduras crudas y/o cocidas +\nProteína vegetal (huevo, legumbres, tofu, soja)":"Cereales o Legumbres +\nVerduras crudas y/o cocidas +\nCarnes y/o Huevo"}

CENA
${esVegetariano?"Verduras crudas y/o cocidas +\nProteína vegetal (huevo, legumbres, tofu, soja)":"Verduras crudas y/o cocidas +\nCarnes y/o Huevo"}

IDEAS DE MENÚ PARA UNA SEMANA

DÍA | ALMUERZO | CENA
LUNES | [almuerzo] | [cena]
MARTES | [almuerzo] | [cena]
MIERCOLES | [almuerzo] | [cena]
JUEVES | [almuerzo] | [cena]
VIERNES | [almuerzo] | [cena]
SÁBADO | [almuerzo] | [cena]
DOMINGO | [almuerzo] | [cena]

RECOMENDACIONES:
[Incluir las recomendaciones del modelo de referencia + 1-2 personalizadas para ${form.nombre}.]

RECETAS BÁSICAS
[Incluir las recetas del modelo de referencia adaptadas a las restricciones.]

JULIETA LUPARDO – Nutricionista UBA –
MN: 6858, MP: 3265

INSTRUCCIONES DE FORMATO:
- Escribí TODO en español argentino (vos, usás, etc.)
- Medidas caseras argentinas (cda, cdita, taza, vaso, plato)
- Marcas argentinas reales del modelo de referencia
- NO uses markdown (#, **, etc.). Solo MAYÚSCULAS para títulos
- Sé detallada y específica como una nutricionista real
- El plan debe ser realista, aplicable y sostenible
- Usá las porciones y equivalencias EXACTAS del modelo de referencia`;
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
function exportPDF({ paciente, plan, notasNutricionista="" }) {
  const fecha = new Date().toLocaleDateString("es-AR");
  const nombre = paciente?.nombre || plan?.nombre || "";
  const planTexto = typeof plan === "string" ? plan : plan?.texto || "";
  const planHTML = planTexto.split("\n").map(line => {
    const t = line.trim();
    if(!t) return "<br>";
    if(/^(LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO|DOMINGO)/i.test(t)) return `<p class="day">${t}</p>`;
    if(/^[A-ZÁÉÍÓÚ\s]{5,}:?\s*$/.test(t)) return `<p class="section-title">${t}</p>`;
    if(t.startsWith("-")||t.startsWith("•")) return `<p class="bullet">${t.replace(/^[-•]\s*/,"")}</p>`;
    return `<p>${t}</p>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Plan Nutricional - ${nombre}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;color:#1a1a1a;background:#fff}.header{background:#2d6a4f;color:white;padding:28px 40px;display:flex;justify-content:space-between;align-items:center}.logo{width:48px;height:48px;background:#52b788;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:white;font-family:sans-serif;flex-shrink:0}.header-title{font-size:20px;font-weight:bold;margin-left:14px}.header-sub{font-size:11px;opacity:.75;margin-top:3px;font-family:sans-serif;margin-left:14px}.content{padding:24px 40px 60px}.plan-text p{font-size:12.5px;line-height:1.75;color:#2a2a2a;margin-bottom:2px}.plan-text p.day{font-weight:bold;color:#2d6a4f;font-size:13px;margin-top:14px;margin-bottom:3px;font-family:sans-serif;border-left:3px solid #52b788;padding-left:8px}.plan-text p.section-title{font-weight:bold;color:#1a3d2b;font-size:13px;margin-top:16px;font-family:sans-serif;text-transform:uppercase;letter-spacing:.5px}.plan-text p.bullet{padding-left:16px;position:relative}.plan-text p.bullet::before{content:"•";position:absolute;left:4px;color:#52b788;font-weight:bold}.notas-box{background:#f5faf7;border:1px solid #d8e8df;border-radius:8px;padding:14px;font-size:12px;line-height:1.7;white-space:pre-wrap}.footer{background:#2d6a4f;color:rgba(255,255,255,.8);font-family:sans-serif;font-size:10px;padding:10px 40px;display:flex;justify-content:space-between;position:fixed;bottom:0;left:0;right:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0;size:A4}}</style></head><body><div class="header"><div style="display:flex;align-items:center"><div class="logo">JL</div><div><div class="header-title">JL Nutrición – Plan Alimentario</div><div class="header-sub">Lic. Julieta Lupardo · MN: 6858, MP: 3265</div></div></div><div style="font-size:12px;opacity:.85;font-family:sans-serif;text-align:right">Fecha: ${fecha}</div></div><div class="content"><div class="plan-text">${planHTML}</div>${notasNutricionista.trim()?`<div style="margin-top:20px"><p style="font-weight:bold;color:#2d6a4f;font-size:13px;font-family:sans-serif;margin-bottom:8px">NOTAS DEL NUTRICIONISTA</p><div class="notas-box">${notasNutricionista.trim()}</div></div>`:""}</div><div class="footer"><span>JL Nutrición · Julieta Lupardo, Nutricionista UBA · Documento de uso profesional</span><span>${fecha}</span></div><script>window.onload=()=>window.print();</script></body></html>`;
  const w = window.open("","_blank");
  if(!w){alert("Permitir popups para poder generar el PDF.");return;}
  w.document.write(html);w.document.close();
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const S = {
  label:{display:"block",fontSize:11,fontWeight:700,color:"#5a7a6a",marginBottom:4,textTransform:"uppercase",letterSpacing:.8},
  input:{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #d8e8df",fontSize:14,fontFamily:"inherit",background:"#fafcfb",outline:"none",boxSizing:"border-box"},
  card:{background:"#fff",borderRadius:16,boxShadow:"0 2px 16px rgba(45,106,79,.08)",padding:"20px"},
  btnPrimary:{padding:"10px 18px",background:"#2d6a4f",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnOutline:{padding:"10px 18px",background:"#fff",color:"#2d6a4f",border:"1.5px solid #2d6a4f",borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnGhost:{padding:"8px 14px",background:"#f0f4f1",color:"#5a7a6a",border:"none",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnDanger:{padding:"8px 14px",background:"#fff0f0",color:"#c0392b",border:"1.5px solid #f5c6c6",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
};

const Field = ({label,value,onChange,type="text",placeholder="",rows}) => (<div style={{marginBottom:14}}><label style={S.label}>{label}</label>{rows?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...S.input,resize:"vertical"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input}/>}</div>);
const Tag = ({label,selected,onClick}) => (<button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",transition:"all .15s",background:selected?"#2d6a4f":"#f0f4f1",color:selected?"#fff":"#3a3a3a",border:selected?"2px solid #2d6a4f":"2px solid #d8e8df",fontFamily:"inherit"}}>{label}</button>);
const Badge = ({label,color="#e8f5ee",text="#2d6a4f"}) => (<span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:color,color:text,whiteSpace:"nowrap"}}>{label}</span>);
const SectionHead = ({children,action}) => (<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1a3d2b"}}>{children}</h3>{action}</div>);

function BarChart({data,color="#2d6a4f",formatValue=(v)=>v,height=120}) {
  const max = Math.max(...data.map(d=>d.value),1);
  return (<div style={{display:"flex",alignItems:"flex-end",gap:6,height:height+40,paddingTop:8}}>{data.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:9,color:"#7a9a8a",fontWeight:600}}>{d.value>0?formatValue(d.value):""}</span><div style={{width:"100%",background:color,borderRadius:"4px 4px 0 0",height:`${(d.value/max)*height}px`,minHeight:d.value>0?4:0,transition:"height .3s"}}/><span style={{fontSize:9,color:"#7a9a8a",textAlign:"center",lineHeight:1.2}}>{d.label}</span></div>))}</div>);
}

function StatsDashboard({patients,consultas}) {
  const now=new Date();const thisMonth=now.getMonth();const thisYear=now.getFullYear();
  const consultasMes=(consultas||[]).filter(c=>{const d=new Date(c.fecha);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;});
  const totalMes=consultasMes.reduce((s,c)=>s+(parseFloat(c.monto)||0),0);const promedio=consultasMes.length?totalMes/consultasMes.length:0;
  const last6=Array.from({length:6},(_,i)=>{const d=new Date(thisYear,thisMonth-5+i,1);const m=d.getMonth();const y=d.getFullYear();const cs=(consultas||[]).filter(c=>{const dd=new Date(c.fecha);return dd.getMonth()===m&&dd.getFullYear()===y;});return{label:MESES[m],value:cs.length,monto:cs.reduce((s,c)=>s+(parseFloat(c.monto)||0),0)};});
  const statCard=(icon,label,value,sub,color="#2d6a4f")=>(<div style={{...S.card,flex:1,minWidth:140}}><div style={{fontSize:22,marginBottom:6}}>{icon}</div><div style={{fontSize:22,fontWeight:700,color}}>{value}</div><div style={{fontSize:12,fontWeight:600,color:"#1a3d2b",marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:11,color:"#7a9a8a",marginTop:2}}>{sub}</div>}</div>);
  return (<div><h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:700,color:"#1a3d2b"}}>📊 Estadísticas</h2><div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>{statCard("👩","Pacientes totales",patients.length,"en el sistema")}{statCard("📅","Consultas este mes",consultasMes.length,"registradas")}{statCard("💰","Facturación del mes",fmtMoney(totalMes),"total cobrado","#1a6b3a")}{statCard("📈","Promedio por consulta",fmtMoney(promedio),"este mes")}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}><div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a3d2b"}}>Consultas por mes</h4>{last6.some(d=>d.value>0)?<BarChart data={last6} color="#52b788"/>:<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"30px 0"}}>Sin datos aún</p>}</div><div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a3d2b"}}>Facturación por mes</h4>{last6.some(d=>d.monto>0)?<BarChart data={last6.map(d=>({...d,value:d.monto}))} color="#2d6a4f" formatValue={v=>`$${Math.round(v/1000)}k`}/>:<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"30px 0"}}>Sin datos aún</p>}</div></div></div>);
}

// ─── CONSULTA FORM (reutilizable, con paciente opcional precargado) ───────────
function ConsultationForm({patients,onSave,onCancel,prefillPatientId}) {
  const [form,setForm]=useState({pacienteId:prefillPatientId||"",fecha:todayISO(),monto:"",tipo:"Primera consulta",obs:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.pacienteId&&form.fecha&&form.monto;
  const handleSave=()=>{const p=patients.find(x=>x.id===form.pacienteId);onSave({id:uid(),pacienteId:form.pacienteId,pacienteNombre:p?.nombre||"",fecha:form.fecha,monto:parseFloat(form.monto)||0,tipo:form.tipo,obs:form.obs});};
  return (<div style={S.card}><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>➕ Registrar consulta</h3>{!prefillPatientId&&<div style={{marginBottom:14}}><label style={S.label}>Paciente</label><select value={form.pacienteId} onChange={e=>set("pacienteId",e.target.value)} style={S.input}><option value="">Seleccioná un paciente...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha" type="date" value={form.fecha} onChange={v=>set("fecha",v)}/><Field label="Monto cobrado ($)" type="number" value={form.monto} onChange={v=>set("monto",v)} placeholder="5000"/></div><div style={{marginBottom:14}}><label style={S.label}>Tipo de consulta</label><select value={form.tipo} onChange={e=>set("tipo",e.target.value)} style={S.input}>{["Primera consulta","Seguimiento","Control","Consulta especial"].map(t=><option key={t}>{t}</option>)}</select></div><Field label="Observación (opcional)" value={form.obs} onChange={v=>set("obs",v)} placeholder="Notas sobre la consulta..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={handleSave} disabled={!valid} style={{...S.btnPrimary,flex:2,opacity:valid?1:.5}}>Guardar consulta</button></div></div>);
}

function PatientsStats({patients,consultas,onAddConsulta,onSelect}) {
  const [tab,setTab]=useState("pacientes");const [showConsultaForm,setShowConsultaForm]=useState(false);const [search,setSearch]=useState("");
  const filtered=patients.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>Pacientes y Estadísticas</h2><button onClick={()=>setShowConsultaForm(true)} style={S.btnPrimary}>+ Registrar consulta</button></div>{showConsultaForm&&<div style={{marginBottom:20}}><ConsultationForm patients={patients} onSave={c=>{onAddConsulta(c);setShowConsultaForm(false);}} onCancel={()=>setShowConsultaForm(false)}/></div>}<div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f4f1",borderRadius:10,padding:4}}>{[["pacientes","👥 Pacientes"],["stats","📊 Estadísticas"],["consultas","📋 Consultas"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",background:tab===id?"#fff":"transparent",color:tab===id?"#2d6a4f":"#5a7a6a",boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>))}</div>{tab==="pacientes"&&<div><input placeholder="🔍 Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:16}}/>{filtered.length===0?<p style={{color:"#aaa",textAlign:"center",padding:"40px 0",fontSize:14}}>No hay pacientes registrados</p>:filtered.map(p=>(<div key={p.id} style={{...S.card,marginBottom:12,display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{p.nombre.charAt(0).toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:15}}>{p.nombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{[p.edad&&`${p.edad} años`,p.objetivo].filter(Boolean).join(" · ")}{p.fechaCreacion&&` · Desde ${p.fechaCreacion}`}</div></div><div style={{display:"flex",gap:8,flexShrink:0}}><button onClick={()=>onSelect(p.id)} style={S.btnOutline}>Ver ficha</button></div></div>))}</div>}{tab==="stats"&&<StatsDashboard patients={patients} consultas={consultas}/>}{tab==="consultas"&&<div>{(!consultas||consultas.length===0)?<p style={{color:"#aaa",textAlign:"center",padding:"40px 0",fontSize:14}}>No hay consultas registradas aún</p>:[...consultas].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(c=>(<div key={c.id} style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:14}}><div style={{flex:1}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{c.pacienteNombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{c.tipo} · {new Date(c.fecha).toLocaleDateString("es-AR")}</div>{c.obs&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:2,fontStyle:"italic"}}>{c.obs}</div>}</div><div style={{fontWeight:700,fontSize:16,color:"#2d6a4f"}}>{fmtMoney(c.monto)}</div></div>))}</div>}</div>);
}

function PatientList({patients,onSelect,onNew}) {
  const [search,setSearch]=useState("");const filtered=patients.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>👥 Pacientes</h2><button onClick={onNew} style={S.btnPrimary}>+ Nuevo paciente</button></div><input placeholder="🔍 Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:16}}/>{filtered.length===0?<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:40,marginBottom:12}}>🌿</div><p style={{color:"#7a9a8a",fontSize:15}}>No hay pacientes aún</p><button onClick={onNew} style={{...S.btnPrimary,marginTop:12}}>Agregar primera paciente</button></div>:filtered.map(p=>(<div key={p.id} onClick={()=>onSelect(p.id)} style={{...S.card,marginBottom:12,display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"box-shadow .2s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(45,106,79,.15)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 16px rgba(45,106,79,.08)"}><div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:18,flexShrink:0}}>{p.nombre.charAt(0).toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:15}}>{p.nombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{[p.edad&&`${p.edad} años`,p.objetivo,p.planes?.length&&`${p.planes.length} plan${p.planes.length!==1?"es":""}`].filter(Boolean).join(" · ")}</div></div><span style={{color:"#52b788",fontSize:20}}>›</span></div>))}</div>);
}

function NewPatient({onSave,onCancel}) {
  const [form,setForm]=useState({nombre:"",edad:"",peso:"",altura:"",sexo:"Femenino",objetivo:"",telefono:"",email:""});const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.nombre&&form.edad;
  return (<div style={{maxWidth:560}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><button onClick={onCancel} style={S.btnGhost}>← Volver</button><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#1a3d2b"}}>Nueva paciente</h2></div><div style={S.card}><Field label="Nombre completo *" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Field label="Edad" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30"/><Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65"/><Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165"/></div><div style={{marginBottom:14}}><label style={S.label}>Sexo</label><div style={{display:"flex",gap:8,marginTop:5}}>{["Femenino","Masculino"].map(s=><Tag key={s} label={s} selected={form.sexo===s} onClick={()=>set("sexo",s)}/>)}</div></div><div style={{marginBottom:14}}><label style={S.label}>Objetivo principal</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{OBJETIVOS_OPTS.map(o=><Tag key={o} label={o} selected={form.objetivo===o} onClick={()=>set("objetivo",o)}/>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Teléfono" value={form.telefono} onChange={v=>set("telefono",v)} placeholder="11XXXXXXXX"/><Field label="Email" value={form.email} onChange={v=>set("email",v)} placeholder="email@ejemplo.com"/></div><button onClick={()=>onSave({...form,id:uid(),fechaCreacion:today(),clinica:initialClinica,mediciones:[],notas:[],planes:[]})} disabled={!valid} style={{...S.btnPrimary,width:"100%",padding:"12px",fontSize:15,opacity:valid?1:.5}}>Guardar paciente</button></div></div>);
}

function PlanViewer({plan,paciente,onClose,onUpdate}) {
  const [editing,setEditing]=useState(false);const [texto,setTexto]=useState(plan.texto||"");const [expanded,setExpanded]=useState(false);const [notasNutri,setNotasNutri]=useState(plan.notasNutri||"");const [saved,setSaved]=useState(false);const isLong=texto.length>1500;
  const handleSave=()=>{onUpdate({...plan,texto,notasNutri});setEditing(false);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  return (<div style={{...S.card,marginBottom:16}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontWeight:700,color:"#1a3d2b",fontSize:15}}>{plan.objetivo}</div><div style={{fontSize:12,color:"#7a9a8a"}}>{plan.fecha}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(!editing)} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>{editing?"✕ Cancelar":"✏️ Editar"}</button><button onClick={()=>exportPDF({paciente,plan:{...plan,texto},notasNutricionista:notasNutri})} style={{...S.btnOutline,fontSize:12,padding:"6px 12px"}}>📄 PDF</button><button onClick={onClose} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>✕</button></div></div>{editing?<div><textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={20} style={{...S.input,resize:"vertical",fontSize:13,lineHeight:1.75,marginBottom:10}}/><div style={{marginBottom:10}}><label style={S.label}>Notas del nutricionista (se guardan con el plan y aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones adicionales..." style={{...S.input,resize:"vertical"}}/></div><button onClick={handleSave} style={{...S.btnPrimary,width:"100%"}}>{saved?"✓ Guardado":"💾 Guardar cambios"}</button></div>:<div><div style={{background:"#f8faf9",borderRadius:10,padding:"16px",maxHeight:expanded?"none":"400px",overflow:"hidden",position:"relative"}}><pre style={{margin:0,fontSize:13,lineHeight:1.75,color:"#2a2a2a",fontFamily:"inherit",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{texto}</pre>{isLong&&!expanded&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,#f8faf9)"}}/>}</div>{isLong&&<button onClick={()=>setExpanded(!expanded)} style={{...S.btnGhost,width:"100%",marginTop:8,fontSize:13}}>{expanded?"▲ Mostrar menos":"▼ Ver plan completo"}</button>}</div>}{!editing&&<div style={{marginTop:12}}><label style={S.label}>Notas del nutricionista (aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones adicionales..." style={{...S.input,resize:"vertical"}}/><button onClick={()=>{onUpdate({...plan,texto,notasNutri});setSaved(true);setTimeout(()=>setSaved(false),2000);}} style={{...S.btnGhost,width:"100%",marginTop:6,fontSize:12}}>{saved?"✓ Notas guardadas":"💾 Guardar notas"}</button></div>}</div>);
}

// ─── PATIENT DETAIL (con pestaña Consultas + consultas en Timeline) ───────────
function PatientDetail({patient,dispatch,consultas,onAddConsulta,onGeneratePlan,onBack,onDelete}) {
  const [tab,setTab]=useState("clinica");const [clinica,setClinica]=useState(patient.clinica||initialClinica);const [clinicaSaved,setClinicaSaved]=useState(false);const [newMedicion,setNewMedicion]=useState({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});const [newNota,setNewNota]=useState("");const [showMedForm,setShowMedForm]=useState(false);const [viewingPlan,setViewingPlan]=useState(null);const [deleteConfirm,setDeleteConfirm]=useState(false);const [showConsultaForm,setShowConsultaForm]=useState(false);
  const setC=(k,v)=>setClinica(c=>({...c,[k]:v}));
  const saveClinica=()=>{dispatch({type:"UPDATE_CLINICA",pid:patient.id,clinica});setClinicaSaved(true);setTimeout(()=>setClinicaSaved(false),2000);};
  const addMedicion=()=>{const m={id:uid(),...newMedicion,imc:calcIMC(newMedicion.peso,patient.altura)};dispatch({type:"ADD_MEDICION",pid:patient.id,m});setNewMedicion({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});setShowMedForm(false);};
  const addNota=()=>{if(!newNota.trim())return;dispatch({type:"ADD_NOTA",pid:patient.id,n:{id:uid(),fecha:today(),texto:newNota}});setNewNota("");};

  // Consultas de este paciente
  const patientConsultas = (consultas||[]).filter(c=>c.pacienteId===patient.id);
  const totalCobrado = patientConsultas.reduce((s,c)=>s+(parseFloat(c.monto)||0),0);

  const tabs=[["clinica","📋 Clínica"],["antrop","📏 Antropometría"],["evol","📝 Evolución"],["planes","🥗 Planes"],["consultas","💰 Consultas"],["timeline","⏱ Timeline"]];

  return (<div><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}><button onClick={onBack} style={S.btnGhost}>← Volver</button><div style={{flex:1}}><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>{patient.nombre}</h2></div><div style={{display:"flex",gap:8}}><button onClick={onGeneratePlan} style={S.btnPrimary}>✨ Nuevo plan</button><button onClick={()=>setDeleteConfirm(true)} style={S.btnDanger}>🗑 Eliminar</button></div></div><div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f4f1",borderRadius:10,padding:4,overflowX:"auto"}}>{tabs.map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:"0 0 auto",padding:"8px 14px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",background:tab===id?"#fff":"transparent",color:tab===id?"#2d6a4f":"#5a7a6a",boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>))}</div>

  {tab==="clinica"&&<div style={S.card}><SectionHead>Historia Clínica</SectionHead><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Motivo de consulta" value={clinica.motivo} onChange={v=>setC("motivo",v)} rows={2}/><Field label="Diagnóstico nutricional" value={clinica.diagnostico} onChange={v=>setC("diagnostico",v)} rows={2}/><Field label="Antecedentes" value={clinica.antecedentes} onChange={v=>setC("antecedentes",v)} rows={2}/><Field label="Medicación" value={clinica.medicacion} onChange={v=>setC("medicacion",v)} rows={2}/><Field label="Patologías" value={clinica.patologias} onChange={v=>setC("patologias",v)} rows={2}/><Field label="Alergias / Intolerancias" value={clinica.alergias} onChange={v=>setC("alergias",v)} rows={2}/><Field label="Síntomas digestivos" value={clinica.digestivo} onChange={v=>setC("digestivo",v)} rows={2}/><Field label="Calidad del sueño" value={clinica.sueno} onChange={v=>setC("sueno",v)} rows={2}/><Field label="Nivel de estrés" value={clinica.estres} onChange={v=>setC("estres",v)} rows={2}/><Field label="Actividad física" value={clinica.actividad} onChange={v=>setC("actividad",v)} rows={2}/></div><button onClick={saveClinica} style={{...S.btnPrimary,width:"100%"}}>{clinicaSaved?"✓ Guardado":"Guardar historia clínica"}</button></div>}

  {tab==="antrop"&&<div><div style={{...S.card,marginBottom:16}}><SectionHead action={<button onClick={()=>setShowMedForm(!showMedForm)} style={S.btnPrimary}>+ Agregar</button>}>Mediciones</SectionHead>{showMedForm&&<div style={{background:"#f5faf7",borderRadius:10,padding:14,marginBottom:14}}><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}><Field label="Fecha" type="date" value={newMedicion.fecha} onChange={v=>setNewMedicion(m=>({...m,fecha:v}))}/><Field label="Peso (kg)" type="number" value={newMedicion.peso} onChange={v=>setNewMedicion(m=>({...m,peso:v}))} placeholder="70"/><Field label="Grasa %" type="number" value={newMedicion.grasa} onChange={v=>setNewMedicion(m=>({...m,grasa:v}))} placeholder="25"/><Field label="Masa muscular %" type="number" value={newMedicion.muscular} onChange={v=>setNewMedicion(m=>({...m,muscular:v}))} placeholder="40"/></div><Field label="Observaciones" value={newMedicion.obs} onChange={v=>setNewMedicion(m=>({...m,obs:v}))} placeholder="Notas..."/><button onClick={addMedicion} style={{...S.btnPrimary,width:"100%"}}>Guardar medición</button></div>}{patient.mediciones?.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin mediciones aún</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:"2px solid #e8f0ec"}}>{["Fecha","Peso","IMC","Grasa%","Músculo%","Obs"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#5a7a6a",fontWeight:700,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{patient.mediciones?.map(m=>(<tr key={m.id} style={{borderBottom:"1px solid #f0f4f1"}}><td style={{padding:"10px"}}>{m.fecha}</td><td style={{padding:"10px",fontWeight:700,color:"#1a3d2b"}}>{m.peso} kg</td><td style={{padding:"10px"}}><Badge label={m.imc}/></td><td style={{padding:"10px"}}>{m.grasa||"—"}%</td><td style={{padding:"10px"}}>{m.muscular||"—"}%</td><td style={{padding:"10px",color:"#7a9a8a",fontSize:12}}>{m.obs||"—"}</td></tr>))}</tbody></table></div>}</div></div>}

  {tab==="evol"&&<div><div style={{...S.card,marginBottom:16}}><SectionHead>Agregar nota de evolución</SectionHead><textarea value={newNota} onChange={e=>setNewNota(e.target.value)} rows={3} placeholder="Notas de la consulta de hoy..." style={{...S.input,resize:"vertical",marginBottom:10}}/><button onClick={addNota} disabled={!newNota.trim()} style={{...S.btnPrimary,width:"100%",opacity:newNota.trim()?1:.5}}>Guardar nota</button></div>{patient.notas?.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin notas aún</p>:patient.notas?.map(n=>(<div key={n.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #52b788"}}><div style={{fontSize:11,color:"#7a9a8a",marginBottom:6,fontWeight:600}}>{n.fecha}</div><p style={{margin:0,fontSize:14,color:"#2a2a2a",lineHeight:1.6}}>{n.texto}</p></div>))}</div>}

  {tab==="planes"&&<div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button onClick={onGeneratePlan} style={S.btnPrimary}>✨ Generar nuevo plan</button></div>{patient.planes?.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin planes generados aún</p>:patient.planes?.map(plan=>(<div key={plan.id}>{viewingPlan===plan.id?<PlanViewer plan={plan} paciente={patient} onClose={()=>setViewingPlan(null)} onUpdate={updated=>dispatch({type:"UPDATE_PLAN",pid:patient.id,plan:updated})}/>:<div style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:12}}><div style={{flex:1}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{plan.objetivo}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{plan.fecha}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setViewingPlan(plan.id)} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>👁 Ver</button><button onClick={()=>exportPDF({paciente:patient,plan})} style={{...S.btnOutline,fontSize:12,padding:"6px 12px"}}>📄 PDF</button></div></div>}</div>))}</div>}

  {tab==="consultas"&&<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <span style={{fontSize:13,color:"#5a7a6a"}}>{patientConsultas.length} consulta{patientConsultas.length!==1?"s":""}</span>
        {patientConsultas.length>0&&<span style={{fontSize:13,color:"#2d6a4f",fontWeight:700,marginLeft:12}}>Total: {fmtMoney(totalCobrado)}</span>}
      </div>
      <button onClick={()=>setShowConsultaForm(!showConsultaForm)} style={S.btnPrimary}>+ Registrar consulta</button>
    </div>
    {showConsultaForm&&<div style={{marginBottom:16}}><ConsultationForm patients={[patient]} prefillPatientId={patient.id} onSave={c=>{onAddConsulta(c);setShowConsultaForm(false);}} onCancel={()=>setShowConsultaForm(false)}/></div>}
    {patientConsultas.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>No hay consultas registradas para este paciente</p>:
    [...patientConsultas].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(c=>(<div key={c.id} style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:14}}><div style={{width:36,height:36,borderRadius:"50%",background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>💰</div><div style={{flex:1}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{c.tipo}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{new Date(c.fecha).toLocaleDateString("es-AR")}</div>{c.obs&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:2,fontStyle:"italic"}}>{c.obs}</div>}</div><div style={{fontWeight:700,fontSize:16,color:"#2d6a4f"}}>{fmtMoney(c.monto)}</div></div>))}
  </div>}

  {tab==="timeline"&&<div>{[
    ...(patient.planes||[]).map(x=>({...x,tipo:"plan",icon:"🥗",color:"#2d6a4f"})),
    ...(patient.mediciones||[]).map(x=>({...x,tipo:"med",icon:"📏",color:"#52b788",fecha:x.fecha})),
    ...(patient.notas||[]).map(x=>({...x,tipo:"nota",icon:"📝",color:"#74c69d"})),
    ...patientConsultas.map(x=>({...x,tipo:"consulta",icon:"💰",color:"#f4a261",fecha:x.fecha})),
  ].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((item,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:14}}><div style={{width:36,height:36,borderRadius:"50%",background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.icon}</div><div style={{...S.card,flex:1,padding:14}}><div style={{fontSize:11,color:"#7a9a8a",marginBottom:4,fontWeight:600}}>{typeof item.fecha==="string"&&item.fecha.includes("-")?new Date(item.fecha).toLocaleDateString("es-AR"):item.fecha}</div>{item.tipo==="plan"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Plan generado</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.objetivo}</div></>}{item.tipo==="med"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Medición registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>Peso: {item.peso}kg · IMC: {item.imc}</div></>}{item.tipo==="nota"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Nota de evolución</div><div style={{fontSize:13,color:"#5a7a6a",marginTop:2}}>{item.texto}</div></>}{item.tipo==="consulta"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Consulta registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.tipo_consulta||item.tipo} · {fmtMoney(item.monto)}</div>{item.obs&&<div style={{fontSize:12,color:"#7a9a8a",fontStyle:"italic",marginTop:2}}>{item.obs}</div>}</>}</div></div>))}</div>}

  {deleteConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:360,width:"90%",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><h3 style={{margin:"0 0 8px",color:"#1a3d2b"}}>¿Eliminar a {patient.nombre}?</h3><p style={{fontSize:14,color:"#5a7a6a",marginBottom:20}}>Esta acción no se puede deshacer.</p><div style={{display:"flex",gap:10}}><button onClick={()=>setDeleteConfirm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onDelete(patient.id);}} style={{...S.btnPrimary,flex:1,background:"#c0392b"}}>Sí, eliminar</button></div></div></div>}</div>);
}

function PlanGenerator({prefill,onSavePlan,onBack}) {
  const [step,setStep]=useState(prefill?1:0);const [form,setForm]=useState({...initialPlanForm,...prefill});const [plan,setPlan]=useState("");const [loading,setLoading]=useState(false);const [editing,setEditing]=useState(false);const [saved,setSaved]=useState(false);const [notasNutri,setNotasNutri]=useState("");const [generatingPDF,setGeneratingPDF]=useState(false);const [expanded,setExpanded]=useState(false);const [showMontoModal,setShowMontoModal]=useState(false);const [monto,setMonto]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const generatePlan=async()=>{setStep(3);setLoading(true);const prompt=buildPrompt(form);try{const res=await fetch("/api/generatePlan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const data=await res.json();if(data.error)throw new Error(data.error.message||JSON.stringify(data.error));setPlan(data.content?.[0]?.text||"Error al generar el plan.");}catch(e){setPlan("Error de conexión. Intentá nuevamente.");}setLoading(false);};
  const isLong=plan.length>1500;
  return (<div><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>{onBack&&<button onClick={onBack} style={S.btnGhost}>← Volver</button>}<div><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>✨ Generar Plan Nutricional</h2>{prefill?.nombre&&<p style={{margin:"2px 0 0",fontSize:13,color:"#7a9a8a"}}>Datos de {prefill.nombre} precargados</p>}</div></div><div style={{maxWidth:580}}>{step<3&&<div style={{display:"flex",gap:6,marginBottom:20}}>{["👤 Paciente","🎯 Objetivos","🚫 Restricciones"].map((s,i)=>(<div key={i} style={{flex:1}}><div style={{height:4,borderRadius:4,background:i<=step?"#2d6a4f":"#e0ece6",transition:"background .3s"}}/></div>))}</div>}<div style={S.card}>
  {step===0&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>👤 Datos de la paciente</h3><Field label="Nombre completo" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Field label="Edad" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30"/><Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65"/><Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165"/></div><div style={{marginBottom:16}}><label style={S.label}>Sexo</label><div style={{display:"flex",gap:8,marginTop:5}}>{["Femenino","Masculino"].map(s=><Tag key={s} label={s} selected={form.sexo===s} onClick={()=>set("sexo",s)}/>)}</div></div><button onClick={()=>setStep(1)} disabled={!form.nombre||!form.edad||!form.peso||!form.sexo} style={{...S.btnPrimary,width:"100%",padding:"12px",fontSize:15,opacity:(!form.nombre||!form.edad||!form.peso||!form.sexo)?.5:1}}>Siguiente →</button></div>}
  {step===1&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>🎯 Objetivos y actividad</h3><div style={{marginBottom:16}}><label style={S.label}>Objetivo principal</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{OBJETIVOS_OPTS.map(o=><Tag key={o} label={o} selected={form.objetivo===o} onClick={()=>set("objetivo",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Tipo de plan</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{TIPO_PLAN_OPTS.map(o=><Tag key={o} label={o} selected={form.tipoPlan===o} onClick={()=>set("tipoPlan",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Nivel de actividad física</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{ACTIVIDAD_OPTS.map(o=><Tag key={o} label={o} selected={form.nivelActividad===o} onClick={()=>set("nivelActividad",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Comidas por día</label><select value={form.cantidadComidas} onChange={e=>set("cantidadComidas",e.target.value)} style={S.input}>{["3","4","5","6"].map(o=><option key={o} value={o}>{o} comidas</option>)}</select></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(0)} style={{...S.btnGhost,flex:1}}>← Volver</button><button onClick={()=>setStep(2)} disabled={!form.objetivo||!form.nivelActividad} style={{...S.btnPrimary,flex:2,opacity:(!form.objetivo||!form.nivelActividad)?.5:1}}>Siguiente →</button></div></div>}
  {step===2&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>🚫 Restricciones y preferencias</h3><div style={{marginBottom:16}}><label style={S.label}>Alergias e intolerancias</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{ALERGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.alergias.includes(o)} onClick={()=>set("alergias",toggle(form.alergias,o))}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Patologías</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{PATOLOGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.patologias.includes(o)} onClick={()=>set("patologias",toggle(form.patologias,o))}/>)}</div></div><Field label="Alimentos preferidos" value={form.preferencias} onChange={v=>set("preferencias",v)} placeholder="Ej: pollo, arroz integral, frutas..." rows={2}/><Field label="Alimentos que no le gustan" value={form.aversiones} onChange={v=>set("aversiones",v)} placeholder="Ej: brócoli, hígado..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{...S.btnGhost,flex:1}}>← Volver</button><button onClick={generatePlan} style={{flex:2,padding:"12px",background:"linear-gradient(135deg,#2d6a4f,#40916c)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>✨ Generar plan</button></div></div>}
  {step===3&&(loading?<div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:44,marginBottom:12}}>🥗</div><h3 style={{color:"#2d6a4f",margin:"0 0 6px"}}>Generando plan para {form.nombre}...</h3><p style={{color:"#7a9a8a",fontSize:13,margin:0}}>La IA está personalizando cada detalle</p><div style={{marginTop:20,display:"flex",justifyContent:"center",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#52b788",animation:`pulse ${0.6+i*.2}s ease-in-out infinite alternate`}}/>)}</div><style>{`@keyframes pulse{from{opacity:.3;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`}</style></div>:<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1a3d2b"}}>Plan de {form.nombre}</h3><p style={{margin:"3px 0 0",fontSize:13,color:"#7a9a8a"}}>{form.objetivo} · {form.tipoPlan} · {form.cantidadComidas} comidas/día</p></div><button onClick={()=>setEditing(!editing)} style={{...S.btnGhost,fontSize:12}}>✏️ {editing?"Cerrar edición":"Editar"}</button></div>{editing?<textarea value={plan} onChange={e=>setPlan(e.target.value)} rows={20} style={{...S.input,resize:"vertical",marginBottom:12,fontSize:13,lineHeight:1.7}}/>:<div style={{background:"#f8faf9",borderRadius:10,padding:16,marginBottom:12,maxHeight:expanded?"none":"400px",overflow:"hidden",position:"relative"}}><pre style={{margin:0,fontSize:13,lineHeight:1.75,color:"#2a2a2a",fontFamily:"inherit",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{plan}</pre>{isLong&&!expanded&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,#f8faf9)"}}/>}</div>}{!editing&&isLong&&<button onClick={()=>setExpanded(!expanded)} style={{...S.btnGhost,width:"100%",marginBottom:12,fontSize:13}}>{expanded?"▲ Mostrar menos":"▼ Ver plan completo"}</button>}<label style={S.label}>Notas del nutricionista (aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones personalizadas..." style={{...S.input,marginBottom:12,resize:"vertical"}}/><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>{const el=document.createElement("textarea");el.value=plan;el.style.position="fixed";el.style.opacity="0";document.body.appendChild(el);el.focus();el.select();document.execCommand("copy");document.body.removeChild(el);}} style={{...S.btnGhost,flex:1,fontSize:12}}>📋 Copiar</button><button onClick={()=>{setGeneratingPDF(true);try{exportPDF({paciente:{nombre:form.nombre,objetivo:form.objetivo},plan:{texto:plan,objetivo:form.objetivo},notasNutricionista:notasNutri});}catch(e){alert("Error generando PDF.");}setGeneratingPDF(false);}} style={{flex:2,padding:"10px",borderRadius:9,border:"none",background:generatingPDF?"#7a9a8a":"#1b4332",color:"#fff",fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>{generatingPDF?"Generando...":"📄 Descargar PDF"}</button>{onSavePlan&&<button onClick={()=>setShowMontoModal(true)} style={{...S.btnPrimary,flex:2,fontSize:13}}>{saved?"✓ Guardado en ficha":"💾 Guardar en ficha"}</button>}</div><button onClick={()=>{setStep(0);setPlan("");setEditing(false);setSaved(false);setExpanded(false);}} style={{...S.btnGhost,width:"100%",marginTop:10,fontSize:13}}>↩ Nuevo plan</button>{showMontoModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:340,width:"90%",textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>💰</div><h3 style={{margin:"0 0 6px",color:"#1a3d2b"}}>¿Cuánto cobró por esta consulta?</h3><p style={{fontSize:13,color:"#7a9a8a",marginBottom:16}}>Se registrará junto con el plan en las estadísticas.</p><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 15000" autoFocus style={{...S.input,fontSize:18,fontWeight:700,textAlign:"center",marginBottom:16}}/><div style={{display:"flex",gap:10}}><button onClick={()=>setShowMontoModal(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onSavePlan({id:uid(),fecha:today(),objetivo:form.objetivo,texto:plan,notasNutri,monto:parseFloat(monto)||0});setSaved(true);setShowMontoModal(false);setTimeout(()=>setSaved(false),3000);}} style={{...S.btnPrimary,flex:2}}>Guardar</button></div></div></div>}</div>)}</div></div></div>);
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [state,dispatch]=useReducer(reducer,{patients:[],consultas:[]});const [screen,setScreen]=useState("patients");const [selectedId,setSelectedId]=useState(null);const [navTab,setNavTab]=useState("patients");const [loaded,setLoaded]=useState(false);const [saveStatus,setSaveStatus]=useState("idle");
  useEffect(()=>{Promise.all([sbLoadAll(),sbLoadConsultas()]).then(([patients,consultas])=>{dispatch({type:"LOAD",patients,consultas});setLoaded(true);}).catch(()=>{dispatch({type:"LOAD",patients:[],consultas:[]});setLoaded(true);});},[]);
  useEffect(()=>{if(!loaded)return;setSaveStatus("saving");const t=setTimeout(async()=>{try{await Promise.all(state.patients.map(p=>sbUpsert(p)));setSaveStatus("saved");}catch{setSaveStatus("error");}setTimeout(()=>setSaveStatus("idle"),2000);},800);return()=>clearTimeout(t);},[state.patients,loaded]);
  const patient=state.patients.find(p=>p.id===selectedId);const go=(s,id=null)=>{setScreen(s);if(id)setSelectedId(id);};
  const handleAddConsulta=async(c)=>{dispatch({type:"ADD_CONSULTA",c});try{await sbInsertConsulta(c);}catch(e){console.error("Error guardando consulta:",e);}};
  const handleDeletePatient=async(id)=>{dispatch({type:"DELETE_PATIENT",id});await sbDelete(id);go("patients");};
  if(!loaded)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5faf7",fontFamily:"sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🌿</div><p style={{color:"#2d6a4f",fontWeight:600,fontSize:16}}>JL Nutrición</p><p style={{color:"#7a9a8a",fontSize:13}}>Conectando con la base de datos...</p></div></div>);
  return (<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5ee 0%,#f5f9f7 50%,#e0f0e8 100%)",fontFamily:"'DM Sans',system-ui,sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#2d6a4f!important;box-shadow:0 0 0 3px rgba(45,106,79,.1)!important;outline:none}`}</style><div style={{background:"#fff",borderBottom:"1.5px solid #e8f0ec",padding:"0 20px",position:"sticky",top:0,zIndex:100}}><div style={{maxWidth:980,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍏</div><span style={{fontWeight:700,fontSize:16,color:"#1a3d2b"}}>JL Nutrición</span><span style={{fontSize:11,color:saveStatus==="saving"?"#f4a261":saveStatus==="saved"?"#52b788":saveStatus==="error"?"#e63946":"transparent",fontWeight:600,transition:"color .3s"}}>{saveStatus==="saving"?"● guardando...":saveStatus==="saved"?"✓ guardado":saveStatus==="error"?"⚠ error":"·"}</span></div><div style={{display:"flex",alignItems:"center",gap:4}}>{[["patients","👥 Pacientes"],["stats","📊 Estadísticas"],["plan","✨ Nuevo plan"]].map(([id,label])=>(<button key={id} onClick={()=>{setNavTab(id);go(id);}} style={{padding:"7px 14px",border:"none",borderRadius:9,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",background:navTab===id?"#2d6a4f":"transparent",color:navTab===id?"#fff":"#5a7a6a"}}>{label}</button>))}</div></div></div><div style={{maxWidth:980,margin:"0 auto",padding:"24px 16px"}}>
    {screen==="patients"&&<PatientList patients={state.patients} onSelect={id=>go("detail",id)} onNew={()=>go("new-patient")}/>}
    {screen==="stats"&&<PatientsStats patients={state.patients} consultas={state.consultas} onAddConsulta={handleAddConsulta} onSelect={id=>go("detail",id)}/>}
    {screen==="new-patient"&&<NewPatient onSave={p=>{dispatch({type:"ADD_PATIENT",p});go("detail",p.id);}} onCancel={()=>go("patients")}/>}
    {screen==="detail"&&patient&&<PatientDetail patient={patient} dispatch={dispatch} consultas={state.consultas} onAddConsulta={handleAddConsulta} onGeneratePlan={()=>go("plan-patient")} onBack={()=>go("patients")} onDelete={handleDeletePatient}/>}
    {screen==="plan-patient"&&patient&&<PlanGenerator prefill={{nombre:patient.nombre,edad:patient.edad,peso:patient.peso,altura:patient.altura,sexo:patient.sexo,objetivo:patient.objetivo||"",nivelActividad:"",alergias:[],patologias:[],preferencias:"",aversiones:"",cantidadComidas:"4",tipoPlan:"Estándar"}} onSavePlan={plan=>{dispatch({type:"ADD_PLAN",pid:patient.id,plan});const c={id:uid(),pacienteId:patient.id,pacienteNombre:patient.nombre,fecha:todayISO(),monto:plan.monto||0,tipo:"Plan generado",obs:`Plan: ${plan.objetivo}`};handleAddConsulta(c);go("detail",patient.id);}} onBack={()=>go("detail",patient.id)}/>}
    {screen==="plan"&&<PlanGenerator onBack={()=>{setNavTab("patients");go("patients");}}/>}
  </div></div>);
}
