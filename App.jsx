import React, { useState, useReducer, useEffect } from "react";

const ALERGIAS_OPTS = ["Gluten", "Lactosa", "Huevo", "Mariscos", "Frutos secos", "Soja", "Ninguna"];
const PATOLOGIAS_OPTS = ["Diabetes tipo 2", "Celiaquía", "Hipotiroidismo", "Hipertensión", "SOP", "Colesterol alto", "Ninguna"];
const OBJETIVOS_OPTS = ["Bajar de peso", "Subir masa muscular", "Mantenimiento", "Mejorar energía", "Control glucémico", "Alimentación saludable general"];
const ACTIVIDAD_OPTS = ["Sedentario", "Leve (1-2 días/semana)", "Moderado (3-4 días/semana)", "Activo (5+ días/semana)", "Muy activo / deportista"];
const initialPlanForm = { nombre:"", edad:"", peso:"", altura:"", sexo:"", objetivo:"", nivelActividad:"", alergias:[], patologias:[], preferencias:"", aversiones:"", cantidadComidas:"4" };
const initialClinica = { motivo:"", diagnostico:"", antecedentes:"", medicacion:"", patologias:"", alergias:"", digestivo:"", sueno:"", estres:"", actividad:"" };

function uid() { return Math.random().toString(36).slice(2,9); }
function today() { return new Date().toLocaleDateString("es-AR"); }
function todayISO() { return new Date().toISOString().split("T")[0]; }
function calcIMC(peso, altura) { if (!peso || !altura) return "—"; return (parseFloat(peso) / Math.pow(parseFloat(altura)/100, 2)).toFixed(1); }
function toggle(arr, val) { return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]; }

function reducer(state, action) {
  switch (action.type) {
    case "ADD_PATIENT": return { ...state, patients: [action.p, ...state.patients] };
    case "ADD_MEDICION": return { ...state, patients: state.patients.map(p => p.id === action.pid ? { ...p, mediciones: [action.m, ...p.mediciones] } : p) };
    case "ADD_NOTA": return { ...state, patients: state.patients.map(p => p.id === action.pid ? { ...p, notas: [action.n, ...p.notas] } : p) };
    case "ADD_PLAN": return { ...state, patients: state.patients.map(p => p.id === action.pid ? { ...p, planes: [action.plan, ...p.planes] } : p) };
    case "UPDATE_CLINICA": return { ...state, patients: state.patients.map(p => p.id === action.pid ? { ...p, clinica: action.clinica } : p) };
    case "LOAD": return { ...state, patients: action.patients };
    default: return state;
  }
}

const DEMO_PATIENTS = [
  { id:"p1", nombre:"María García", edad:"32", sexo:"Femenino", altura:"165", peso:"72", telefono:"1150001111", email:"maria@mail.com", fechaCreacion:"01/01/2025", objetivo:"Bajar de peso",
    clinica:{ motivo:"Bajar 10kg antes del verano", diagnostico:"Sobrepeso leve", antecedentes:"Ninguno relevante", medicacion:"Ninguna", patologias:"Ninguna", alergias:"Lactosa", digestivo:"Hinchazón ocasional", sueno:"Regular, 6-7hs", estres:"Alto por trabajo", actividad:"Caminata 3x semana" },
    mediciones:[{ id:"m1", fecha:"2025-03-01", peso:"72", imc:"26.4", grasa:"30", muscular:"42", obs:"Inicio tratamiento" }],
    notas:[{ id:"n1", fecha:"01/03/2025", texto:"Primera consulta. Paciente motivada. Se propone bajar 1kg por mes de forma sostenible. Refiere comer poco pero picotear entre comidas." }],
    planes:[{ id:"pl1", fecha:"01/03/2025", objetivo:"Bajar de peso", texto:"Plan de ejemplo precargado para María García.\n\n🥗 DISTRIBUCIÓN DE MACROS:\n- Proteínas: 30%\n- Carbohidratos: 40%\n- Grasas saludables: 30%\n\n📅 LUNES\nDesayuno: Avena con frutas y semillas\nAlmuerzo: Pechuga a la plancha con ensalada\nMerienda: Fruta + infusión\nCena: Omelette de claras con vegetales\n\n✅ INDICACIONES GENERALES:\n- Tomar 2L de agua por día\n- Evitar ultraprocesados\n- Respetar horarios de comidas" }]
  }
];

// ─── ESTILOS BASE ──────────────────────────────────────────────────────────────
const S = {
  label: { display:"block", fontSize:11, fontWeight:700, color:"#5a7a6a", marginBottom:4, textTransform:"uppercase", letterSpacing:.8 },
  input: { width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid #d8e8df", fontSize:14, fontFamily:"inherit", background:"#fafcfb", outline:"none", boxSizing:"border-box" },
  card: { background:"#fff", borderRadius:16, boxShadow:"0 2px 16px rgba(45,106,79,.08)", padding:"20px" },
  btnPrimary: { padding:"10px 18px", background:"#2d6a4f", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  btnOutline: { padding:"10px 18px", background:"#fff", color:"#2d6a4f", border:"1.5px solid #2d6a4f", borderRadius:10, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  btnGhost: { padding:"8px 14px", background:"#f0f4f1", color:"#5a7a6a", border:"none", borderRadius:9, fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
};

// ─── COMPONENTES REUTILIZABLES ─────────────────────────────────────────────────
const Field = ({ label, value, onChange, type="text", placeholder="", rows }) => (
  <div style={{ marginBottom:14 }}>
    <label style={S.label}>{label}</label>
    {rows
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...S.input, resize:"vertical"}} />
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input} />
    }
  </div>
);

const Tag = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer", transition:"all .15s",
    background:selected?"#2d6a4f":"#f0f4f1", color:selected?"#fff":"#3a3a3a",
    border:selected?"2px solid #2d6a4f":"2px solid #d8e8df", fontFamily:"inherit" }}>{label}</button>
);

