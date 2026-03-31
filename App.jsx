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

// Fértil constants
const FERTIL_STATUS_LABELS={lead:"Lead",activa:"Activa",pausada:"Pausada",finalizada:"Finalizada"};
const FERTIL_STATUS_COLORS={lead:"#f4a261",activa:"#7b2d8b",pausada:"#aaa",finalizada:"#52b788"};
const FERTIL_PAYMENT_LABELS={pendiente:"Pendiente",parcial:"Parcial",pago:"Pago"};
const FERTIL_PAYMENT_COLORS={pendiente:"#e76f51",parcial:"#f4a261",pago:"#52b788"};
const FERTIL_CONSULT_TYPES=[{num:1,type:"inicial",label:"Consulta Inicial"},{num:2,type:"seguimiento",label:"Seguimiento 1"},{num:3,type:"seguimiento",label:"Seguimiento 2"},{num:4,type:"seguimiento",label:"Seguimiento 3"},{num:5,type:"cierre",label:"Consulta de Cierre"}];

function uid() { return Math.random().toString(36).slice(2,9); }
function today() { return new Date().toLocaleDateString("es-AR"); }
function todayISO() { return new Date().toISOString().split("T")[0]; }
function calcIMC(peso,altura) { if(!peso||!altura) return "—"; return (parseFloat(peso)/Math.pow(parseFloat(altura)/100,2)).toFixed(1); }
function toggle(arr,val) { return arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]; }
function fmtMoney(n) { return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",minimumFractionDigits:0}).format(n||0); }
function fmtDate(d) { if(!d) return "—"; try { return new Date(d+"T12:00:00").toLocaleDateString("es-AR"); } catch { return d; } }
function fmtDateTime(d) { if(!d) return "—"; try { const dt=new Date(d); return dt.toLocaleDateString("es-AR")+" "+dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); } catch { return d; } }

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
    case "LOAD_EVENTOS": return {...state,eventos:action.eventos||[]};
    case "ADD_EVENTO": return {...state,eventos:[action.e,...(state.eventos||[])]};
    case "UPDATE_EVENTO": return {...state,eventos:(state.eventos||[]).map(e=>e.id===action.e.id?action.e:e)};
    case "DELETE_EVENTO": return {...state,eventos:(state.eventos||[]).filter(e=>e.id!==action.id)};
    // Fértil
    case "LOAD_FERTIL": return {...state,fertilCases:action.cases||[],appointments:action.appointments||[],fertilFollowups:action.followups||[],fertilLabs:action.labs||[],fertilTasks:action.tasks||[]};
    case "ADD_FERTIL_CASE": return {...state,fertilCases:[action.c,...(state.fertilCases||[])]};
    case "UPDATE_FERTIL_CASE": return {...state,fertilCases:(state.fertilCases||[]).map(c=>c.id===action.c.id?action.c:c)};
    case "ADD_APPOINTMENT": return {...state,appointments:[action.a,...(state.appointments||[])]};
    case "UPDATE_APPOINTMENT": return {...state,appointments:(state.appointments||[]).map(a=>a.id===action.a.id?action.a:a)};
    case "DELETE_APPOINTMENT": return {...state,appointments:(state.appointments||[]).filter(a=>a.id!==action.id)};
    case "ADD_FERTIL_FOLLOWUP": return {...state,fertilFollowups:[action.f,...(state.fertilFollowups||[])]};
    case "ADD_FERTIL_LAB": return {...state,fertilLabs:[action.l,...(state.fertilLabs||[])]};
    case "ADD_FERTIL_TASK": return {...state,fertilTasks:[action.t,...(state.fertilTasks||[])]};
    case "UPDATE_FERTIL_TASK": return {...state,fertilTasks:(state.fertilTasks||[]).map(t=>t.id===action.t.id?action.t:t)};
    case "DELETE_FERTIL_TASK": return {...state,fertilTasks:(state.fertilTasks||[]).filter(t=>t.id!==action.id)};
    case "LOAD": return {...state,patients:action.patients,consultas:action.consultas||[],eventos:action.eventos||[]};
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

async function sbLoadEventos() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/eventos?select=*&order=fecha.asc`,{headers:sbHeaders});
  if(!r.ok) return [];
  const rows = await r.json();
  return rows.map(row=>({
    id:row.id,pacienteId:row.paciente_id,pacienteNombre:row.paciente_nombre,
    tipo:row.tipo||"seguimiento",titulo:row.titulo,descripcion:row.descripcion||"",
    fecha:row.fecha,hora:row.hora||"",notificar:row.notificar||false,
    notificarVia:row.notificar_via||"",completado:row.completado||false
  }));
}

async function sbInsertEvento(e) {
  const body = JSON.stringify({
    id:e.id,paciente_id:e.pacienteId,paciente_nombre:e.pacienteNombre,
    tipo:e.tipo||"seguimiento",titulo:e.titulo,descripcion:e.descripcion||"",
    fecha:e.fecha,hora:e.hora||"",notificar:e.notificar||false,
    notificar_via:e.notificarVia||"",completado:e.completado||false
  });
  await fetch(`${SUPABASE_URL}/rest/v1/eventos`,{method:"POST",headers:sbHeaders,body});
}

async function sbUpdateEvento(e) {
  const body = JSON.stringify({
    paciente_id:e.pacienteId,paciente_nombre:e.pacienteNombre,
    tipo:e.tipo,titulo:e.titulo,descripcion:e.descripcion||"",
    fecha:e.fecha,hora:e.hora||"",notificar:e.notificar||false,
    notificar_via:e.notificarVia||"",completado:e.completado||false,
    updated_at:new Date().toISOString()
  });
  await fetch(`${SUPABASE_URL}/rest/v1/eventos?id=eq.${e.id}`,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body});
}

async function sbDeleteEvento(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/eventos?id=eq.${id}`,{method:"DELETE",headers:sbHeaders});
}

