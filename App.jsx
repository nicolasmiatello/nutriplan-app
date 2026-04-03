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
const C = {
  // Semánticos — cada color comunica un significado
  ok:"#52b788",         // verde = hecho, pagado, completado, al día
  okDark:"#2d6a4f",     // verde oscuro = primario, brand, headers
  okLight:"#e8f5ee",    // verde fondo = backgrounds ok
  warn:"#f4a261",       // naranja = atención, parcial, próximo
  warnLight:"#fff8f0",  // naranja fondo
  danger:"#e76f51",     // rojo = vencido, pendiente crítico, eliminar
  dangerDark:"#c0392b", // rojo oscuro = botón eliminar
  dangerLight:"#fff0f0",// rojo fondo
  fertil:"#7b2d8b",     // violeta = módulo fértil
  fertilLight:"#f3e5f5",// violeta fondo
  fertilAlt:"#a855f7",  // violeta claro = gradiente, acento
  lead:"#3b82f6",       // azul = leads, nuevo
  leadLight:"#eff6ff",  // azul fondo
  muted:"#7a9a8a",      // gris verde = texto secundario
  mutedLight:"#aaa",    // gris = desactivado, descartado
  bg:"#f0f4f1",         // fondo general
  bgCard:"#fff",        // fondo cards
  text:"#1a3d2b",       // texto principal
  textSub:"#5a7a6a",    // texto secundario
  border:"#d8e8df",     // bordes
  borderLight:"#f0f4f1" // bordes suaves
};
const FERTIL_STATUS_LABELS={lead:"Lead",activa:"Activa",pausada:"Pausada",finalizada:"Finalizada"};
const FERTIL_STATUS_COLORS={lead:C.warn,activa:C.fertil,pausada:C.mutedLight,finalizada:C.ok};
const FERTIL_PAYMENT_LABELS={pendiente:"Pendiente",parcial:"Parcial",pago:"Pago"};
const FERTIL_PAYMENT_COLORS={pendiente:C.danger,parcial:C.warn,pago:C.ok};
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
    case "DELETE_CONSULTA": return {...state,consultas:(state.consultas||[]).filter(c=>c.id!==action.id)};
    case "LOAD_EVENTOS": return {...state,eventos:action.eventos||[]};
    case "ADD_EVENTO": return {...state,eventos:[action.e,...(state.eventos||[])]};
    case "UPDATE_EVENTO": return {...state,eventos:(state.eventos||[]).map(e=>e.id===action.e.id?action.e:e)};
    case "DELETE_EVENTO": return {...state,eventos:(state.eventos||[]).filter(e=>e.id!==action.id)};
    // Fértil
    case "LOAD_FERTIL": return {...state,fertilCases:action.cases||[],appointments:action.appointments||[],fertilFollowups:action.followups||[],fertilLabs:action.labs||[],fertilTasks:action.tasks||[],fertilLeads:action.leads||[]};
    case "ADD_FERTIL_CASE": return {...state,fertilCases:[action.c,...(state.fertilCases||[])]};
    case "UPDATE_FERTIL_CASE": return {...state,fertilCases:(state.fertilCases||[]).map(c=>c.id===action.c.id?action.c:c)};
    case "ADD_APPOINTMENT": return {...state,appointments:[action.a,...(state.appointments||[])]};
    case "UPDATE_APPOINTMENT": return {...state,appointments:(state.appointments||[]).map(a=>a.id===action.a.id?action.a:a)};
    case "DELETE_APPOINTMENT": return {...state,appointments:(state.appointments||[]).filter(a=>a.id!==action.id)};
    case "ADD_FERTIL_FOLLOWUP": return {...state,fertilFollowups:[action.f,...(state.fertilFollowups||[])]};
    case "UPDATE_FERTIL_FOLLOWUP": return {...state,fertilFollowups:(state.fertilFollowups||[]).map(f=>f.id===action.f.id?action.f:f)};
    case "ADD_FERTIL_LAB": return {...state,fertilLabs:[action.l,...(state.fertilLabs||[])]};
    case "ADD_FERTIL_TASK": return {...state,fertilTasks:[action.t,...(state.fertilTasks||[])]};
    case "UPDATE_FERTIL_TASK": return {...state,fertilTasks:(state.fertilTasks||[]).map(t=>t.id===action.t.id?action.t:t)};
    case "DELETE_FERTIL_TASK": return {...state,fertilTasks:(state.fertilTasks||[]).filter(t=>t.id!==action.id)};
    // Leads
    case "LOAD_LEADS": return {...state,fertilLeads:action.leads||[]};
    case "ADD_LEAD": return {...state,fertilLeads:[action.l,...(state.fertilLeads||[])]};
    case "UPDATE_LEAD": return {...state,fertilLeads:(state.fertilLeads||[]).map(l=>l.id===action.l.id?action.l:l)};
    case "DELETE_LEAD": return {...state,fertilLeads:(state.fertilLeads||[]).filter(l=>l.id!==action.id)};
    case "LOAD_GASTOS": return {...state,gastos:action.gastos||[]};
    case "ADD_GASTO": return {...state,gastos:[action.g,...(state.gastos||[])]};
    case "DELETE_GASTO": return {...state,gastos:(state.gastos||[]).filter(g=>g.id!==action.id)};
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
    fecha:row.fecha,monto:parseFloat(row.monto)||0,tipo:row.tipo,obs:row.obs||"",lugar:row.lugar||"Consultorio propio"
  }));
}

async function sbInsertConsulta(c) {
  const body = JSON.stringify({
    id:c.id,paciente_id:c.pacienteId,paciente_nombre:c.pacienteNombre,
    fecha:c.fecha,monto:c.monto||0,tipo:c.tipo||"",obs:c.obs||"",lugar:c.lugar||"Consultorio propio"
  });
  await fetch(`${SUPABASE_URL}/rest/v1/consultas`,{method:"POST",headers:sbHeaders,body});
}
async function sbDeleteConsulta(id){await fetch(SUPABASE_URL+"/rest/v1/consultas?id=eq."+id,{method:"DELETE",headers:sbHeaders});}