const Badge = ({ label, color="#e8f5ee", text="#2d6a4f" }) => (
  <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:color, color:text, whiteSpace:"nowrap" }}>{label}</span>
);

const SectionHead = ({ children, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
    <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1a3d2b" }}>{children}</h3>
    {action}
  </div>
);

// ─── GENERADOR DE PDF (vía HTML + print) ──────────────────────────────────────
function exportPDF({ form, plan, notasNutricionista = "" }) {
  const fecha = new Date().toLocaleDateString("es-AR");

  // Formatear el texto del plan a HTML
  const planHTML = (plan || "")
    .split("\n")
    .map(line => {
      const t = line.trim();
      if (!t) return "<br>";
      if (/^(LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO|DOMINGO)/i.test(t))
        return `<p class="day">${t}</p>`;
      if (/^[🥗📅✅💪🎯#]/.test(t) || /^[A-ZÁÉÍÓÚ\s]{4,}:?$/.test(t))
        return `<p class="section-title">${t}</p>`;
      if (t.startsWith("-") || t.startsWith("•"))
        return `<p class="bullet">${t.replace(/^[-•]\s*/,"")}</p>`;
      return `<p>${t}</p>`;
    }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan Nutricional - ${form.nombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; }

    .header { background: #2d6a4f; color: white; padding: 28px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo { width: 48px; height: 48px; background: #52b788; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; color: white; font-family: sans-serif; flex-shrink:0; }
    .header-title { font-size: 22px; font-weight: bold; letter-spacing: -0.3px; }
    .header-sub { font-size: 11px; opacity: 0.75; margin-top: 3px; font-family: sans-serif; }
    .header-date { font-size: 12px; opacity: 0.85; font-family: sans-serif; text-align: right; }

    .patient-card { background: #e8f5ee; border-left: 5px solid #2d6a4f; margin: 28px 40px 0; padding: 16px 20px; border-radius: 0 8px 8px 0; display: flex; justify-content: space-between; align-items: center; }
    .patient-name { font-size: 20px; font-weight: bold; color: #1a3d2b; font-family: sans-serif; }
    .patient-meta { font-size: 12px; color: #5a7a6a; margin-top: 4px; font-family: sans-serif; }
    .objective-badge { background: #2d6a4f; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; font-family: sans-serif; white-space: nowrap; }

    .content { padding: 24px 40px 40px; }

    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; border-bottom: 2px solid #e8f5ee; padding-bottom: 6px; }
    .section-bar { width: 4px; height: 20px; background: #2d6a4f; border-radius: 2px; flex-shrink: 0; }
    .section-header h2 { font-size: 13px; font-weight: bold; color: #2d6a4f; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif; }

    .plan-text p { font-size: 13px; line-height: 1.75; color: #2a2a2a; margin-bottom: 2px; }
    .plan-text p.day { font-weight: bold; color: #2d6a4f; font-size: 13px; margin-top: 12px; margin-bottom: 2px; font-family: sans-serif; border-left: 3px solid #52b788; padding-left: 8px; }
    .plan-text p.section-title { font-weight: bold; color: #1a3d2b; font-size: 13px; margin-top: 14px; font-family: sans-serif; }
    .plan-text p.bullet { padding-left: 16px; position: relative; }
    .plan-text p.bullet::before { content: "•"; position: absolute; left: 4px; color: #52b788; font-weight: bold; }
    .plan-text br { line-height: 0.5; }

    .notas-box { background: #f5faf7; border: 1px solid #d8e8df; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.7; color: #2a2a2a; white-space: pre-wrap; }

    .footer { background: #2d6a4f; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 10px; padding: 10px 40px; display: flex; justify-content: space-between; position: fixed; bottom: 0; left: 0; right: 0; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .footer { position: fixed; bottom: 0; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="logo">N</div>
      <div>
        <div class="header-title">Plan Nutricional Personalizado</div>
        <div class="header-sub">NutriPlan IA · Documento de uso profesional</div>
      </div>
    </div>
    <div class="header-date">Fecha: ${fecha}</div>
  </div>

  <div class="patient-card">
    <div>
      <div class="patient-name">${form.nombre}</div>
      <div class="patient-meta">
        ${[form.edad && `${form.edad} años`, form.peso && `${form.peso} kg`, form.altura && `${form.altura} cm`, form.sexo].filter(Boolean).join(" · ")}
        ${form.nivelActividad ? ` · Actividad: ${form.nivelActividad}` : ""}
        · ${form.cantidadComidas} comidas/día
      </div>
    </div>
    <div class="objective-badge">${form.objetivo || "Plan nutricional"}</div>
  </div>

  <div class="content">

    <div class="section">
      <div class="section-header"><div class="section-bar"></div><h2>Plan alimentario</h2></div>
      <div class="plan-text">${planHTML}</div>
    </div>

    ${notasNutricionista.trim() ? `
    <div class="section">
      <div class="section-header"><div class="section-bar" style="background:#52b788"></div><h2>Notas del nutricionista</h2></div>
      <div class="notas-box">${notasNutricionista.trim()}</div>
    </div>` : ""}

  </div>

  <div class="footer">
    <span>NutriPlan IA · Documento generado para uso profesional · No reemplaza la consulta médica</span>
    <span>${fecha}</span>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  // Abrir en nueva pestaña
  const w = window.open("", "_blank");
  if (!w) { alert("Permitir popups para esta página para poder generar el PDF."); return; }
  w.document.write(html);
  w.document.close();
}

// ─── GENERADOR DE PLAN ─────────────────────────────────────────────────────────
function PlanGenerator({ prefill, onSavePlan, onBack }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(prefill || initialPlanForm);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notasNutri, setNotasNutri] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const generatePlan = async () => {
    setStep(3); setLoading(true);
    const prompt = `Eres una nutricionista profesional. Generá un plan alimentario detallado y personalizado en español, con formato claro y profesional.

DATOS DE LA PACIENTE:
- Nombre: ${form.nombre}
- Edad: ${form.edad} años | Peso: ${form.peso} kg | Altura: ${form.altura} cm | Sexo: ${form.sexo}
- Nivel de actividad: ${form.nivelActividad}
- Objetivo principal: ${form.objetivo}
- Alergias/intolerancias: ${form.alergias.length ? form.alergias.join(", ") : "Ninguna"}
- Patologías: ${form.patologias.length ? form.patologias.join(", ") : "Ninguna"}
- Preferencias alimentarias: ${form.preferencias || "No especificadas"}
- Alimentos que no le gustan: ${form.aversiones || "No especificados"}
- Cantidad de comidas por día: ${form.cantidadComidas}

Estructurá el plan con:
1. Introducción breve personalizada
2. Distribución de macronutrientes estimada (%)
3. Plan semanal lunes a domingo con porciones
4. Indicaciones generales
5. Tips para su objetivo

Tono cálido, motivador y profesional. Usá emojis de sección.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      setPlan(data.content?.[0]?.text || "Error al generar el plan.");
    } catch { setPlan("Error de conexión. Intentá nuevamente."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        {onBack && <button onClick={onBack} style={S.btnGhost}>← Volver</button>}
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1a3d2b" }}>✨ Generar Plan Nutricional</h2>
          {prefill?.nombre && <p style={{ margin:"2px 0 0", fontSize:13, color:"#7a9a8a" }}>Datos de {prefill.nombre} precargados</p>}
        </div>
      </div>

      <div style={{ maxWidth:580 }}>
        {step < 3 && (
          <div style={{ display:"flex", gap:6, marginBottom:20 }}>
            {["👤 Paciente","🎯 Objetivos","🚫 Restricciones"].map((s,i) => (
              <div key={i} style={{ flex:1 }}>
                <div style={{ height:4, borderRadius:4, background:i<=step?"#2d6a4f":"#e0ece6", transition:"background .3s" }} />
              </div>
            ))}
          </div>
        )}

        <div style={S.card}>
          {step === 0 && (
            <div>
              <h3 style={{ margin:"0 0 16px", color:"#1a3d2b", fontSize:16 }}>👤 Datos de la paciente</h3>
              <Field label="Nombre completo" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <Field label="Edad" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30" />
                <Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65" />
                <Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165" />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Sexo</label>
                <div style={{ display:"flex", gap:8, marginTop:5 }}>
                  {["Femenino","Masculino"].map(s=><Tag key={s} label={s} selected={form.sexo===s} onClick={()=>set("sexo",s)} />)}
                </div>
              </div>
              <button onClick={()=>setStep(1)} disabled={!form.nombre||!form.edad||!form.peso||!form.sexo}
                style={{...S.btnPrimary, width:"100%", padding:"12px", fontSize:15, opacity:(!form.nombre||!form.edad||!form.peso||!form.sexo)?.5:1}}>
                Siguiente →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ margin:"0 0 16px", color:"#1a3d2b", fontSize:16 }}>🎯 Objetivos y actividad</h3>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Objetivo principal</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:5 }}>
                  {OBJETIVOS_OPTS.map(o=><Tag key={o} label={o} selected={form.objetivo===o} onClick={()=>set("objetivo",o)} />)}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Nivel de actividad física</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:5 }}>
                  {ACTIVIDAD_OPTS.map(o=><Tag key={o} label={o} selected={form.nivelActividad===o} onClick={()=>set("nivelActividad",o)} />)}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Comidas por día</label>
                <select value={form.cantidadComidas} onChange={e=>set("cantidadComidas",e.target.value)} style={S.input}>
                  {["3","4","5","6"].map(o=><option key={o} value={o}>{o} comidas</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(0)} style={{...S.btnGhost, flex:1}}>← Volver</button>
                <button onClick={()=>setStep(2)} disabled={!form.objetivo||!form.nivelActividad}
                  style={{...S.btnPrimary, flex:2, opacity:(!form.objetivo||!form.nivelActividad)?.5:1}}>Siguiente →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin:"0 0 16px", color:"#1a3d2b", fontSize:16 }}>🚫 Restricciones y preferencias</h3>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Alergias e intolerancias</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:5 }}>
                  {ALERGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.alergias.includes(o)} onClick={()=>set("alergias",toggle(form.alergias,o))} />)}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Patologías</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:5 }}>
                  {PATOLOGIAS_OPTS.map(o=><Tag key={o} label={o} selected={form.patologias.includes(o)} onClick={()=>set("patologias",toggle(form.patologias,o))} />)}
                </div>
              </div>
              <Field label="Alimentos preferidos" value={form.preferencias} onChange={v=>set("preferencias",v)} placeholder="Ej: pollo, arroz integral, frutas..." rows={2} />
              <Field label="Alimentos que no le gustan" value={form.aversiones} onChange={v=>set("aversiones",v)} placeholder="Ej: brócoli, hígado..." rows={2} />
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(1)} style={{...S.btnGhost, flex:1}}>← Volver</button>
                <button onClick={generatePlan} style={{ flex:2, padding:"12px", background:"linear-gradient(135deg,#2d6a4f,#40916c)", color:"#fff", border:"none", borderRadius:10, fontSize:15, fontFamily:"inherit", cursor:"pointer", fontWeight:700 }}>
                  ✨ Generar plan
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            loading ? (
              <div style={{ textAlign:"center", padding:"50px 20px" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🥗</div>
                <h3 style={{ color:"#2d6a4f", margin:"0 0 6px" }}>Generando plan para {form.nombre}...</h3>
                <p style={{ color:"#7a9a8a", fontSize:13, margin:0 }}>La IA está personalizando cada detalle</p>
                <div style={{ marginTop:20, display:"flex", justifyContent:"center", gap:8 }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:"#2d6a4f", animation:`bx .8s ${i*.2}s infinite alternate` }} />
                  ))}
                </div>
                <style>{`@keyframes bx{to{transform:translateY(-10px)}}`}</style>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <h3 style={{ margin:0, fontSize:16, color:"#1a3d2b" }}>Plan de {form.nombre}</h3>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:"#7a9a8a" }}>{form.objetivo} · {form.cantidadComidas} comidas/día</p>
                  </div>
                  <button onClick={()=>setEditing(!editing)} style={{...S.btnOutline, fontSize:12, padding:"6px 12px"}}>
                    {editing?"👁 Ver":"✏️ Editar"}
                  </button>
                </div>
                {editing
                  ? <textarea value={plan} onChange={e=>setPlan(e.target.value)} rows={18} style={{...S.input, lineHeight:1.7, fontSize:13, resize:"vertical"}} />
                  : <div style={{ background:"#f5faf7", borderRadius:12, padding:"14px", fontSize:13, lineHeight:1.8, color:"#1a3d2b", maxHeight:380, overflowY:"auto", whiteSpace:"pre-wrap", border:"1.5px solid #e0ece6" }}>{plan}</div>
                }

                {/* Notas del nutricionista para el PDF */}
                <div style={{ marginTop:12 }}>
                  <label style={{ ...S.label, marginBottom:5 }}>Notas del nutricionista (aparecen en el PDF)</label>
                  <textarea value={notasNutri} onChange={e=>setNotasNutri(e.target.value)} rows={2} placeholder="Indicaciones personalizadas, aclaraciones, próxima consulta..."
                    style={{...S.input, fontSize:13, resize:"none"}} />
                </div>

                <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button onClick={()=>{
                    const el=document.createElement("textarea"); el.value=plan; el.style.position="fixed"; el.style.opacity="0";
                    document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el);
                    setCopied(true); setTimeout(()=>setCopied(false),2000);
                  }} style={{ flex:1, padding:"10px", borderRadius:9, border:"1.5px solid #d8e8df", background:copied?"#2d6a4f":"#fff", color:copied?"#fff":"#2d6a4f", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600, transition:"all .2s", minWidth:90 }}>
                    {copied?"✓ Copiado!":"📋 Copiar"}
                  </button>
                  <button onClick={()=>{
                    const content=`PLAN NUTRICIONAL\nPaciente: ${form.nombre} | ${today()}\n${"=".repeat(50)}\n\n${plan}`;
                    const a=document.createElement("a"); a.href=`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
                    a.download=`Plan_${form.nombre.replace(/ /g,"_")}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }} style={{...S.btnGhost, flex:1, minWidth:90}}>⬇️ .txt</button>
                  <button onClick={()=>{
                    setGeneratingPDF(true);
                    try { exportPDF({ form, plan, notasNutricionista: notasNutri }); }
                    catch(e){ alert("Error generando PDF. Intentá nuevamente."); }
                    setGeneratingPDF(false);
                  }} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background: generatingPDF?"#7a9a8a":"#1b4332", color:"#fff", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:700, minWidth:120, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    {generatingPDF ? "Generando..." : "📄 Descargar PDF"}
                  </button>
                  {onSavePlan && !saved && (
                    <button onClick={()=>{ onSavePlan({id:uid(),fecha:today(),objetivo:form.objetivo,texto:plan}); setSaved(true); }}
                      style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"#52b788", color:"#fff", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600, minWidth:90 }}>
                      💾 Guardar
                    </button>
                  )}
                  {saved && <Badge label="✓ Guardado" color="#d8f3dc" text="#2d6a4f" />}
                </div>
                <button onClick={()=>{setStep(0);setForm(initialPlanForm);setPlan("");setSaved(false);}} style={{...S.btnGhost, marginTop:10, width:"100%", textAlign:"center"}}>
                  ↩ Nuevo plan
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LISTA DE PACIENTES ────────────────────────────────────────────────────────
function PatientList({ patients, onSelect, onNew }) {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:"#1a3d2b" }}>👥 Pacientes</h2>
          <p style={{ margin:"2px 0 0", fontSize:13, color:"#7a9a8a" }}>{patients.length} paciente{patients.length!==1?"s":""} registrada{patients.length!==1?"s":""}</p>
        </div>
        <button onClick={onNew} style={S.btnPrimary}>+ Nuevo paciente</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nombre..." style={{...S.input, maxWidth:340, marginBottom:16}} />
      {filtered.length === 0 && (
        <div style={{...S.card, textAlign:"center", padding:"48px 24px", color:"#7a9a8a"}}>
          <div style={{ fontSize:40, marginBottom:10 }}>👩‍⚕️</div>
          <p style={{ margin:0 }}>{search?"Sin resultados":"Aún no hay pacientes. ¡Agregá la primera!"}</p>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(p => (
          <div key={p.id} onClick={()=>onSelect(p.id)} style={{...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", cursor:"pointer", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:13 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#52b788,#2d6a4f)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:17, fontWeight:700, flexShrink:0 }}>
                {p.nombre.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#1a3d2b" }}>{p.nombre}</div>
                <div style={{ fontSize:12, color:"#7a9a8a", marginTop:1 }}>{p.edad} años · {p.objetivo||"Sin objetivo"}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#bbb" }}>Última consulta</div>
                <div style={{ fontSize:12, color:"#5a7a6a", fontWeight:600 }}>{p.notas?.[0]?.fecha||p.fechaCreacion}</div>
              </div>
              <Badge label={`${p.planes?.length||0} plan${p.planes?.length!==1?"es":""}`} />
              <span style={{ color:"#2d6a4f", fontSize:20 }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NUEVO PACIENTE ────────────────────────────────────────────────────────────
function NewPatient({ onSave, onCancel }) {
  const [form, setForm] = useState({ nombre:"", edad:"", sexo:"", altura:"", peso:"", telefono:"", email:"", fechaCreacion:todayISO() });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onCancel} style={S.btnGhost}>← Volver</button>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1a3d2b" }}>+ Nuevo paciente</h2>
      </div>
      <div style={{...S.card, maxWidth:540}}>
        <Field label="Nombre completo *" value={form.nombre} onChange={v=>set("nombre",v)} placeholder="Nombre y apellido" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Edad *" type="number" value={form.edad} onChange={v=>set("edad",v)} placeholder="30" />
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Sexo</label>
            <select value={form.sexo} onChange={e=>set("sexo",e.target.value)} style={S.input}>
              <option value="">Seleccionar...</option>
              <option>Femenino</option><option>Masculino</option><option>Otro</option>
            </select>
          </div>
          <Field label="Altura (cm)" type="number" value={form.altura} onChange={v=>set("altura",v)} placeholder="165" />
          <Field label="Peso (kg)" type="number" value={form.peso} onChange={v=>set("peso",v)} placeholder="65" />
          <Field label="Teléfono" value={form.telefono} onChange={v=>set("telefono",v)} placeholder="1150001111" />
          <Field label="Email" type="email" value={form.email} onChange={v=>set("email",v)} placeholder="mail@ejemplo.com" />
          <Field label="Primera consulta" type="date" value={form.fechaCreacion} onChange={v=>set("fechaCreacion",v)} />
        </div>
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button onClick={onCancel} style={{...S.btnGhost, flex:1}}>Cancelar</button>
          <button onClick={()=>onSave({...form, id:uid(), clinica:{...initialClinica}, mediciones:[], notas:[], planes:[], objetivo:""})}
            disabled={!form.nombre||!form.edad} style={{...S.btnPrimary, flex:2, opacity:(form.nombre&&form.edad)?1:.5}}>
            Guardar paciente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FICHA DEL PACIENTE ────────────────────────────────────────────────────────
function PatientDetail({ patient, dispatch, onGeneratePlan, onBack }) {
  const [tab, setTab] = useState("ficha");
  const [editingClinica, setEditingClinica] = useState(false);
  const [clinica, setClinica] = useState({...initialClinica, ...(patient.clinica||{})});
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState({ fecha:todayISO(), peso:"", grasa:"", muscular:"", obs:"" });
  const [notaText, setNotaText] = useState("");
  const [showNota, setShowNota] = useState(false);
  const [viewPlan, setViewPlan] = useState(null);

  const setC = (k,v) => setClinica(c=>({...c,[k]:v}));
  const setM = (k,v) => setMedForm(f=>({...f,[k]:v}));

  const TABS = [["ficha","📋 Ficha"],["antrop","📏 Antropometría"],["evol","📝 Evolución"],["planes","🥗 Planes"],["timeline","⏱ Timeline"]];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <button onClick={onBack} style={S.btnGhost}>← Pacientes</button>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:200 }}>
          <div style={{ width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,#52b788,#2d6a4f)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:19, fontWeight:700, flexShrink:0 }}>
            {patient.nombre.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:19, fontWeight:700, color:"#1a3d2b" }}>{patient.nombre}</h2>
            <p style={{ margin:0, fontSize:12, color:"#7a9a8a" }}>{patient.edad} años · {patient.sexo} · {patient.altura}cm · {patient.peso}kg · IMC {calcIMC(patient.peso,patient.altura)}</p>
          </div>
        </div>
        <button onClick={onGeneratePlan} style={S.btnPrimary}>✨ Generar plan</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, marginBottom:20, borderBottom:"2px solid #e0ece6", overflowX:"auto" }}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            padding:"9px 15px", border:"none", background:"none", fontFamily:"inherit", fontSize:13, fontWeight:600,
            color:tab===id?"#2d6a4f":"#7a9a8a", cursor:"pointer", whiteSpace:"nowrap",
            borderBottom:tab===id?"2px solid #2d6a4f":"2px solid transparent", marginBottom:-2
          }}>{label}</button>
        ))}
      </div>

      {/* FICHA */}
      {tab === "ficha" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
          <div style={S.card}>
            <SectionHead>👤 Datos personales</SectionHead>
            {[["Nombre",patient.nombre],["Edad",`${patient.edad} años`],["Sexo",patient.sexo||"—"],["Altura",`${patient.altura||"—"} cm`],["Peso",`${patient.peso||"—"} kg`],["IMC",calcIMC(patient.peso,patient.altura)],["Teléfono",patient.telefono||"—"],["Email",patient.email||"—"],["1ª consulta",patient.fechaCreacion]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f4f1" }}>
                <span style={{ fontSize:12, color:"#7a9a8a", fontWeight:600 }}>{k}</span>
                <span style={{ fontSize:13, color:"#1a3d2b", fontWeight:500, textAlign:"right", maxWidth:"60%" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <SectionHead action={
              <button onClick={()=>setEditingClinica(!editingClinica)} style={{...S.btnGhost, fontSize:12, padding:"6px 12px"}}>
                {editingClinica?"Cancelar":"✏️ Editar"}
              </button>
            }>🏥 Historia clínica</SectionHead>
            {editingClinica ? (
              <div>
                {[["motivo","Motivo de consulta",3],["diagnostico","Diagnóstico nutricional",2],["antecedentes","Antecedentes médicos",2],["medicacion","Medicación",2],["patologias","Patologías",2],["alergias","Alergias / intolerancias",2],["digestivo","Síntomas digestivos",2],["sueno","Calidad del sueño",1],["estres","Nivel de estrés",1],["actividad","Actividad física",1]].map(([k,l,r])=>(
                  <Field key={k} label={l} value={clinica[k]} onChange={v=>setC(k,v)} rows={r} />
                ))}
                <button onClick={()=>{ dispatch({type:"UPDATE_CLINICA",pid:patient.id,clinica}); setEditingClinica(false); }} style={{...S.btnPrimary, width:"100%"}}>
                  Guardar
                </button>
              </div>
            ) : (
              <div>
                {[["Motivo","motivo"],["Diagnóstico","diagnostico"],["Antecedentes","antecedentes"],["Medicación","medicacion"],["Patologías","patologias"],["Alergias","alergias"],["Digestivo","digestivo"],["Sueño","sueno"],["Estrés","estres"],["Actividad","actividad"]].map(([l,k])=>
                  clinica[k] ? (
                    <div key={k} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#5a7a6a", textTransform:"uppercase", letterSpacing:.8 }}>{l}</div>
                      <div style={{ fontSize:13, color:"#1a3d2b", marginTop:2 }}>{clinica[k]}</div>
                    </div>
                  ) : null
                )}
                {!Object.values(clinica).some(Boolean) && <p style={{ color:"#bbb", fontSize:13 }}>Sin datos. Hacé click en Editar.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANTROPOMETRÍA */}
      {tab === "antrop" && (
        <div style={S.card}>
          <SectionHead action={<button onClick={()=>setShowMedForm(!showMedForm)} style={S.btnPrimary}>+ Agregar medición</button>}>
            📏 Historial de mediciones
          </SectionHead>
          {showMedForm && (
            <div style={{ background:"#f5faf7", borderRadius:12, padding:16, marginBottom:20, border:"1.5px solid #d8f3dc" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
                <Field label="Fecha" type="date" value={medForm.fecha} onChange={v=>setM("fecha",v)} />
                <Field label="Peso (kg)" type="number" value={medForm.peso} onChange={v=>setM("peso",v)} placeholder="70" />
                <Field label="% Grasa" type="number" value={medForm.grasa} onChange={v=>setM("grasa",v)} placeholder="25" />
                <Field label="Masa muscular (kg)" type="number" value={medForm.muscular} onChange={v=>setM("muscular",v)} placeholder="45" />
                <div style={{ gridColumn:"1/-1" }}><Field label="Observaciones" value={medForm.obs} onChange={v=>setM("obs",v)} placeholder="Notas..." /></div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setShowMedForm(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button>
                <button onClick={()=>{ dispatch({type:"ADD_MEDICION",pid:patient.id,m:{id:uid(),...medForm,imc:calcIMC(medForm.peso,patient.altura)}}); setMedForm({fecha:todayISO(),peso:"",grasa:"",muscular:"",obs:""}); setShowMedForm(false); }}
                  disabled={!medForm.peso} style={{...S.btnPrimary,flex:2,opacity:medForm.peso?1:.5}}>Guardar</button>
              </div>
            </div>
          )}
          {!patient.mediciones?.length && <p style={{ color:"#bbb", fontSize:13 }}>Sin mediciones registradas.</p>}
          {!!patient.mediciones?.length && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"#f5faf7" }}>
                  {["Fecha","Peso","IMC","% Grasa","Masa Musc.","Observaciones"].map(h=>(
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#5a7a6a", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{patient.mediciones.map((m,i)=>(
                  <tr key={m.id} style={{ borderTop:"1px solid #f0f4f1", background:i%2?"#fafcfb":"#fff" }}>
                    <td style={{ padding:"9px 12px", fontWeight:600, color:"#1a3d2b", whiteSpace:"nowrap" }}>{m.fecha}</td>
                    <td style={{ padding:"9px 12px" }}>{m.peso} kg</td>
                    <td style={{ padding:"9px 12px" }}><Badge label={m.imc} /></td>
                    <td style={{ padding:"9px 12px" }}>{m.grasa?`${m.grasa}%`:"—"}</td>
                    <td style={{ padding:"9px 12px" }}>{m.muscular?`${m.muscular} kg`:"—"}</td>
                    <td style={{ padding:"9px 12px", color:"#7a9a8a" }}>{m.obs||"—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EVOLUCIÓN */}
      {tab === "evol" && (
        <div style={S.card}>
          <SectionHead action={<button onClick={()=>setShowNota(!showNota)} style={S.btnPrimary}>+ Agregar nota</button>}>
            📝 Notas de seguimiento
          </SectionHead>
          {showNota && (
            <div style={{ background:"#f5faf7", borderRadius:12, padding:16, marginBottom:20, border:"1.5px solid #d8f3dc" }}>
              <Field label={`Nota del ${today()}`} value={notaText} onChange={setNotaText} rows={4} placeholder="Observaciones de la consulta de hoy..." />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setShowNota(false)} style={{...S.btnGhost,flex:1}}>Cancelar</button>
                <button onClick={()=>{ dispatch({type:"ADD_NOTA",pid:patient.id,n:{id:uid(),fecha:today(),texto:notaText}}); setNotaText(""); setShowNota(false); }}
                  disabled={!notaText} style={{...S.btnPrimary,flex:2,opacity:notaText?1:.5}}>Guardar nota</button>
              </div>
            </div>
          )}
          {!patient.notas?.length && <p style={{ color:"#bbb", fontSize:13 }}>Sin notas registradas.</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {patient.notas?.map(n=>(
              <div key={n.id} style={{ borderLeft:"3px solid #52b788", paddingLeft:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#5a7a6a", marginBottom:4 }}>{n.fecha}</div>
                <div style={{ fontSize:13.5, color:"#1a3d2b", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{n.texto}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLANES */}
      {tab === "planes" && (
        <div style={S.card}>
          <SectionHead action={<button onClick={onGeneratePlan} style={S.btnPrimary}>✨ Generar nuevo plan</button>}>
            🥗 Planes generados
          </SectionHead>
          {!patient.planes?.length && <p style={{ color:"#bbb", fontSize:13 }}>Sin planes. Hacé click en "Generar nuevo plan".</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {patient.planes?.map(pl=>(
              <div key={pl.id}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:"#f5faf7", borderRadius:12, border:"1.5px solid #e0ece6" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:"#1a3d2b" }}>{pl.objetivo}</div>
                    <div style={{ fontSize:12, color:"#7a9a8a", marginTop:1 }}>{pl.fecha}</div>
                  </div>
                  <button onClick={()=>setViewPlan(viewPlan===pl.id?null:pl.id)} style={{...S.btnOutline, fontSize:12, padding:"6px 14px"}}>
                    {viewPlan===pl.id?"Cerrar":"Ver plan"}
                  </button>
                </div>
                {viewPlan===pl.id && (
                  <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", padding:"14px 16px", border:"1.5px solid #d8f3dc", borderTop:"none", fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap", color:"#1a3d2b", maxHeight:360, overflowY:"auto" }}>
                    {pl.texto}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {tab === "timeline" && (
        <div style={S.card}>
          <SectionHead>⏱ Timeline del paciente</SectionHead>
          {(() => {
            const ev = [
              ...(patient.notas||[]).map(n=>({fecha:n.fecha, tipo:"nota", icon:"📝", label:"Consulta registrada", desc:n.texto.slice(0,70)+(n.texto.length>70?"...":"")})),
              ...(patient.mediciones||[]).map(m=>({fecha:m.fecha, tipo:"med", icon:"📏", label:`Medición · ${m.peso} kg`, desc:`IMC ${m.imc}${m.obs?" · "+m.obs:""}`})),
              ...(patient.planes||[]).map(p=>({fecha:p.fecha, tipo:"plan", icon:"🥗", label:"Plan generado", desc:p.objetivo})),
            ].sort((a,b)=>b.fecha.localeCompare(a.fecha));
            if (!ev.length) return <p style={{ color:"#bbb", fontSize:13 }}>Sin eventos registrados aún.</p>;
            return (
              <div style={{ position:"relative", paddingLeft:32 }}>
                <div style={{ position:"absolute", left:12, top:4, bottom:4, width:2, background:"#e0ece6", borderRadius:2 }} />
                {ev.map((e,i)=>(
                  <div key={i} style={{ position:"relative", marginBottom:18 }}>
                    <div style={{ position:"absolute", left:-24, top:4, width:26, height:26, borderRadius:"50%", background:e.tipo==="plan"?"#52b788":e.tipo==="med"?"#74c69d":"#b7e4c7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{e.icon}</div>
                    <div style={{ background:"#f5faf7", borderRadius:10, padding:"10px 14px", border:"1.5px solid #e0ece6" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2, gap:8 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#1a3d2b" }}>{e.label}</span>
                        <span style={{ fontSize:11, color:"#bbb", flexShrink:0 }}>{e.fecha}</span>
                      </div>
                      <span style={{ fontSize:12, color:"#5a7a6a" }}>{e.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ttgnqkmhevegcldvrthw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Z25xa21oZXZlZ2NsZHZydGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDUwMjEsImV4cCI6MjA4ODM4MTAyMX0.AlbfPSk8C-IDvf_AcnFwaAkv4iLKz3Gj5w3QDw9EDSM";
const SB = (path, opts={}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation", ...opts.headers },
  ...opts
});

async function sbLoadAll() {
  const r = await SB("patients?select=*&order=created_at.desc");
  if (!r.ok) return [];
  const rows = await r.json();
  return rows.map(row => ({
    id: row.id, nombre: row.nombre, edad: row.edad, sexo: row.sexo,
    altura: row.altura, peso: row.peso, telefono: row.telefono, email: row.email,
    fechaCreacion: row.fecha_creacion, objetivo: row.objetivo,
    clinica: row.clinica || {}, mediciones: row.mediciones || [],
    notas: row.notas || [], planes: row.planes || []
  }));
}

async function sbUpsert(patient) {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  };
  const body = JSON.stringify({
    id: patient.id, nombre: patient.nombre, edad: patient.edad, sexo: patient.sexo,
    altura: patient.altura, peso: patient.peso, telefono: patient.telefono || "", email: patient.email || "",
    fecha_creacion: patient.fechaCreacion || "", objetivo: patient.objetivo || "",
    clinica: patient.clinica || {}, mediciones: patient.mediciones || [],
    notas: patient.notas || [], planes: patient.planes || []
  });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/patients`, { method:"POST", headers, body });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(err);
  }
}

async function sbDelete(id) {
  await SB(`patients?id=eq.${id}`, { method: "DELETE" });
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { patients: [] });
  const [screen, setScreen] = useState("patients");
  const [selectedId, setSelectedId] = useState(null);
  const [navTab, setNavTab] = useState("patients");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [importError, setImportError] = useState("");
  const [showBackup, setShowBackup] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [exportData, setExportData] = useState("");
  const [exportCopied, setExportCopied] = useState(false);

  // Cargar todos los pacientes desde Supabase al iniciar
  useEffect(() => {
    sbLoadAll().then(patients => {
      dispatch({ type: "LOAD", patients });
      setLoaded(true);
    }).catch(() => {
      dispatch({ type: "LOAD", patients: [] });
      setLoaded(true);
    });
  }, []);

  // Auto-guardar en Supabase cuando cambian los pacientes
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        await Promise.all(state.patients.map(p => sbUpsert(p)));
        setSaveStatus("saved");
      } catch(e) { setSaveStatus("error"); }
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
    return () => clearTimeout(t);
  }, [state.patients, loaded]);

  const patient = state.patients.find(p => p.id === selectedId);
  const go = (s, id=null) => { setScreen(s); if(id) setSelectedId(id); };

  // Export JSON backup
  const handleExport = () => {
    const data = JSON.stringify({ version:1, exportedAt: new Date().toISOString(), patients: state.patients }, null, 2);
    setExportData(data); setShowExportData(true);
  };
  const handleCopyExport = () => {
    const el=document.createElement("textarea"); el.value=exportData; el.style.position="fixed"; el.style.opacity="0";
    document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    setExportCopied(true); setTimeout(()=>setExportCopied(false),2000);
  };
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const patients = parsed.patients || parsed;
        if (!Array.isArray(patients)) throw new Error();
        dispatch({ type:"LOAD", patients });
        setImportError(""); setShowBackup(false);
        alert(`✓ ${patients.length} paciente(s) importado(s).`);
      } catch { setImportError("Archivo inválido."); }
    };
    reader.readAsText(file); e.target.value="";
  };

  if (!loaded) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5faf7", fontFamily:"sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🥗</div>
        <p style={{ color:"#2d6a4f", fontWeight:600 }}>Conectando con la base de datos...</p>
        <p style={{ color:"#7a9a8a", fontSize:13 }}>JL Nutrición · Supabase</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#e8f5ee 0%,#f5f9f7 50%,#e0f0e8 100%)", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap'); *{box-sizing:border-box} input:focus,select:focus,textarea:focus{border-color:#2d6a4f!important;box-shadow:0 0 0 3px rgba(45,106,79,.1)!important}`}</style>

      {/* NAVBAR */}
      <div style={{ background:"#fff", borderBottom:"1.5px solid #e8f0ec", padding:"0 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>🥗</span>
            <span style={{ fontWeight:700, fontSize:16, color:"#1a3d2b" }}>NutriPlan IA</span>
            {/* Indicador de guardado */}
            <span style={{ fontSize:11, color: saveStatus==="saving"?"#f4a261": saveStatus==="saved"?"#52b788": saveStatus==="error"?"#e63946":"#bbb", fontWeight:600, transition:"color .3s" }}>
              {saveStatus==="saving" ? "● guardando..." : saveStatus==="saved" ? "✓ guardado en la nube" : saveStatus==="error" ? "⚠ error al guardar" : ""}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {[["patients","👥 Pacientes"],["plan","✨ Nuevo plan"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setNavTab(id);go(id);}} style={{
                padding:"7px 15px", border:"none", borderRadius:9, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer",
                background:navTab===id?"#2d6a4f":"transparent", color:navTab===id?"#fff":"#5a7a6a"
              }}>{label}</button>
            ))}
            <button onClick={()=>setShowBackup(!showBackup)} style={{ padding:"7px 12px", border:"none", borderRadius:9, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", background:showBackup?"#f0f4f1":"transparent", color:"#5a7a6a" }} title="Backup">
              💾
            </button>
          </div>
        </div>

        {/* Panel de backup */}
        {showBackup && (
          <div style={{ borderTop:"1px solid #e8f0ec", background:"#f5faf7" }}>
            <div style={{ maxWidth:960, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#1a3d2b" }}>💾 Backup de datos</span>
              <span style={{ fontSize:12, color:"#7a9a8a" }}>{state.patients.length} paciente(s) en el sistema</span>
              <div style={{ display:"flex", gap:8, marginLeft:"auto", flexWrap:"wrap" }}>
                <button onClick={handleExport} style={{ padding:"7px 16px", background:"#2d6a4f", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:600 }}>
                  ⬇️ Exportar backup (.json)
                </button>
                <label style={{ padding:"7px 16px", background:"#fff", color:"#2d6a4f", border:"1.5px solid #2d6a4f", borderRadius:8, fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:600 }}>
                  ⬆️ Importar backup
                  <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
                </label>
              </div>
              {importError && <p style={{ margin:0, fontSize:12, color:"#e63946", width:"100%" }}>{importError}</p>}
              <p style={{ margin:0, fontSize:11, color:"#aaa", width:"100%" }}>
                Los datos se guardan automáticamente en Supabase (nube). El backup JSON es un respaldo extra.
              </p>
            </div>

            {/* Panel JSON exportado */}
            {showExportData && (
              <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px 14px" }}>
                <div style={{ background:"#1a3d2b", borderRadius:12, padding:"14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <span style={{ color:"#52b788", fontSize:12, fontWeight:700 }}>📋 Copiá este texto y guardalo en un archivo .json o en Google Drive</span>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={handleCopyExport} style={{ padding:"6px 14px", background: exportCopied?"#52b788":"#2d6a4f", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:600 }}>
                        {exportCopied ? "✓ Copiado!" : "📋 Copiar todo"}
                      </button>
                      <button onClick={()=>setShowExportData(false)} style={{ padding:"6px 12px", background:"#3a5a4a", color:"#ccc", border:"none", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                  <textarea readOnly value={exportData} rows={8}
                    style={{ width:"100%", background:"#0d2218", color:"#74c69d", border:"none", borderRadius:8, padding:"10px", fontSize:11, fontFamily:"monospace", resize:"none", outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"24px 16px" }}>
        {screen === "patients" && <PatientList patients={state.patients} onSelect={id=>go("detail",id)} onNew={()=>go("new-patient")} />}
        {screen === "new-patient" && <NewPatient onSave={p=>{dispatch({type:"ADD_PATIENT",p});go("detail",p.id);}} onCancel={()=>go("patients")} />}
        {screen === "detail" && patient && (
          <PatientDetail patient={patient} dispatch={dispatch} onGeneratePlan={()=>go("plan-patient")} onBack={()=>go("patients")} />
        )}
        {screen === "plan-patient" && patient && (
          <PlanGenerator
            prefill={{nombre:patient.nombre, edad:patient.edad, peso:patient.peso, altura:patient.altura, sexo:patient.sexo, objetivo:patient.objetivo||"", nivelActividad:"", alergias:[], patologias:[], preferencias:"", aversiones:"", cantidadComidas:"4"}}
            onSavePlan={plan=>{dispatch({type:"ADD_PLAN",pid:patient.id,plan}); go("detail",patient.id);}}
            onBack={()=>go("detail",patient.id)}
          />
        )}
        {screen === "plan" && <PlanGenerator onBack={()=>{setNavTab("patients");go("patients");}} />}
      </div>
    </div>
  );
}