// ─── SUPABASE FÉRTIL ─────────────────────────────────────────────────────────
async function sbLoadFertilCases(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_cases?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,patientId:row.patient_id,status:row.status||"lead",startDate:row.start_date,currentWeek:row.current_week||1,mainCondition:row.main_condition||"",objective:row.objective||"",notes:row.notes||"",totalPrice:parseFloat(row.total_price)||0,paymentStatus:row.payment_status||"pendiente",paymentMethod:row.payment_method||"",installments:row.installments||1,amountPaid:parseFloat(row.amount_paid)||0,createdAt:row.created_at}));}catch(e){console.error("sbLoadFertilCases:",e);return[];}}
async function sbUpsertFertilCase(c){const body=JSON.stringify({id:c.id,patient_id:c.patientId,status:c.status,start_date:c.startDate,current_week:c.currentWeek,main_condition:c.mainCondition||"",objective:c.objective||"",notes:c.notes||"",total_price:c.totalPrice||0,payment_status:c.paymentStatus||"pendiente",payment_method:c.paymentMethod||"",installments:c.installments||1,amount_paid:c.amountPaid||0});await fetch(`${SUPABASE_URL}/rest/v1/fertil_cases`,{method:"POST",headers:sbHeaders,body});}
async function sbLoadAppointments(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/appointments?select=*&order=start_at.asc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,patientId:row.patient_id,fertilCaseId:row.fertil_case_id,programType:row.program_type||"general",consultationNumber:row.consultation_number,consultationType:row.consultation_type||"consulta_individual",title:row.title,startAt:row.start_at,endAt:row.end_at,status:row.status||"programada",notes:row.notes||""}));}catch(e){console.error("sbLoadAppointments:",e);return[];}}
async function sbUpsertAppointment(a){const body=JSON.stringify({id:a.id,patient_id:a.patientId,fertil_case_id:a.fertilCaseId||null,program_type:a.programType||"general",consultation_number:a.consultationNumber||null,consultation_type:a.consultationType||"consulta_individual",title:a.title,start_at:a.startAt,end_at:a.endAt||null,status:a.status||"programada",notes:a.notes||""});await fetch(`${SUPABASE_URL}/rest/v1/appointments`,{method:"POST",headers:sbHeaders,body});}
async function sbUpdateAppointment(a){const body=JSON.stringify({patient_id:a.patientId,fertil_case_id:a.fertilCaseId||null,program_type:a.programType,consultation_number:a.consultationNumber,consultation_type:a.consultationType,title:a.title,start_at:a.startAt,end_at:a.endAt||null,status:a.status,notes:a.notes||""});await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${a.id}`,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body});}
async function sbDeleteAppointment(id){await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${id}`,{method:"DELETE",headers:sbHeaders});}
async function sbLoadFertilFollowups(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_followups?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,fertilCaseId:row.fertil_case_id,weekNumber:row.week_number,date:row.date,weight:row.weight,symptoms:row.symptoms||"",mood:row.mood||"",sleepQuality:row.sleep_quality||"",digestion:row.digestion||"",adherence:row.adherence||"",notes:row.notes||""}));}catch(e){return[];}}
async function sbInsertFertilFollowup(f){const body=JSON.stringify({id:f.id,fertil_case_id:f.fertilCaseId,week_number:f.weekNumber,date:f.date,weight:f.weight||null,symptoms:f.symptoms||"",mood:f.mood||"",sleep_quality:f.sleepQuality||"",digestion:f.digestion||"",adherence:f.adherence||"",notes:f.notes||""});await fetch(`${SUPABASE_URL}/rest/v1/fertil_followups`,{method:"POST",headers:sbHeaders,body});}
async function sbLoadFertilLabs(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_labs?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,fertilCaseId:row.fertil_case_id,date:row.date,labType:row.lab_type||"",results:row.results||"",notes:row.notes||""}));}catch(e){return[];}}
async function sbInsertFertilLab(l){const body=JSON.stringify({id:l.id,fertil_case_id:l.fertilCaseId,date:l.date,lab_type:l.labType||"",results:l.results||"",notes:l.notes||""});await fetch(`${SUPABASE_URL}/rest/v1/fertil_labs`,{method:"POST",headers:sbHeaders,body});}
async function sbLoadFertilTasks(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,fertilCaseId:row.fertil_case_id,title:row.title,done:row.done||false,dueDate:row.due_date}));}catch(e){return[];}}
async function sbInsertFertilTask(t){const body=JSON.stringify({id:t.id,fertil_case_id:t.fertilCaseId,title:t.title,done:t.done||false,due_date:t.dueDate||null});await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks`,{method:"POST",headers:sbHeaders,body});}
async function sbUpdateFertilTask(t){const body=JSON.stringify({title:t.title,done:t.done,due_date:t.dueDate||null});await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?id=eq.${t.id}`,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body});}
async function sbDeleteFertilTask(id){await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?id=eq.${id}`,{method:"DELETE",headers:sbHeaders});}

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
  btnFertil:{padding:"10px 18px",background:"#7b2d8b",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
};

const Field = ({label,value,onChange,type="text",placeholder="",rows}) => (<div style={{marginBottom:14}}><label style={S.label}>{label}</label>{rows?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...S.input,resize:"vertical"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input}/>}</div>);
const Tag = ({label,selected,onClick}) => (<button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",transition:"all .15s",background:selected?"#2d6a4f":"#f0f4f1",color:selected?"#fff":"#3a3a3a",border:selected?"2px solid #2d6a4f":"2px solid #d8e8df",fontFamily:"inherit"}}>{label}</button>);
const Badge = ({label,color="#e8f5ee",text="#2d6a4f"}) => (<span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:color,color:text,whiteSpace:"nowrap"}}>{label}</span>);
const SectionHead = ({children,action}) => (<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1a3d2b"}}>{children}</h3>{action}</div>);

function BarChart({data,color="#2d6a4f",formatValue=(v)=>v,height=120}) {
  const max = Math.max(...data.map(d=>d.value),1);
  return (<div style={{display:"flex",alignItems:"flex-end",gap:6,height:height+40,paddingTop:8}}>{data.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:9,color:"#7a9a8a",fontWeight:600}}>{d.value>0?formatValue(d.value):""}</span><div style={{width:"100%",background:color,borderRadius:"4px 4px 0 0",height:`${(d.value/max)*height}px`,minHeight:d.value>0?4:0,transition:"height .3s"}}/><span style={{fontSize:9,color:"#7a9a8a",textAlign:"center",lineHeight:1.2}}>{d.label}</span></div>))}</div>);
}

function StatsDashboard({patients,consultas,fertilCases,appointments}) {
  const now=new Date();const thisMonth=now.getMonth();const thisYear=now.getFullYear();
  const consultasMes=(consultas||[]).filter(c=>{const d=new Date(c.fecha);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;});
  const totalMes=consultasMes.reduce((s,c)=>s+(parseFloat(c.monto)||0),0);const promedio=consultasMes.length?totalMes/consultasMes.length:0;
  const last6=Array.from({length:6},(_,i)=>{const d=new Date(thisYear,thisMonth-5+i,1);const m=d.getMonth();const y=d.getFullYear();const cs=(consultas||[]).filter(c=>{const dd=new Date(c.fecha);return dd.getMonth()===m&&dd.getFullYear()===y;});return{label:MESES[m],value:cs.length,monto:cs.reduce((s,c)=>s+(parseFloat(c.monto)||0),0)};});
  // Fértil stats
  const fc=fertilCases||[];const fertilActivas=fc.filter(c=>c.status==="activa").length;const fertilFinalizadas=fc.filter(c=>c.status==="finalizada").length;
  const fertilTotalIngresos=fc.reduce((s,c)=>s+(c.amountPaid||0),0);
  const fertilMesIngresos=fc.filter(c=>{const d=new Date(c.createdAt);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}).reduce((s,c)=>s+(c.amountPaid||0),0);
  const fertilTicketPromedio=fc.length?fertilTotalIngresos/fc.length:0;
  const fertilPagos=fc.filter(c=>c.paymentStatus==="pago").length;const fertilPendientes=fc.filter(c=>c.paymentStatus==="pendiente").length;
  const fertilPctPago=fc.length?Math.round((fertilPagos/fc.length)*100):0;
  const totalHistorico=(consultas||[]).reduce((s,c)=>s+(parseFloat(c.monto)||0),0)+fertilTotalIngresos;
  const last6Fertil=Array.from({length:6},(_,i)=>{const d=new Date(thisYear,thisMonth-5+i,1);const m=d.getMonth();const y=d.getFullYear();const ing=fc.filter(c=>{const dd=new Date(c.createdAt);return dd.getMonth()===m&&dd.getFullYear()===y;}).reduce((s,c)=>s+(c.amountPaid||0),0);return{label:MESES[m],value:ing};});
  const [showFertil,setShowFertil]=useState(false);
  const statCard=(icon,label,value,sub,color="#2d6a4f")=>(<div style={{...S.card,flex:1,minWidth:140}}><div style={{fontSize:22,marginBottom:6}}>{icon}</div><div style={{fontSize:22,fontWeight:700,color}}>{value}</div><div style={{fontSize:12,fontWeight:600,color:"#1a3d2b",marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:11,color:"#7a9a8a",marginTop:2}}>{sub}</div>}</div>);
  return (<div><h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:700,color:"#1a3d2b"}}>📊 Estadísticas</h2><div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>{statCard("👩","Pacientes totales",patients.length,"en el sistema")}{statCard("📅","Consultas este mes",consultasMes.length,"registradas")}{statCard("💰","Facturación del mes",fmtMoney(totalMes+fertilMesIngresos),"consultas + fértil","#1a6b3a")}{statCard("📈","Ingreso total histórico",fmtMoney(totalHistorico),"todo el sistema")}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}><div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a3d2b"}}>Consultas por mes</h4>{last6.some(d=>d.value>0)?<BarChart data={last6} color="#52b788"/>:<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"30px 0"}}>Sin datos aún</p>}</div><div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a3d2b"}}>Facturación por mes</h4>{last6.some(d=>d.monto>0)?<BarChart data={last6.map(d=>({...d,value:d.monto}))} color="#2d6a4f" formatValue={v=>`$${Math.round(v/1000)}k`}/>:<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"30px 0"}}>Sin datos aún</p>}</div></div>
    {/* Fértil stats */}
    <div style={{borderTop:"2px solid #e8d5f0",paddingTop:20,marginTop:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,cursor:"pointer"}} onClick={()=>setShowFertil(!showFertil)}>
        <span style={{fontSize:18}}>💜</span><h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#7b2d8b"}}>Métricas Fértil</h3><span style={{fontSize:12,color:"#7a9a8a"}}>{showFertil?"▲":"▼"}</span>
      </div>
      {showFertil&&<><div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>{statCard("💜","Pacientes activas",fertilActivas,"en programa","#7b2d8b")}{statCard("✅","Finalizadas",fertilFinalizadas,"completaron")}{statCard("💰","Ingresos Fértil",fmtMoney(fertilTotalIngresos),"total acumulado","#7b2d8b")}{statCard("🎫","Ticket promedio",fmtMoney(fertilTicketPromedio),"por paciente")}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#7b2d8b"}}>Ingresos Fértil por mes</h4>{last6Fertil.some(d=>d.value>0)?<BarChart data={last6Fertil} color="#7b2d8b" formatValue={v=>`$${Math.round(v/1000)}k`}/>:<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"30px 0"}}>Sin datos aún</p>}</div>
          <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#7b2d8b"}}>Estado de pagos</h4><div style={{display:"flex",gap:20,justifyContent:"center",padding:"20px 0"}}><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:"#52b788"}}>{fertilPagos}</div><div style={{fontSize:11,color:"#7a9a8a"}}>Pagos</div></div><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:"#f4a261"}}>{fc.filter(c=>c.paymentStatus==="parcial").length}</div><div style={{fontSize:11,color:"#7a9a8a"}}>Parciales</div></div><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:"#e76f51"}}>{fertilPendientes}</div><div style={{fontSize:11,color:"#7a9a8a"}}>Pendientes</div></div></div><div style={{fontSize:12,textAlign:"center",color:"#5a7a6a"}}>{fertilPctPago}% con pago completo</div></div>
        </div></>}
    </div>
  </div>);
}

// ─── CONSULTA FORM (reutilizable, con paciente opcional precargado) ───────────
function ConsultationForm({patients,onSave,onCancel,prefillPatientId}) {
  const [form,setForm]=useState({pacienteId:prefillPatientId||"",fecha:todayISO(),monto:"",tipo:"Primera consulta",obs:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.pacienteId&&form.fecha&&form.monto;
  const handleSave=()=>{const p=patients.find(x=>x.id===form.pacienteId);onSave({id:uid(),pacienteId:form.pacienteId,pacienteNombre:p?.nombre||"",fecha:form.fecha,monto:parseFloat(form.monto)||0,tipo:form.tipo,obs:form.obs});};
  return (<div style={S.card}><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>➕ Registrar consulta</h3>{!prefillPatientId&&<div style={{marginBottom:14}}><label style={S.label}>Paciente</label><select value={form.pacienteId} onChange={e=>set("pacienteId",e.target.value)} style={S.input}><option value="">Seleccioná un paciente...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha" type="date" value={form.fecha} onChange={v=>set("fecha",v)}/><Field label="Monto cobrado ($)" type="number" value={form.monto} onChange={v=>set("monto",v)} placeholder="5000"/></div><div style={{marginBottom:14}}><label style={S.label}>Tipo de consulta</label><select value={form.tipo} onChange={e=>set("tipo",e.target.value)} style={S.input}>{["Primera consulta","Seguimiento","Control","Consulta especial"].map(t=><option key={t}>{t}</option>)}</select></div><Field label="Observación (opcional)" value={form.obs} onChange={v=>set("obs",v)} placeholder="Notas sobre la consulta..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={handleSave} disabled={!valid} style={{...S.btnPrimary,flex:2,opacity:valid?1:.5}}>Guardar consulta</button></div></div>);
}

function PatientsStats({patients,consultas,fertilCases,appointments,onAddConsulta,onSelect}) {
  const [tab,setTab]=useState("pacientes");const [showConsultaForm,setShowConsultaForm]=useState(false);const [search,setSearch]=useState("");
  const filtered=patients.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>Pacientes y Estadísticas</h2><button onClick={()=>setShowConsultaForm(true)} style={S.btnPrimary}>+ Registrar consulta</button></div>{showConsultaForm&&<div style={{marginBottom:20}}><ConsultationForm patients={patients} onSave={c=>{onAddConsulta(c);setShowConsultaForm(false);}} onCancel={()=>setShowConsultaForm(false)}/></div>}<div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f4f1",borderRadius:10,padding:4}}>{[["pacientes","👥 Pacientes"],["stats","📊 Estadísticas"],["consultas","📋 Consultas"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",background:tab===id?"#fff":"transparent",color:tab===id?"#2d6a4f":"#5a7a6a",boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>))}</div>{tab==="pacientes"&&<div><input placeholder="🔍 Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:16}}/>{filtered.length===0?<p style={{color:"#aaa",textAlign:"center",padding:"40px 0",fontSize:14}}>No hay pacientes registrados</p>:filtered.map(p=>(<div key={p.id} style={{...S.card,marginBottom:12,display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{p.nombre.charAt(0).toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:15}}>{p.nombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{[p.edad&&`${p.edad} años`,p.objetivo].filter(Boolean).join(" · ")}{p.fechaCreacion&&` · Desde ${p.fechaCreacion}`}</div></div><div style={{display:"flex",gap:8,flexShrink:0}}><button onClick={()=>onSelect(p.id)} style={S.btnOutline}>Ver ficha</button></div></div>))}</div>}{tab==="stats"&&<StatsDashboard patients={patients} consultas={consultas} fertilCases={fertilCases} appointments={appointments}/>}{tab==="consultas"&&<div>{(!consultas||consultas.length===0)?<p style={{color:"#aaa",textAlign:"center",padding:"40px 0",fontSize:14}}>No hay consultas registradas aún</p>:[...consultas].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(c=>(<div key={c.id} style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:14}}><div style={{flex:1}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{c.pacienteNombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{c.tipo} · {new Date(c.fecha).toLocaleDateString("es-AR")}</div>{c.obs&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:2,fontStyle:"italic"}}>{c.obs}</div>}</div><div style={{fontWeight:700,fontSize:16,color:"#2d6a4f"}}>{fmtMoney(c.monto)}</div></div>))}</div>}</div>);
}

// ─── EVENTO FORM ──────────────────────────────────────────────────────────────
const EVENTO_TIPOS = [
  {id:"turno",label:"📅 Turno",color:"#2d6a4f"},
  {id:"seguimiento",label:"🔄 Seguimiento",color:"#e76f51"},
  {id:"recordatorio",label:"🔔 Recordatorio",color:"#f4a261"},
];

function EventForm({patients,onSave,onCancel,prefillPatientId,prefillDate,editEvento}) {
  const [form,setForm]=useState(editEvento?{
    pacienteId:editEvento.pacienteId||"",titulo:editEvento.titulo||"",tipo:editEvento.tipo||"seguimiento",
    fecha:editEvento.fecha||todayISO(),hora:editEvento.hora||"",descripcion:editEvento.descripcion||"",
    notificar:editEvento.notificar||false,notificarVia:editEvento.notificarVia||""
  }:{
    pacienteId:prefillPatientId||"",titulo:"",tipo:"seguimiento",
    fecha:prefillDate||todayISO(),hora:"",descripcion:"",notificar:false,notificarVia:""
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.titulo&&form.fecha;
  const handleSave=()=>{
    const p=patients.find(x=>x.id===form.pacienteId);
    onSave({
      id:editEvento?.id||uid(),pacienteId:form.pacienteId,pacienteNombre:p?.nombre||"",
      tipo:form.tipo,titulo:form.titulo,descripcion:form.descripcion,
      fecha:form.fecha,hora:form.hora,notificar:form.notificar,
      notificarVia:form.notificarVia,completado:editEvento?.completado||false
    });
  };
  return (<div style={S.card}><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:16}}>{editEvento?"✏️ Editar evento":"➕ Nuevo evento"}</h3>
    <Field label="Título *" value={form.titulo} onChange={v=>set("titulo",v)} placeholder="Ej: Seguimiento semanal, Control peso..."/>
    <div style={{marginBottom:14}}><label style={S.label}>Tipo de evento</label><div style={{display:"flex",gap:8,marginTop:5}}>{EVENTO_TIPOS.map(t=><button key={t.id} onClick={()=>set("tipo",t.id)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",border:form.tipo===t.id?`2px solid ${t.color}`:"2px solid #d8e8df",background:form.tipo===t.id?t.color+"18":"#f0f4f1",color:form.tipo===t.id?t.color:"#3a3a3a",fontFamily:"inherit",fontWeight:600}}>{t.label}</button>)}</div></div>
    {!prefillPatientId&&<div style={{marginBottom:14}}><label style={S.label}>Paciente (opcional)</label><select value={form.pacienteId} onChange={e=>set("pacienteId",e.target.value)} style={S.input}><option value="">Sin paciente asignado</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Fecha *" type="date" value={form.fecha} onChange={v=>set("fecha",v)}/>
      <Field label="Hora" type="time" value={form.hora} onChange={v=>set("hora",v)}/>
    </div>
    <Field label="Descripción (opcional)" value={form.descripcion} onChange={v=>set("descripcion",v)} placeholder="Notas sobre este evento..." rows={2}/>
    <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#1a3d2b",fontWeight:600}}>
        <input type="checkbox" checked={form.notificar} onChange={e=>set("notificar",e.target.checked)} style={{width:16,height:16,accentColor:"#2d6a4f"}}/>
        Notificar paciente
      </label>
      {form.notificar&&<div style={{display:"flex",gap:6}}>{["whatsapp","email"].map(v=><button key={v} onClick={()=>set("notificarVia",v)} style={{padding:"4px 12px",borderRadius:16,fontSize:11,cursor:"pointer",border:form.notificarVia===v?"2px solid #2d6a4f":"2px solid #d8e8df",background:form.notificarVia===v?"#2d6a4f":"#f0f4f1",color:form.notificarVia===v?"#fff":"#5a7a6a",fontFamily:"inherit",fontWeight:600}}>{v==="whatsapp"?"📱 WhatsApp":"📧 Email"}</button>)}</div>}
    </div>
    <div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={handleSave} disabled={!valid} style={{...S.btnPrimary,flex:2,opacity:valid?1:.5}}>{editEvento?"Guardar cambios":"Crear evento"}</button></div>
  </div>);
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function CalendarView({eventos,patients,appointments,onAddEvento,onUpdateEvento,onDeleteEvento,onSelectPatient,filterPatientId}) {
  const [currentDate,setCurrentDate]=useState(new Date());
  const [showForm,setShowForm]=useState(false);
  const [selectedDate,setSelectedDate]=useState(null);
  const [editingEvento,setEditingEvento]=useState(null);
  const [viewMode,setViewMode]=useState("month"); // month | list

  const year=currentDate.getFullYear();const month=currentDate.getMonth();
  const firstDay=new Date(year,month,1);const lastDay=new Date(year,month+1,0);
  const startDow=(firstDay.getDay()+6)%7; // Monday=0
  const daysInMonth=lastDay.getDate();
  const todayStr=todayISO();

  const filteredEventos=(eventos||[]).filter(e=>filterPatientId?e.pacienteId===filterPatientId:true);
  // Merge Fértil appointments into calendar
  const appointmentEvents=(appointments||[]).filter(a=>filterPatientId?a.patientId===filterPatientId:true).filter(a=>{const dt=new Date(a.startAt);return dt.getFullYear()>2020;}).map(a=>{const dt=new Date(a.startAt);const p=patients.find(x=>x.id===a.patientId);return{id:"appt-"+a.id,pacienteId:a.patientId,pacienteNombre:p?.nombre||"",tipo:"fertil",titulo:a.title,descripcion:a.notes||"",fecha:dt.toISOString().split("T")[0],hora:dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),completado:a.status==="realizada",_isAppointment:true};});
  const allEvents=[...filteredEventos,...appointmentEvents];

  const eventsByDate=useMemo(()=>{
    const map={};
    allEvents.forEach(e=>{if(e.fecha){if(!map[e.fecha])map[e.fecha]=[];map[e.fecha].push(e);}});
    return map;
  },[allEvents]);

  const monthEventos=allEvents.filter(e=>{
    if(!e.fecha) return false;
    const d=new Date(e.fecha+"T12:00:00");
    return d.getMonth()===month&&d.getFullYear()===year;
  }).sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.hora||"").localeCompare(b.hora||""));

  const prevMonth=()=>setCurrentDate(new Date(year,month-1,1));
  const nextMonth=()=>setCurrentDate(new Date(year,month+1,1));
  const goToday=()=>setCurrentDate(new Date());

  const getEventColor=(tipo)=>{if(tipo==="fertil") return "#7b2d8b";const t=EVENTO_TIPOS.find(x=>x.id===tipo);return t?t.color:"#7a9a8a";};

  const todayEventos=allEvents.filter(e=>e.fecha===todayStr&&!e.completado);
  const pendientes=allEvents.filter(e=>!e.completado&&e.fecha<todayStr);

  const handleToggleCompletado=(evento)=>{
    const updated={...evento,completado:!evento.completado};
    onUpdateEvento(updated);
  };

  const handleDeleteEvento=(id)=>{
    if(confirm("¿Eliminar este evento?")) onDeleteEvento(id);
  };

  const calendarCells=[];
  for(let i=0;i<startDow;i++) calendarCells.push(null);
  for(let d=1;d<=daysInMonth;d++) calendarCells.push(d);
  while(calendarCells.length%7!==0) calendarCells.push(null);

  const renderEventCard=(e,compact=false)=>{
    const color=getEventColor(e.tipo);
    return (<div key={e.id} style={{background:e.completado?"#f0f4f1":color+"12",borderLeft:`3px solid ${e.completado?"#ccc":color}`,borderRadius:8,padding:compact?"6px 8px":"10px 14px",marginBottom:compact?4:8,opacity:e.completado?.6:1,transition:"all .15s"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>handleToggleCompletado(e)} title={e.completado?"Marcar pendiente":"Marcar completado"} style={{width:18,height:18,borderRadius:4,border:`2px solid ${e.completado?"#aaa":color}`,background:e.completado?color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",padding:0,flexShrink:0}}>{e.completado?"✓":""}</button>
            <span style={{fontWeight:700,fontSize:compact?12:14,color:e.completado?"#999":"#1a3d2b",textDecoration:e.completado?"line-through":"none"}}>{e.titulo}</span>
          </div>
          {!compact&&<div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>
            {e.hora&&<span>{e.hora} · </span>}
            {e.pacienteNombre&&<span style={{cursor:onSelectPatient?"pointer":"default",textDecoration:onSelectPatient?"underline":"none"}} onClick={()=>onSelectPatient&&e.pacienteId&&onSelectPatient(e.pacienteId)}>{e.pacienteNombre}</span>}
            {!e.pacienteNombre&&<span style={{fontStyle:"italic"}}>Sin paciente</span>}
            {e.notificar&&<span> · {e.notificarVia==="whatsapp"?"📱":"📧"}</span>}
          </div>}
          {!compact&&e.descripcion&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:3,fontStyle:"italic"}}>{e.descripcion}</div>}
        </div>
        {!compact&&<div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>{setEditingEvento(e);setShowForm(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px"}}>✏️</button>
          <button onClick={()=>handleDeleteEvento(e.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px"}}>🗑</button>
        </div>}
      </div>
    </div>);
  };

  return (<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1a3d2b"}}>{filterPatientId?"📅 Agenda del paciente":"📅 Agenda"}</h2>
      <button onClick={()=>{setEditingEvento(null);setSelectedDate(null);setShowForm(true);}} style={S.btnPrimary}>+ Nuevo evento</button>
    </div>

    {/* Alertas de hoy y pendientes */}
    {(todayEventos.length>0||pendientes.length>0)&&<div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      {todayEventos.length>0&&<div style={{...S.card,flex:1,minWidth:200,borderLeft:"4px solid #2d6a4f",padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,color:"#2d6a4f",marginBottom:4}}>📌 Hoy tenés {todayEventos.length} evento{todayEventos.length>1?"s":""}</div>{todayEventos.slice(0,3).map(e=><div key={e.id} style={{fontSize:12,color:"#5a7a6a"}}>{e.hora&&`${e.hora} — `}{e.titulo}{e.pacienteNombre&&` (${e.pacienteNombre})`}</div>)}</div>}
      {pendientes.length>0&&<div style={{...S.card,flex:1,minWidth:200,borderLeft:"4px solid #e76f51",padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,color:"#e76f51",marginBottom:4}}>⚠️ {pendientes.length} evento{pendientes.length>1?"s":""} vencido{pendientes.length>1?"s":""}</div>{pendientes.slice(0,3).map(e=><div key={e.id} style={{fontSize:12,color:"#5a7a6a"}}>{new Date(e.fecha+"T12:00:00").toLocaleDateString("es-AR")} — {e.titulo}</div>)}</div>}
    </div>}

    {showForm&&<div style={{marginBottom:20}}><EventForm patients={patients} prefillPatientId={filterPatientId} prefillDate={selectedDate} editEvento={editingEvento} onSave={e=>{if(editingEvento){onUpdateEvento(e);}else{onAddEvento(e);}setShowForm(false);setEditingEvento(null);}} onCancel={()=>{setShowForm(false);setEditingEvento(null);}}/></div>}

    {/* Toggle vista */}
    <div style={{display:"flex",gap:4,marginBottom:16,background:"#f0f4f1",borderRadius:10,padding:4,maxWidth:240}}>
      {[["month","📅 Mes"],["list","📋 Lista"]].map(([id,label])=>(
        <button key={id} onClick={()=>setViewMode(id)} style={{flex:1,padding:"6px 10px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",background:viewMode===id?"#fff":"transparent",color:viewMode===id?"#2d6a4f":"#5a7a6a",boxShadow:viewMode===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>
      ))}
    </div>

    {viewMode==="month"&&<div>
      {/* Nav del mes */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{...S.btnGhost,padding:"6px 12px"}}>◀</button>
        <div style={{textAlign:"center"}}>
          <span style={{fontWeight:700,fontSize:16,color:"#1a3d2b"}}>{MESES_FULL[month]} {year}</span>
          <button onClick={goToday} style={{marginLeft:10,padding:"2px 10px",borderRadius:12,border:"1px solid #d8e8df",background:"#f5faf7",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"#2d6a4f",fontWeight:600}}>Hoy</button>
        </div>
        <button onClick={nextMonth} style={{...S.btnGhost,padding:"6px 12px"}}>▶</button>
      </div>

      {/* Grilla del calendario */}
      <div style={{...S.card,padding:12,overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,minWidth:560}}>
          {DIAS_SEMANA.map(d=><div key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#5a7a6a",textTransform:"uppercase"}}>{d}</div>)}
          {calendarCells.map((day,i)=>{
            if(day===null) return <div key={`empty-${i}`} style={{padding:4,minHeight:80,background:"#fafcfb",borderRadius:6}}/>;
            const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayEvents=eventsByDate[dateStr]||[];
            const isToday=dateStr===todayStr;
            const isPast=dateStr<todayStr;
            return (<div key={dateStr} onClick={()=>{setSelectedDate(dateStr);setEditingEvento(null);setShowForm(true);}} style={{padding:4,minHeight:80,background:isToday?"#e8f5ee":"#fff",borderRadius:6,cursor:"pointer",border:isToday?"2px solid #52b788":"1px solid #f0f4f1",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=isToday?"#d4edda":"#f5faf7"} onMouseLeave={e=>e.currentTarget.style.background=isToday?"#e8f5ee":"#fff"}>
              <div style={{fontSize:13,fontWeight:isToday?800:600,color:isToday?"#2d6a4f":isPast?"#aaa":"#1a3d2b",marginBottom:2,textAlign:"right",padding:"0 2px"}}>{day}</div>
              {dayEvents.slice(0,3).map(ev=>(<div key={ev.id} onClick={e=>{e.stopPropagation();setEditingEvento(ev);setShowForm(true);}} style={{fontSize:10,padding:"1px 4px",borderRadius:4,marginBottom:1,background:ev.completado?"#eee":getEventColor(ev.tipo)+"20",color:ev.completado?"#aaa":getEventColor(ev.tipo),fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:ev.completado?"line-through":"none",cursor:"pointer"}}>{ev.hora&&`${ev.hora} `}{ev.titulo}</div>))}
              {dayEvents.length>3&&<div style={{fontSize:9,color:"#7a9a8a",textAlign:"center"}}>+{dayEvents.length-3} más</div>}
            </div>);
          })}
        </div>
      </div>
    </div>}

    {viewMode==="list"&&<div>
      {monthEventos.length===0?<div style={{...S.card,textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:8}}>📅</div><p style={{color:"#7a9a8a",fontSize:14}}>No hay eventos en {MESES_FULL[month]}</p></div>:
      monthEventos.map(e=>renderEventCard(e))}
    </div>}
  </div>);
}

// ─── FÉRTIL MODULE ────────────────────────────────────────────────────────────
function FertilDashboard({fertilCases,patients,appointments,onSelectCase,onNewCase}){
  const activas=fertilCases.filter(c=>c.status==="activa");const now=new Date();const thisMonth=now.getMonth();const thisYear=now.getFullYear();
  const ingresosMes=fertilCases.filter(c=>{const d=new Date(c.createdAt);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}).reduce((s,c)=>s+(c.amountPaid||0),0);
  const totalAcumulado=fertilCases.reduce((s,c)=>s+(c.amountPaid||0),0);
  const nowISO=now.toISOString();const proximosTurnos=(appointments||[]).filter(a=>a.programType==="fertil"&&a.status==="programada"&&a.startAt>nowISO).sort((a,b)=>a.startAt.localeCompare(b.startAt)).slice(0,5);
  const alertas=[];activas.forEach(c=>{if(c.paymentStatus==="pendiente"){const pName=patients.find(p=>p.id===c.patientId);alertas.push({type:"pago",msg:(pName?pName.nombre:"Paciente")+" - pago pendiente",caseId:c.id});}});
  const renderTurno=(a)=>{const p=patients.find(x=>x.id===a.patientId);const pName=p&&p.nombre?p.nombre:"Paciente";return(<div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f0f4f1"}}><div style={{width:28,height:28,borderRadius:"50%",background:"#f3e5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{"💜"}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#1a3d2b"}}>{pName}</div><div style={{fontSize:11,color:"#7a9a8a"}}>{a.title+" · "+fmtDateTime(a.startAt)}</div></div></div>);};
  const statCard=(icon,label,value,sub,color="#7b2d8b")=>(<div style={{...S.card,flex:1,minWidth:130}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontSize:20,fontWeight:700,color}}>{value}</div><div style={{fontSize:11,fontWeight:600,color:"#1a3d2b",marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:"#7a9a8a",marginTop:1}}>{sub}</div>}</div>);
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>💜</span><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#7b2d8b"}}>Programa Fértil</h2></div><button onClick={onNewCase} style={S.btnFertil}>+ Nueva paciente Fértil</button></div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>{statCard("👩","Activas",activas.length,"en programa")}{statCard("✅","Finalizadas",fertilCases.filter(c=>c.status==="finalizada").length,"completaron")}{statCard("💰","Ingresos del mes",fmtMoney(ingresosMes),"programa Fértil")}{statCard("📊","Total acumulado",fmtMoney(totalAcumulado),"histórico")}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#7b2d8b"}}>{"📅 Próximos turnos Fértil"}</h4>{proximosTurnos.length===0?<p style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"20px 0"}}>Sin turnos programados</p>:proximosTurnos.map(renderTurno)}</div>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#e76f51"}}>⚠️ Alertas</h4>{alertas.length===0?<p style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"20px 0"}}>Sin alertas</p>:alertas.map((a,i)=>(<div key={i} onClick={()=>onSelectCase(a.caseId)} style={{padding:"8px 10px",background:"#fff5f0",borderRadius:8,marginBottom:6,fontSize:12,color:"#c0392b",cursor:"pointer",fontWeight:600}}>{a.msg}</div>))}</div>
    </div>
  </div>);
}

function FertilPatientList({fertilCases,patients,appointments,onSelectCase}){
  const [search,setSearch]=useState("");const [filterStatus,setFilterStatus]=useState("all");
  const filtered=fertilCases.filter(c=>{if(filterStatus!=="all"&&c.status!==filterStatus)return false;const p=patients.find(x=>x.id===c.patientId);if(search&&p&&!p.nombre.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  const renderCase=(c)=>{
    const p=patients.find(x=>x.id===c.patientId);
    const caseAppts=(appointments||[]).filter(a=>a.fertilCaseId===c.id);
    const realized=caseAppts.filter(a=>a.status==="realizada").length;
    const nextAppt=caseAppts.filter(a=>a.status==="programada"&&a.startAt>new Date().toISOString()).sort((a,b)=>a.startAt.localeCompare(b.startAt))[0];
    const pName=p&&p.nombre?p.nombre:"Paciente";
    const pInitial=p&&p.nombre?p.nombre.charAt(0):"?";
    return(<div key={c.id} onClick={()=>onSelectCase(c.id)} style={{...S.card,marginBottom:10,cursor:"pointer",borderLeft:"4px solid "+(FERTIL_STATUS_COLORS[c.status]||"#aaa"),transition:"box-shadow .2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(123,45,139,.12)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 16px rgba(45,106,79,.08)";}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#7b2d8b,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{pInitial}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{pName}</span><Badge label={FERTIL_STATUS_LABELS[c.status]} color={(FERTIL_STATUS_COLORS[c.status]||"#aaa")+"22"} text={FERTIL_STATUS_COLORS[c.status]||"#aaa"}/><Badge label={FERTIL_PAYMENT_LABELS[c.paymentStatus]} color={(FERTIL_PAYMENT_COLORS[c.paymentStatus]||"#aaa")+"22"} text={FERTIL_PAYMENT_COLORS[c.paymentStatus]||"#aaa"}/></div>
          <div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>{"Semana "+c.currentWeek+"/8 · "+realized+"/5 consultas · "+fmtMoney(c.amountPaid)+"/"+fmtMoney(c.totalPrice)+(nextAppt?" · Próx: "+fmtDateTime(nextAppt.startAt):"")}</div>
        </div>
        <span style={{color:"#a855f7",fontSize:20}}>{"›"}</span>
      </div>
    </div>);
  };
  const statusButtons=[["all","Todas"],["activa","Activas"],["lead","Leads"],["pausada","Pausadas"],["finalizada","Finalizadas"]];
  return(<div>
    <input placeholder="Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:12}}/>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{statusButtons.map(function(item){var k=item[0];var lab=item[1];return(<button key={k} onClick={function(){setFilterStatus(k);}} style={{padding:"5px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:filterStatus===k?"2px solid #7b2d8b":"2px solid #d8e8df",background:filterStatus===k?"#7b2d8b":"#f0f4f1",color:filterStatus===k?"#fff":"#5a7a6a",fontFamily:"inherit",fontWeight:600}}>{lab}</button>);})}</div>
    {filtered.length===0?<p style={{color:"#aaa",textAlign:"center",padding:"40px 0",fontSize:13}}>No hay pacientes Fértil</p>:filtered.map(renderCase)}
  </div>);
}

function FertilNewCase({patients,fertilCases,onSave,onCancel}){
  const availablePatients=patients.filter(p=>!fertilCases.some(c=>c.patientId===p.id&&(c.status==="activa"||c.status==="lead")));
  const [form,setForm]=useState({patientId:"",mainCondition:"",objective:"",notes:"",totalPrice:"",paymentMethod:"transferencia",installments:"1"});const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.patientId&&form.totalPrice;
  return(<div style={{maxWidth:560}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><button onClick={onCancel} style={S.btnGhost}>← Volver</button><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#7b2d8b"}}>💜 Nueva paciente Fértil</h2></div>
    <div style={S.card}>
      <div style={{marginBottom:14}}><label style={S.label}>Paciente *</label><select value={form.patientId} onChange={e=>set("patientId",e.target.value)} style={S.input}><option value="">Seleccioná una paciente...</option>{availablePatients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
      <Field label="Condición principal" value={form.mainCondition} onChange={v=>set("mainCondition",v)} placeholder="Ej: SOP, endometriosis, buscando embarazo..."/>
      <Field label="Objetivo del programa" value={form.objective} onChange={v=>set("objective",v)} placeholder="Ej: Mejorar fertilidad, regular ciclo..." rows={2}/>
      <Field label="Notas" value={form.notes} onChange={v=>set("notes",v)} placeholder="Observaciones iniciales..." rows={2}/>
      <div style={{borderTop:"2px solid #f3e5f5",paddingTop:16,marginTop:8,marginBottom:14}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:"#7b2d8b"}}>💰 Datos de pago</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Precio del programa ($) *" type="number" value={form.totalPrice} onChange={v=>set("totalPrice",v)} placeholder="200000"/><div style={{marginBottom:14}}><label style={S.label}>Método de pago</label><select value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)} style={S.input}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mp">Mercado Pago</option></select></div></div>
        <Field label="Cuotas" type="number" value={form.installments} onChange={v=>set("installments",v)} placeholder="1"/>
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!valid} onClick={()=>{const caseId=uid();const newCase={id:caseId,patientId:form.patientId,status:"activa",startDate:todayISO(),currentWeek:1,mainCondition:form.mainCondition,objective:form.objective,notes:form.notes,totalPrice:parseFloat(form.totalPrice)||0,paymentStatus:"pendiente",paymentMethod:form.paymentMethod,installments:parseInt(form.installments)||1,amountPaid:0,createdAt:new Date().toISOString()};const appts=FERTIL_CONSULT_TYPES.map(ct=>({id:uid(),patientId:form.patientId,fertilCaseId:caseId,programType:"fertil",consultationNumber:ct.num,consultationType:ct.type,title:`Fértil - ${ct.label}`,startAt:new Date().toISOString(),endAt:null,status:"programada",notes:""}));onSave(newCase,appts);}} style={{...S.btnFertil,flex:2,opacity:valid?1:.5}}>Crear caso y generar consultas</button></div>
    </div>
  </div>);
}

function FertilCaseDetail({fertilCase,patient,appointments,followups,labs,tasks,patients,allAppointments,dispatch,onUpdateCase,onUpdateAppointment,onAddFollowup,onAddLab,onAddTask,onUpdateTask,onDeleteTask,onBack,onGoToPatient}){
  const [tab,setTab]=useState("resumen");const fc=fertilCase;
  const caseAppts=(appointments||[]).filter(a=>a.fertilCaseId===fc.id).sort((a,b)=>(a.consultationNumber||0)-(b.consultationNumber||0));
  const caseFollowups=(followups||[]).filter(f=>f.fertilCaseId===fc.id);const caseLabs=(labs||[]).filter(l=>l.fertilCaseId===fc.id);const caseTasks=(tasks||[]).filter(t=>t.fertilCaseId===fc.id);
  const [payForm,setPayForm]=useState({amount:"",method:fc.paymentMethod||"transferencia"});const [showPayForm,setShowPayForm]=useState(false);
  const [scheduleAppt,setScheduleAppt]=useState(null);const [schedForm,setSchedForm]=useState({date:"",time:""});
  const [showFollowupForm,setShowFollowupForm]=useState(false);const [ffForm,setFfForm]=useState({weekNumber:fc.currentWeek,date:todayISO(),weight:"",symptoms:"",mood:"",sleepQuality:"",digestion:"",adherence:"",notes:""});
  const [showLabForm,setShowLabForm]=useState(false);const [labForm,setLabForm]=useState({date:todayISO(),labType:"",results:"",notes:""});
  const [newTaskTitle,setNewTaskTitle]=useState("");
  const checkConflict=(date,time)=>{if(!date||!time)return false;const startAt=new Date(`${date}T${time}`);const endAt=new Date(startAt.getTime()+3600000);return(allAppointments||[]).some(a=>{if(a.id===scheduleAppt?.id||a.status==="cancelada")return false;const aS=new Date(a.startAt);const aE=a.endAt?new Date(a.endAt):new Date(aS.getTime()+3600000);return startAt<aE&&endAt>aS;});};
  const hasConflict=scheduleAppt&&schedForm.date&&schedForm.time?checkConflict(schedForm.date,schedForm.time):false;
  const tabs=[["resumen","📋 Resumen"],["pago","💰 Pago"],["consultas","📅 Consultas"],["seguimientos","📝 Seguimientos"],["analisis","🔬 Análisis"],["tareas","✅ Tareas"]];
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}><button onClick={onBack} style={S.btnGhost}>← Volver</button><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>💜</span><h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#7b2d8b"}}>{patient?.nombre||"Paciente"}</h2><Badge label={FERTIL_STATUS_LABELS[fc.status]} color={FERTIL_STATUS_COLORS[fc.status]+"22"} text={FERTIL_STATUS_COLORS[fc.status]}/></div><div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>Semana {fc.currentWeek}/8 · Inicio: {fmtDate(fc.startDate)}</div></div>
      <div style={{display:"flex",gap:6}}><button onClick={()=>onGoToPatient(fc.patientId)} style={S.btnOutline}>Ver ficha completa</button>{fc.status==="activa"&&<select value={fc.currentWeek} onChange={e=>onUpdateCase({...fc,currentWeek:parseInt(e.target.value)})} style={{...S.input,width:110,fontSize:12}}>{[1,2,3,4,5,6,7,8].map(w=><option key={w} value={w}>Semana {w}</option>)}</select>}<select value={fc.status} onChange={e=>onUpdateCase({...fc,status:e.target.value})} style={{...S.input,width:110,fontSize:12}}>{Object.entries(FERTIL_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
    </div>
    <div style={{display:"flex",gap:4,marginBottom:20,background:"#f5f0f7",borderRadius:10,padding:4,overflowX:"auto"}}>{tabs.map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:"0 0 auto",padding:"8px 14px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",background:tab===id?"#fff":"transparent",color:tab===id?"#7b2d8b":"#5a7a6a",boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>))}</div>

    {tab==="resumen"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={S.card}><h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#7b2d8b"}}>Datos del caso</h4><div style={{fontSize:13,color:"#1a3d2b",lineHeight:2}}><div><strong>Condición:</strong> {fc.mainCondition||"—"}</div><div><strong>Objetivo:</strong> {fc.objective||"—"}</div><div><strong>Semana:</strong> {fc.currentWeek}/8</div><div><strong>Consultas:</strong> {caseAppts.filter(a=>a.status==="realizada").length}/5</div>{fc.notes&&<div><strong>Notas:</strong> {fc.notes}</div>}</div></div><div style={S.card}><h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#7b2d8b"}}>💰 Resumen de pago</h4><div style={{fontSize:13,color:"#1a3d2b",lineHeight:2}}><div><strong>Total:</strong> {fmtMoney(fc.totalPrice)}</div><div><strong>Pagado:</strong> <span style={{color:"#52b788",fontWeight:700}}>{fmtMoney(fc.amountPaid)}</span></div><div><strong>Restante:</strong> <span style={{color:fc.totalPrice-fc.amountPaid>0?"#e76f51":"#52b788",fontWeight:700}}>{fmtMoney(fc.totalPrice-fc.amountPaid)}</span></div><div><strong>Estado:</strong> <Badge label={FERTIL_PAYMENT_LABELS[fc.paymentStatus]} color={FERTIL_PAYMENT_COLORS[fc.paymentStatus]+"22"} text={FERTIL_PAYMENT_COLORS[fc.paymentStatus]}/></div></div></div></div>}

    {tab==="pago"&&<div style={{maxWidth:480}}><div style={{...S.card,borderLeft:"4px solid #7b2d8b",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:16}}><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Precio total</div><div style={{fontSize:24,fontWeight:700,color:"#1a3d2b"}}>{fmtMoney(fc.totalPrice)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Pagado</div><div style={{fontSize:24,fontWeight:700,color:"#52b788"}}>{fmtMoney(fc.amountPaid)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Restante</div><div style={{fontSize:24,fontWeight:700,color:fc.totalPrice-fc.amountPaid>0?"#e76f51":"#52b788"}}>{fmtMoney(fc.totalPrice-fc.amountPaid)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Estado</div><div style={{marginTop:6}}><Badge label={FERTIL_PAYMENT_LABELS[fc.paymentStatus]} color={FERTIL_PAYMENT_COLORS[fc.paymentStatus]+"22"} text={FERTIL_PAYMENT_COLORS[fc.paymentStatus]}/></div></div></div><div style={{fontSize:12,color:"#7a9a8a"}}>Método: {fc.paymentMethod||"—"} · Cuotas: {fc.installments||1}</div></div>
      <button onClick={()=>setShowPayForm(!showPayForm)} style={S.btnFertil}>💰 Registrar pago</button>
      {showPayForm&&<div style={{...S.card,marginTop:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Monto ($)" type="number" value={payForm.amount} onChange={v=>setPayForm(f=>({...f,amount:v}))} placeholder="50000"/><div style={{marginBottom:14}}><label style={S.label}>Método</label><select value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))} style={S.input}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mp">Mercado Pago</option></select></div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setShowPayForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!payForm.amount} onClick={()=>{const newPaid=(fc.amountPaid||0)+parseFloat(payForm.amount);const newStatus=newPaid>=fc.totalPrice?"pago":newPaid>0?"parcial":"pendiente";onUpdateCase({...fc,amountPaid:newPaid,paymentStatus:newStatus,paymentMethod:payForm.method});setPayForm({amount:"",method:fc.paymentMethod});setShowPayForm(false);}} style={{...S.btnFertil,flex:2,opacity:payForm.amount?1:.5}}>Registrar</button></div></div>}
    </div>}

    {tab==="consultas"&&<div>
      {caseAppts.map(function(a){
        var createdRecently=Math.abs(new Date(a.startAt).getTime()-new Date(fc.createdAt).getTime())<60000;
        var effectivelyScheduled=new Date(a.startAt).getFullYear()>2020&&!createdRecently;
        var borderColor=a.status==="realizada"?"#52b788":a.status==="cancelada"?"#ccc":"#7b2d8b";
        var badgeLabel=a.status==="realizada"?"✓ Realizada":a.status==="cancelada"?"Cancelada":effectivelyScheduled?"Programada":"Pendiente";
        var badgeColor=a.status==="realizada"?"#e8f5ee":a.status==="cancelada"?"#f0f0f0":effectivelyScheduled?"#f3e5f5":"#fff5f0";
        var badgeText=a.status==="realizada"?"#52b788":a.status==="cancelada"?"#aaa":effectivelyScheduled?"#7b2d8b":"#e76f51";
        return(<div key={a.id} style={{...S.card,marginBottom:10,borderLeft:"4px solid "+borderColor}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{a.title}</span><Badge label={badgeLabel} color={badgeColor} text={badgeText}/></div>{effectivelyScheduled&&<div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>{fmtDateTime(a.startAt)}</div>}</div>
          <div style={{display:"flex",gap:6}}>{a.status!=="realizada"&&<button onClick={function(){setScheduleAppt(a);setSchedForm({date:effectivelyScheduled?new Date(a.startAt).toISOString().split("T")[0]:"",time:effectivelyScheduled?new Date(a.startAt).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",hour12:false}):""});}} style={{...S.btnGhost,fontSize:11,padding:"5px 10px"}}>{effectivelyScheduled?"Reprogramar":"Programar"}</button>}{a.status==="programada"&&<button onClick={function(){onUpdateAppointment({...a,status:"realizada"});}} style={{...S.btnGhost,fontSize:11,padding:"5px 10px",background:"#e8f5ee",color:"#2d6a4f"}}>{"✓ Realizada"}</button>}</div>
        </div>{a.notes&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:6,fontStyle:"italic"}}>{a.notes}</div>}</div>);
      })}
      {scheduleAppt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:400,width:"90%"}}><h3 style={{margin:"0 0 16px",color:"#7b2d8b",fontSize:16}}>{"📅 "+scheduleAppt.title}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha *" type="date" value={schedForm.date} onChange={v=>setSchedForm(f=>({...f,date:v}))}/><Field label="Hora *" type="time" value={schedForm.time} onChange={v=>setSchedForm(f=>({...f,time:v}))}/></div>{hasConflict&&<div style={{background:"#fff5f0",border:"1px solid #f5c6c6",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#c0392b",fontWeight:600}}>{"⚠️ Hay un conflicto de horario con otro turno"}</div>}<div style={{display:"flex",gap:10}}><button onClick={()=>setScheduleAppt(null)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!schedForm.date||!schedForm.time||hasConflict} onClick={()=>{const sAt=new Date(schedForm.date+"T"+schedForm.time).toISOString();const eAt=new Date(new Date(schedForm.date+"T"+schedForm.time).getTime()+3600000).toISOString();onUpdateAppointment({...scheduleAppt,startAt:sAt,endAt:eAt,status:"programada"});setScheduleAppt(null);}} style={{...S.btnFertil,flex:2,opacity:(!schedForm.date||!schedForm.time||hasConflict)?0.5:1}}>Confirmar</button></div></div></div>}
    </div>}

    {tab==="seguimientos"&&<div>
      <button onClick={()=>setShowFollowupForm(!showFollowupForm)} style={{...S.btnFertil,marginBottom:16}}>+ Nuevo seguimiento</button>
      {showFollowupForm&&<div style={{...S.card,marginBottom:16}}><h4 style={{margin:"0 0 12px",color:"#7b2d8b"}}>📝 Registrar seguimiento</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><div style={{marginBottom:14}}><label style={S.label}>Semana</label><select value={ffForm.weekNumber} onChange={e=>setFfForm(f=>({...f,weekNumber:parseInt(e.target.value)}))} style={S.input}>{[1,2,3,4,5,6,7,8].map(w=><option key={w} value={w}>Semana {w}</option>)}</select></div><Field label="Fecha" type="date" value={ffForm.date} onChange={v=>setFfForm(f=>({...f,date:v}))}/><Field label="Peso (kg)" type="number" value={ffForm.weight} onChange={v=>setFfForm(f=>({...f,weight:v}))} placeholder="65"/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Síntomas" value={ffForm.symptoms} onChange={v=>setFfForm(f=>({...f,symptoms:v}))} placeholder="Hinchazón, cansancio..." rows={2}/><Field label="Estado de ánimo" value={ffForm.mood} onChange={v=>setFfForm(f=>({...f,mood:v}))} placeholder="Bien, ansiosa..."/><Field label="Sueño" value={ffForm.sleepQuality} onChange={v=>setFfForm(f=>({...f,sleepQuality:v}))} placeholder="Bueno, regular..."/><Field label="Digestión" value={ffForm.digestion} onChange={v=>setFfForm(f=>({...f,digestion:v}))} placeholder="Normal, constipación..."/></div><Field label="Adherencia al plan" value={ffForm.adherence} onChange={v=>setFfForm(f=>({...f,adherence:v}))} placeholder="Buena, parcial..."/><Field label="Notas" value={ffForm.notes} onChange={v=>setFfForm(f=>({...f,notes:v}))} placeholder="Observaciones..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={()=>setShowFollowupForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onAddFollowup({id:uid(),fertilCaseId:fc.id,...ffForm,weight:parseFloat(ffForm.weight)||null});setShowFollowupForm(false);setFfForm({weekNumber:fc.currentWeek,date:todayISO(),weight:"",symptoms:"",mood:"",sleepQuality:"",digestion:"",adherence:"",notes:""});}} style={{...S.btnFertil,flex:2}}>Guardar</button></div></div>}
      {caseFollowups.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin seguimientos registrados</p>:caseFollowups.sort((a,b)=>b.weekNumber-a.weekNumber||new Date(b.date)-new Date(a.date)).map(f=>(<div key={f.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #7b2d8b"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:700,color:"#7b2d8b",fontSize:13}}>Semana {f.weekNumber}</span><span style={{fontSize:12,color:"#7a9a8a"}}>{fmtDate(f.date)}</span></div><div style={{fontSize:12,color:"#1a3d2b",lineHeight:1.8}}>{f.weight&&<div>Peso: {f.weight} kg</div>}{f.symptoms&&<div>Síntomas: {f.symptoms}</div>}{f.mood&&<div>Ánimo: {f.mood}</div>}{f.sleepQuality&&<div>Sueño: {f.sleepQuality}</div>}{f.digestion&&<div>Digestión: {f.digestion}</div>}{f.adherence&&<div>Adherencia: {f.adherence}</div>}{f.notes&&<div style={{fontStyle:"italic",color:"#5a7a6a",marginTop:4}}>{f.notes}</div>}</div></div>))}
    </div>}

    {tab==="analisis"&&<div>
      <button onClick={()=>setShowLabForm(!showLabForm)} style={{...S.btnFertil,marginBottom:16}}>+ Nuevo análisis</button>
      {showLabForm&&<div style={{...S.card,marginBottom:16}}><h4 style={{margin:"0 0 12px",color:"#7b2d8b"}}>🔬 Registrar análisis</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha" type="date" value={labForm.date} onChange={v=>setLabForm(f=>({...f,date:v}))}/><Field label="Tipo de análisis" value={labForm.labType} onChange={v=>setLabForm(f=>({...f,labType:v}))} placeholder="Hormonal, hemograma..."/></div><Field label="Resultados" value={labForm.results} onChange={v=>setLabForm(f=>({...f,results:v}))} placeholder="Valores relevantes..." rows={3}/><Field label="Notas" value={labForm.notes} onChange={v=>setLabForm(f=>({...f,notes:v}))} placeholder="Observaciones..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={()=>setShowLabForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onAddLab({id:uid(),fertilCaseId:fc.id,...labForm});setShowLabForm(false);setLabForm({date:todayISO(),labType:"",results:"",notes:""});}} style={{...S.btnFertil,flex:2}}>Guardar</button></div></div>}
      {caseLabs.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin análisis registrados</p>:caseLabs.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>(<div key={l.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #a855f7"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:700,color:"#7b2d8b",fontSize:13}}>{l.labType||"Análisis"}</span><span style={{fontSize:12,color:"#7a9a8a"}}>{fmtDate(l.date)}</span></div>{l.results&&<div style={{fontSize:12,color:"#1a3d2b",whiteSpace:"pre-wrap",marginBottom:4}}>{l.results}</div>}{l.notes&&<div style={{fontSize:12,color:"#5a7a6a",fontStyle:"italic"}}>{l.notes}</div>}</div>))}
    </div>}

    {tab==="tareas"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:16}}><input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="Nueva tarea..." style={{...S.input,flex:1}} onKeyDown={e=>{if(e.key==="Enter"&&newTaskTitle.trim()){onAddTask({id:uid(),fertilCaseId:fc.id,title:newTaskTitle.trim(),done:false,dueDate:null});setNewTaskTitle("");}}}/><button disabled={!newTaskTitle.trim()} onClick={()=>{onAddTask({id:uid(),fertilCaseId:fc.id,title:newTaskTitle.trim(),done:false,dueDate:null});setNewTaskTitle("");}} style={{...S.btnFertil,opacity:newTaskTitle.trim()?1:.5}}>+ Agregar</button></div>
      {caseTasks.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin tareas</p>:caseTasks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:t.done?"#f8f8f8":"#fff",borderRadius:10,marginBottom:6,border:"1px solid #f0f4f1"}}><button onClick={()=>onUpdateTask({...t,done:!t.done})} style={{width:20,height:20,borderRadius:4,border:`2px solid ${t.done?"#52b788":"#7b2d8b"}`,background:t.done?"#52b788":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",padding:0,flexShrink:0}}>{t.done?"✓":""}</button><span style={{flex:1,fontSize:13,color:t.done?"#aaa":"#1a3d2b",textDecoration:t.done?"line-through":"none"}}>{t.title}</span><button onClick={()=>onDeleteTask(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:"#ccc"}}>✕</button></div>))}
    </div>}
  </div>);
}

function FertilModule({state,dispatch,patients,onGoToPatient}){
  const [subScreen,setSubScreen]=useState("dashboard");const [selectedCaseId,setSelectedCaseId]=useState(null);const [subTab,setSubTab]=useState("dashboard");
  const fertilCases=state.fertilCases||[];const appointments=state.appointments||[];const followups=state.fertilFollowups||[];const labs=state.fertilLabs||[];const tasks=state.fertilTasks||[];
  const selectedCase=fertilCases.find(c=>c.id===selectedCaseId);const selectedPatient=selectedCase?patients.find(p=>p.id===selectedCase.patientId):null;

  if(subScreen==="new-case")return<FertilNewCase patients={patients} fertilCases={fertilCases} onSave={async(newCase,appts)=>{dispatch({type:"ADD_FERTIL_CASE",c:newCase});await sbUpsertFertilCase(newCase);for(const a of appts){dispatch({type:"ADD_APPOINTMENT",a});await sbUpsertAppointment(a);}setSubScreen("dashboard");}} onCancel={()=>setSubScreen("dashboard")}/>;

  if(subScreen==="case-detail"&&selectedCase)return<FertilCaseDetail fertilCase={selectedCase} patient={selectedPatient} appointments={appointments} followups={followups} labs={labs} tasks={tasks} patients={patients} allAppointments={appointments} dispatch={dispatch}
    onUpdateCase={async c=>{dispatch({type:"UPDATE_FERTIL_CASE",c});await sbUpsertFertilCase(c);}}
    onUpdateAppointment={async a=>{dispatch({type:"UPDATE_APPOINTMENT",a});await sbUpdateAppointment(a);}}
    onAddFollowup={async f=>{dispatch({type:"ADD_FERTIL_FOLLOWUP",f});await sbInsertFertilFollowup(f);}}
    onAddLab={async l=>{dispatch({type:"ADD_FERTIL_LAB",l});await sbInsertFertilLab(l);}}
    onAddTask={async t=>{dispatch({type:"ADD_FERTIL_TASK",t});await sbInsertFertilTask(t);}}
    onUpdateTask={async t=>{dispatch({type:"UPDATE_FERTIL_TASK",t});await sbUpdateFertilTask(t);}}
    onDeleteTask={async id=>{dispatch({type:"DELETE_FERTIL_TASK",id});await sbDeleteFertilTask(id);}}
    onBack={()=>setSubScreen("dashboard")} onGoToPatient={onGoToPatient}/>;

  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:20,background:"#f5f0f7",borderRadius:10,padding:4}}>{[["dashboard","📊 Dashboard"],["pacientes","👩 Pacientes"]].map(([id,label])=>(<button key={id} onClick={()=>setSubTab(id)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",background:subTab===id?"#fff":"transparent",color:subTab===id?"#7b2d8b":"#5a7a6a",boxShadow:subTab===id?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>))}</div>
    {subTab==="dashboard"&&<FertilDashboard fertilCases={fertilCases} patients={patients} appointments={appointments} onSelectCase={id=>{setSelectedCaseId(id);setSubScreen("case-detail");}} onNewCase={()=>setSubScreen("new-case")}/>}
    {subTab==="pacientes"&&<><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#7b2d8b"}}>Pacientes Fértil</h3><button onClick={()=>setSubScreen("new-case")} style={S.btnFertil}>+ Nueva paciente</button></div><FertilPatientList fertilCases={fertilCases} patients={patients} appointments={appointments} onSelectCase={id=>{setSelectedCaseId(id);setSubScreen("case-detail");}}/></>}
  </div>);
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

// ─── PATIENT DETAIL (con pestaña Consultas + Agenda + consultas en Timeline) ──
function PatientDetail({patient,dispatch,consultas,eventos,appointments,onAddConsulta,onAddEvento,onUpdateEvento,onDeleteEvento,onGeneratePlan,onBack,onDelete}) {
  const [tab,setTab]=useState("clinica");const [clinica,setClinica]=useState(patient.clinica||initialClinica);const [clinicaSaved,setClinicaSaved]=useState(false);const [newMedicion,setNewMedicion]=useState({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});const [newNota,setNewNota]=useState("");const [showMedForm,setShowMedForm]=useState(false);const [viewingPlan,setViewingPlan]=useState(null);const [deleteConfirm,setDeleteConfirm]=useState(false);const [showConsultaForm,setShowConsultaForm]=useState(false);
  const setC=(k,v)=>setClinica(c=>({...c,[k]:v}));
  const saveClinica=()=>{dispatch({type:"UPDATE_CLINICA",pid:patient.id,clinica});setClinicaSaved(true);setTimeout(()=>setClinicaSaved(false),2000);};
  const addMedicion=()=>{const m={id:uid(),...newMedicion,imc:calcIMC(newMedicion.peso,patient.altura)};dispatch({type:"ADD_MEDICION",pid:patient.id,m});setNewMedicion({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});setShowMedForm(false);};
  const addNota=()=>{if(!newNota.trim())return;dispatch({type:"ADD_NOTA",pid:patient.id,n:{id:uid(),fecha:today(),texto:newNota}});setNewNota("");};

  // Consultas de este paciente
  const patientConsultas = (consultas||[]).filter(c=>c.pacienteId===patient.id);
  const totalCobrado = patientConsultas.reduce((s,c)=>s+(parseFloat(c.monto)||0),0);

  const tabs=[["clinica","📋 Clínica"],["antrop","📏 Antropometría"],["evol","📝 Evolución"],["planes","🥗 Planes"],["consultas","💰 Consultas"],["agenda","📅 Agenda"],["timeline","⏱ Timeline"]];

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

  {tab==="agenda"&&<CalendarView eventos={eventos} patients={[patient]} appointments={appointments} filterPatientId={patient.id} onAddEvento={onAddEvento} onUpdateEvento={onUpdateEvento} onDeleteEvento={onDeleteEvento}/>}

  {tab==="timeline"&&<div>{[
    ...(patient.planes||[]).map(x=>({...x,_tipo:"plan",icon:"🥗",color:"#2d6a4f"})),
    ...(patient.mediciones||[]).map(x=>({...x,_tipo:"med",icon:"📏",color:"#52b788",fecha:x.fecha})),
    ...(patient.notas||[]).map(x=>({...x,_tipo:"nota",icon:"📝",color:"#74c69d"})),
    ...patientConsultas.map(x=>({...x,_tipo:"consulta",icon:"💰",color:"#f4a261",fecha:x.fecha})),
    ...((eventos||[]).filter(e=>e.pacienteId===patient.id)).map(x=>({...x,_tipo:"evento",icon:x.tipo==="turno"?"📅":x.tipo==="seguimiento"?"🔄":"🔔",color:x.tipo==="turno"?"#2d6a4f":x.tipo==="seguimiento"?"#e76f51":"#f4a261"})),
  ].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((item,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:14}}><div style={{width:36,height:36,borderRadius:"50%",background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.icon}</div><div style={{...S.card,flex:1,padding:14}}><div style={{fontSize:11,color:"#7a9a8a",marginBottom:4,fontWeight:600}}>{typeof item.fecha==="string"&&item.fecha.includes("-")?new Date(item.fecha+"T12:00:00").toLocaleDateString("es-AR"):item.fecha}</div>{item._tipo==="plan"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Plan generado</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.objetivo}</div></>}{item._tipo==="med"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Medición registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>Peso: {item.peso}kg · IMC: {item.imc}</div></>}{item._tipo==="nota"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Nota de evolución</div><div style={{fontSize:13,color:"#5a7a6a",marginTop:2}}>{item.texto}</div></>}{item._tipo==="consulta"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Consulta registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.tipo_consulta||item.tipo} · {fmtMoney(item.monto)}</div>{item.obs&&<div style={{fontSize:12,color:"#7a9a8a",fontStyle:"italic",marginTop:2}}>{item.obs}</div>}</>}{item._tipo==="evento"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{item.titulo}</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.tipo==="turno"?"Turno":item.tipo==="seguimiento"?"Seguimiento":"Recordatorio"}{item.hora&&` · ${item.hora}`}{item.completado?" · ✓ Completado":""}</div>{item.descripcion&&<div style={{fontSize:12,color:"#7a9a8a",fontStyle:"italic",marginTop:2}}>{item.descripcion}</div>}</>}</div></div>))}</div>}

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
  const [state,dispatch]=useReducer(reducer,{patients:[],consultas:[],eventos:[],fertilCases:[],appointments:[],fertilFollowups:[],fertilLabs:[],fertilTasks:[]});const [screen,setScreen]=useState("patients");const [selectedId,setSelectedId]=useState(null);const [navTab,setNavTab]=useState("patients");const [loaded,setLoaded]=useState(false);const [saveStatus,setSaveStatus]=useState("idle");
  useEffect(()=>{
    async function loadAll(){
      try{
        const [patients,consultas,eventos]=await Promise.all([sbLoadAll(),sbLoadConsultas(),sbLoadEventos()]);
        dispatch({type:"LOAD",patients,consultas,eventos});
      }catch(e){console.error("Error loading base:",e);dispatch({type:"LOAD",patients:[],consultas:[],eventos:[]});}
      try{
        const [cases,appointments,followups,labs,tasks]=await Promise.all([sbLoadFertilCases(),sbLoadAppointments(),sbLoadFertilFollowups(),sbLoadFertilLabs(),sbLoadFertilTasks()]);
        dispatch({type:"LOAD_FERTIL",cases,appointments,followups,labs,tasks});
      }catch(e){console.error("Error loading fertil:",e);dispatch({type:"LOAD_FERTIL",cases:[],appointments:[],followups:[],labs:[],tasks:[]});}
      setLoaded(true);
    }
    loadAll();
  },[]);
  useEffect(()=>{if(!loaded)return;setSaveStatus("saving");const t=setTimeout(async()=>{try{await Promise.all(state.patients.map(p=>sbUpsert(p)));setSaveStatus("saved");}catch{setSaveStatus("error");}setTimeout(()=>setSaveStatus("idle"),2000);},800);return()=>clearTimeout(t);},[state.patients,loaded]);
  const patient=state.patients.find(p=>p.id===selectedId);const go=(s,id=null)=>{setScreen(s);if(id)setSelectedId(id);};
  const handleAddConsulta=async(c)=>{dispatch({type:"ADD_CONSULTA",c});try{await sbInsertConsulta(c);}catch(e){console.error("Error guardando consulta:",e);}};
  const handleDeletePatient=async(id)=>{dispatch({type:"DELETE_PATIENT",id});await sbDelete(id);go("patients");};
  const handleAddEvento=async(e)=>{dispatch({type:"ADD_EVENTO",e});try{await sbInsertEvento(e);}catch(err){console.error("Error guardando evento:",err);}};
  const handleUpdateEvento=async(e)=>{dispatch({type:"UPDATE_EVENTO",e});try{await sbUpdateEvento(e);}catch(err){console.error("Error actualizando evento:",err);}};
  const handleDeleteEvento=async(id)=>{dispatch({type:"DELETE_EVENTO",id});try{await sbDeleteEvento(id);}catch(err){console.error("Error eliminando evento:",err);}};
  const todayPendientes=(state.eventos||[]).filter(e=>e.fecha===todayISO()&&!e.completado).length;
  const fertilActivas=(state.fertilCases||[]).filter(c=>c.status==="activa").length;
  if(!loaded)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5faf7",fontFamily:"sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🌿</div><p style={{color:"#2d6a4f",fontWeight:600,fontSize:16}}>JL Nutrición</p><p style={{color:"#7a9a8a",fontSize:13}}>Conectando con la base de datos...</p></div></div>);
  return (<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5ee 0%,#f5f9f7 50%,#e0f0e8 100%)",fontFamily:"'DM Sans',system-ui,sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#2d6a4f!important;box-shadow:0 0 0 3px rgba(45,106,79,.1)!important;outline:none}`}</style><div style={{background:"#fff",borderBottom:"1.5px solid #e8f0ec",padding:"0 20px",position:"sticky",top:0,zIndex:100}}><div style={{maxWidth:980,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍏</div><span style={{fontWeight:700,fontSize:16,color:"#1a3d2b"}}>JL Nutrición</span><span style={{fontSize:11,color:saveStatus==="saving"?"#f4a261":saveStatus==="saved"?"#52b788":saveStatus==="error"?"#e63946":"transparent",fontWeight:600,transition:"color .3s"}}>{saveStatus==="saving"?"● guardando...":saveStatus==="saved"?"✓ guardado":saveStatus==="error"?"⚠ error":"·"}</span></div><div style={{display:"flex",alignItems:"center",gap:4}}>{[["patients","👥 Pacientes"],["fertil","💜 Fértil"],["agenda","📅 Agenda"],["stats","📊 Estadísticas"],["plan","✨ Nuevo plan"]].map(([id,label])=>(<button key={id} onClick={()=>{setNavTab(id);go(id);}} style={{padding:"7px 14px",border:"none",borderRadius:9,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",background:navTab===id?(id==="fertil"?"#7b2d8b":"#2d6a4f"):"transparent",color:navTab===id?"#fff":(id==="fertil"?"#7b2d8b":"#5a7a6a"),position:"relative"}}>{label}{id==="agenda"&&todayPendientes>0&&<span style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#e76f51",color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{todayPendientes}</span>}{id==="fertil"&&fertilActivas>0&&<span style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#7b2d8b",color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{fertilActivas}</span>}</button>))}</div></div></div><div style={{maxWidth:980,margin:"0 auto",padding:"24px 16px"}}>
    {screen==="patients"&&<PatientList patients={state.patients} onSelect={id=>go("detail",id)} onNew={()=>go("new-patient")}/>}
    {screen==="fertil"&&<FertilModule state={state} dispatch={dispatch} patients={state.patients} onGoToPatient={id=>{setNavTab("patients");go("detail",id);}}/>}
    {screen==="agenda"&&<CalendarView eventos={state.eventos} patients={state.patients} appointments={state.appointments} onAddEvento={handleAddEvento} onUpdateEvento={handleUpdateEvento} onDeleteEvento={handleDeleteEvento} onSelectPatient={id=>go("detail",id)}/>}
    {screen==="stats"&&<PatientsStats patients={state.patients} consultas={state.consultas} fertilCases={state.fertilCases} appointments={state.appointments} onAddConsulta={handleAddConsulta} onSelect={id=>go("detail",id)}/>}
    {screen==="new-patient"&&<NewPatient onSave={p=>{dispatch({type:"ADD_PATIENT",p});go("detail",p.id);}} onCancel={()=>go("patients")}/>}
    {screen==="detail"&&patient&&<PatientDetail patient={patient} dispatch={dispatch} consultas={state.consultas} eventos={state.eventos} appointments={state.appointments} onAddConsulta={handleAddConsulta} onAddEvento={handleAddEvento} onUpdateEvento={handleUpdateEvento} onDeleteEvento={handleDeleteEvento} onGeneratePlan={()=>go("plan-patient")} onBack={()=>go("patients")} onDelete={handleDeletePatient}/>}
    {screen==="plan-patient"&&patient&&<PlanGenerator prefill={{nombre:patient.nombre,edad:patient.edad,peso:patient.peso,altura:patient.altura,sexo:patient.sexo,objetivo:patient.objetivo||"",nivelActividad:"",alergias:[],patologias:[],preferencias:"",aversiones:"",cantidadComidas:"4",tipoPlan:"Estándar"}} onSavePlan={plan=>{dispatch({type:"ADD_PLAN",pid:patient.id,plan});const c={id:uid(),pacienteId:patient.id,pacienteNombre:patient.nombre,fecha:todayISO(),monto:plan.monto||0,tipo:"Plan generado",obs:`Plan: ${plan.objetivo}`};handleAddConsulta(c);go("detail",patient.id);}} onBack={()=>go("detail",patient.id)}/>}
    {screen==="plan"&&<PlanGenerator onBack={()=>{setNavTab("patients");go("patients");}}/>}
  </div></div>);
}