// ─── GASTOS ──────────────────────────────────────────────────────────────────
async function sbLoadGastos(){
  try{var r=await fetch(SUPABASE_URL+"/rest/v1/gastos?select=*&order=created_at.desc",{headers:sbHeaders});if(!r.ok)return[];return await r.json();}catch(e){console.error("sbLoadGastos:",e);return[];}
}
async function sbInsertGasto(g){
  var body=JSON.stringify({tipo:g.tipo,categoria:g.categoria||"general",monto:g.monto||0,mes:g.mes,descripcion:g.descripcion||""});
  var r=await fetch(SUPABASE_URL+"/rest/v1/gastos",{method:"POST",headers:{...sbHeaders,"Prefer":"return=representation"},body:body});
  if(!r.ok){console.error("Error insertando gasto:",await r.text());}
  return r.ok?await r.json():null;
}
async function sbDeleteGasto(id){await fetch(SUPABASE_URL+"/rest/v1/gastos?id=eq."+id,{method:"DELETE",headers:sbHeaders});}

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
async function sbUpdateFertilFollowup(f){var body=JSON.stringify({week_number:f.weekNumber,date:f.date,weight:f.weight||null,symptoms:f.symptoms||"",mood:f.mood||"",sleep_quality:f.sleepQuality||"",digestion:f.digestion||"",adherence:f.adherence||"",notes:f.notes||""});await fetch(SUPABASE_URL+"/rest/v1/fertil_followups?id=eq."+f.id,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body:body});}
async function sbLoadFertilLabs(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_labs?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,fertilCaseId:row.fertil_case_id,date:row.date,labType:row.lab_type||"",results:row.results||"",notes:row.notes||""}));}catch(e){return[];}}
async function sbInsertFertilLab(l){const body=JSON.stringify({id:l.id,fertil_case_id:l.fertilCaseId,date:l.date,lab_type:l.labType||"",results:l.results||"",notes:l.notes||""});await fetch(`${SUPABASE_URL}/rest/v1/fertil_labs`,{method:"POST",headers:sbHeaders,body});}
async function sbLoadFertilTasks(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?select=*&order=created_at.desc`,{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(row=>({id:row.id,fertilCaseId:row.fertil_case_id,title:row.title,done:row.done||false,dueDate:row.due_date}));}catch(e){return[];}}
async function sbInsertFertilTask(t){const body=JSON.stringify({id:t.id,fertil_case_id:t.fertilCaseId,title:t.title,done:t.done||false,due_date:t.dueDate||null});await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks`,{method:"POST",headers:sbHeaders,body});}
async function sbUpdateFertilTask(t){const body=JSON.stringify({title:t.title,done:t.done,due_date:t.dueDate||null});await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?id=eq.${t.id}`,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body});}
async function sbDeleteFertilTask(id){await fetch(`${SUPABASE_URL}/rest/v1/fertil_tasks?id=eq.${id}`,{method:"DELETE",headers:sbHeaders});}

// ─── SUPABASE LEADS ──────────────────────────────────────────────────────────
async function sbLoadLeads(){try{var r=await fetch(SUPABASE_URL+"/rest/v1/fertil_leads?select=*&order=created_at.desc",{headers:sbHeaders});if(!r.ok)return[];return(await r.json()).map(function(row){return{id:row.id,nombre:row.nombre||"",instagram:row.instagram||"",telefono:row.telefono||"",origen:row.origen||"instagram",estado:row.estado||"nuevo",interes:row.interes||"indefinido",ultimaInteraccion:row.ultima_interaccion||"",proximoSeguimiento:row.proximo_seguimiento||"",accionPendiente:row.accion_pendiente||"",notas:row.notas||"",createdAt:row.created_at};});}catch(e){return[];}}
async function sbInsertLead(l){try{var body=JSON.stringify({id:l.id,nombre:l.nombre,instagram:l.instagram||"",telefono:l.telefono||"",origen:l.origen||"instagram",estado:l.estado||"nuevo",interes:l.interes||"indefinido",ultima_interaccion:l.ultimaInteraccion||null,proximo_seguimiento:l.proximoSeguimiento||null,accion_pendiente:l.accionPendiente||"",notas:l.notas||""});var r=await fetch(SUPABASE_URL+"/rest/v1/fertil_leads",{method:"POST",headers:sbHeaders,body:body});if(!r.ok){var t=await r.text();console.error("sbInsertLead error:",r.status,t);}else{console.log("Lead guardado OK");}}catch(e){console.error("sbInsertLead exception:",e);}}
async function sbUpdateLead(l){var body=JSON.stringify({nombre:l.nombre,instagram:l.instagram||"",telefono:l.telefono||"",origen:l.origen,estado:l.estado,interes:l.interes,ultima_interaccion:l.ultimaInteraccion||null,proximo_seguimiento:l.proximoSeguimiento||null,accion_pendiente:l.accionPendiente||"",notas:l.notas||""});await fetch(SUPABASE_URL+"/rest/v1/fertil_leads?id=eq."+l.id,{method:"PATCH",headers:{...sbHeaders,"Prefer":"return=minimal"},body:body});}
async function sbDeleteLead(id){await fetch(SUPABASE_URL+"/rest/v1/fertil_leads?id=eq."+id,{method:"DELETE",headers:sbHeaders});}

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
  label:{display:"block",fontSize:11,fontWeight:700,color:C.textSub,marginBottom:4,textTransform:"uppercase",letterSpacing:.8},
  input:{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid "+C.border,fontSize:14,fontFamily:"inherit",background:"#fafcfb",outline:"none",boxSizing:"border-box"},
  card:{background:C.bgCard,borderRadius:14,border:"1px solid #E5E7EB",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px"},
  btnPrimary:{padding:"10px 18px",background:C.okDark,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnOutline:{padding:"10px 18px",background:"#fff",color:C.okDark,border:"1.5px solid "+C.okDark,borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnGhost:{padding:"8px 14px",background:C.bg,color:C.textSub,border:"none",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnDanger:{padding:"8px 14px",background:C.dangerLight,color:C.dangerDark,border:"1.5px solid #f5c6c6",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
  btnFertil:{padding:"10px 18px",background:C.fertil,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:600},
};

const Field = ({label,value,onChange,type="text",placeholder="",rows}) => (<div style={{marginBottom:16}}><label style={S.label}>{label}</label>{rows?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...S.input,resize:"vertical"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input}/>}</div>);
const Tag = ({label,selected,onClick}) => (<button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",transition:"all .15s",background:selected?"#2d6a4f":"#f0f4f1",color:selected?"#fff":"#3a3a3a",border:selected?"2px solid #2d6a4f":"2px solid #d8e8df",fontFamily:"inherit"}}>{label}</button>);
const Badge = ({label,color="#e8f5ee",text="#2d6a4f"}) => (<span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:color,color:text,whiteSpace:"nowrap"}}>{label}</span>);
const SectionHead = ({children,action}) => (<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#1a3d2b"}}>{children}</h3>{action}</div>);
const EmptyState = ({icon="📭",title="No hay datos todavía",sub,action,actionLabel,compact}) => (<div style={{textAlign:"center",padding:compact?"20px 10px":"44px 20px"}}><div style={{fontSize:compact?28:40,marginBottom:compact?6:12}}>{icon}</div><p style={{color:C.muted,fontSize:compact?12:14,fontWeight:600,margin:0}}>{title}</p>{sub&&<p style={{color:C.mutedLight,fontSize:compact?11:12,margin:"4px 0 0"}}>{sub}</p>}{action&&<button onClick={action} style={{...S.btnPrimary,marginTop:14,fontSize:13}}>{actionLabel||"Agregar"}</button>}</div>);

function BarChart({data,color="#2d6a4f",formatValue=(v)=>v,height=120}) {
  const max = Math.max(...data.map(d=>d.value),1);
  return (<div style={{display:"flex",alignItems:"flex-end",gap:6,height:height+40,paddingTop:8}}>{data.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:9,color:"#7a9a8a",fontWeight:600}}>{d.value>0?formatValue(d.value):""}</span><div style={{width:"100%",background:color,borderRadius:"4px 4px 0 0",height:`${(d.value/max)*height}px`,minHeight:d.value>0?4:0,transition:"height .3s"}}/><span style={{fontSize:9,color:"#7a9a8a",textAlign:"center",lineHeight:1.2}}>{d.label}</span></div>))}</div>);
}

function StatsDashboard({patients,consultas,fertilCases,appointments,gastos,onAddGasto,onDeleteGasto}) {
  var now=new Date();var thisMonth=now.getMonth();var thisYear=now.getFullYear();
  var mesActual=(thisYear)+"-"+(String(thisMonth+1).padStart(2,"0"));
  var allConsultas=consultas||[];
  var fc=fertilCases||[];
  var allGastos=gastos||[];
  var [showGastoForm,setShowGastoForm]=useState(false);
  var [gastoForm,setGastoForm]=useState({tipo:"alquiler",categoria:"general",monto:"",mes:mesActual,descripcion:""});

  // Consultas privadas (este mes)
  var consultasMes=allConsultas.filter(function(c){var d=new Date(c.fecha);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;});
  var totalMesConsultas=consultasMes.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0);
  var totalHistoricoConsultas=allConsultas.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0);

  // Desglose por lugar
  var consultasOlivos=consultasMes.filter(function(c){return c.lugar==="Olivos Medical";});
  var consultasPropio=consultasMes.filter(function(c){return!c.lugar||c.lugar==="Consultorio propio";});
  var consultasOnline=consultasMes.filter(function(c){return c.lugar==="Online";});
  var montoOlivos=consultasOlivos.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0);
  var montoPropio=consultasPropio.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0);
  var montoOnline=consultasOnline.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0);

  // Fértil stats
  var fertilActivas=fc.filter(function(c){return c.status==="activa";}).length;
  var fertilFinalizadas=fc.filter(function(c){return c.status==="finalizada";}).length;
  var fertilTotalIngresos=fc.reduce(function(s,c){return s+(c.amountPaid||0);},0);
  var fertilMesIngresos=fc.filter(function(c){var sd=c.startDate||c.createdAt||"";var d=new Date(sd.length===10?sd+"T12:00:00":sd);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}).reduce(function(s,c){return s+(c.amountPaid||0);},0);
  var fertilTicketPromedio=fc.length?fertilTotalIngresos/fc.length:0;
  var fertilPagos=fc.filter(function(c){return c.paymentStatus==="pago";}).length;
  var fertilPendientes=fc.filter(function(c){return c.paymentStatus==="pendiente";}).length;
  var fertilPctPago=fc.length?Math.round((fertilPagos/fc.length)*100):0;

  // Gastos del mes
  var gastosMes=allGastos.filter(function(g){return g.mes===mesActual;});
  var gastosFertilMes=gastosMes.filter(function(g){return g.categoria==="fertil";}).reduce(function(s,g){return s+(parseFloat(g.monto)||0);},0);
  var gastosPrivadasMes=gastosMes.filter(function(g){return g.categoria==="privadas";}).reduce(function(s,g){return s+(parseFloat(g.monto)||0);},0);
  var gastosGeneralMes=gastosMes.filter(function(g){return g.categoria==="general";}).reduce(function(s,g){return s+(parseFloat(g.monto)||0);},0);
  var totalGastosMes=gastosMes.reduce(function(s,g){return s+(parseFloat(g.monto)||0);},0);

  // Totales generales
  var totalMes=totalMesConsultas+fertilMesIngresos;
  var totalHistorico=totalHistoricoConsultas+fertilTotalIngresos;
  var consultasTotalesMes=consultasMes.length;
  var gananciaNetaMes=totalMes-totalGastosMes;

  // Gráficos últimos 6 meses
  var last6=Array.from({length:6},function(_,i){var d=new Date(thisYear,thisMonth-5+i,1);var m=d.getMonth();var y=d.getFullYear();var cs=allConsultas.filter(function(c){var dd=new Date(c.fecha);return dd.getMonth()===m&&dd.getFullYear()===y;});var fertilMes=fc.filter(function(c){var sd=c.startDate||c.createdAt||"";var dd=new Date(sd.length===10?sd+"T12:00:00":sd);return dd.getMonth()===m&&dd.getFullYear()===y;}).reduce(function(s,c){return s+(c.amountPaid||0);},0);return{label:MESES[m],value:cs.length,monto:cs.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0),montoFertil:fertilMes,montoTotal:cs.reduce(function(s,c){return s+(parseFloat(c.monto)||0);},0)+fertilMes};});
  var last6Fertil=Array.from({length:6},function(_,i){var d=new Date(thisYear,thisMonth-5+i,1);var m=d.getMonth();var y=d.getFullYear();var ing=fc.filter(function(c){var sd=c.startDate||c.createdAt||"";var dd=new Date(sd.length===10?sd+"T12:00:00":sd);return dd.getMonth()===m&&dd.getFullYear()===y;}).reduce(function(s,c){return s+(c.amountPaid||0);},0);return{label:MESES[m],value:ing};});
  var last6Privadas=last6.map(function(d){return{label:d.label,value:d.monto};});

  var statCard=function(icon,label,value,sub,color){
    color=color||C.okDark;
    return(<div style={{...S.card,flex:1,minWidth:130}}><div style={{fontSize:20,marginBottom:6}}>{icon}</div><div style={{fontSize:28,fontWeight:800,color:color,letterSpacing:"-0.5px"}}>{value}</div><div style={{fontSize:11,fontWeight:600,color:C.textSub,marginTop:4,textTransform:"uppercase",letterSpacing:".5px"}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}</div>);
  };

  var handleSaveGasto=function(){
    if(!gastoForm.monto||!gastoForm.mes)return;
    var g={id:uid(),tipo:gastoForm.tipo,categoria:gastoForm.categoria,monto:parseFloat(gastoForm.monto)||0,mes:gastoForm.mes,descripcion:gastoForm.descripcion};
    onAddGasto(g);
    setGastoForm({tipo:"alquiler",categoria:"general",monto:"",mes:mesActual,descripcion:""});
    setShowGastoForm(false);
  };

  return (<div>
    {/* ── BLOQUE 1: GENERAL ── */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.text,letterSpacing:"-0.3px"}}>{"📊 Estadísticas generales"}</h2>
      <button onClick={function(){setShowGastoForm(!showGastoForm);}} style={S.btnOutline}>{"💸 "+(showGastoForm?"Cerrar":"Cargar gasto")}</button>
    </div>

    {showGastoForm&&<div style={{...S.card,marginBottom:20,borderLeft:"4px solid "+C.warn}}>
      <h4 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:C.text}}>{"Registrar gasto"}</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div style={{marginBottom:14}}><label style={S.label}>{"Tipo"}</label><select value={gastoForm.tipo} onChange={function(e){setGastoForm(function(f){return Object.assign({},f,{tipo:e.target.value});});}} style={S.input}><option value="alquiler">{"Alquiler"}</option><option value="publicidad">{"Publicidad"}</option><option value="insumos">{"Insumos"}</option><option value="otro">{"Otro"}</option></select></div>
        <div style={{marginBottom:14}}><label style={S.label}>{"Categoría"}</label><select value={gastoForm.categoria} onChange={function(e){setGastoForm(function(f){return Object.assign({},f,{categoria:e.target.value});});}} style={S.input}><option value="general">{"General"}</option><option value="fertil">{"Fértil"}</option><option value="privadas">{"Consultas privadas"}</option></select></div>
        <Field label="Monto ($)" type="number" value={gastoForm.monto} onChange={function(v){setGastoForm(function(f){return Object.assign({},f,{monto:v});});}} placeholder="15000"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{marginBottom:14}}><label style={S.label}>{"Mes"}</label><input type="month" value={gastoForm.mes} onChange={function(e){setGastoForm(function(f){return Object.assign({},f,{mes:e.target.value});});}} style={S.input}/></div>
        <Field label="Descripción (opcional)" value={gastoForm.descripcion} onChange={function(v){setGastoForm(function(f){return Object.assign({},f,{descripcion:v});});}} placeholder="Ej: Alquiler Olivos Medical"/>
      </div>
      <button onClick={handleSaveGasto} disabled={!gastoForm.monto} style={{...S.btnPrimary,opacity:gastoForm.monto?1:.5}}>{"💾 Guardar gasto"}</button>
    </div>}

    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
      {statCard("👩","Pacientes totales",patients.length,"en el sistema")}
      {statCard("📅","Consultas del mes",consultasTotalesMes,"registradas")}
      {statCard("💰","Ingreso del mes",fmtMoney(totalMes),"consultas + fértil",C.okDark)}
      {statCard("💸","Gastos del mes",fmtMoney(totalGastosMes),"total gastos",totalGastosMes>0?C.danger:C.muted)}
      {statCard("📈","Ganancia neta",fmtMoney(gananciaNetaMes),"ingresos - gastos",gananciaNetaMes>=0?C.ok:C.danger)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:28}}>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>{"Consultas por mes"}</h4>{last6.some(function(d){return d.value>0;})?<BarChart data={last6} color={C.ok}/>:<EmptyState icon="📊" title="Sin datos aún" compact={true}/>}</div>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>{"Facturación total por mes"}</h4>{last6.some(function(d){return d.montoTotal>0;})?<BarChart data={last6.map(function(d){return{label:d.label,value:d.montoTotal};})} color={C.okDark} formatValue={function(v){return "$"+Math.round(v/1000)+"k";}}/>:<EmptyState icon="📊" title="Sin datos aún" compact={true}/>}</div>
    </div>

    {/* Gastos del mes detalle */}
    {gastosMes.length>0&&<div style={{...S.card,marginBottom:28}}>
      <h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>{"💸 Gastos del mes"}</h4>
      {gastosMes.map(function(g){return(<div key={g.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+C.borderLight}}>
        <div><span style={{fontWeight:600,fontSize:13,color:C.text}}>{g.tipo.charAt(0).toUpperCase()+g.tipo.slice(1)}</span><span style={{fontSize:11,color:C.muted,marginLeft:8}}>{g.categoria==="fertil"?"Fértil":g.categoria==="privadas"?"Consultas":"General"}</span>{g.descripcion&&<span style={{fontSize:11,color:C.muted,marginLeft:6,fontStyle:"italic"}}>{" · "+g.descripcion}</span>}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,fontSize:14,color:C.danger}}>{fmtMoney(g.monto)}</span><button onClick={function(){if(confirm("¿Eliminar este gasto?"))onDeleteGasto(g.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:C.danger,padding:"2px 4px"}}>{"✕"}</button></div>
      </div>);})}
    </div>}

    {/* ── BLOQUE 2: FÉRTIL ── */}
    <div style={{borderTop:"2px solid "+C.fertilLight,paddingTop:20,marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <span style={{fontSize:18}}>{"💜"}</span><h3 style={{margin:0,fontSize:17,fontWeight:700,color:C.fertil}}>{"Programa Fértil"}</h3>
      </div>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        {statCard("👩","Activas",fertilActivas,"en programa",C.fertil)}
        {statCard("✅","Finalizadas",fertilFinalizadas,"completaron")}
        {statCard("💰","Ingresos Fértil",fmtMoney(fertilTotalIngresos),"total acumulado",C.fertil)}
        {statCard("🎫","Ticket promedio",fmtMoney(fertilTicketPromedio),"por paciente")}
      </div>
      {gastosFertilMes>0&&<div style={{...S.card,marginBottom:16,padding:"14px 18px",borderLeft:"3px solid "+C.fertil}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,fontWeight:600,color:C.fertil}}>{"Gastos Fértil del mes"}</span><span style={{fontSize:14,fontWeight:700,color:C.danger}}>{fmtMoney(gastosFertilMes)}</span></div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{"Ganancia neta Fértil: "}<span style={{fontWeight:700,color:fertilMesIngresos-gastosFertilMes>=0?C.ok:C.danger}}>{fmtMoney(fertilMesIngresos-gastosFertilMes)}</span></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.fertil}}>{"Ingresos Fértil por mes"}</h4>{last6Fertil.some(function(d){return d.value>0;})?<BarChart data={last6Fertil} color={C.fertil} formatValue={function(v){return "$"+Math.round(v/1000)+"k";}}/>:<EmptyState icon="📊" title="Sin datos aún" compact={true}/>}</div>
        <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.fertil}}>{"Estado de pagos"}</h4><div style={{display:"flex",gap:20,justifyContent:"center",padding:"20px 0"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:C.ok,letterSpacing:"-0.5px"}}>{fertilPagos}</div><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{"Pagos"}</div></div><div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:C.warn,letterSpacing:"-0.5px"}}>{fc.filter(function(c){return c.paymentStatus==="parcial";}).length}</div><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{"Parciales"}</div></div><div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:C.danger,letterSpacing:"-0.5px"}}>{fertilPendientes}</div><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{"Pendientes"}</div></div></div><div style={{fontSize:12,textAlign:"center",color:C.textSub}}>{fertilPctPago}{"% con pago completo"}</div></div>
      </div>
    </div>

    {/* ── BLOQUE 3: CONSULTAS PRIVADAS ── */}
    <div style={{borderTop:"2px solid "+C.border,paddingTop:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <span style={{fontSize:18}}>{"🩺"}</span><h3 style={{margin:0,fontSize:17,fontWeight:700,color:C.okDark}}>{"Consultas privadas"}</h3>
      </div>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        {statCard("📅","Consultas del mes",consultasMes.length,"privadas")}
        {statCard("💰","Facturación del mes",fmtMoney(totalMesConsultas),"consultas privadas",C.okDark)}
        {statCard("📈","Total histórico",fmtMoney(totalHistoricoConsultas),"acumulado consultas")}
      </div>

      {/* Desglose por lugar */}
      {consultasMes.length>0&&<div style={{...S.card,marginBottom:20}}>
        <h4 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:C.text}}>{"Desglose por lugar — este mes"}</h4>
        <div style={{display:"flex",gap:20,justifyContent:"center",padding:"10px 0"}}>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:24,fontWeight:800,color:C.okDark}}>{consultasPropio.length}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginTop:4}}>{"Consultorio"}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.ok,marginTop:2}}>{fmtMoney(montoPropio)}</div>
          </div>
          <div style={{width:1,background:C.borderLight}}></div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:24,fontWeight:800,color:C.lead}}>{consultasOlivos.length}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginTop:4}}>{"Olivos Medical"}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.ok,marginTop:2}}>{fmtMoney(montoOlivos)}</div>
          </div>
          <div style={{width:1,background:C.borderLight}}></div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:24,fontWeight:800,color:C.fertil}}>{consultasOnline.length}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginTop:4}}>{"Online"}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.ok,marginTop:2}}>{fmtMoney(montoOnline)}</div>
          </div>
        </div>
      </div>}

      {gastosPrivadasMes>0&&<div style={{...S.card,marginBottom:16,padding:"14px 18px",borderLeft:"3px solid "+C.okDark}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,fontWeight:600,color:C.okDark}}>{"Gastos consultas del mes"}</span><span style={{fontSize:14,fontWeight:700,color:C.danger}}>{fmtMoney(gastosPrivadasMes)}</span></div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{"Ganancia neta consultas: "}<span style={{fontWeight:700,color:totalMesConsultas-gastosPrivadasMes>=0?C.ok:C.danger}}>{fmtMoney(totalMesConsultas-gastosPrivadasMes)}</span></div>
      </div>}

      <div style={S.card}>
        <h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.okDark}}>{"Ingresos consultas por mes"}</h4>
        {last6Privadas.some(function(d){return d.value>0;})?<BarChart data={last6Privadas} color={C.ok} formatValue={function(v){return "$"+Math.round(v/1000)+"k";}}/>:<EmptyState icon="📊" title="Sin datos aún" compact={true}/>}
      </div>
    </div>
  </div>);
}

// ─── CONSULTA FORM (reutilizable, con paciente opcional precargado) ───────────
function ConsultationForm({patients,onSave,onCancel,prefillPatientId}) {
  const [form,setForm]=useState({pacienteId:prefillPatientId||"",fecha:todayISO(),monto:"",tipo:"Primera consulta",lugar:"Consultorio propio",obs:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.pacienteId&&form.fecha&&form.monto;
  const handleSave=()=>{const p=patients.find(x=>x.id===form.pacienteId);onSave({id:uid(),pacienteId:form.pacienteId,pacienteNombre:p?.nombre||"",fecha:form.fecha,monto:parseFloat(form.monto)||0,tipo:form.tipo,lugar:form.lugar,obs:form.obs});};
  return (<div style={S.card}><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:17,fontWeight:700}}>➕ Registrar consulta</h3>{!prefillPatientId&&<div style={{marginBottom:14}}><label style={S.label}>Paciente</label><select value={form.pacienteId} onChange={e=>set("pacienteId",e.target.value)} style={S.input}><option value="">Seleccioná un paciente...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha" type="date" value={form.fecha} onChange={v=>set("fecha",v)}/><Field label="Monto cobrado ($)" type="number" value={form.monto} onChange={v=>set("monto",v)} placeholder="5000"/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:14}}><label style={S.label}>Tipo de consulta</label><select value={form.tipo} onChange={e=>set("tipo",e.target.value)} style={S.input}>{["Primera consulta","Seguimiento","Control","Consulta especial"].map(t=><option key={t}>{t}</option>)}</select></div><div style={{marginBottom:14}}><label style={S.label}>Lugar</label><select value={form.lugar} onChange={e=>set("lugar",e.target.value)} style={S.input}>{["Consultorio propio","Olivos Medical","Online"].map(t=><option key={t}>{t}</option>)}</select></div></div><Field label="Observación (opcional)" value={form.obs} onChange={v=>set("obs",v)} placeholder="Notas sobre la consulta..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={handleSave} disabled={!valid} style={{...S.btnPrimary,flex:2,opacity:valid?1:.5}}>{"💰 Registrar consulta"}</button></div></div>);
}

function PatientsStats({patients,consultas,fertilCases,appointments,gastos,onAddConsulta,onDeleteConsulta,onAddGasto,onDeleteGasto,onSelect}) {
  const [tab,setTab]=useState("pacientes");const [showConsultaForm,setShowConsultaForm]=useState(false);const [search,setSearch]=useState("");
  const filtered=patients.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#1a3d2b"}}>Pacientes y Estadísticas</h2><button onClick={()=>setShowConsultaForm(true)} style={S.btnPrimary}>{"💰 Registrar consulta"}</button></div>{showConsultaForm&&<div style={{marginBottom:20}}><ConsultationForm patients={patients} onSave={c=>{onAddConsulta(c);setShowConsultaForm(false);}} onCancel={()=>setShowConsultaForm(false)}/></div>}<div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f4f1",borderRadius:10,padding:4}}>{[["pacientes","👥 Pacientes"],["stats","📊 Estadísticas"],["consultas","📋 Consultas"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:tab===id?700:500,cursor:"pointer",background:tab===id?C.okLight:"transparent",color:tab===id?C.okDark:C.textSub,boxShadow:"none"}}>{label}</button>))}</div>{tab==="pacientes"&&<div><input placeholder="🔍 Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:16}}/>{filtered.length===0?<EmptyState icon="👥" title="No hay pacientes registrados" sub="Agregá tu primera paciente para empezar"/>:filtered.map(p=>(<div key={p.id} style={{...S.card,marginBottom:14,display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{p.nombre.charAt(0).toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:17}}>{p.nombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{[p.edad&&`${p.edad} años`,p.objetivo].filter(Boolean).join(" · ")}{p.fechaCreacion&&` · Desde ${p.fechaCreacion}`}</div></div><div style={{display:"flex",gap:8,flexShrink:0}}><button onClick={()=>onSelect(p.id)} style={S.btnOutline}>Ver ficha</button></div></div>))}</div>}{tab==="stats"&&<StatsDashboard patients={patients} consultas={consultas} fertilCases={fertilCases} appointments={appointments} gastos={gastos} onAddGasto={onAddGasto} onDeleteGasto={onDeleteGasto}/>}{tab==="consultas"&&<div>{(!consultas||consultas.length===0)?<EmptyState icon="📋" title="No hay consultas registradas" sub="Las consultas aparecerán acá cuando las registres"/>:(function(){
    var sorted=[...consultas].sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);});
    var groups={};
    sorted.forEach(function(c){
      var d=new Date(c.fecha);
      var key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
      var label=MESES_FULL[d.getMonth()]+" "+d.getFullYear();
      if(!groups[key])groups[key]={label:label,items:[],total:0};
      groups[key].items.push(c);
      groups[key].total+=(parseFloat(c.monto)||0);
    });
    return Object.keys(groups).sort().reverse().map(function(key){
      var g=groups[key];
      return(<div key={key} style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,padding:"8px 14px",background:C.bg,borderRadius:8}}>
          <span style={{fontWeight:700,fontSize:15,color:C.text}}>{g.label}</span>
          <div style={{display:"flex",gap:12,fontSize:12}}>
            <span style={{color:C.muted}}>{g.items.length+" consulta"+(g.items.length>1?"s":"")}</span>
            <span style={{fontWeight:800,color:C.ok}}>{fmtMoney(g.total)}</span>
          </div>
        </div>
        {g.items.map(function(c){return(<div key={c.id} style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:C.text,fontSize:15}}>{c.pacienteNombre}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.tipo+" · "+new Date(c.fecha).toLocaleDateString("es-AR")}</div>
            {c.obs&&<div style={{fontSize:12,color:C.textSub,marginTop:2,fontStyle:"italic"}}>{c.obs}</div>}
          </div>
          <div style={{fontWeight:800,fontSize:17,color:C.ok}}>{fmtMoney(c.monto)}</div>
          <button onClick={function(){if(confirm("¿Eliminar esta consulta de "+c.pacienteNombre+"?"))onDeleteConsulta(c.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"4px",color:C.danger,flexShrink:0}} title="Eliminar consulta">{"✕"}</button>
        </div>);})}
      </div>);
    });
  })()}</div>}</div>);
}

// ─── EVENTO FORM ──────────────────────────────────────────────────────────────
const EVENTO_TIPOS = [
  {id:"turno",label:"📅 Turno",color:C.okDark},
  {id:"seguimiento",label:"🔄 Seguimiento",color:C.danger},
  {id:"recordatorio",label:"🔔 Recordatorio",color:C.warn},
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
  return (<div style={S.card}><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:17,fontWeight:700}}>{editEvento?"✏️ Editar evento":"➕ Nuevo evento"}</h3>
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
    <div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={handleSave} disabled={!valid} style={{...S.btnPrimary,flex:2,opacity:valid?1:.5}}>{editEvento?"💾 Guardar cambios":"📅 Crear evento"}</button></div>
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
  const appointmentEvents=(appointments||[]).filter(a=>filterPatientId?a.patientId===filterPatientId:true).filter(a=>{var dt=new Date(a.startAt);return dt.getFullYear()>2020;}).map(function(a){var dt=new Date(a.startAt);var p=patients.find(function(x){return x.id===a.patientId;});var pName=p?p.nombre:"";return{id:"appt-"+a.id,pacienteId:a.patientId,pacienteNombre:pName,tipo:"fertil",titulo:a.title,descripcion:a.notes||"",fecha:dt.toISOString().split("T")[0],hora:dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),completado:a.status==="realizada",_isAppointment:true};});
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

  const getEventColor=(tipo)=>{if(tipo==="fertil") return C.fertil;const t=EVENTO_TIPOS.find(x=>x.id===tipo);return t?t.color:C.muted;};

  const todayEventos=allEvents.filter(e=>e.fecha===todayStr&&!e.completado);
  const tomorrowStr=new Date(new Date().getTime()+86400000).toISOString().split("T")[0];
  const tomorrowEventos=allEvents.filter(e=>e.fecha===tomorrowStr&&!e.completado).sort((a,b)=>(a.hora||"").localeCompare(b.hora||""));
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
    return (<div key={e.id} style={{background:e.completado?"#f0f4f1":color+"12",borderLeft:"3px solid "+(e.completado?"#ccc":color),borderRadius:8,padding:compact?"6px 8px":"12px 16px",marginBottom:compact?4:8,opacity:e.completado?0.6:1,transition:"all .15s"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          {!compact&&<div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,marginBottom:4}}>{fmtDate(e.fecha)}{e.hora?" · "+e.hora:""}</div>}
          {e.pacienteNombre&&!compact&&<div style={{fontSize:16,fontWeight:700,color:e.completado?"#999":"#1a3d2b",marginBottom:3,textDecoration:e.completado?"line-through":"none"}}>{e.pacienteNombre}</div>}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {!e._isAppointment&&<button onClick={()=>handleToggleCompletado(e)} title={e.completado?"Marcar pendiente":"Marcar completado"} style={{width:18,height:18,borderRadius:4,border:"2px solid "+(e.completado?"#aaa":color),background:e.completado?color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",padding:0,flexShrink:0}}>{e.completado?"✓":""}</button>}
            {e._isAppointment&&<span style={{fontSize:12}}>{"💜"}</span>}
            <span style={{fontWeight:600,fontSize:compact?12:13,color:e.completado?"#aaa":"#5a7a6a",textDecoration:e.completado?"line-through":"none"}}>{e.titulo}</span>
          </div>
          {!compact&&!e.pacienteNombre&&<div style={{fontSize:12,color:"#7a9a8a",marginTop:3,fontStyle:"italic"}}>Sin paciente asignado</div>}
          {!compact&&e.descripcion&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:3,fontStyle:"italic"}}>{e.descripcion}</div>}
        </div>
        {!compact&&!e._isAppointment&&<div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>{setEditingEvento(e);setShowForm(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px"}}>{"✏️"}</button>
          <button onClick={()=>handleDeleteEvento(e.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px"}}>{"🗑"}</button>
        </div>}
      </div>
    </div>);
  };

  return (<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#1a3d2b"}}>{filterPatientId?"📅 Agenda del paciente":"📅 Agenda"}</h2>
      <button onClick={()=>{setEditingEvento(null);setSelectedDate(null);setShowForm(true);}} style={S.btnPrimary}>{"📅 Nuevo evento"}</button>
    </div>

    {/* Alertas de hoy y pendientes */}
    {(todayEventos.length>0||tomorrowEventos.length>0||pendientes.length>0)&&<div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      {todayEventos.length>0&&<div style={{...S.card,flex:1,minWidth:200,borderLeft:"4px solid "+C.okDark,padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.okDark,marginBottom:4}}>{"📌 Hoy tenés "+todayEventos.length+" evento"+(todayEventos.length>1?"s":"")}</div>{todayEventos.slice(0,4).map(e=><div key={e.id} style={{fontSize:12,color:"#5a7a6a"}}>{(e.hora?e.hora+" — ":"")+e.titulo+(e.pacienteNombre?" ("+e.pacienteNombre+")":"")}</div>)}</div>}
      {tomorrowEventos.length>0&&<div style={{...S.card,flex:1,minWidth:200,borderLeft:"4px solid "+C.ok,padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.ok,marginBottom:4}}>{"📋 Mañana: "+tomorrowEventos.length+" paciente"+(tomorrowEventos.length>1?"s":"")}</div>{tomorrowEventos.slice(0,5).map(e=><div key={e.id} style={{fontSize:12,color:"#5a7a6a"}}>{(e.hora?e.hora+" — ":"")+(e.pacienteNombre?e.pacienteNombre+" · ":"")+e.titulo}</div>)}</div>}
      {pendientes.length>0&&<div style={{...S.card,flex:1,minWidth:200,borderLeft:"4px solid #e76f51",padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.danger,marginBottom:4}}>{"⚠️ "+pendientes.length+" evento"+(pendientes.length>1?"s":"")+" vencido"+(pendientes.length>1?"s":"")}</div>{pendientes.slice(0,3).map(e=><div key={e.id} style={{fontSize:12,color:"#5a7a6a"}}>{fmtDate(e.fecha)+" — "+e.titulo}</div>)}</div>}
    </div>}

    {showForm&&<div style={{marginBottom:20}}><EventForm patients={patients} prefillPatientId={filterPatientId} prefillDate={selectedDate} editEvento={editingEvento} onSave={e=>{if(editingEvento){onUpdateEvento(e);}else{onAddEvento(e);}setShowForm(false);setEditingEvento(null);}} onCancel={()=>{setShowForm(false);setEditingEvento(null);}}/></div>}

    {/* Toggle vista */}
    <div style={{display:"flex",gap:4,marginBottom:16,background:"#f0f4f1",borderRadius:10,padding:4,maxWidth:240}}>
      {[["month","📅 Mes"],["list","📋 Lista"]].map(([id,label])=>(
        <button key={id} onClick={()=>setViewMode(id)} style={{flex:1,padding:"6px 10px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:viewMode===id?700:500,cursor:"pointer",background:viewMode===id?C.okLight:"transparent",color:viewMode===id?C.okDark:C.textSub,boxShadow:"none"}}>{label}</button>
      ))}
    </div>

    {viewMode==="month"&&<div>
      {/* Nav del mes */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{...S.btnGhost,padding:"6px 12px"}}>◀</button>
        <div style={{textAlign:"center"}}>
          <span style={{fontWeight:800,fontSize:18,color:C.text,letterSpacing:"-0.3px"}}>{MESES_FULL[month]} {year}</span>
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
            return (<div key={dateStr} onClick={()=>{setSelectedDate(dateStr);setEditingEvento(null);setShowForm(true);}} style={{padding:4,minHeight:80,background:isToday?C.okLight:"#fff",borderRadius:6,cursor:"pointer",border:isToday?"2px solid "+C.ok:"1px solid #f0f4f1",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=isToday?"#d4edda":"#f5faf7"} onMouseLeave={e=>e.currentTarget.style.background=isToday?"#e8f5ee":"#fff"}>
              <div style={{fontSize:13,fontWeight:isToday?800:600,color:isToday?"#2d6a4f":isPast?"#aaa":"#1a3d2b",marginBottom:2,textAlign:"right",padding:"0 2px"}}>{day}</div>
              {dayEvents.slice(0,3).map(ev=>(<div key={ev.id} onClick={e=>{e.stopPropagation();if(!ev._isAppointment){setEditingEvento(ev);setShowForm(true);}}} style={{fontSize:10,padding:"1px 4px",borderRadius:4,marginBottom:1,background:ev.completado?"#eee":getEventColor(ev.tipo)+"20",color:ev.completado?"#aaa":getEventColor(ev.tipo),fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:ev.completado?"line-through":"none",cursor:"pointer"}}>{ev.hora?ev.hora+" ":""}{ev.pacienteNombre?ev.pacienteNombre+" - ":""}{ev.titulo}</div>))}
              {dayEvents.length>3&&<div style={{fontSize:9,color:"#7a9a8a",textAlign:"center"}}>+{dayEvents.length-3} más</div>}
            </div>);
          })}
        </div>
      </div>
    </div>}

    {viewMode==="list"&&<div>
      {monthEventos.length===0?<div style={{...S.card,textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:8}}>{"📅"}</div><p style={{color:"#7a9a8a",fontSize:14}}>{"No hay eventos en "+MESES_FULL[month]}</p></div>:(function(){
        var todayS=todayISO();
        var tomorrowS=new Date(new Date().getTime()+86400000).toISOString().split("T")[0];
        var now=new Date();
        var endOfWeek=new Date(now);endOfWeek.setDate(now.getDate()+(7-now.getDay()));
        var weekEndStr=endOfWeek.toISOString().split("T")[0];
        var hoy=monthEventos.filter(function(e){return e.fecha===todayS;});
        var manana=monthEventos.filter(function(e){return e.fecha===tomorrowS;});
        var semana=monthEventos.filter(function(e){return e.fecha>tomorrowS&&e.fecha<=weekEndStr;});
        var resto=monthEventos.filter(function(e){return e.fecha>weekEndStr;});
        var groups=[{label:"Hoy",color:C.okDark,items:hoy},{label:"Mañana",color:C.ok,items:manana},{label:"Esta semana",color:C.muted,items:semana},{label:"Resto del mes",color:C.mutedLight,items:resto}];
        return groups.map(function(g){
          if(g.items.length===0)return null;
          return(<div key={g.label} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:4,height:20,borderRadius:2,background:g.color}}></div>
              <h3 style={{margin:0,fontSize:15,fontWeight:700,color:g.color}}>{g.label}</h3>
              <span style={{fontSize:12,color:"#7a9a8a",fontWeight:600}}>{g.items.length+" evento"+(g.items.length>1?"s":"")}</span>
            </div>
            {g.items.map(function(e){
              var color=getEventColor(e.tipo);
              var isFertil=e.tipo==="fertil"||e._isAppointment;
              return(<div key={e.id} style={{background:e.completado?"#f5f5f5":isFertil?"#faf5fc":"#fff",borderLeft:"4px solid "+(e.completado?"#ccc":color),borderRadius:10,padding:"16px 20px",marginBottom:10,opacity:e.completado?0.6:1,boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:12,color:"#7a9a8a",fontWeight:600}}>{fmtDate(e.fecha)}{e.hora?" · "+e.hora:""}</span>
                      {isFertil&&<span style={{background:C.fertil,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>{"FÉRTIL"}</span>}
                      {e.completado&&<span style={{background:C.ok,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>{"REALIZADA"}</span>}
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:e.completado?"#aaa":"#1a3d2b",textDecoration:e.completado?"line-through":"none",marginBottom:2}}>{e.pacienteNombre||"Sin paciente"}</div>
                    <div style={{fontSize:13,color:e.completado?"#bbb":"#5a7a6a"}}>{e.titulo}</div>
                    {e.descripcion&&<div style={{fontSize:12,color:"#7a9a8a",marginTop:4,fontStyle:"italic"}}>{e.descripcion}</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    {!e._isAppointment&&!e.completado&&<button onClick={function(){handleToggleCompletado(e);}} style={{width:28,height:28,borderRadius:6,border:"2px solid "+color,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:color,padding:0}} title="Marcar completado">{"✓"}</button>}
                    {!e._isAppointment&&<button onClick={function(){setEditingEvento(e);setShowForm(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"4px"}}>{"✏️"}</button>}
                    {!e._isAppointment&&<button onClick={function(){handleDeleteEvento(e.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"4px"}}>{"🗑"}</button>}
                  </div>
                </div>
              </div>);
            })}
          </div>);
        });
      })()}
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
  const statCard=(icon,label,value,sub,color="#7b2d8b")=>(<div style={{...S.card,flex:1,minWidth:130}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontSize:24,fontWeight:800,color,letterSpacing:"-0.5px"}}>{value}</div><div style={{fontSize:11,fontWeight:600,color:C.textSub,marginTop:3,textTransform:"uppercase",letterSpacing:".5px"}}>{label}</div>{sub&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{sub}</div>}</div>);
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>💜</span><h2 style={{margin:0,fontSize:22,fontWeight:700,color:C.fertil}}>Programa Fértil</h2></div><button onClick={onNewCase} style={S.btnFertil}>{"💜 Nueva paciente Fértil"}</button></div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>{statCard("👩","Activas",activas.length,"en programa")}{statCard("✅","Finalizadas",fertilCases.filter(c=>c.status==="finalizada").length,"completaron")}{statCard("💰","Ingresos del mes",fmtMoney(ingresosMes),"programa Fértil")}{statCard("📊","Total acumulado",fmtMoney(totalAcumulado),"histórico")}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.fertil}}>{"📅 Próximos turnos Fértil"}</h4>{proximosTurnos.length===0?<EmptyState icon="📅" title="Sin turnos programados" compact={true}/>:proximosTurnos.map(renderTurno)}</div>
      <div style={S.card}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.danger}}>⚠️ Alertas</h4>{alertas.length===0?<EmptyState icon="✨" title="Sin alertas" sub="Todo en orden" compact={true}/>:alertas.map((a,i)=>(<div key={i} onClick={()=>onSelectCase(a.caseId)} style={{padding:"8px 10px",background:"#fff5f0",borderRadius:8,marginBottom:6,fontSize:12,color:"#c0392b",cursor:"pointer",fontWeight:600}}>{a.msg}</div>))}</div>
    </div>

    {/* Cuadro de seguimiento de consultas */}
    {activas.length>0&&<div style={{...S.card,marginBottom:20}}>
      <h4 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:C.fertil}}>{"📋 Seguimiento de consultas — Pacientes activas"}</h4>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"2px solid "+C.fertilLight}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:"#7b2d8b",fontWeight:700,fontSize:11,textTransform:"uppercase",minWidth:140}}>Paciente</th>
              {FERTIL_CONSULT_TYPES.map(function(ct){return <th key={ct.num} style={{padding:"8px 6px",textAlign:"center",color:"#5a7a6a",fontWeight:600,fontSize:10,textTransform:"uppercase",minWidth:70}}>{ct.num===1?"Inicial":ct.num===5?"Cierre":"Seg "+( ct.num-1)}</th>;})}
            </tr>
          </thead>
          <tbody>
            {activas.map(function(c){
              var p=patients.find(function(x){return x.id===c.patientId;});
              var pName=p&&p.nombre?p.nombre:"Paciente";
              var caseAppts=(appointments||[]).filter(function(a){return a.fertilCaseId===c.id;}).sort(function(a,b){return(a.consultationNumber||0)-(b.consultationNumber||0);});
              return(<tr key={c.id} style={{borderBottom:"1px solid #f0f4f1",cursor:"pointer"}} onClick={function(){onSelectCase(c.id);}}>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,"+C.fertil+","+C.fertilAlt+")",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>{pName.charAt(0)}</div>
                    <div><div style={{fontWeight:600,color:"#1a3d2b",fontSize:13}}>{pName}</div><div style={{fontSize:10,color:"#7a9a8a"}}>{"Sem "+c.currentWeek+"/8"}</div></div>
                  </div>
                </td>
                {FERTIL_CONSULT_TYPES.map(function(ct){
                  var appt=caseAppts.find(function(a){return a.consultationNumber===ct.num;});
                  var status=appt?appt.status:"programada";
                  var createdRecently=appt?Math.abs(new Date(appt.startAt).getTime()-new Date(c.createdAt).getTime())<60000:true;
                  var scheduled=appt&&!createdRecently&&new Date(appt.startAt).getFullYear()>2020;
                  var bgColor=status==="realizada"?"#52b788":scheduled?"#f3e5f5":"#f8f8f8";
                  var textColor=status==="realizada"?"#fff":scheduled?"#7b2d8b":"#ccc";
                  var label=status==="realizada"?"✓":scheduled?fmtDate(appt.startAt.split("T")[0]):"—";
                  return(<td key={ct.num} style={{padding:"6px",textAlign:"center"}}>
                    <div style={{width:36,height:36,borderRadius:8,background:bgColor,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:status==="realizada"?16:9,fontWeight:700,color:textColor,border:status==="realizada"?"none":scheduled?"2px solid #7b2d8b":"2px solid #e0e0e0"}}>{label}</div>
                  </td>);
                })}
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:16,marginTop:12,fontSize:11,color:"#7a9a8a"}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:3,background:"#52b788",display:"inline-block"}}></span> Realizada</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:3,background:"#f3e5f5",border:"2px solid #7b2d8b",display:"inline-block"}}></span> Programada</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:3,background:"#f8f8f8",border:"2px solid #e0e0e0",display:"inline-block"}}></span> Pendiente</span>
      </div>
    </div>}
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
    return(<div key={c.id} onClick={()=>onSelectCase(c.id)} style={{...S.card,marginBottom:12,cursor:"pointer",borderLeft:"4px solid "+(FERTIL_STATUS_COLORS[c.status]||"#aaa"),transition:"box-shadow .2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,"+C.fertil+","+C.fertilAlt+")",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{pInitial}</div>
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
    {filtered.length===0?<EmptyState icon="💜" title="No hay pacientes Fértil" sub="Las nuevas pacientes aparecerán acá"/>:filtered.map(renderCase)}
  </div>);
}

function FertilNewCase({patients,fertilCases,onSave,onCancel}){
  const availablePatients=patients.filter(p=>!fertilCases.some(c=>c.patientId===p.id&&(c.status==="activa"||c.status==="lead")));
  const [form,setForm]=useState({patientId:"",mainCondition:"",objective:"",notes:"",totalPrice:"250000",paymentMethod:"transferencia",installments:"1",amountPaid:""});const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.patientId&&form.totalPrice;
  return(<div style={{maxWidth:560}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><button onClick={onCancel} style={S.btnGhost}>← Volver</button><h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.fertil}}>💜 Nueva paciente Fértil</h2></div>
    <div style={S.card}>
      <div style={{marginBottom:14}}><label style={S.label}>Paciente *</label><select value={form.patientId} onChange={e=>set("patientId",e.target.value)} style={S.input}><option value="">Seleccioná una paciente...</option>{availablePatients.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
      <Field label="Condición principal" value={form.mainCondition} onChange={v=>set("mainCondition",v)} placeholder="Ej: SOP, endometriosis, buscando embarazo..."/>
      <Field label="Objetivo del programa" value={form.objective} onChange={v=>set("objective",v)} placeholder="Ej: Mejorar fertilidad, regular ciclo..." rows={2}/>
      <Field label="Notas" value={form.notes} onChange={v=>set("notes",v)} placeholder="Observaciones iniciales..." rows={2}/>
      <div style={{borderTop:"2px solid "+C.fertilLight,paddingTop:16,marginTop:8,marginBottom:14}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.fertil}}>💰 Datos de pago</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Precio del programa ($) *" type="number" value={form.totalPrice} onChange={v=>set("totalPrice",v)} placeholder="200000"/>
          <Field label="Monto ya pagado ($)" type="number" value={form.amountPaid} onChange={v=>set("amountPaid",v)} placeholder="0"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{marginBottom:14}}><label style={S.label}>Método de pago</label><select value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)} style={S.input}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mp">Mercado Pago</option></select></div>
          <Field label="Cuotas" type="number" value={form.installments} onChange={v=>set("installments",v)} placeholder="1"/>
        </div>
        {form.totalPrice&&form.amountPaid&&<div style={{background:"#f5f0f7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#7b2d8b"}}>
          {"Restante: "+fmtMoney((parseFloat(form.totalPrice)||0)-(parseFloat(form.amountPaid)||0))+" · Estado: "+(parseFloat(form.amountPaid)>=parseFloat(form.totalPrice)?"Pago completo":parseFloat(form.amountPaid)>0?"Parcial":"Pendiente")}
        </div>}
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!valid} onClick={function(){
        var caseId=uid();
        var price=parseFloat(form.totalPrice)||0;
        var paid=parseFloat(form.amountPaid)||0;
        var payStatus=paid>=price&&price>0?"pago":paid>0?"parcial":"pendiente";
        var newCase={id:caseId,patientId:form.patientId,status:"activa",startDate:todayISO(),currentWeek:1,mainCondition:form.mainCondition,objective:form.objective,notes:form.notes,totalPrice:price,paymentStatus:payStatus,paymentMethod:form.paymentMethod,installments:parseInt(form.installments)||1,amountPaid:paid,createdAt:new Date().toISOString()};
        var appts=FERTIL_CONSULT_TYPES.map(function(ct){return{id:uid(),patientId:form.patientId,fertilCaseId:caseId,programType:"fertil",consultationNumber:ct.num,consultationType:ct.type,title:"Fértil - "+ct.label,startAt:"2000-01-01T00:00:00.000Z",endAt:null,status:"programada",notes:""};});
        onSave(newCase,appts);
      }} style={{...S.btnFertil,flex:2,opacity:valid?1:0.5}}>{"💜 Crear caso y generar consultas"}</button></div>
    </div>
  </div>);
}

function FertilCaseDetail({fertilCase,patient,appointments,followups,labs,tasks,patients,allAppointments,dispatch,onUpdateCase,onUpdateAppointment,onAddFollowup,onUpdateFollowup,onAddLab,onAddTask,onUpdateTask,onDeleteTask,onDeleteCase,onBack,onGoToPatient}){
  const [tab,setTab]=useState("resumen");const fc=fertilCase;
  const caseAppts=(appointments||[]).filter(a=>a.fertilCaseId===fc.id).sort((a,b)=>(a.consultationNumber||0)-(b.consultationNumber||0));
  const caseFollowups=(followups||[]).filter(f=>f.fertilCaseId===fc.id);const caseLabs=(labs||[]).filter(l=>l.fertilCaseId===fc.id);const caseTasks=(tasks||[]).filter(t=>t.fertilCaseId===fc.id);
  const [payForm,setPayForm]=useState({amount:"",method:fc.paymentMethod||"transferencia"});const [showPayForm,setShowPayForm]=useState(false);
  const [scheduleAppt,setScheduleAppt]=useState(null);const [schedForm,setSchedForm]=useState({date:"",time:""});
  const [showFollowupForm,setShowFollowupForm]=useState(false);const [editingFollowupId,setEditingFollowupId]=useState(null);const [ffForm,setFfForm]=useState({weekNumber:fc.currentWeek,date:todayISO(),weight:"",symptoms:"",mood:"",sleepQuality:"",digestion:"",adherence:"",notes:""});
  const [showLabForm,setShowLabForm]=useState(false);const [labForm,setLabForm]=useState({date:todayISO(),labType:"",results:"",notes:""});
  const [newTaskTitle,setNewTaskTitle]=useState("");
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const checkConflict=(date,time)=>{if(!date||!time)return false;const startAt=new Date(`${date}T${time}`);const endAt=new Date(startAt.getTime()+3600000);return(allAppointments||[]).some(a=>{if(a.id===scheduleAppt?.id||a.status==="cancelada")return false;const aS=new Date(a.startAt);const aE=a.endAt?new Date(a.endAt):new Date(aS.getTime()+3600000);return startAt<aE&&endAt>aS;});};
  const hasConflict=scheduleAppt&&schedForm.date&&schedForm.time?checkConflict(schedForm.date,schedForm.time):false;
  const tabs=[["resumen","📋 Resumen"],["pago","💰 Pago"],["consultas","📅 Consultas"],["seguimientos","📝 Seguimientos"],["analisis","🔬 Análisis"],["tareas","✅ Tareas"]];

  // Executive summary data
  var realizadas=caseAppts.filter(function(a){return a.status==="realizada";}).length;
  var nextAppt=caseAppts.filter(function(a){
    if(a.status!=="programada")return false;
    var createdRecently=Math.abs(new Date(a.startAt).getTime()-new Date(fc.createdAt).getTime())<60000;
    return!createdRecently&&new Date(a.startAt).getFullYear()>2020;
  }).sort(function(a,b){return a.startAt.localeCompare(b.startAt);})[0];
  var lastFollowup=caseFollowups.length>0?caseFollowups.sort(function(a,b){return new Date(b.date)-new Date(a.date);})[0]:null;
  var restante=fc.totalPrice-fc.amountPaid;
  var payColor=fc.paymentStatus==="pago"?"#52b788":fc.paymentStatus==="parcial"?"#f4a261":"#e76f51";

  return(<div>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      <button onClick={onBack} style={S.btnGhost}>{"← Volver"}</button>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>{"💜"}</span>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:C.fertil}}>{patient&&patient.nombre?patient.nombre:"Paciente"}</h2>
          <Badge label={FERTIL_STATUS_LABELS[fc.status]} color={(FERTIL_STATUS_COLORS[fc.status]||"#aaa")+"22"} text={FERTIL_STATUS_COLORS[fc.status]||"#aaa"}/>
        </div>
        {fc.mainCondition&&<div style={{fontSize:13,color:"#7a9a8a",marginTop:2}}>{fc.mainCondition}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={function(){onGoToPatient(fc.patientId);}} style={S.btnOutline}>{"Ver ficha"}</button>
        {fc.status==="activa"&&<select value={fc.currentWeek} onChange={function(e){onUpdateCase({...fc,currentWeek:parseInt(e.target.value)});}} style={{...S.input,width:110,fontSize:12}}>{[1,2,3,4,5,6,7,8].map(function(w){return <option key={w} value={w}>{"Semana "+w}</option>;})}</select>}
        <select value={fc.status} onChange={function(e){onUpdateCase({...fc,status:e.target.value});}} style={{...S.input,width:110,fontSize:12}}>{Object.entries(FERTIL_STATUS_LABELS).map(function(entry){return <option key={entry[0]} value={entry[0]}>{entry[1]}</option>;})}</select>
        <button onClick={function(){setDeleteConfirm(true);}} style={S.btnDanger}>{"🗑"}</button>
      </div>
    </div>

    {/* Executive summary cards */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
      <div style={{...S.card,flex:1,minWidth:120,padding:"14px 16px",borderTop:"3px solid "+C.fertil}}>
        <div style={{fontSize:10,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Semana actual</div>
        <div style={{fontSize:28,fontWeight:700,color:C.fertil,marginTop:4}}>{fc.currentWeek}<span style={{fontSize:14,fontWeight:400,color:"#7a9a8a"}}>{" / 8"}</span></div>
        <div style={{fontSize:11,color:"#7a9a8a",marginTop:2}}>{"Inicio: "+fmtDate(fc.startDate)}</div>
      </div>
      <div style={{...S.card,flex:1,minWidth:120,padding:"14px 16px",borderTop:nextAppt?"3px solid "+C.ok:"3px solid #e0e0e0"}}>
        <div style={{fontSize:10,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Próxima consulta</div>
        {nextAppt?<div><div style={{fontSize:15,fontWeight:700,color:"#1a3d2b",marginTop:4}}>{fmtDate(nextAppt.startAt.split("T")[0])}</div><div style={{fontSize:11,color:"#7a9a8a"}}>{nextAppt.title}</div></div>:<div style={{fontSize:13,fontWeight:600,color:"#aaa",marginTop:4}}>{"Sin programar"}</div>}
      </div>
      <div style={{...S.card,flex:1,minWidth:120,padding:"14px 16px",borderTop:"3px solid "+payColor}}>
        <div style={{fontSize:10,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Estado de pago</div>
        <div style={{marginTop:4}}><Badge label={FERTIL_PAYMENT_LABELS[fc.paymentStatus]} color={payColor+"22"} text={payColor}/></div>
        <div style={{fontSize:12,color:payColor,fontWeight:700,marginTop:4}}>{restante>0?fmtMoney(restante)+" restante":"Pago completo"}</div>
      </div>
      <div style={{...S.card,flex:1,minWidth:120,padding:"14px 16px",borderTop:"3px solid "+C.ok}}>
        <div style={{fontSize:10,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Consultas</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4}}>
          <span style={{fontSize:28,fontWeight:700,color:"#1a3d2b"}}>{realizadas}</span>
          <span style={{fontSize:14,color:"#7a9a8a"}}>{"/ 5"}</span>
        </div>
        <div style={{display:"flex",gap:3,marginTop:4}}>{FERTIL_CONSULT_TYPES.map(function(ct){var a=caseAppts.find(function(x){return x.consultationNumber===ct.num;});var done=a&&a.status==="realizada";return <div key={ct.num} style={{width:14,height:14,borderRadius:3,background:done?C.ok:"#e0e0e0"}}></div>;})}</div>
      </div>
      <div style={{...S.card,flex:1,minWidth:120,padding:"14px 16px",borderTop:"3px solid "+(lastFollowup?"#a855f7":"#e0e0e0")}}>
        <div style={{fontSize:10,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Último seguimiento</div>
        {lastFollowup?<div><div style={{fontSize:13,fontWeight:700,color:"#1a3d2b",marginTop:4}}>{"Semana "+lastFollowup.weekNumber}</div><div style={{fontSize:11,color:"#7a9a8a"}}>{fmtDate(lastFollowup.date)}{lastFollowup.weight?" · "+lastFollowup.weight+" kg":""}</div></div>:<div style={{fontSize:13,fontWeight:600,color:"#aaa",marginTop:4}}>{"Sin seguimientos"}</div>}
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:20,background:"#f5f0f7",borderRadius:10,padding:4,overflowX:"auto"}}>{tabs.map(function(item){var id=item[0];var label=item[1];return(<button key={id} onClick={function(){setTab(id);}} style={{flex:"0 0 auto",padding:"8px 14px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:tab===id?700:500,cursor:"pointer",whiteSpace:"nowrap",background:tab===id?C.fertilLight:"transparent",color:tab===id?C.fertil:C.textSub,boxShadow:"none"}}>{label}</button>);})}</div>

    {tab==="resumen"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={S.card}><h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:C.fertil}}>Datos del caso</h4><div style={{fontSize:13,color:"#1a3d2b",lineHeight:2}}><div><strong>Condición:</strong> {fc.mainCondition||"—"}</div><div><strong>Objetivo:</strong> {fc.objective||"—"}</div><div><strong>Semana:</strong> {fc.currentWeek}/8</div><div><strong>Consultas:</strong> {caseAppts.filter(a=>a.status==="realizada").length}/5</div>{fc.notes&&<div><strong>Notas:</strong> {fc.notes}</div>}</div></div><div style={S.card}><h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:C.fertil}}>💰 Resumen de pago</h4><div style={{fontSize:13,color:"#1a3d2b",lineHeight:2}}><div><strong>Total:</strong> {fmtMoney(fc.totalPrice)}</div><div><strong>Pagado:</strong> <span style={{color:"#52b788",fontWeight:700}}>{fmtMoney(fc.amountPaid)}</span></div><div><strong>Restante:</strong> <span style={{color:fc.totalPrice-fc.amountPaid>0?"#e76f51":"#52b788",fontWeight:700}}>{fmtMoney(fc.totalPrice-fc.amountPaid)}</span></div><div><strong>Estado:</strong> <Badge label={FERTIL_PAYMENT_LABELS[fc.paymentStatus]} color={FERTIL_PAYMENT_COLORS[fc.paymentStatus]+"22"} text={FERTIL_PAYMENT_COLORS[fc.paymentStatus]}/></div></div></div></div>}

    {tab==="pago"&&<div style={{maxWidth:480}}><div style={{...S.card,borderLeft:"4px solid #7b2d8b",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:16}}><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Precio total</div><div style={{fontSize:24,fontWeight:700,color:"#1a3d2b"}}>{fmtMoney(fc.totalPrice)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Pagado</div><div style={{fontSize:24,fontWeight:700,color:C.ok}}>{fmtMoney(fc.amountPaid)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Restante</div><div style={{fontSize:24,fontWeight:700,color:fc.totalPrice-fc.amountPaid>0?"#e76f51":"#52b788"}}>{fmtMoney(fc.totalPrice-fc.amountPaid)}</div></div><div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Estado</div><div style={{marginTop:6}}><Badge label={FERTIL_PAYMENT_LABELS[fc.paymentStatus]} color={FERTIL_PAYMENT_COLORS[fc.paymentStatus]+"22"} text={FERTIL_PAYMENT_COLORS[fc.paymentStatus]}/></div></div></div><div style={{fontSize:12,color:"#7a9a8a"}}>Método: {fc.paymentMethod||"—"} · Cuotas: {fc.installments||1}</div></div>
      <button onClick={()=>setShowPayForm(!showPayForm)} style={S.btnFertil}>{"💰 Registrar pago"}</button>
      {showPayForm&&<div style={{...S.card,marginTop:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Monto ($)" type="number" value={payForm.amount} onChange={v=>setPayForm(f=>({...f,amount:v}))} placeholder="50000"/><div style={{marginBottom:14}}><label style={S.label}>Método</label><select value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))} style={S.input}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mp">Mercado Pago</option></select></div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setShowPayForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!payForm.amount} onClick={()=>{const newPaid=(fc.amountPaid||0)+parseFloat(payForm.amount);const newStatus=newPaid>=fc.totalPrice?"pago":newPaid>0?"parcial":"pendiente";onUpdateCase({...fc,amountPaid:newPaid,paymentStatus:newStatus,paymentMethod:payForm.method});setPayForm({amount:"",method:fc.paymentMethod});setShowPayForm(false);}} style={{...S.btnFertil,flex:2,opacity:payForm.amount?1:.5}}>Registrar pago</button></div></div>}
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
          <div style={{display:"flex",gap:6}}>{a.status!=="realizada"&&<button onClick={function(){setScheduleAppt(a);setSchedForm({date:effectivelyScheduled?new Date(a.startAt).toISOString().split("T")[0]:"",time:effectivelyScheduled?new Date(a.startAt).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",hour12:false}):""});}} style={{...S.btnGhost,fontSize:11,padding:"5px 10px"}}>{effectivelyScheduled?"📅 Reprogramar":"📅 Programar consulta"}</button>}{a.status==="programada"&&<button onClick={function(){onUpdateAppointment({...a,status:"realizada"});}} style={{...S.btnGhost,fontSize:11,padding:"5px 10px",background:"#e8f5ee",color:"#2d6a4f"}}>{"✓ Marcar realizada"}</button>}</div>
        </div>{a.notes&&<div style={{fontSize:12,color:"#5a7a6a",marginTop:6,fontStyle:"italic"}}>{a.notes}</div>}</div>);
      })}
      {scheduleAppt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:400,width:"90%"}}><h3 style={{margin:"0 0 16px",color:"#7b2d8b",fontSize:16}}>{"📅 "+scheduleAppt.title}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha *" type="date" value={schedForm.date} onChange={v=>setSchedForm(f=>({...f,date:v}))}/><Field label="Hora *" type="time" value={schedForm.time} onChange={v=>setSchedForm(f=>({...f,time:v}))}/></div>{hasConflict&&<div style={{background:"#fff5f0",border:"1px solid #f5c6c6",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#c0392b",fontWeight:600}}>{"⚠️ Hay un conflicto de horario con otro turno"}</div>}<div style={{display:"flex",gap:10}}><button onClick={()=>setScheduleAppt(null)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button disabled={!schedForm.date||!schedForm.time||hasConflict} onClick={()=>{const sAt=new Date(schedForm.date+"T"+schedForm.time).toISOString();const eAt=new Date(new Date(schedForm.date+"T"+schedForm.time).getTime()+3600000).toISOString();onUpdateAppointment({...scheduleAppt,startAt:sAt,endAt:eAt,status:"programada"});setScheduleAppt(null);}} style={{...S.btnFertil,flex:2,opacity:(!schedForm.date||!schedForm.time||hasConflict)?0.5:1}}>{"Confirmar turno"}</button></div></div></div>}
    </div>}

    {tab==="seguimientos"&&<div>
      <button onClick={function(){setEditingFollowupId(null);setFfForm({weekNumber:fc.currentWeek,date:todayISO(),weight:"",symptoms:"",mood:"",sleepQuality:"",digestion:"",adherence:"",notes:""});setShowFollowupForm(!showFollowupForm);}} style={{...S.btnFertil,marginBottom:16}}>{"📝 Agregar seguimiento"}</button>
      {showFollowupForm&&<div style={{...S.card,marginBottom:18}}><h4 style={{margin:"0 0 12px",color:C.fertil}}>{editingFollowupId?"✏️ Editar seguimiento":"📝 Registrar seguimiento"}</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><div style={{marginBottom:14}}><label style={S.label}>Semana</label><select value={ffForm.weekNumber} onChange={e=>setFfForm(f=>({...f,weekNumber:parseInt(e.target.value)}))} style={S.input}>{[1,2,3,4,5,6,7,8].map(w=><option key={w} value={w}>Semana {w}</option>)}</select></div><Field label="Fecha" type="date" value={ffForm.date} onChange={v=>setFfForm(f=>({...f,date:v}))}/><Field label="Peso (kg)" type="number" value={ffForm.weight} onChange={v=>setFfForm(f=>({...f,weight:v}))} placeholder="65"/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Síntomas" value={ffForm.symptoms} onChange={v=>setFfForm(f=>({...f,symptoms:v}))} placeholder="Hinchazón, cansancio..." rows={2}/><Field label="Estado de ánimo" value={ffForm.mood} onChange={v=>setFfForm(f=>({...f,mood:v}))} placeholder="Bien, ansiosa..."/><Field label="Sueño" value={ffForm.sleepQuality} onChange={v=>setFfForm(f=>({...f,sleepQuality:v}))} placeholder="Bueno, regular..."/><Field label="Digestión" value={ffForm.digestion} onChange={v=>setFfForm(f=>({...f,digestion:v}))} placeholder="Normal, constipación..."/></div><Field label="Adherencia al plan" value={ffForm.adherence} onChange={v=>setFfForm(f=>({...f,adherence:v}))} placeholder="Buena, parcial..."/><Field label="Notas" value={ffForm.notes} onChange={v=>setFfForm(f=>({...f,notes:v}))} placeholder="Observaciones..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={function(){setShowFollowupForm(false);setEditingFollowupId(null);}} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={function(){
        if(editingFollowupId){
          onUpdateFollowup({id:editingFollowupId,fertilCaseId:fc.id,...ffForm,weight:parseFloat(ffForm.weight)||null});
        }else{
          onAddFollowup({id:uid(),fertilCaseId:fc.id,...ffForm,weight:parseFloat(ffForm.weight)||null});
        }
        setShowFollowupForm(false);setEditingFollowupId(null);setFfForm({weekNumber:fc.currentWeek,date:todayISO(),weight:"",symptoms:"",mood:"",sleepQuality:"",digestion:"",adherence:"",notes:""});
      }} style={{...S.btnFertil,flex:2}}>{editingFollowupId?"💾 Guardar cambios":"Guardar seguimiento"}</button></div></div>}
      {caseFollowups.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin seguimientos registrados</p>:caseFollowups.sort((a,b)=>b.weekNumber-a.weekNumber||new Date(b.date)-new Date(a.date)).map(function(f){return(<div key={f.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid "+C.fertil}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontWeight:700,color:C.fertil,fontSize:13}}>{"Semana "+f.weekNumber}</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:C.muted}}>{fmtDate(f.date)}</span>
            <button onClick={function(){setEditingFollowupId(f.id);setFfForm({weekNumber:f.weekNumber,date:f.date||todayISO(),weight:f.weight?String(f.weight):"",symptoms:f.symptoms||"",mood:f.mood||"",sleepQuality:f.sleepQuality||"",digestion:f.digestion||"",adherence:f.adherence||"",notes:f.notes||""});setShowFollowupForm(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px"}}>{"✏️"}</button>
          </div>
        </div>
        <div style={{fontSize:12,color:C.text,lineHeight:1.8}}>{f.weight&&<div>{"Peso: "+f.weight+" kg"}</div>}{f.symptoms&&<div>{"Síntomas: "+f.symptoms}</div>}{f.mood&&<div>{"Ánimo: "+f.mood}</div>}{f.sleepQuality&&<div>{"Sueño: "+f.sleepQuality}</div>}{f.digestion&&<div>{"Digestión: "+f.digestion}</div>}{f.adherence&&<div>{"Adherencia: "+f.adherence}</div>}{f.notes&&<div style={{fontStyle:"italic",color:C.textSub,marginTop:4}}>{f.notes}</div>}</div>
      </div>);})}
    </div>}

    {tab==="analisis"&&<div>
      <button onClick={()=>setShowLabForm(!showLabForm)} style={{...S.btnFertil,marginBottom:16}}>{"🔬 Cargar análisis"}</button>
      {showLabForm&&<div style={{...S.card,marginBottom:18}}><h4 style={{margin:"0 0 12px",color:"#7b2d8b"}}>🔬 Registrar análisis</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Fecha" type="date" value={labForm.date} onChange={v=>setLabForm(f=>({...f,date:v}))}/><Field label="Tipo de análisis" value={labForm.labType} onChange={v=>setLabForm(f=>({...f,labType:v}))} placeholder="Hormonal, hemograma..."/></div><Field label="Resultados" value={labForm.results} onChange={v=>setLabForm(f=>({...f,results:v}))} placeholder="Valores relevantes..." rows={3}/><Field label="Notas" value={labForm.notes} onChange={v=>setLabForm(f=>({...f,notes:v}))} placeholder="Observaciones..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={()=>setShowLabForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onAddLab({id:uid(),fertilCaseId:fc.id,...labForm});setShowLabForm(false);setLabForm({date:todayISO(),labType:"",results:"",notes:""});}} style={{...S.btnFertil,flex:2}}>{"Guardar análisis"}</button></div></div>}
      {caseLabs.length===0?<EmptyState icon="🔬" title="Sin análisis registrados" sub="Agregá resultados de laboratorio"/>:caseLabs.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>(<div key={l.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #a855f7"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:700,color:C.fertil,fontSize:13}}>{l.labType||"Análisis"}</span><span style={{fontSize:12,color:"#7a9a8a"}}>{fmtDate(l.date)}</span></div>{l.results&&<div style={{fontSize:12,color:"#1a3d2b",whiteSpace:"pre-wrap",marginBottom:4}}>{l.results}</div>}{l.notes&&<div style={{fontSize:12,color:"#5a7a6a",fontStyle:"italic"}}>{l.notes}</div>}</div>))}
    </div>}

    {tab==="tareas"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:16}}><input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="Nueva tarea..." style={{...S.input,flex:1}} onKeyDown={e=>{if(e.key==="Enter"&&newTaskTitle.trim()){onAddTask({id:uid(),fertilCaseId:fc.id,title:newTaskTitle.trim(),done:false,dueDate:null});setNewTaskTitle("");}}}/><button disabled={!newTaskTitle.trim()} onClick={()=>{onAddTask({id:uid(),fertilCaseId:fc.id,title:newTaskTitle.trim(),done:false,dueDate:null});setNewTaskTitle("");}} style={{...S.btnFertil,opacity:newTaskTitle.trim()?1:.5}}>{"Agregar tarea"}</button></div>
      {caseTasks.length===0?<p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"40px 0"}}>Sin tareas</p>:caseTasks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:t.done?"#f8f8f8":"#fff",borderRadius:10,marginBottom:6,border:"1px solid #f0f4f1"}}><button onClick={()=>onUpdateTask({...t,done:!t.done})} style={{width:20,height:20,borderRadius:4,border:`2px solid ${t.done?"#52b788":"#7b2d8b"}`,background:t.done?"#52b788":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",padding:0,flexShrink:0}}>{t.done?"✓":""}</button><span style={{flex:1,fontSize:13,color:t.done?"#aaa":"#1a3d2b",textDecoration:t.done?"line-through":"none"}}>{t.title}</span><button onClick={()=>onDeleteTask(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:"#ccc"}}>✕</button></div>))}
    </div>}
    {deleteConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:400,width:"90%",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>{"⚠️"}</div><h3 style={{margin:"0 0 8px",color:"#7b2d8b"}}>{"¿Eliminar este caso Fértil?"}</h3><p style={{fontSize:13,color:"#5a7a6a",marginBottom:8}}>{"Se eliminará el caso, sus consultas, seguimientos, análisis y tareas."}</p><p style={{fontSize:12,color:"#e76f51",fontWeight:600,marginBottom:20}}>{"El paciente NO se elimina de la lista general."}</p><div style={{display:"flex",gap:10}}><button onClick={function(){setDeleteConfirm(false);}} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={function(){onDeleteCase(fc.id);}} style={{...S.btnPrimary,flex:1,background:"#c0392b"}}>{"Sí, eliminar caso"}</button></div></div></div>}
  </div>);
}

// ─── LEADS MODULE ─────────────────────────────────────────────────────────────
var LEAD_ESTADOS=[
  {id:"nuevo",label:"Nuevo",color:C.lead},
  {id:"respondido",label:"Respondido",color:C.fertilAlt},
  {id:"esperando",label:"Esperando",color:C.warn},
  {id:"seguimiento",label:"Seguimiento",color:C.danger},
  {id:"consulta",label:"Consulta",color:C.ok},
  {id:"fertil",label:"Fértil",color:C.fertil},
  {id:"descartado",label:"Descartado",color:C.mutedLight}
];
var LEAD_ORIGENES=[{id:"instagram",label:"Instagram"},{id:"derivacion",label:"Derivación"},{id:"web",label:"Web"},{id:"otro",label:"Otro"}];
var LEAD_INTERES=[{id:"consulta",label:"Consulta"},{id:"fertil",label:"Fértil"},{id:"indefinido",label:"Indefinido"}];

function getLeadEstadoColor(estado){var e=LEAD_ESTADOS.find(function(x){return x.id===estado;});return e?e.color:"#aaa";}
function getLeadEstadoLabel(estado){var e=LEAD_ESTADOS.find(function(x){return x.id===estado;});return e?e.label:estado;}

function LeadForm({lead,onSave,onCancel}){
  var isEdit=!!lead;
  var defaultSeg=new Date(new Date().getTime()+2*86400000).toISOString().split("T")[0];
  var [form,setForm]=useState(lead?{nombre:lead.nombre,instagram:lead.instagram,telefono:lead.telefono,origen:lead.origen,estado:lead.estado,interes:lead.interes,proximoSeguimiento:lead.proximoSeguimiento,accionPendiente:lead.accionPendiente,notas:lead.notas}:{nombre:"",instagram:"",telefono:"",origen:"instagram",estado:"nuevo",interes:"indefinido",proximoSeguimiento:defaultSeg,accionPendiente:"Responder mensaje",notas:""});
  var set=function(k,v){setForm(function(f){var n={...f};n[k]=v;return n;});};
  var valid=form.nombre.trim();
  return(<div style={S.card}>
    <h3 style={{margin:"0 0 16px",color:"#7b2d8b",fontSize:16}}>{isEdit?"✏️ Editar Lead":"➕ Nuevo Lead"}</h3>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Nombre *" value={form.nombre} onChange={function(v){set("nombre",v);}} placeholder="Nombre del lead"/>
      <Field label="Instagram" value={form.instagram} onChange={function(v){set("instagram",v);}} placeholder="@usuario"/>
    </div>
    <Field label="Teléfono" value={form.telefono} onChange={function(v){set("telefono",v);}} placeholder="5411XXXXXXXX"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <div style={{marginBottom:14}}><label style={S.label}>Origen</label><select value={form.origen} onChange={function(e){set("origen",e.target.value);}} style={S.input}>{LEAD_ORIGENES.map(function(o){return <option key={o.id} value={o.id}>{o.label}</option>;})}</select></div>
      <div style={{marginBottom:14}}><label style={S.label}>Estado</label><select value={form.estado} onChange={function(e){set("estado",e.target.value);}} style={S.input}>{LEAD_ESTADOS.map(function(o){return <option key={o.id} value={o.id}>{o.label}</option>;})}</select></div>
      <div style={{marginBottom:14}}><label style={S.label}>Interés</label><select value={form.interes} onChange={function(e){set("interes",e.target.value);}} style={S.input}>{LEAD_INTERES.map(function(o){return <option key={o.id} value={o.id}>{o.label}</option>;})}</select></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Próximo seguimiento" type="date" value={form.proximoSeguimiento} onChange={function(v){set("proximoSeguimiento",v);}}/>
      <Field label="Acción pendiente" value={form.accionPendiente} onChange={function(v){set("accionPendiente",v);}} placeholder="Ej: Enviar info del programa"/>
    </div>
    <Field label="Notas" value={form.notas} onChange={function(v){set("notas",v);}} placeholder="Observaciones..." rows={3}/>
    <div style={{display:"flex",gap:10}}>
      <button onClick={onCancel} style={{...S.btnGhost,flex:1}}>Cancelar</button>
      <button disabled={!valid} onClick={function(){
        var now=new Date().toISOString();
        onSave({id:isEdit?lead.id:uid(),nombre:form.nombre.trim(),instagram:form.instagram.trim(),telefono:form.telefono.trim(),origen:form.origen,estado:form.estado,interes:form.interes,ultimaInteraccion:now,proximoSeguimiento:form.proximoSeguimiento,accionPendiente:form.accionPendiente,notas:form.notas,createdAt:isEdit?lead.createdAt:now});
      }} style={{...S.btnFertil,flex:2,opacity:valid?1:0.5}}>{isEdit?"💾 Guardar cambios":"📱 Crear lead"}</button>
    </div>
  </div>);
}

function LeadsList({leads,onAddLead,onUpdateLead,onDeleteLead}){
  var [search,setSearch]=useState("");
  var [filterEstado,setFilterEstado]=useState("all");
  var [showForm,setShowForm]=useState(false);
  var [editingLead,setEditingLead]=useState(null);
  var todayStr=todayISO();

  var filtered=leads.filter(function(l){
    if(filterEstado!=="all"&&l.estado!==filterEstado)return false;
    if(search&&l.nombre.toLowerCase().indexOf(search.toLowerCase())===-1&&(l.instagram||"").toLowerCase().indexOf(search.toLowerCase())===-1)return false;
    return true;
  });

  // Resumen
  var seguimientoHoy=leads.filter(function(l){return l.proximoSeguimiento===todayStr&&l.estado!=="descartado";});
  var sinResponder=leads.filter(function(l){return l.estado==="nuevo";});
  var enSeguimiento=leads.filter(function(l){return l.estado==="seguimiento";});
  var vencidos=leads.filter(function(l){return l.proximoSeguimiento&&l.proximoSeguimiento<todayStr&&l.estado!=="descartado"&&l.estado!=="fertil"&&l.estado!=="consulta";});

  var handleSave=function(l){
    if(editingLead){onUpdateLead(l);}else{onAddLead(l);}
    setShowForm(false);setEditingLead(null);
  };

  var handleDelete=function(id){
    if(confirm("¿Eliminar este lead?")){onDeleteLead(id);setEditingLead(null);setShowForm(false);}
  };

  var waLink=function(tel,nombre){
    var phone=(tel||"").replace(/[^0-9]/g,"");
    if(!phone)return null;
    return "https://wa.me/"+phone+"?text="+encodeURIComponent("Hola "+nombre+"! Te escribo de parte de Julieta Lupardo Nutrición 🌿");
  };

  // Detail view
  if(editingLead&&!showForm){
    var l=editingLead;
    var estadoColor=getLeadEstadoColor(l.estado);
    var wa=waLink(l.telefono,l.nombre);
    return(<div>
      <button onClick={function(){setEditingLead(null);}} style={S.btnGhost}>{"← Volver a leads"}</button>
      <div style={{...S.card,marginTop:16,borderLeft:"4px solid "+estadoColor}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"#1a3d2b"}}>{l.nombre}</h3>
            <div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>{l.instagram&&("@"+(l.instagram.replace("@",""))+" · ")}{LEAD_ORIGENES.find(function(o){return o.id===l.origen;})?.label||l.origen}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {wa&&<a href={wa} target="_blank" rel="noopener noreferrer" style={{...S.btnFertil,padding:"8px 14px",fontSize:12,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,background:"#25D366"}}>{"📱 WhatsApp"}</a>}
            <button onClick={function(){setShowForm(true);}} style={{...S.btnOutline,fontSize:12,padding:"8px 14px"}}>{"✏️ Editar"}</button>
            <button onClick={function(){handleDelete(l.id);}} style={{...S.btnDanger,fontSize:12,padding:"8px 14px"}}>{"🗑"}</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
          <div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Estado</div><div style={{marginTop:4}}><Badge label={getLeadEstadoLabel(l.estado)} color={estadoColor+"22"} text={estadoColor}/></div></div>
          <div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Interés</div><div style={{marginTop:4,fontSize:14,fontWeight:600,color:"#1a3d2b"}}>{LEAD_INTERES.find(function(x){return x.id===l.interes;})?.label||l.interes}</div></div>
          <div><div style={{fontSize:11,color:"#7a9a8a",fontWeight:600,textTransform:"uppercase"}}>Próximo seguimiento</div><div style={{marginTop:4,fontSize:14,fontWeight:600,color:l.proximoSeguimiento&&l.proximoSeguimiento<=todayStr?"#e76f51":"#1a3d2b"}}>{l.proximoSeguimiento?fmtDate(l.proximoSeguimiento):"Sin fecha"}</div></div>
        </div>
        {l.accionPendiente&&<div style={{background:"#fff5f0",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13}}><strong style={{color:"#e76f51"}}>{"Acción pendiente: "}</strong>{l.accionPendiente}</div>}
        {l.telefono&&<div style={{fontSize:13,color:"#5a7a6a",marginBottom:6}}>{"📞 "+l.telefono}</div>}
        {l.notas&&<div style={{background:"#f5f0f7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#1a3d2b",whiteSpace:"pre-wrap"}}>{l.notas}</div>}
        <div style={{fontSize:11,color:"#aaa",marginTop:12}}>{"Creado: "+fmtDate(l.createdAt?(l.createdAt.split("T")[0]):"")}</div>
      </div>
    </div>);
  }

  // Edit form
  if(showForm){
    return(<div>
      <LeadForm lead={editingLead} onSave={handleSave} onCancel={function(){setShowForm(false);setEditingLead(null);}}/>
    </div>);
  }

  // List view
  var estadoButtons=[["all","Todos"]].concat(LEAD_ESTADOS.map(function(e){return[e.id,e.label];}));
  return(<div>
    {/* Resumen */}
    {(seguimientoHoy.length>0||sinResponder.length>0||vencidos.length>0)&&<div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      {seguimientoHoy.length>0&&<div style={{...S.card,flex:1,minWidth:180,borderLeft:"4px solid #7b2d8b",padding:"12px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.fertil,marginBottom:4}}>{"📋 Hoy tenés "+seguimientoHoy.length+" seguimiento"+(seguimientoHoy.length>1?"s":"")+" pendiente"+(seguimientoHoy.length>1?"s":"")}</div>{seguimientoHoy.slice(0,3).map(function(l){return <div key={l.id} style={{fontSize:12,color:"#5a7a6a"}}>{l.nombre+(l.accionPendiente?" — "+l.accionPendiente:"")}</div>;})}</div>}
      {sinResponder.length>0&&<div style={{...S.card,flex:1,minWidth:180,borderLeft:"4px solid #3b82f6",padding:"12px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.lead}}>{"🆕 "+sinResponder.length+" lead"+(sinResponder.length>1?"s":"")+" sin responder"}</div></div>}
      {vencidos.length>0&&<div style={{...S.card,flex:1,minWidth:180,borderLeft:"4px solid #e76f51",padding:"12px 16px"}}><div style={{fontSize:13,fontWeight:700,color:C.danger}}>{"⚠️ "+vencidos.length+" seguimiento"+(vencidos.length>1?"s":"")+" vencido"+(vencidos.length>1?"s":"")}</div></div>}
    </div>}

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.fertil}}>Leads</h3>
      <button onClick={function(){setEditingLead(null);setShowForm(true);}} style={S.btnFertil}>{"📱 Nuevo lead"}</button>
    </div>

    <input placeholder="Buscar por nombre o Instagram..." value={search} onChange={function(e){setSearch(e.target.value);}} style={{...S.input,marginBottom:12}}/>
    <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap",overflowX:"auto"}}>{estadoButtons.map(function(item){var k=item[0];var lab=item[1];return(<button key={k} onClick={function(){setFilterEstado(k);}} style={{padding:"4px 10px",borderRadius:16,fontSize:11,cursor:"pointer",border:filterEstado===k?"2px solid #7b2d8b":"1px solid #d8e8df",background:filterEstado===k?"#7b2d8b":"#fff",color:filterEstado===k?"#fff":"#5a7a6a",fontFamily:"inherit",fontWeight:600,whiteSpace:"nowrap"}}>{lab}</button>);})}</div>

    {filtered.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:8}}>{"📱"}</div><p style={{color:"#aaa",fontSize:13}}>No hay leads{filterEstado!=="all"?" con este estado":""}</p></div>:
    filtered.map(function(l){
      var estadoColor=getLeadEstadoColor(l.estado);
      var isOverdue=l.proximoSeguimiento&&l.proximoSeguimiento<todayStr&&l.estado!=="descartado"&&l.estado!=="fertil"&&l.estado!=="consulta";
      var isToday=l.proximoSeguimiento===todayStr;
      return(<div key={l.id} onClick={function(){setEditingLead(l);}} style={{...S.card,marginBottom:8,cursor:"pointer",borderLeft:"4px solid "+estadoColor,transition:"box-shadow .2s"}} onMouseEnter={function(e){e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";}} onMouseLeave={function(e){e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:estadoColor+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:estadoColor,fontWeight:700}}>{l.nombre.charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{l.nombre}</span>
              <Badge label={getLeadEstadoLabel(l.estado)} color={estadoColor+"22"} text={estadoColor}/>
              {l.interes!=="indefinido"&&<Badge label={l.interes==="fertil"?"Fértil":"Consulta"} color={l.interes==="fertil"?"#f3e5f5":"#e8f5ee"} text={l.interes==="fertil"?"#7b2d8b":"#2d6a4f"}/>}
            </div>
            <div style={{fontSize:12,color:"#7a9a8a",marginTop:3}}>
              {l.instagram&&("@"+l.instagram.replace("@","")+" · ")}
              {LEAD_ORIGENES.find(function(o){return o.id===l.origen;})?.label||l.origen}
              {l.proximoSeguimiento&&<span style={{color:isOverdue?"#e76f51":isToday?"#7b2d8b":"#7a9a8a",fontWeight:isOverdue||isToday?700:400}}>{" · Seg: "+fmtDate(l.proximoSeguimiento)}</span>}
            </div>
            {l.accionPendiente&&<div style={{fontSize:12,color:"#e76f51",marginTop:2,fontWeight:600}}>{"→ "+l.accionPendiente}</div>}
          </div>
          <span style={{color:"#a855f7",fontSize:20}}>{"›"}</span>
        </div>
      </div>);
    })}
  </div>);
}

function FertilModule({state,dispatch,patients,onGoToPatient}){
  const [subScreen,setSubScreen]=useState("dashboard");const [selectedCaseId,setSelectedCaseId]=useState(null);const [subTab,setSubTab]=useState("dashboard");
  const fertilCases=state.fertilCases||[];const appointments=state.appointments||[];const followups=state.fertilFollowups||[];const labs=state.fertilLabs||[];const tasks=state.fertilTasks||[];const leads=state.fertilLeads||[];
  const selectedCase=fertilCases.find(c=>c.id===selectedCaseId);const selectedPatient=selectedCase?patients.find(p=>p.id===selectedCase.patientId):null;

  if(subScreen==="new-case")return<FertilNewCase patients={patients} fertilCases={fertilCases} onSave={async(newCase,appts)=>{dispatch({type:"ADD_FERTIL_CASE",c:newCase});await sbUpsertFertilCase(newCase);for(const a of appts){dispatch({type:"ADD_APPOINTMENT",a});await sbUpsertAppointment(a);}setSubScreen("dashboard");}} onCancel={()=>setSubScreen("dashboard")}/>;

  if(subScreen==="case-detail"&&selectedCase)return<FertilCaseDetail fertilCase={selectedCase} patient={selectedPatient} appointments={appointments} followups={followups} labs={labs} tasks={tasks} patients={patients} allAppointments={appointments} dispatch={dispatch}
    onUpdateCase={async c=>{dispatch({type:"UPDATE_FERTIL_CASE",c});await sbUpsertFertilCase(c);}}
    onUpdateAppointment={async a=>{dispatch({type:"UPDATE_APPOINTMENT",a});await sbUpdateAppointment(a);}}
    onAddFollowup={async f=>{dispatch({type:"ADD_FERTIL_FOLLOWUP",f});await sbInsertFertilFollowup(f);}}
    onUpdateFollowup={async f=>{dispatch({type:"UPDATE_FERTIL_FOLLOWUP",f});await sbUpdateFertilFollowup(f);}}
    onAddLab={async l=>{dispatch({type:"ADD_FERTIL_LAB",l});await sbInsertFertilLab(l);}}
    onAddTask={async t=>{dispatch({type:"ADD_FERTIL_TASK",t});await sbInsertFertilTask(t);}}
    onUpdateTask={async t=>{dispatch({type:"UPDATE_FERTIL_TASK",t});await sbUpdateFertilTask(t);}}
    onDeleteTask={async id=>{dispatch({type:"DELETE_FERTIL_TASK",id});await sbDeleteFertilTask(id);}}
    onDeleteCase={async function(caseId){
      var fc=fertilCases.find(function(c){return c.id===caseId;});
      if(!fc)return;
      // Eliminar appointments del caso
      var cAppts=appointments.filter(function(a){return a.fertilCaseId===caseId;});
      for(var a of cAppts){dispatch({type:"DELETE_APPOINTMENT",id:a.id});try{await sbDeleteAppointment(a.id);}catch(e){}}
      // Eliminar followups
      var cFups=followups.filter(function(f){return f.fertilCaseId===caseId;});
      for(var f of cFups){try{await fetch(SUPABASE_URL+"/rest/v1/fertil_followups?id=eq."+f.id,{method:"DELETE",headers:sbHeaders});}catch(e){}}
      // Eliminar labs
      var cLabs=labs.filter(function(l){return l.fertilCaseId===caseId;});
      for(var l of cLabs){try{await fetch(SUPABASE_URL+"/rest/v1/fertil_labs?id=eq."+l.id,{method:"DELETE",headers:sbHeaders});}catch(e){}}
      // Eliminar tasks
      var cTasks=tasks.filter(function(t){return t.fertilCaseId===caseId;});
      for(var t of cTasks){try{await sbDeleteFertilTask(t.id);}catch(e){}}
      // Eliminar el caso
      try{await fetch(SUPABASE_URL+"/rest/v1/fertil_cases?id=eq."+caseId,{method:"DELETE",headers:sbHeaders});}catch(e){}
      // Actualizar state
      dispatch({type:"LOAD_FERTIL",cases:fertilCases.filter(function(c){return c.id!==caseId;}),appointments:appointments.filter(function(a){return a.fertilCaseId!==caseId;}),followups:followups.filter(function(f){return f.fertilCaseId!==caseId;}),labs:labs.filter(function(l){return l.fertilCaseId!==caseId;}),tasks:tasks.filter(function(t){return t.fertilCaseId!==caseId;}),leads:state.fertilLeads||[]});
      setSubScreen("dashboard");setSelectedCaseId(null);
    }}
    onBack={()=>setSubScreen("dashboard")} onGoToPatient={onGoToPatient}/>;

  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:20,background:"#f5f0f7",borderRadius:10,padding:4}}>{[["dashboard","📊 Dashboard"],["pacientes","👩 Pacientes"],["leads","📱 Leads"]].map(([id,label])=>(<button key={id} onClick={()=>setSubTab(id)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:subTab===id?700:500,cursor:"pointer",background:subTab===id?C.fertilLight:"transparent",color:subTab===id?C.fertil:C.textSub,boxShadow:"none"}}>{label}{id==="leads"&&leads.filter(function(l){return l.estado==="nuevo"||l.proximoSeguimiento===todayISO();}).length>0&&<span style={{marginLeft:4,background:"#e76f51",color:"#fff",borderRadius:"50%",width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{leads.filter(function(l){return l.estado==="nuevo"||l.proximoSeguimiento===todayISO();}).length}</span>}</button>))}</div>
    {subTab==="dashboard"&&<FertilDashboard fertilCases={fertilCases} patients={patients} appointments={appointments} onSelectCase={id=>{setSelectedCaseId(id);setSubScreen("case-detail");}} onNewCase={()=>setSubScreen("new-case")}/>}
    {subTab==="pacientes"&&<><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.fertil}}>Pacientes Fértil</h3><button onClick={()=>setSubScreen("new-case")} style={S.btnFertil}>{"💜 Nueva paciente"}</button></div><FertilPatientList fertilCases={fertilCases} patients={patients} appointments={appointments} onSelectCase={id=>{setSelectedCaseId(id);setSubScreen("case-detail");}}/></>}
    {subTab==="leads"&&<LeadsList leads={leads} onAddLead={async function(l){dispatch({type:"ADD_LEAD",l:l});await sbInsertLead(l);} } onUpdateLead={async function(l){dispatch({type:"UPDATE_LEAD",l:l});await sbUpdateLead(l);}} onDeleteLead={async function(id){dispatch({type:"DELETE_LEAD",id:id});await sbDeleteLead(id);}}/>}
  </div>);
}

// ─── HOY DASHBOARD ────────────────────────────────────────────────────────────
function TodayDashboard({state,patients,onGoToPatient,onGoToFertilCase,onGoToAgenda,onGoToLeads,onDeleteEvento}){
  var todayStr=todayISO();
  var tomorrowStr=new Date(new Date().getTime()+86400000).toISOString().split("T")[0];
  var now=new Date();
  var nowISO=now.toISOString();
  var eventos=state.eventos||[];
  var appointments=state.appointments||[];
  var fertilCases=state.fertilCases||[];
  var consultas=state.consultas||[];
  var leads=state.fertilLeads||[];

  // Consultas/eventos de hoy
  var eventosHoy=eventos.filter(function(e){return e.fecha===todayStr&&!e.completado;});
  var apptsHoy=appointments.filter(function(a){return a.startAt&&a.startAt.startsWith(todayStr)&&a.status!=="cancelada";});
  var totalHoy=eventosHoy.length+apptsHoy.length;

  // Consultas de mañana
  var eventosMañana=eventos.filter(function(e){return e.fecha===tomorrowStr&&!e.completado;});
  var apptsMañana=appointments.filter(function(a){return a.startAt&&a.startAt.startsWith(tomorrowStr)&&a.status!=="cancelada";});

  // Seguimientos Fértil vencidos
  var fertilProgramadas=appointments.filter(function(a){
    if(a.programType!=="fertil"||a.status!=="programada")return false;
    var fc=fertilCases.find(function(c){return c.id===a.fertilCaseId;});
    if(!fc)return false;
    var createdRecently=Math.abs(new Date(a.startAt).getTime()-new Date(fc.createdAt).getTime())<60000;
    return!createdRecently&&new Date(a.startAt)<now&&new Date(a.startAt).getFullYear()>2020;
  });

  // Pagos pendientes Fértil
  var pagosPendientes=fertilCases.filter(function(c){return c.status==="activa"&&(c.paymentStatus==="pendiente"||c.paymentStatus==="parcial");});

  // Leads sin responder
  var leadsNuevos=leads.filter(function(l){return l.estado==="nuevo";});
  var leadsSeguimientoHoy=leads.filter(function(l){return l.proximoSeguimiento===todayStr&&l.estado!=="descartado";});

  // Eventos vencidos
  var eventosVencidos=eventos.filter(function(e){return!e.completado&&e.fecha<todayStr;});

  // Próximos días (día 2 al 7 desde hoy, excluyendo hoy y mañana)
  var proximosDias=[];
  for(var d=2;d<=7;d++){
    var dateStr=new Date(now.getTime()+d*86400000).toISOString().split("T")[0];
    var dayEventos=eventos.filter(function(e){return e.fecha===dateStr&&!e.completado;});
    var dayAppts=appointments.filter(function(a){return a.startAt&&a.startAt.startsWith(dateStr)&&a.status!=="cancelada";});
    if(dayEventos.length>0||dayAppts.length>0){
      proximosDias.push({fecha:dateStr,label:new Date(now.getTime()+d*86400000).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"short"}),eventos:dayEventos,appts:dayAppts});
    }
  }

  // Saludo
  var hora=now.getHours();
  var saludo=hora<12?"Buenos días":hora<18?"Buenas tardes":"Buenas noches";

  var statCard=function(icon,value,label,sub,color,onClick){
    return(<div onClick={onClick} style={{...S.card,flex:1,minWidth:140,cursor:onClick?"pointer":"default",transition:"box-shadow .2s",borderTop:"3px solid "+color}} onMouseEnter={function(e){if(onClick)e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";}} onMouseLeave={function(e){e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
      <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:32,fontWeight:800,color:color,letterSpacing:"-1px",lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginTop:6,textTransform:"uppercase",letterSpacing:".5px"}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}
    </div>);
  };

  var renderApptItem=function(a){
    var p=patients.find(function(x){return x.id===a.patientId;});
    var pName=p?p.nombre:"Paciente";
    var dt=new Date(a.startAt);
    var hora=dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
    var isFertil=a.programType==="fertil";
    return(<div key={a.id} onClick={function(){if(isFertil&&a.fertilCaseId){onGoToFertilCase(a.fertilCaseId);}else if(p){onGoToPatient(p.id);}}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:isFertil?"#f9f0fc":"#f5faf7",borderRadius:10,marginBottom:6,cursor:"pointer",borderLeft:"3px solid "+(isFertil?"#7b2d8b":"#2d6a4f")}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:isFertil?"linear-gradient(135deg,#7b2d8b,#a855f7)":"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>{pName.charAt(0)}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1a3d2b"}}>{pName}</div>
        <div style={{fontSize:12,color:"#7a9a8a"}}>{hora+" · "+a.title}</div>
      </div>
      {isFertil&&<Badge label="Fértil" color="#f3e5f5" text="#7b2d8b"/>}
    </div>);
  };

  var renderEventoItem=function(e){
    return(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#f5faf7",borderRadius:10,marginBottom:6,borderLeft:"3px solid #52b788"}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{e.tipo==="turno"?"📅":e.tipo==="seguimiento"?"🔄":"🔔"}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1a3d2b"}}>{e.pacienteNombre||e.titulo}</div>
        <div style={{fontSize:12,color:"#7a9a8a"}}>{(e.hora?e.hora+" · ":"")+e.titulo}</div>
      </div>
    </div>);
  };

  return(<div>
    <div style={{marginBottom:24}}>
      <h2 style={{margin:0,fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-0.5px"}}>{saludo+", Julieta"}</h2>
      <p style={{margin:"6px 0 0",fontSize:14,color:C.muted}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
    </div>

    {/* Resumen rápido */}
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:24}}>
      {statCard("📅",totalHoy,"Consultas hoy",totalHoy===0?"Día libre":"pendientes",C.okDark,onGoToAgenda)}
      {statCard("💜",fertilCases.filter(function(c){return c.status==="activa";}).length,"Fértil activas","en programa","#7b2d8b")}
      {statCard("📱",leadsNuevos.length+leadsSeguimientoHoy.length,"Leads pendientes",(leadsNuevos.length?"nuevos: "+leadsNuevos.length:"")+(leadsSeguimientoHoy.length?" · hoy: "+leadsSeguimientoHoy.length:""),C.lead,leadsNuevos.length+leadsSeguimientoHoy.length>0?onGoToLeads:null)}
      {statCard("💰",pagosPendientes.length,"Pagos pendientes",pagosPendientes.length>0?"requieren atención":"todo al día",pagosPendientes.length>0?"#e76f51":"#52b788")}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
      {/* Columna izquierda: Hoy + próximos */}
      <div>
        <div style={{...S.card,marginBottom:18}}>
          <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:C.text}}>{"📅 Hoy"+(totalHoy>0?" · "+totalHoy+" turno"+(totalHoy>1?"s":""):"")}</h3>
          {totalHoy===0?<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.okLight,borderRadius:10}}><span style={{fontSize:20}}>{"☀️"}</span><div><div style={{fontSize:13,fontWeight:600,color:C.okDark}}>{"Día libre"}</div><div style={{fontSize:11,color:C.muted}}>{"No hay turnos para hoy"}</div></div></div>:<div>
            {apptsHoy.sort(function(a,b){return a.startAt.localeCompare(b.startAt);}).map(renderApptItem)}
            {eventosHoy.sort(function(a,b){return(a.hora||"").localeCompare(b.hora||"");}).map(renderEventoItem)}
          </div>}
        </div>

        {/* Mañana */}
        {(eventosMañana.length>0||apptsMañana.length>0)&&<div style={{...S.card,marginBottom:18}}>
          <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:C.ok}}>{"📋 Mañana · "+(eventosMañana.length+apptsMañana.length)+" turno"+(eventosMañana.length+apptsMañana.length>1?"s":"")}</h3>
          {apptsMañana.sort(function(a,b){return a.startAt.localeCompare(b.startAt);}).map(renderApptItem)}
          {eventosMañana.sort(function(a,b){return(a.hora||"").localeCompare(b.hora||"");}).map(renderEventoItem)}
        </div>}

        {/* Próximos días */}
        {proximosDias.length>0&&<div style={{...S.card}}>
          <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:C.textSub}}>{"🗓 Próximos días"}</h3>
          {proximosDias.map(function(dia){
            return(<div key={dia.fecha} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textSub,textTransform:"capitalize",marginBottom:6,paddingBottom:4,borderBottom:"1px solid "+C.borderLight}}>{dia.label}</div>
              {dia.appts.sort(function(a,b){return a.startAt.localeCompare(b.startAt);}).map(renderApptItem)}
              {dia.eventos.sort(function(a,b){return(a.hora||"").localeCompare(b.hora||"");}).map(renderEventoItem)}
            </div>);
          })}
        </div>}

        {/* Si no hay nada en toda la semana */}
        {totalHoy===0&&eventosMañana.length===0&&apptsMañana.length===0&&proximosDias.length===0&&<div style={{...S.card,textAlign:"center",padding:"30px 20px"}}><div style={{fontSize:28,marginBottom:6}}>{"🌿"}</div><p style={{color:C.muted,fontSize:12,margin:0}}>{"No hay turnos esta semana"}</p></div>}
      </div>

      {/* Columna derecha: Alertas y pendientes */}
      <div>
        {/* Seguimientos Fértil vencidos */}
        {fertilProgramadas.length>0&&<div style={{...S.card,marginBottom:18,borderLeft:"4px solid "+C.danger}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:C.danger}}>{"⚠️ "+fertilProgramadas.length+" consulta"+(fertilProgramadas.length>1?"s":"")+" Fértil vencida"+(fertilProgramadas.length>1?"s":"")}</h4>
          {fertilProgramadas.slice(0,4).map(function(a){var p=patients.find(function(x){return x.id===a.patientId;});return(<div key={a.id} onClick={function(){if(a.fertilCaseId)onGoToFertilCase(a.fertilCaseId);}} style={{fontSize:12,color:"#5a7a6a",padding:"4px 0",cursor:"pointer"}}>{(p?p.nombre:"Paciente")+" — "+a.title+" ("+fmtDate(a.startAt.split("T")[0])+")"}</div>);})}
        </div>}

        {/* Pagos pendientes */}
        {pagosPendientes.length>0&&<div style={{...S.card,marginBottom:18,borderLeft:"4px solid "+C.warn}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:"#f4a261"}}>{"💰 "+pagosPendientes.length+" pago"+(pagosPendientes.length>1?"s":"")+" pendiente"+(pagosPendientes.length>1?"s":"")}</h4>
          {pagosPendientes.map(function(c){var p=patients.find(function(x){return x.id===c.patientId;});return(<div key={c.id} onClick={function(){onGoToFertilCase(c.id);}} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#5a7a6a",padding:"4px 0",cursor:"pointer"}}><span>{p?p.nombre:"Paciente"}</span><span style={{fontWeight:700,color:c.paymentStatus==="pendiente"?"#e76f51":"#f4a261"}}>{fmtMoney(c.totalPrice-c.amountPaid)+" restante"}</span></div>);})}
        </div>}

        {/* Leads */}
        {(leadsNuevos.length>0||leadsSeguimientoHoy.length>0)&&<div style={{...S.card,marginBottom:18,borderLeft:"4px solid "+C.lead}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:C.lead}}>{"📱 Leads que necesitan atención"}</h4>
          {leadsSeguimientoHoy.map(function(l){return(<div key={l.id} onClick={onGoToLeads} style={{fontSize:12,color:"#5a7a6a",padding:"4px 0",cursor:"pointer"}}>{"📋 "+l.nombre+(l.accionPendiente?" — "+l.accionPendiente:"")}</div>);})}
          {leadsNuevos.map(function(l){return(<div key={l.id} onClick={onGoToLeads} style={{fontSize:12,color:C.lead,padding:"4px 0",cursor:"pointer"}}>{"🆕 "+l.nombre+" — sin responder"}</div>);})}
        </div>}

        {/* Eventos vencidos */}
        {eventosVencidos.length>0&&<div style={{...S.card,borderLeft:"4px solid #e76f51"}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:C.danger}}>{"⏰ "+eventosVencidos.length+" evento"+(eventosVencidos.length>1?"s":"")+" vencido"+(eventosVencidos.length>1?"s":"")}</h4>
          {eventosVencidos.map(function(e){return(<div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.borderLight}}>
            <div style={{fontSize:12,color:C.textSub}}>{fmtDate(e.fecha)+" — "+e.titulo+(e.pacienteNombre?" ("+e.pacienteNombre+")":"")}</div>
            <button onClick={function(){if(confirm("¿Eliminar este evento vencido?"))onDeleteEvento(e.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"2px 6px",color:C.danger,flexShrink:0}} title="Eliminar evento">{"✕"}</button>
          </div>);})}
        </div>}

        {/* Todo tranquilo */}
        {fertilProgramadas.length===0&&pagosPendientes.length===0&&leadsNuevos.length===0&&leadsSeguimientoHoy.length===0&&eventosVencidos.length===0&&<div style={{...S.card,textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:8}}>{"✨"}</div><p style={{color:"#52b788",fontWeight:600,fontSize:14}}>{"Todo al día"}</p><p style={{color:"#7a9a8a",fontSize:12}}>{"No hay alertas ni pendientes"}</p></div>}
      </div>
    </div>
  </div>);
}

function PatientList({patients,onSelect,onNew}) {
  const [search,setSearch]=useState("");const filtered=patients.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#1a3d2b"}}>👥 Pacientes</h2><button onClick={onNew} style={S.btnPrimary}>{"👤 Nueva paciente"}</button></div><input placeholder="🔍 Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,marginBottom:16}}/>{filtered.length===0?<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:40,marginBottom:12}}>🌿</div><p style={{color:"#7a9a8a",fontSize:15}}>No hay pacientes aún</p><button onClick={onNew} style={{...S.btnPrimary,marginTop:12}}>{"👤 Agregar primera paciente"}</button></div>:filtered.map(p=>(<div key={p.id} onClick={()=>onSelect(p.id)} style={{...S.card,marginBottom:14,display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"box-shadow .2s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"}><div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:18,flexShrink:0}}>{p.nombre.charAt(0).toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:17}}>{p.nombre}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{[p.edad&&`${p.edad} años`,p.objetivo,p.planes?.length&&`${p.planes.length} plan${p.planes.length!==1?"es":""}`].filter(Boolean).join(" · ")}</div></div><span style={{color:"#52b788",fontSize:20}}>›</span></div>))}</div>);
}

function NewPatient({onSave,onCancel}) {
  const [form,setForm]=useState({nombre:"",edad:"",peso:"",altura:"",sexo:"Femenino",objetivo:"",telefono:"",email:""});const set=(k,v)=>setForm(f=>({...f,[k]:v}));const valid=form.nombre&&form.edad;
  return (<div style={{maxWidth:560}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><button onClick={onCancel} style={S.btnGhost}>← Volver</button><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#1a3d2b"}}>Nueva paciente</h2></div><div style={S.card}><Field label="Nombre completo *" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Field label="Edad" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30"/><Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65"/><Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165"/></div><div style={{marginBottom:14}}><label style={S.label}>Sexo</label><div style={{display:"flex",gap:8,marginTop:5}}>{["Femenino","Masculino"].map(s=><Tag key={s} label={s} selected={form.sexo===s} onClick={()=>set("sexo",s)}/>)}</div></div><div style={{marginBottom:14}}><label style={S.label}>Objetivo principal</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{OBJETIVOS_OPTS.map(o=><Tag key={o} label={o} selected={form.objetivo===o} onClick={()=>set("objetivo",o)}/>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Teléfono" value={form.telefono} onChange={v=>set("telefono",v)} placeholder="11XXXXXXXX"/><Field label="Email" value={form.email} onChange={v=>set("email",v)} placeholder="email@ejemplo.com"/></div><button onClick={()=>onSave({...form,id:uid(),fechaCreacion:today(),clinica:initialClinica,mediciones:[],notas:[],planes:[]})} disabled={!valid} style={{...S.btnPrimary,width:"100%",padding:"12px",fontSize:15,opacity:valid?1:.5}}>{"💾 Guardar paciente"}</button></div></div>);
}

function PlanViewer({plan,paciente,onClose,onUpdate}) {
  const [editing,setEditing]=useState(false);const [texto,setTexto]=useState(plan.texto||"");const [expanded,setExpanded]=useState(false);const [notasNutri,setNotasNutri]=useState(plan.notasNutri||"");const [saved,setSaved]=useState(false);const isLong=texto.length>1500;
  const handleSave=()=>{onUpdate({...plan,texto,notasNutri});setEditing(false);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  return (<div style={{...S.card,marginBottom:18}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontWeight:700,color:"#1a3d2b",fontSize:15}}>{plan.objetivo}</div><div style={{fontSize:12,color:"#7a9a8a"}}>{plan.fecha}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(!editing)} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>{editing?"✕ Cancelar":"✏️ Editar"}</button><button onClick={()=>exportPDF({paciente,plan:{...plan,texto},notasNutricionista:notasNutri})} style={{...S.btnOutline,fontSize:12,padding:"6px 12px"}}>📄 PDF</button><button onClick={onClose} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>✕</button></div></div>{editing?<div><textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={20} style={{...S.input,resize:"vertical",fontSize:13,lineHeight:1.75,marginBottom:10}}/><div style={{marginBottom:10}}><label style={S.label}>Notas del nutricionista (se guardan con el plan y aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones adicionales..." style={{...S.input,resize:"vertical"}}/></div><button onClick={handleSave} style={{...S.btnPrimary,width:"100%"}}>{saved?"✓ Cambios guardados":"💾 Guardar cambios"}</button></div>:<div><div style={{background:"#f8faf9",borderRadius:10,padding:"16px",maxHeight:expanded?"none":"400px",overflow:"hidden",position:"relative"}}><pre style={{margin:0,fontSize:13,lineHeight:1.75,color:"#2a2a2a",fontFamily:"inherit",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{texto}</pre>{isLong&&!expanded&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,#f8faf9)"}}/>}</div>{isLong&&<button onClick={()=>setExpanded(!expanded)} style={{...S.btnGhost,width:"100%",marginTop:8,fontSize:13}}>{expanded?"▲ Mostrar menos":"▼ Ver plan completo"}</button>}</div>}{!editing&&<div style={{marginTop:12}}><label style={S.label}>Notas del nutricionista (aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones adicionales..." style={{...S.input,resize:"vertical"}}/><button onClick={()=>{onUpdate({...plan,texto,notasNutri});setSaved(true);setTimeout(()=>setSaved(false),2000);}} style={{...S.btnGhost,width:"100%",marginTop:6,fontSize:12}}>{saved?"✓ Notas guardadas":"💾 Guardar notas"}</button></div>}</div>);
}

// ─── PATIENT DETAIL (con pestaña Consultas + Agenda + consultas en Timeline) ──
function PatientDetail({patient,dispatch,consultas,eventos,appointments,fertilCases,onAddConsulta,onDeleteConsulta,onAddEvento,onUpdateEvento,onDeleteEvento,onGeneratePlan,onBack,onDelete,onGoToFertil}) {
  const [tab,setTab]=useState("resumen");const [clinica,setClinica]=useState(patient.clinica||initialClinica);const [clinicaSaved,setClinicaSaved]=useState(false);const [newMedicion,setNewMedicion]=useState({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});const [newNota,setNewNota]=useState("");const [showMedForm,setShowMedForm]=useState(false);const [viewingPlan,setViewingPlan]=useState(null);const [deleteConfirm,setDeleteConfirm]=useState(false);const [showConsultaForm,setShowConsultaForm]=useState(false);
  const setC=(k,v)=>setClinica(c=>({...c,[k]:v}));
  const saveClinica=()=>{dispatch({type:"UPDATE_CLINICA",pid:patient.id,clinica});setClinicaSaved(true);setTimeout(()=>setClinicaSaved(false),2000);};
  const addMedicion=()=>{const m={id:uid(),...newMedicion,imc:calcIMC(newMedicion.peso,patient.altura)};dispatch({type:"ADD_MEDICION",pid:patient.id,m});setNewMedicion({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""});setShowMedForm(false);};
  const addNota=()=>{if(!newNota.trim())return;dispatch({type:"ADD_NOTA",pid:patient.id,n:{id:uid(),fecha:today(),texto:newNota}});setNewNota("");};

  const patientConsultas = (consultas||[]).filter(c=>c.pacienteId===patient.id);
  const totalCobrado = patientConsultas.reduce((s,c)=>s+(parseFloat(c.monto)||0),0);

  // Summary data
  var fertilCase=(fertilCases||[]).find(function(c){return c.patientId===patient.id&&(c.status==="activa"||c.status==="lead");});
  var lastPlan=patient.planes&&patient.planes.length>0?patient.planes[0]:null;
  var lastConsulta=patientConsultas.length>0?[...patientConsultas].sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);})[0]:null;
  var lastMedicion=patient.mediciones&&patient.mediciones.length>0?patient.mediciones[0]:null;
  var imc=lastMedicion?lastMedicion.imc:calcIMC(patient.peso,patient.altura);


  return (<div>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      <button onClick={onBack} style={S.btnGhost}>{"← Volver"}</button>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <h2 style={{margin:0,fontSize:24,fontWeight:800,color:C.text,letterSpacing:"-0.5px"}}>{patient.nombre}</h2>
          {fertilCase&&<span onClick={onGoToFertil} style={{background:"#7b2d8b",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:12,cursor:"pointer"}}>{"💜 FÉRTIL"}</span>}
        </div>
        {patient.objetivo&&<div style={{fontSize:13,color:"#7a9a8a",marginTop:2}}>{patient.objetivo}</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onGeneratePlan} style={S.btnPrimary}>{"✨ Generar plan"}</button>
        <button onClick={function(){setDeleteConfirm(true);}} style={S.btnDanger}>{"🗑 Eliminar paciente"}</button>
      </div>
    </div>

    {/* Summary cards */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
      <div style={{...S.card,flex:1,minWidth:100,padding:"12px 16px"}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px"}}>Edad</div>
        <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:4,letterSpacing:"-0.5px"}}>{patient.edad?patient.edad+" años":"—"}</div>
      </div>
      <div style={{...S.card,flex:1,minWidth:100,padding:"12px 16px"}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px"}}>Peso / IMC</div>
        <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:4,letterSpacing:"-0.5px"}}>{(lastMedicion?lastMedicion.peso:patient.peso)||"—"}<span style={{fontSize:12,fontWeight:400,color:C.muted}}>{" kg"}{imc&&imc!=="—"?" · IMC "+imc:""}</span></div>
      </div>
      <div style={{...S.card,flex:1,minWidth:100,padding:"12px 16px"}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px"}}>Último plan</div>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:4}}>{lastPlan?lastPlan.objetivo||lastPlan.fecha:"Sin planes"}</div>
        {lastPlan&&<div style={{fontSize:11,color:C.muted}}>{lastPlan.fecha}</div>}
      </div>
      <div style={{...S.card,flex:1,minWidth:100,padding:"12px 16px"}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px"}}>Consultas</div>
        <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:4,letterSpacing:"-0.5px"}}>{patientConsultas.length}</div>
        <div style={{fontSize:12,color:C.ok,fontWeight:700}}>{fmtMoney(totalCobrado)}</div>
      </div>
      {fertilCase&&<div style={{...S.card,flex:1,minWidth:100,padding:"12px 16px",borderTop:"3px solid "+C.fertil}}>
        <div style={{fontSize:10,color:C.fertil,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px"}}>Fértil</div>
        <div style={{fontSize:14,fontWeight:700,color:C.fertil,marginTop:4}}>{"Semana "+fertilCase.currentWeek+"/8"}</div>
        <div style={{fontSize:11,color:C.muted}}><Badge label={FERTIL_PAYMENT_LABELS[fertilCase.paymentStatus]} color={FERTIL_PAYMENT_COLORS[fertilCase.paymentStatus]+"22"} text={FERTIL_PAYMENT_COLORS[fertilCase.paymentStatus]}/></div>
      </div>}
    </div>

    {/* Sugerencia: Enviar a Fértil */}
    {!fertilCase&&patient.objetivo==="Fertilidad"&&<div style={{...S.card,marginBottom:18,borderLeft:"4px solid "+C.fertil,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px"}}>
      <div><div style={{fontSize:13,fontWeight:700,color:C.fertil}}>{"💜 Esta paciente tiene objetivo Fertilidad"}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{"Podés inscribirla en el programa Fértil de 8 semanas"}</div></div>
      <button onClick={onGoToFertil} style={S.btnFertil}>{"Enviar a Fértil"}</button>
    </div>}

    {/* Tabs — simplificados */}
    <div style={{display:"flex",gap:4,marginBottom:20,background:"#f0f4f1",borderRadius:10,padding:4,overflowX:"auto"}}>{[["resumen","📋 Resumen"],["evol","📝 Evolución"],["planes","🥗 Planes"],["consultas","💰 Consultas"],["agenda","📅 Agenda"],["timeline","⏱ Timeline"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:"0 0 auto",padding:"8px 14px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:12,fontWeight:tab===id?700:500,cursor:"pointer",whiteSpace:"nowrap",background:tab===id?C.okLight:"transparent",color:tab===id?C.okDark:C.textSub,boxShadow:"none"}}>{label}</button>))}</div>

  {tab==="resumen"&&<div>
    {/* Historia Clínica */}
    <div style={{...S.card,marginBottom:18}}>
      <SectionHead>Historia Clínica</SectionHead>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Field label="Motivo de consulta" value={clinica.motivo} onChange={v=>setC("motivo",v)} rows={4}/>
        <Field label="Diagnóstico nutricional" value={clinica.diagnostico} onChange={v=>setC("diagnostico",v)} rows={4}/>
        <Field label="Antecedentes" value={clinica.antecedentes} onChange={v=>setC("antecedentes",v)} rows={4}/>
        <Field label="Medicación" value={clinica.medicacion} onChange={v=>setC("medicacion",v)} rows={4}/>
        <Field label="Rutinas" value={clinica.patologias} onChange={v=>setC("patologias",v)} rows={4}/>
        <Field label="Alergias / Intolerancias" value={clinica.alergias} onChange={v=>setC("alergias",v)} rows={4}/>
        <Field label="Síntomas digestivos" value={clinica.digestivo} onChange={v=>setC("digestivo",v)} rows={4}/>
        <Field label="Calidad del sueño" value={clinica.sueno} onChange={v=>setC("sueno",v)} rows={4}/>
        <Field label="Observaciones" value={clinica.estres} onChange={v=>setC("estres",v)} rows={4}/>
        <Field label="Actividad física" value={clinica.actividad} onChange={v=>setC("actividad",v)} rows={4}/>
      </div>
      <button onClick={saveClinica} style={{...S.btnPrimary,width:"100%"}}>{clinicaSaved?"✓ Historia guardada":"💾 Guardar historia clínica"}</button>
    </div>

    {/* Antropometría dentro de Resumen */}
    <div style={{...S.card}}>
      <SectionHead action={<button onClick={()=>setShowMedForm(!showMedForm)} style={S.btnPrimary}>{"+ Nueva medición"}</button>}>Antropometría</SectionHead>
      {showMedForm&&<div style={{background:"#f5faf7",borderRadius:10,padding:14,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          <Field label="Fecha" type="date" value={newMedicion.fecha} onChange={v=>setNewMedicion(m=>({...m,fecha:v}))}/>
          <Field label="Peso (kg)" type="number" value={newMedicion.peso} onChange={v=>setNewMedicion(m=>({...m,peso:v}))} placeholder="70"/>
          <Field label="Grasa %" type="number" value={newMedicion.grasa} onChange={v=>setNewMedicion(m=>({...m,grasa:v}))} placeholder="25"/>
          <Field label="Masa muscular %" type="number" value={newMedicion.muscular} onChange={v=>setNewMedicion(m=>({...m,muscular:v}))} placeholder="40"/>
        </div>
        <Field label="Observaciones" value={newMedicion.obs} onChange={v=>setNewMedicion(m=>({...m,obs:v}))} placeholder="Notas..."/>
        <button onClick={addMedicion} style={{...S.btnPrimary,width:"100%"}}>{"💾 Guardar medición"}</button>
      </div>}
      {patient.mediciones&&patient.mediciones.length>0?<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{borderBottom:"2px solid #e8f0ec"}}>{["Fecha","Peso","IMC","Grasa%","Músculo%","Obs"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:C.textSub,fontWeight:700,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{patient.mediciones.map(m=>(<tr key={m.id} style={{borderBottom:"1px solid "+C.borderLight}}><td style={{padding:"10px"}}>{m.fecha}</td><td style={{padding:"10px",fontWeight:700,color:C.text}}>{m.peso} kg</td><td style={{padding:"10px"}}><Badge label={m.imc}/></td><td style={{padding:"10px"}}>{m.grasa||"—"}%</td><td style={{padding:"10px"}}>{m.muscular||"—"}%</td><td style={{padding:"10px",color:C.muted,fontSize:12}}>{m.obs||"—"}</td></tr>))}</tbody>
        </table>
      </div>:<EmptyState icon="📏" title="Sin mediciones aún" sub="Registrá peso, grasa y masa muscular" compact={true}/>}
    </div>
  </div>}

  {tab==="evol"&&<div><div style={{...S.card,marginBottom:18}}><SectionHead>Agregar nota de evolución</SectionHead><textarea value={newNota} onChange={e=>setNewNota(e.target.value)} rows={3} placeholder="Notas de la consulta de hoy..." style={{...S.input,resize:"vertical",marginBottom:10}}/><button onClick={addNota} disabled={!newNota.trim()} style={{...S.btnPrimary,width:"100%",opacity:newNota.trim()?1:.5}}>{"💾 Guardar nota"}</button></div>{patient.notas?.length===0?<EmptyState icon="📝" title="Sin notas aún" sub="Las notas de evolución aparecerán acá" compact={true}/>:patient.notas?.map(n=>(<div key={n.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #52b788"}}><div style={{fontSize:11,color:"#7a9a8a",marginBottom:6,fontWeight:600}}>{n.fecha}</div><p style={{margin:0,fontSize:14,color:"#2a2a2a",lineHeight:1.6}}>{n.texto}</p></div>))}</div>}

  {tab==="planes"&&<div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button onClick={onGeneratePlan} style={S.btnPrimary}>{"✨ Generar nuevo plan"}</button></div>{patient.planes?.length===0?<EmptyState icon="✨" title="Sin planes generados" sub="Generá el primer plan nutricional"/>:patient.planes?.map(plan=>(<div key={plan.id}>{viewingPlan===plan.id?<PlanViewer plan={plan} paciente={patient} onClose={()=>setViewingPlan(null)} onUpdate={updated=>dispatch({type:"UPDATE_PLAN",pid:patient.id,plan:updated})}/>:<div style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:12}}><div style={{flex:1}}><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{plan.objetivo}</div><div style={{fontSize:12,color:"#7a9a8a",marginTop:2}}>{plan.fecha}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setViewingPlan(plan.id)} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>👁 Ver</button><button onClick={()=>exportPDF({paciente:patient,plan})} style={{...S.btnOutline,fontSize:12,padding:"6px 12px"}}>📄 PDF</button></div></div>}</div>))}</div>}

  {tab==="consultas"&&<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <span style={{fontSize:13,color:"#5a7a6a"}}>{patientConsultas.length} consulta{patientConsultas.length!==1?"s":""}</span>
        {patientConsultas.length>0&&<span style={{fontSize:13,color:"#2d6a4f",fontWeight:700,marginLeft:12}}>Total: {fmtMoney(totalCobrado)}</span>}
      </div>
      <button onClick={()=>setShowConsultaForm(!showConsultaForm)} style={S.btnPrimary}>{"💰 Registrar consulta"}</button>
    </div>
    {showConsultaForm&&<div style={{marginBottom:16}}><ConsultationForm patients={[patient]} prefillPatientId={patient.id} onSave={c=>{onAddConsulta(c);setShowConsultaForm(false);}} onCancel={()=>setShowConsultaForm(false)}/></div>}
    {patientConsultas.length===0?<EmptyState icon="📋" title="Sin consultas registradas" sub="Las consultas de este paciente aparecerán acá"/>:
    [...patientConsultas].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(c=>(<div key={c.id} style={{...S.card,marginBottom:10,display:"flex",alignItems:"center",gap:14}}><div style={{width:36,height:36,borderRadius:"50%",background:C.okLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{"💰"}</div><div style={{flex:1}}><div style={{fontWeight:700,color:C.text,fontSize:14}}>{c.tipo}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{new Date(c.fecha).toLocaleDateString("es-AR")}</div>{c.obs&&<div style={{fontSize:12,color:C.textSub,marginTop:2,fontStyle:"italic"}}>{c.obs}</div>}</div><div style={{fontWeight:700,fontSize:16,color:C.ok}}>{fmtMoney(c.monto)}</div><button onClick={function(){if(confirm("¿Eliminar esta consulta?"))onDeleteConsulta(c.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"4px",color:C.danger,flexShrink:0}} title="Eliminar consulta">{"✕"}</button></div>))}
  </div>}

  {tab==="agenda"&&<CalendarView eventos={eventos} patients={[patient]} appointments={appointments} filterPatientId={patient.id} onAddEvento={onAddEvento} onUpdateEvento={onUpdateEvento} onDeleteEvento={onDeleteEvento}/>}

  {tab==="timeline"&&<div>{[
    ...(patient.planes||[]).map(x=>({...x,_tipo:"plan",icon:"🥗",color:"#2d6a4f"})),
    ...(patient.mediciones||[]).map(x=>({...x,_tipo:"med",icon:"📏",color:"#52b788",fecha:x.fecha})),
    ...(patient.notas||[]).map(x=>({...x,_tipo:"nota",icon:"📝",color:"#74c69d"})),
    ...patientConsultas.map(x=>({...x,_tipo:"consulta",icon:"💰",color:"#f4a261",fecha:x.fecha})),
    ...((eventos||[]).filter(e=>e.pacienteId===patient.id)).map(x=>({...x,_tipo:"evento",icon:x.tipo==="turno"?"📅":x.tipo==="seguimiento"?"🔄":"🔔",color:x.tipo==="turno"?"#2d6a4f":x.tipo==="seguimiento"?"#e76f51":"#f4a261"})),
  ].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((item,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:14}}><div style={{width:36,height:36,borderRadius:"50%",background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.icon}</div><div style={{...S.card,flex:1,padding:14}}><div style={{fontSize:11,color:"#7a9a8a",marginBottom:4,fontWeight:600}}>{typeof item.fecha==="string"&&item.fecha.includes("-")?new Date(item.fecha+"T12:00:00").toLocaleDateString("es-AR"):item.fecha}</div>{item._tipo==="plan"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Plan generado</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.objetivo}</div></>}{item._tipo==="med"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Medición registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>Peso: {item.peso}kg · IMC: {item.imc}</div></>}{item._tipo==="nota"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Nota de evolución</div><div style={{fontSize:13,color:"#5a7a6a",marginTop:2}}>{item.texto}</div></>}{item._tipo==="consulta"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>Consulta registrada</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.tipo_consulta||item.tipo} · {fmtMoney(item.monto)}</div>{item.obs&&<div style={{fontSize:12,color:"#7a9a8a",fontStyle:"italic",marginTop:2}}>{item.obs}</div>}</>}{item._tipo==="evento"&&<><div style={{fontWeight:700,color:"#1a3d2b",fontSize:14}}>{item.titulo}</div><div style={{fontSize:13,color:"#5a7a6a"}}>{item.tipo==="turno"?"Turno":item.tipo==="seguimiento"?"Seguimiento":"Recordatorio"}{item.hora&&` · ${item.hora}`}{item.completado?" · ✓ Completado":""}</div>{item.descripcion&&<div style={{fontSize:12,color:"#7a9a8a",fontStyle:"italic",marginTop:2}}>{item.descripcion}</div>}</>}</div></div>))}</div>}

  {deleteConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:360,width:"90%",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><h3 style={{margin:"0 0 8px",color:"#1a3d2b"}}>¿Eliminar a {patient.nombre}?</h3><p style={{fontSize:14,color:"#5a7a6a",marginBottom:20}}>Esta acción no se puede deshacer.</p><div style={{display:"flex",gap:10}}><button onClick={()=>setDeleteConfirm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onDelete(patient.id);}} style={{...S.btnPrimary,flex:1,background:"#c0392b"}}>{"Sí, eliminar"}</button></div></div></div>}</div>);
}

function PlanGenerator({prefill,onSavePlan,onBack}) {
  const [step,setStep]=useState(prefill?1:0);const [form,setForm]=useState({...initialPlanForm,...prefill});const [plan,setPlan]=useState("");const [loading,setLoading]=useState(false);const [editing,setEditing]=useState(false);const [saved,setSaved]=useState(false);const [notasNutri,setNotasNutri]=useState("");const [generatingPDF,setGeneratingPDF]=useState(false);const [expanded,setExpanded]=useState(false);const [showMontoModal,setShowMontoModal]=useState(false);const [monto,setMonto]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const generatePlan=async()=>{setStep(3);setLoading(true);const prompt=buildPrompt(form);try{const res=await fetch("/api/generatePlan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const data=await res.json();if(data.error)throw new Error(data.error.message||JSON.stringify(data.error));setPlan(data.content?.[0]?.text||"Error al generar el plan.");}catch(e){setPlan("Error de conexión. Intentá nuevamente.");}setLoading(false);};
  const isLong=plan.length>1500;
  return (<div><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>{onBack&&<button onClick={onBack} style={S.btnGhost}>← Volver</button>}<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#1a3d2b"}}>✨ Generar Plan Nutricional</h2>{prefill?.nombre&&<p style={{margin:"2px 0 0",fontSize:13,color:"#7a9a8a"}}>Datos de {prefill.nombre} precargados</p>}</div></div><div style={{maxWidth:580}}>{step<3&&<div style={{display:"flex",gap:6,marginBottom:20}}>{["👤 Paciente","🎯 Objetivos","🚫 Restricciones"].map((s,i)=>(<div key={i} style={{flex:1}}><div style={{height:4,borderRadius:4,background:i<=step?"#2d6a4f":"#e0ece6",transition:"background .3s"}}/></div>))}</div>}<div style={S.card}>
  {step===0&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:17,fontWeight:700}}>👤 Datos de la paciente</h3><Field label="Nombre completo" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Field label="Edad" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30"/><Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65"/><Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165"/></div><div style={{marginBottom:16}}><label style={S.label}>Sexo</label><div style={{display:"flex",gap:8,marginTop:5}}>{["Femenino","Masculino"].map(s=><Tag key={s} label={s} selected={form.sexo===s} onClick={()=>set("sexo",s)}/>)}</div></div><button onClick={()=>setStep(1)} disabled={!form.nombre||!form.edad||!form.peso||!form.sexo} style={{...S.btnPrimary,width:"100%",padding:"12px",fontSize:15,opacity:(!form.nombre||!form.edad||!form.peso||!form.sexo)?.5:1}}>Siguiente →</button></div>}
  {step===1&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:17,fontWeight:700}}>🎯 Objetivos y actividad</h3><div style={{marginBottom:16}}><label style={S.label}>Objetivo principal</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{OBJETIVOS_OPTS.map(o=><Tag key={o} label={o} selected={form.objetivo===o} onClick={()=>set("objetivo",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Tipo de plan</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{TIPO_PLAN_OPTS.map(o=><Tag key={o} label={o} selected={form.tipoPlan===o} onClick={()=>set("tipoPlan",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Nivel de actividad física</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{ACTIVIDAD_OPTS.map(o=><Tag key={o} label={o} selected={form.nivelActividad===o} onClick={()=>set("nivelActividad",o)}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Comidas por día</label><select value={form.cantidadComidas} onChange={e=>set("cantidadComidas",e.target.value)} style={S.input}>{["3","4","5","6"].map(o=><option key={o} value={o}>{o} comidas</option>)}</select></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(0)} style={{...S.btnGhost,flex:1}}>← Volver</button><button onClick={()=>setStep(2)} disabled={!form.objetivo||!form.nivelActividad} style={{...S.btnPrimary,flex:2,opacity:(!form.objetivo||!form.nivelActividad)?.5:1}}>Siguiente →</button></div></div>}
  {step===2&&<div><h3 style={{margin:"0 0 16px",color:"#1a3d2b",fontSize:17,fontWeight:700}}>🚫 Restricciones y preferencias</h3><div style={{marginBottom:16}}><label style={S.label}>Alergias e intolerancias</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{ALERGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.alergias.includes(o)} onClick={()=>set("alergias",toggle(form.alergias,o))}/>)}</div></div><div style={{marginBottom:16}}><label style={S.label}>Patologías</label><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>{PATOLOGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.patologias.includes(o)} onClick={()=>set("patologias",toggle(form.patologias,o))}/>)}</div></div><Field label="Alimentos preferidos" value={form.preferencias} onChange={v=>set("preferencias",v)} placeholder="Ej: pollo, arroz integral, frutas..." rows={2}/><Field label="Alimentos que no le gustan" value={form.aversiones} onChange={v=>set("aversiones",v)} placeholder="Ej: brócoli, hígado..." rows={2}/><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{...S.btnGhost,flex:1}}>← Volver</button><button onClick={generatePlan} style={{flex:2,padding:"12px",background:"linear-gradient(135deg,#2d6a4f,#40916c)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>✨ Generar plan</button></div></div>}
  {step===3&&(loading?<div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:44,marginBottom:12}}>🥗</div><h3 style={{color:"#2d6a4f",margin:"0 0 6px"}}>Generando plan para {form.nombre}...</h3><p style={{color:"#7a9a8a",fontSize:13,margin:0}}>La IA está personalizando cada detalle</p><div style={{marginTop:20,display:"flex",justifyContent:"center",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#52b788",animation:`pulse ${0.6+i*.2}s ease-in-out infinite alternate`}}/>)}</div><style>{`@keyframes pulse{from{opacity:.3;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`}</style></div>:<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1a3d2b"}}>Plan de {form.nombre}</h3><p style={{margin:"3px 0 0",fontSize:13,color:"#7a9a8a"}}>{form.objetivo} · {form.tipoPlan} · {form.cantidadComidas} comidas/día</p></div><button onClick={()=>setEditing(!editing)} style={{...S.btnGhost,fontSize:12}}>✏️ {editing?"Cerrar edición":"Editar"}</button></div>{editing?<textarea value={plan} onChange={e=>setPlan(e.target.value)} rows={20} style={{...S.input,resize:"vertical",marginBottom:12,fontSize:13,lineHeight:1.7}}/>:<div style={{background:"#f8faf9",borderRadius:10,padding:16,marginBottom:12,maxHeight:expanded?"none":"400px",overflow:"hidden",position:"relative"}}><pre style={{margin:0,fontSize:13,lineHeight:1.75,color:"#2a2a2a",fontFamily:"inherit",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{plan}</pre>{isLong&&!expanded&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,#f8faf9)"}}/>}</div>}{!editing&&isLong&&<button onClick={()=>setExpanded(!expanded)} style={{...S.btnGhost,width:"100%",marginBottom:12,fontSize:13}}>{expanded?"▲ Mostrar menos":"▼ Ver plan completo"}</button>}<label style={S.label}>Notas del nutricionista (aparecen en el PDF)</label><textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones personalizadas..." style={{...S.input,marginBottom:12,resize:"vertical"}}/><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>{const el=document.createElement("textarea");el.value=plan;el.style.position="fixed";el.style.opacity="0";document.body.appendChild(el);el.focus();el.select();document.execCommand("copy");document.body.removeChild(el);}} style={{...S.btnGhost,flex:1,fontSize:12}}>📋 Copiar</button><button onClick={()=>{setGeneratingPDF(true);try{exportPDF({paciente:{nombre:form.nombre,objetivo:form.objetivo},plan:{texto:plan,objetivo:form.objetivo},notasNutricionista:notasNutri});}catch(e){alert("Error generando PDF.");}setGeneratingPDF(false);}} style={{flex:2,padding:"10px",borderRadius:9,border:"none",background:generatingPDF?"#7a9a8a":"#1b4332",color:"#fff",fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>{generatingPDF?"Generando...":"📄 Descargar PDF"}</button>{onSavePlan&&<button onClick={()=>setShowMontoModal(true)} style={{...S.btnPrimary,flex:2,fontSize:13}}>{saved?"✓ Guardado en ficha":"💾 Guardar en ficha"}</button>}</div><button onClick={()=>{setStep(0);setPlan("");setEditing(false);setSaved(false);setExpanded(false);}} style={{...S.btnGhost,width:"100%",marginTop:10,fontSize:13}}>↩ Nuevo plan</button>{showMontoModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}><div style={{...S.card,maxWidth:340,width:"90%",textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>💰</div><h3 style={{margin:"0 0 6px",color:"#1a3d2b"}}>¿Cuánto cobró por esta consulta?</h3><p style={{fontSize:13,color:"#7a9a8a",marginBottom:16}}>Se registrará junto con el plan en las estadísticas.</p><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="Ej: 15000" autoFocus style={{...S.input,fontSize:18,fontWeight:700,textAlign:"center",marginBottom:16}}/><div style={{display:"flex",gap:10}}><button onClick={()=>setShowMontoModal(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button><button onClick={()=>{onSavePlan({id:uid(),fecha:today(),objetivo:form.objetivo,texto:plan,notasNutri,monto:parseFloat(monto)||0});setSaved(true);setShowMontoModal(false);setTimeout(()=>setSaved(false),3000);}} style={{...S.btnPrimary,flex:2}}>Guardar</button></div></div></div>}</div>)}</div></div></div>);
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [state,dispatch]=useReducer(reducer,{patients:[],consultas:[],eventos:[],fertilCases:[],appointments:[],fertilFollowups:[],fertilLabs:[],fertilTasks:[],gastos:[]});const [screen,setScreen]=useState("hoy");const [selectedId,setSelectedId]=useState(null);const [navTab,setNavTab]=useState("hoy");const [loaded,setLoaded]=useState(false);const [saveStatus,setSaveStatus]=useState("idle");
  useEffect(()=>{
    async function loadAll(){
      try{
        const [patients,consultas,eventos]=await Promise.all([sbLoadAll(),sbLoadConsultas(),sbLoadEventos()]);
        dispatch({type:"LOAD",patients,consultas,eventos});
      }catch(e){console.error("Error loading base:",e);dispatch({type:"LOAD",patients:[],consultas:[],eventos:[]});}
      try{
        const [cases,appointments,followups,labs,tasks,leads]=await Promise.all([sbLoadFertilCases(),sbLoadAppointments(),sbLoadFertilFollowups(),sbLoadFertilLabs(),sbLoadFertilTasks(),sbLoadLeads()]);
        // Auto-marcar como realizada las consultas con fecha pasada
        var now=new Date();
        var updated=[];
        var finalAppts=appointments.map(function(a){
          if(a.status==="programada"&&a.startAt){
            var apptDate=new Date(a.startAt);
            var createdAt=cases.find(function(c){return c.id===a.fertilCaseId;});
            var createdRecently=createdAt?Math.abs(apptDate.getTime()-new Date(createdAt.createdAt).getTime())<60000:false;
            if(!createdRecently&&apptDate<now&&apptDate.getFullYear()>2020){
              var completed={...a,status:"realizada"};
              updated.push(completed);
              return completed;
            }
          }
          return a;
        });
        dispatch({type:"LOAD_FERTIL",cases,appointments:finalAppts,followups,labs,tasks,leads});
        // Persistir los que se auto-completaron
        for(var u of updated){try{await sbUpdateAppointment(u);console.log("Auto-completada:",u.title);}catch(e){console.error("Error auto-completando:",e);}}
      }catch(e){console.error("Error loading fertil:",e);dispatch({type:"LOAD_FERTIL",cases:[],appointments:[],followups:[],labs:[],tasks:[],leads:[]});}
      // Load gastos
      try{var gastos=await sbLoadGastos();dispatch({type:"LOAD_GASTOS",gastos:gastos});}catch(e){console.error("Error loading gastos:",e);}
      setLoaded(true);
    }
    loadAll();
  },[]);
  useEffect(()=>{if(!loaded)return;setSaveStatus("saving");const t=setTimeout(async()=>{try{await Promise.all(state.patients.map(p=>sbUpsert(p)));setSaveStatus("saved");}catch{setSaveStatus("error");}setTimeout(()=>setSaveStatus("idle"),3000);},800);return()=>clearTimeout(t);},[state.patients,loaded]);
  const patient=state.patients.find(p=>p.id===selectedId);const go=(s,id=null)=>{setScreen(s);if(id)setSelectedId(id);};
  const handleAddConsulta=async(c)=>{dispatch({type:"ADD_CONSULTA",c});try{await sbInsertConsulta(c);}catch(e){console.error("Error guardando consulta:",e);}};
  const handleDeleteConsulta=async(id)=>{dispatch({type:"DELETE_CONSULTA",id});try{await sbDeleteConsulta(id);}catch(e){console.error("Error eliminando consulta:",e);}};
  const handleAddGasto=async function(g){dispatch({type:"ADD_GASTO",g:g});try{var result=await sbInsertGasto(g);if(result&&result[0]&&result[0].id){g.id=result[0].id;}}catch(e){console.error("Error guardando gasto:",e);}};
  const handleDeleteGasto=async function(id){dispatch({type:"DELETE_GASTO",id:id});try{await sbDeleteGasto(id);}catch(e){console.error("Error eliminando gasto:",e);}};  const handleDeletePatient=async(id)=>{
    // Limpiar datos Fértil asociados
    var casesForPatient=(state.fertilCases||[]).filter(function(c){return c.patientId===id;});
    var caseIds=casesForPatient.map(function(c){return c.id;});
    // Eliminar appointments del paciente
    var apptsToDelete=(state.appointments||[]).filter(function(a){return a.patientId===id;});
    for(var a of apptsToDelete){dispatch({type:"DELETE_APPOINTMENT",id:a.id});try{await sbDeleteAppointment(a.id);}catch(e){}}
    // Eliminar followups, labs, tasks de los cases
    for(var cid of caseIds){
      var fups=(state.fertilFollowups||[]).filter(function(f){return f.fertilCaseId===cid;});
      for(var f of fups){try{await fetch(SUPABASE_URL+"/rest/v1/fertil_followups?id=eq."+f.id,{method:"DELETE",headers:sbHeaders});}catch(e){}}
      var labs=(state.fertilLabs||[]).filter(function(l){return l.fertilCaseId===cid;});
      for(var l of labs){try{await fetch(SUPABASE_URL+"/rest/v1/fertil_labs?id=eq."+l.id,{method:"DELETE",headers:sbHeaders});}catch(e){}}
      var tasks=(state.fertilTasks||[]).filter(function(t){return t.fertilCaseId===cid;});
      for(var t of tasks){try{await sbDeleteFertilTask(t.id);}catch(e){}}
    }
    // Eliminar los fertil_cases
    for(var fc of casesForPatient){try{await fetch(SUPABASE_URL+"/rest/v1/fertil_cases?id=eq."+fc.id,{method:"DELETE",headers:sbHeaders});}catch(e){}}
    // Eliminar leads con mismo nombre (opcional, por si matchea)
    // Limpiar del state
    dispatch({type:"LOAD_FERTIL",cases:(state.fertilCases||[]).filter(function(c){return c.patientId!==id;}),appointments:(state.appointments||[]).filter(function(a){return a.patientId!==id;}),followups:(state.fertilFollowups||[]).filter(function(f){return!caseIds.includes(f.fertilCaseId);}),labs:(state.fertilLabs||[]).filter(function(l){return!caseIds.includes(l.fertilCaseId);}),tasks:(state.fertilTasks||[]).filter(function(t){return!caseIds.includes(t.fertilCaseId);}),leads:state.fertilLeads||[]});
    // Eliminar paciente
    dispatch({type:"DELETE_PATIENT",id:id});
    await sbDelete(id);
    go("patients");
  };
  const handleAddEvento=async(e)=>{dispatch({type:"ADD_EVENTO",e});try{await sbInsertEvento(e);}catch(err){console.error("Error guardando evento:",err);}};
  const handleUpdateEvento=async(e)=>{dispatch({type:"UPDATE_EVENTO",e});try{await sbUpdateEvento(e);}catch(err){console.error("Error actualizando evento:",err);}};
  const handleDeleteEvento=async(id)=>{dispatch({type:"DELETE_EVENTO",id});try{await sbDeleteEvento(id);}catch(err){console.error("Error eliminando evento:",err);}};
  const todayPendientes=(state.eventos||[]).filter(e=>e.fecha===todayISO()&&!e.completado).length;
  const fertilActivas=(state.fertilCases||[]).filter(c=>c.status==="activa").length;
  if(!loaded)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5faf7",fontFamily:"sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🌿</div><p style={{color:"#2d6a4f",fontWeight:600,fontSize:16}}>JL Nutrición</p><p style={{color:"#7a9a8a",fontSize:13}}>Conectando con la base de datos...</p></div></div>);
  return (<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5ee 0%,#f5f9f7 50%,#e0f0e8 100%)",fontFamily:"'DM Sans',system-ui,sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#2d6a4f!important;box-shadow:0 0 0 3px rgba(45,106,79,.1)!important;outline:none}.nav-tab{transition:background .15s,color .15s}.nav-tab:hover{background:#f0f4f1!important}`}</style><div style={{background:"#fff",borderBottom:"1.5px solid #e8f0ec",padding:"0 20px",position:"sticky",top:0,zIndex:100}}><div style={{maxWidth:980,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#52b788)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍏</div><span style={{fontWeight:700,fontSize:16,color:"#1a3d2b"}}>JL Nutrición</span><span style={{fontSize:11,padding:"3px 10px",borderRadius:12,fontWeight:600,transition:"all .3s",background:saveStatus==="saving"?"#fff8f0":saveStatus==="saved"?C.okLight:saveStatus==="error"?C.dangerLight:"transparent",color:saveStatus==="saving"?C.warn:saveStatus==="saved"?C.ok:saveStatus==="error"?C.danger:"transparent"}}>{saveStatus==="saving"?"● Guardando...":saveStatus==="saved"?"✓ Guardado":saveStatus==="error"?"⚠ Error al guardar":"·"}</span></div><div style={{display:"flex",alignItems:"center",gap:2}}>{[["hoy","🏠 Hoy"],["patients","👥 Pacientes"],["fertil","💜 Fértil"],["agenda","📅 Agenda"],["stats","📊 Estadísticas"],["plan","✨ Nuevo plan"]].map(([id,label])=>(<button key={id} className="nav-tab" onClick={()=>{setNavTab(id);go(id);}} style={{padding:"6px 14px",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:13,fontWeight:navTab===id?700:500,cursor:"pointer",background:navTab===id?(id==="fertil"?C.fertilLight:C.okLight):"transparent",color:navTab===id?(id==="fertil"?C.fertil:C.okDark):C.textSub,position:"relative"}}>{label}{id==="agenda"&&todayPendientes>0&&<span style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:C.danger,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{todayPendientes}</span>}{id==="fertil"&&fertilActivas>0&&<span style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:C.fertil,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{fertilActivas}</span>}</button>))}</div></div></div><div style={{maxWidth:980,margin:"0 auto",padding:"28px 20px"}}>
    {screen==="hoy"&&<TodayDashboard state={state} patients={state.patients} onGoToPatient={function(id){setNavTab("patients");go("detail",id);}} onGoToFertilCase={function(caseId){setNavTab("fertil");go("fertil");}} onGoToAgenda={function(){setNavTab("agenda");go("agenda");}} onGoToLeads={function(){setNavTab("fertil");go("fertil");}} onDeleteEvento={handleDeleteEvento}/>}
    {screen==="patients"&&<PatientList patients={state.patients} onSelect={id=>go("detail",id)} onNew={()=>go("new-patient")}/>}
    {screen==="fertil"&&<FertilModule state={state} dispatch={dispatch} patients={state.patients} onGoToPatient={id=>{setNavTab("patients");go("detail",id);}}/>}
    {screen==="agenda"&&<CalendarView eventos={state.eventos} patients={state.patients} appointments={state.appointments} onAddEvento={handleAddEvento} onUpdateEvento={handleUpdateEvento} onDeleteEvento={handleDeleteEvento} onSelectPatient={id=>go("detail",id)}/>}
    {screen==="stats"&&<PatientsStats patients={state.patients} consultas={state.consultas} fertilCases={state.fertilCases} appointments={state.appointments} gastos={state.gastos} onAddConsulta={handleAddConsulta} onDeleteConsulta={handleDeleteConsulta} onAddGasto={handleAddGasto} onDeleteGasto={handleDeleteGasto} onSelect={id=>go("detail",id)}/>}
    {screen==="new-patient"&&<NewPatient onSave={p=>{dispatch({type:"ADD_PATIENT",p});go("detail",p.id);}} onCancel={()=>go("patients")}/>}
    {screen==="detail"&&patient&&<PatientDetail patient={patient} dispatch={dispatch} consultas={state.consultas} eventos={state.eventos} appointments={state.appointments} fertilCases={state.fertilCases} onAddConsulta={handleAddConsulta} onDeleteConsulta={handleDeleteConsulta} onAddEvento={handleAddEvento} onUpdateEvento={handleUpdateEvento} onDeleteEvento={handleDeleteEvento} onGeneratePlan={()=>go("plan-patient")} onBack={()=>go("patients")} onDelete={handleDeletePatient} onGoToFertil={()=>{setNavTab("fertil");go("fertil");}}/>}
    {screen==="plan-patient"&&patient&&<PlanGenerator prefill={{nombre:patient.nombre,edad:patient.edad,peso:patient.peso,altura:patient.altura,sexo:patient.sexo,objetivo:patient.objetivo||"",nivelActividad:"",alergias:[],patologias:[],preferencias:"",aversiones:"",cantidadComidas:"4",tipoPlan:"Estándar"}} onSavePlan={plan=>{dispatch({type:"ADD_PLAN",pid:patient.id,plan});const c={id:uid(),pacienteId:patient.id,pacienteNombre:patient.nombre,fecha:todayISO(),monto:plan.monto||0,tipo:"Plan generado",obs:`Plan: ${plan.objetivo}`};handleAddConsulta(c);go("detail",patient.id);}} onBack={()=>go("detail",patient.id)}/>}
    {screen==="plan"&&<PlanGenerator onBack={()=>{setNavTab("patients");go("patients");}}/>}
  </div></div>);
}
