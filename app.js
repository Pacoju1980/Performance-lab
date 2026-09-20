const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const COLORS={green:'#24c875',yellow:'#f4b83d',red:'#ff6262',gray:'#a9b3c1',blue:'#3678ff',violet:'#7a67ff'};
const STORE='performanceLab.v1';
const BUILD='1.2.0';
const defaultState={version:2,profile:null,daily:{},anthro:[],labs:[],selectedRoutine:{},settings:{explain:true,notifications:false,weeklySessionTarget:3},lastSync:null,lastSyncSources:[],syncLog:[]};
let state=load(); migrateState(); let ui={screen:'today',period:'week',modal:null,demo:false};

const routines={
 A:{phase:'Meses 1–3',label:'Sesión A',accent:'blue',exercises:[['Press inclinado con mancuernas','2–3 × 8–12'],['Remo con pecho apoyado','2–3 × 8–12'],['Sentadilla profunda en Smith','2–3 × 8–12'],['Curl femoral sentado','2–3 × 10–15'],['Elevación lateral','2 × 12–20'],['Extensión de tríceps sobre la cabeza','2 × 10–15'],['Elevación de talones de pie','2–3 × 10–15']]},
 B:{phase:'Meses 1–3',label:'Sesión B',accent:'violet',exercises:[['Press horizontal','2–3 × 8–12'],['Jalón al pecho','2–3 × 8–12'],['Prensa de piernas','2–3 × 10–15'],['Extensión de rodilla','2–3 × 10–15'],['Peso muerto piernas semirrígidas','2 × 8–12'],['Elevación lateral','2 × 12–20'],['Curl en banco predicador','2 × 10–15']]},
 C:{phase:'Meses 1–3',label:'Sesión C',accent:'green',exercises:[['Press inclinado con mancuernas','2–3 × 10–15'],['Remo con pecho apoyado','2–3 × 10–15'],['Jalón al pecho','2 × 10–15'],['Hip thrust','2–3 × 8–12'],['Curl femoral sentado','2 × 10–15'],['Curl inclinado','2 × 10–15'],['Apertura posterior de hombro','2 × 12–20']]},
 UA:{phase:'Meses 4–6',label:'Superior A',accent:'blue',exercises:[['Press inclinado con mancuernas','3 × 8–12'],['Jalón al pecho','3 × 8–12'],['Remo con pecho apoyado','2 × 8–12'],['Elevación lateral','3 × 12–20'],['Extensión tríceps sobre la cabeza','3 × 10–15'],['Curl inclinado','2–3 × 10–15'],['Apertura posterior de hombro','2 × 12–20']]},
 LA:{phase:'Meses 4–6',label:'Inferior A',accent:'green',exercises:[['Sentadilla profunda en Smith','3 × 8–12'],['Extensión de rodilla','3 × 10–15'],['Curl femoral sentado','3 × 10–15'],['Hip thrust','2 × 8–12'],['Elevación de talones de pie','4 × 10–15']]},
 UB:{phase:'Meses 4–6',label:'Superior B',accent:'violet',exercises:[['Press horizontal','3 × 8–12'],['Press inclinado con mancuernas','2–3 × 10–15'],['Jalón al pecho','2 × 10–15'],['Remo con pecho apoyado','3 × 10–15'],['Elevación lateral','3–4 × 12–20'],['Extensión tríceps sobre la cabeza','3 × 10–15'],['Curl en banco predicador','2–3 × 10–15']]},
 LB:{phase:'Meses 4–6',label:'Inferior B',accent:'yellow',exercises:[['Prensa de piernas','3 × 10–15'],['Peso muerto piernas semirrígidas','3 × 8–12'],['Curl femoral sentado','2–3 × 10–15'],['Extensión de rodilla','2–3 × 10–15'],['Elevación de talones de pie','4 × 10–15'],['Curl femoral nórdico asistido','2 × 5–8']]}
};

const metricDefs={
 energy:{name:'Energía',icon:'⚡',unit:'/5',manual:true,clinical:false},
 sleepHours:{name:'Sueño',icon:'🌙',unit:'h',clinical:true,ref:p=>'Adulto: objetivo general ≥ 7 h/noche.',good:(v,p)=>v>=7?'green':v>=6?'yellow':'red'},
 stress:{name:'Estrés',icon:'◉',unit:'/100',clinical:false},
 restingHR:{name:'FC en reposo',icon:'♥',unit:'lpm',clinical:true,ref:p=>'Adultos: 60–100 lpm es un rango general; tu tendencia personal tiene prioridad.',good:(v,p)=>v>=50&&v<=90?'green':v>=45&&v<=100?'yellow':'red'},
 spo2:{name:'SpO₂',icon:'O₂',unit:'%',clinical:true,ref:p=>p?.altitude>=1500?'CDMX (~2,240 m): media poblacional sana cercana a 94%; se interpreta con altitud y basal personal.':'A baja altitud, valores habituales en adultos suelen estar alrededor de 95–100%.',good:(v,p)=>p?.altitude>=1500?(v>=92?'green':v>=90?'yellow':'red'):(v>=95?'green':v>=92?'yellow':'red')},
 hrv:{name:'VFC (HRV)',icon:'〽',unit:'ms',clinical:false},
 steps:{name:'Pasos',icon:'◌',unit:'',clinical:false},
 respiratoryRate:{name:'Respiración',icon:'≈',unit:'rpm',clinical:true,ref:p=>'En reposo, 12–20 respiraciones/min es un intervalo clínico general en adultos.',good:(v,p)=>v>=12&&v<=20?'green':v>=10&&v<=22?'yellow':'red'},
 bioCharge:{name:'BioCharge',icon:'◔',unit:'/100',clinical:false},
 workoutMinutes:{name:'Entrenamiento',icon:'🏋︎',unit:'min',clinical:false},
 workoutCalories:{name:'Calorías entrenamiento',icon:'🔥',unit:'kcal',clinical:false},
 workoutAvgHR:{name:'FC media entrenamiento',icon:'♥',unit:'lpm',clinical:false},
 activeMinutes:{name:'Minutos activos',icon:'↗',unit:'min',clinical:false},
 restMinutes:{name:'Tiempo de reposo',icon:'◴',unit:'min',clinical:false},
 bmi:{name:'IMC',icon:'◇',unit:'kg/m²',clinical:true,ref:p=>'Adultos: 18.5–24.9 kg/m² se considera rango de peso normal; no distingue músculo de grasa.',good:(v,p)=>v>=18.5&&v<25?'green':v>=17&&v<30?'yellow':'red'},
 waistHeight:{name:'Cintura/altura',icon:'⌁',unit:'',clinical:true,ref:p=>'Referencia clínica práctica: mantener la cintura por debajo de la mitad de la altura.',good:(v,p)=>v<.5?'green':v<.6?'yellow':'red'},
 waist:{name:'Cintura',icon:'◯',unit:'cm',clinical:true,ref:p=>p?.sex==='female'?'Mujeres: <80 cm menor riesgo; 80–87.9 cm aumentado; ≥88 cm alto.':'Hombres: <94 cm menor riesgo; 94–101.9 cm aumentado; ≥102 cm alto.',good:(v,p)=>p?.sex==='female'?(v<80?'green':v<88?'yellow':'red'):(v<94?'green':v<102?'yellow':'red')},
 weight:{name:'Peso',icon:'⚖',unit:'kg',clinical:false},
 sleepScore:{name:'Puntuación de sueño',icon:'◔',unit:'/100',clinical:false},
 pai:{name:'PAI',icon:'◎',unit:'',clinical:false},
 zeppReadiness:{name:'Recuperación Zepp',icon:'↗',unit:'/100',clinical:false}
};

function load(){try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return structuredClone(defaultState)}}
function migrateState(){state.version=2;state.settings={...defaultState.settings,...(state.settings||{})};state.daily=state.daily||{};state.anthro=Array.isArray(state.anthro)?state.anthro:[];state.labs=Array.isArray(state.labs)?state.labs:[];state.selectedRoutine=state.selectedRoutine||{};state.lastSyncSources=Array.isArray(state.lastSyncSources)?state.lastSyncSources:[];state.syncLog=Array.isArray(state.syncLog)?state.syncLog:[];for(const [d,r] of Object.entries(state.daily)){r.date=r.date||d;r.metrics=r.metrics||{};r.series=r.series||{};r.checkins=r.checkins||{};r.sources=Array.isArray(r.sources)?r.sources:[];r.supplements=r.supplements||{creatineG:3,creatineTaken:false,proteinG:30,proteinTaken:false};r.pain=r.pain||{}}}
function containsDemoData(s){
  const syncDemo=(s?.lastSyncSources||[]).some(x=>/demo/i.test(String(x)));
  const dailyDemo=Object.values(s?.daily||{}).some(d=>(d?.sources||[]).some(x=>/demo/i.test(String(x))));
  return syncDemo||dailyDemo;
}
function purgeDemoDataIfNeeded(){
  if(!containsDemoData(state))return false;
  state=structuredClone(defaultState);
  localStorage.removeItem(STORE);
  return true;
}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function iso(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function dayObj(d=iso()){state.daily[d]??={date:d,sources:[],metrics:{},series:{},checkins:{},supplements:{creatineG:3,creatineTaken:false,proteinG:30,proteinTaken:false},pain:{}};return state.daily[d]}
function fmtDate(s){return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(new Date(s+'T12:00:00'))}
function fmtFull(s=iso()){return new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(new Date(s+'T12:00:00'))}
function daysBack(n){let a=[];for(let i=n-1;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);a.push(iso(d))}return a}
function mean(a){let v=a.filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null}
function median(a){let v=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!v.length)return null;let m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2}
function pct(a,b){if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return null;return (a-b)/b*100}
function clamp(v,a=0,b=100){return Math.min(b,Math.max(a,v))}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function today(){return dayObj()}
function latestAnthro(){return [...state.anthro].sort((a,b)=>b.date.localeCompare(a.date))[0]||null}
function baselineDates(){return Object.keys(state.daily).sort().slice(0,15)}
function baselineMetric(key){return mean(baselineDates().map(d=>state.daily[d]?.metrics?.[key]))}
function personalBaselineReady(){return baselineDates().length>=15}
function metricValue(date,key){let d=state.daily[date];if(key==='energy')return d?.checkins?.morning?.energy??d?.checkins?.pre?.energy??null;if(key==='stress'&&!Number.isFinite(d?.metrics?.stress)){return mean([d?.metrics?.stressMorning,d?.metrics?.stressNoon,d?.metrics?.stressPreWorkout])}if(['bmi','waistHeight','weight','waist'].includes(key)){let a=[...state.anthro].filter(x=>x.date<=date).sort((x,y)=>y.date.localeCompare(x.date))[0]; if(!a)return null;if(key==='waistHeight')return a.waist&&state.profile?.height?a.waist/(state.profile.height):null;return a[key]??null}return d?.metrics?.[key]??null}
function periodDates(period){return daysBack(period==='day'?1:period==='week'?7:30)}
function seriesFor(key,period=ui.period){let ds=periodDates(period);return ds.map(d=>({date:d,value:metricValue(d,key)})).filter(x=>Number.isFinite(x.value))}
function trendFor(key,period=ui.period){let n=period==='day'?1:period==='week'?7:30;let cur=mean(daysBack(n).map(d=>metricValue(d,key)));let past=[];for(let i=n*2-1;i>=n;i--){let d=new Date();d.setDate(d.getDate()-i);past.push(metricValue(iso(d),key))}let prev=mean(past);return {cur,prev,delta:pct(cur,prev)}}
function clinicalColor(key,v){let def=metricDefs[key];return def?.good&&Number.isFinite(v)?def.good(v,state.profile):'gray'}
function deviationColor(key,v){let b=baselineMetric(key);if(!Number.isFinite(v)||!Number.isFinite(b))return 'gray';let delta=pct(v,b);if(key==='restingHR'||key==='stress'){return delta<=5?'green':delta<=15?'yellow':'red'}if(key==='hrv'||key==='sleepHours'||key==='spo2'){return delta>=-5?'green':delta>=-15?'yellow':'red'}return Math.abs(delta)<=7?'green':Math.abs(delta)<=15?'yellow':'red'}
function statusText(c){return c==='green'?'Favorable':c==='yellow'?'Precaución':c==='red'?'Alerta':'Datos insuficientes'}
function scoreHealth(date=iso()){
 const keys=['sleepHours','restingHR','spo2','respiratoryRate']; let vals=[];
 for(const k of keys){let v=metricValue(date,k),d=metricDefs[k]; if(Number.isFinite(v)&&d.good){let c=d.good(v,state.profile);vals.push(c==='green'?90:c==='yellow'?62:28)}}
 if(vals.length<2)return {score:null,color:'gray',label:'Datos insuficientes',factors:vals.length};let s=Math.round(mean(vals));return {score:s,color:s>=80?'green':s>=65?'green':s>=45?'yellow':'red',label:s>=80?'Óptimo':s>=65?'Normal':s>=45?'Precaución':'Alerta',factors:vals.length}
}
function scoreTraining(date=iso()){
 let weights={sleepHours:24,restingHR:18,hrv:18,spo2:12,respiratoryRate:8,zeppReadiness:14,steps:6},parts=[];
 for(const [k,w] of Object.entries(weights)){let v=metricValue(date,k); if(!Number.isFinite(v))continue; let q=null,b=baselineMetric(k);
   if(k==='sleepHours') q=personalBaselineReady()&&Number.isFinite(b)?clamp(80+(v-b)/(Math.max(b,.1))*100):v>=7?90:v>=6?65:40;
   if(k==='restingHR') q=Number.isFinite(b)?clamp(88-Math.max(0,(v-b)/Math.max(b,1))*220):clinicalColor(k,v)==='green'?82:60;
   if(k==='hrv') q=Number.isFinite(b)?clamp(78+(v-b)/Math.max(b,1)*160):70;
   if(k==='spo2') q=Number.isFinite(b)?clamp(85+(v-b)*8):clinicalColor(k,v)==='green'?85:clinicalColor(k,v)==='yellow'?58:28;
   if(k==='respiratoryRate') q=clinicalColor(k,v)==='green'?84:clinicalColor(k,v)==='yellow'?60:32;
   if(k==='zeppReadiness') q=clamp(v);
   if(k==='steps'){let pd=new Date(date+'T12:00:00');pd.setDate(pd.getDate()-1);let prev=metricValue(iso(pd),'steps');q=Number.isFinite(prev)?clamp(92-Math.max(0,prev-10000)/200):80}
   if(Number.isFinite(q))parts.push({k,w,q});
 }
 if(parts.length<2)return {score:null,color:'gray',label:'Datos insuficientes',parts};let ws=parts.reduce((a,x)=>a+x.w,0);let sc=Math.round(parts.reduce((a,x)=>a+x.q*x.w,0)/ws);return {score:sc,color:sc>=80?'green':sc>=65?'green':sc>=45?'yellow':'red',label:sc>=80?'Condiciones favorables':sc>=65?'Entrenamiento normal':sc>=45?'Considerar ajuste':'Recuperación recomendada',parts}
}
function healthRecommendation(h=scoreHealth()){if(h.color==='green')return 'Los parámetros objetivos disponibles se encuentran globalmente estables o dentro de sus referencias. Revisa las tendencias individuales si algún indicador cambia.';if(h.color==='yellow')return 'Hay una o más desviaciones que merecen vigilancia. Revisa qué parámetro cambió y su evolución antes de interpretar un dato aislado.';if(h.color==='red')return 'Existe una desviación objetiva relevante en los datos disponibles. Performance Lab no diagnostica: revisa el detalle y considera valoración clínica si el hallazgo persiste o se acompaña de síntomas.';return 'No hay suficientes datos objetivos para resumir el estado de salud hoy.'}
function recommendation(train){if(train.color==='green'&&train.score>=80)return 'Condiciones objetivas favorables. Puedes realizar la sesión seleccionada y, si tu registro externo también lo respalda, considerar progresión de carga.';if(train.color==='green')return 'Condiciones compatibles con la sesión prevista. Mantén la dosis programada y evita forzar progresiones por calendario.';if(train.color==='yellow')return 'Hay señales objetivas de recuperación parcial. Considera mantener carga, ampliar margen de esfuerzo o reducir volumen si el calentamiento confirma fatiga.';if(train.color==='red')return 'Los datos objetivos sugieren priorizar recuperación o una versión reducida. Revisa el motivo antes de decidir.';return 'Aún no hay suficientes datos objetivos automáticos para recomendar intensidad.'}
function currentRoutine(){return state.selectedRoutine[iso()]?routines[state.selectedRoutine[iso()]]:null}
function syncQuality(){let d=today(),wanted=['sleepHours','restingHR','spo2','steps','respiratoryRate'];let n=wanted.filter(k=>Number.isFinite(d.metrics[k])).length;return {n,total:wanted.length,wanted}}
function syncFromHash(){let h=location.hash;if(!h.startsWith('#sync='))return false;try{let raw=h.slice(6).replace(/-/g,'+').replace(/_/g,'/');raw+='='.repeat((4-raw.length%4)%4);let json=decodeURIComponent(escape(atob(raw)));safeImportText(json);history.replaceState(null,'',location.pathname+location.search);return true}catch(e){console.warn('Sync hash inválido',e);return false}}
function applyDayImport(item,defaultSource,generatedAt){
 if(!item||typeof item!=='object')return false;
 const d=item.date||iso();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const rec=dayObj(d),metrics=item.metrics||{};
 let imported=[];
 for(const [k,v] of Object.entries(metrics)){
   if(v===null||v===undefined||v==='')continue;
   const n=Number(v);
   if(Number.isFinite(n)){rec.metrics[k]=n;imported.push(k)}
 }
 if(item.series&&typeof item.series==='object')rec.series={...rec.series,...item.series};
 if(['weight','bodyFat','muscleMass','bmi'].some(k=>Number.isFinite(Number(metrics[k])))){
   let a=state.anthro.find(x=>x.date===d)||{date:d};
   for(const k of ['weight','bodyFat','muscleMass','bmi'])if(Number.isFinite(Number(metrics[k])))a[k]=Number(metrics[k]);
   if(a.weight&&state.profile?.height&&!a.bmi)a.bmi=a.weight/((state.profile.height/100)**2);
   state.anthro=state.anthro.filter(x=>x.date!==d);state.anthro.push(a)
 }
 const src=item.source||defaultSource||'Atajo Apple Salud';
 if(!rec.sources.includes(src))rec.sources.push(src);
 state.syncLog.unshift({at:generatedAt,date:d,source:src,keys:imported});
 return imported.length>0||Object.keys(item.series||{}).length>0
}
const ES_MONTHS={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,sept:8,oct:9,nov:10,dic:11};
function parseEsDateTime(v){
 if(v instanceof Date&&!Number.isNaN(v.getTime()))return v;
 if(v===null||v===undefined||v==='')return null;
 let s=String(v).trim().replace(/[\u00a0\u202f]/g,' ').toLowerCase();
 let m=s.match(/^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?)?/i);
 if(m){
   let mon=ES_MONTHS[m[2].normalize('NFD').replace(/[\u0300-\u036f]/g,'')];
   if(mon!==undefined){let h=Number(m[4]||0),min=Number(m[5]||0),ap=(m[6]||'').toLowerCase();if(ap==='p'&&h<12)h+=12;if(ap==='a'&&h===12)h=0;let d=new Date(Number(m[3]),mon,Number(m[1]),h,min,0);return Number.isNaN(d.getTime())?null:d}
 }
 let d=new Date(String(v));return Number.isNaN(d.getTime())?null:d;
}
function normalizeImportedDate(v){
 if(v===null||v===undefined)return null;
 if(v instanceof Date&&!Number.isNaN(v.getTime()))return iso(v);
 let s=String(v).trim();
 let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(m)return `${m[1]}-${m[2]}-${m[3]}`;
 m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
 if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
 let d=parseEsDateTime(s);return d?iso(d):null
}
function asArray(v){
 if(Array.isArray(v))return v;
 if(v===null||v===undefined||v==='')return [];
 if(typeof v==='string'){
   const t=v.trim();
   if(!t)return [];
   try{const j=JSON.parse(t);if(Array.isArray(j))return j}catch{}
   // Shortcuts serializa las listas como una línea por elemento.
   // NO separar por comas: las fechas es-MX contienen una coma entre fecha y hora.
   return t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
 }
 return [v]
}
const importAliases={
 weight:'weight',peso:'weight',
 steps:'steps',pasos:'steps',
 spo2:'spo2',oxygen:'spo2',bloodOxygen:'spo2',oxigeno:'spo2',
 respiratoryRate:'respiratoryRate',respiration:'respiratoryRate',frecuenciaRespiratoria:'respiratoryRate',
 restingHR:'restingHR',restingHeartRate:'restingHR',fcReposo:'restingHR',
 sleepHours:'sleepHours',sleep:'sleepHours',sueno:'sleepHours',
 workoutMinutes:'workoutMinutes',workoutCalories:'workoutCalories',workoutAvgHR:'workoutAvgHR',
 HRV:'hrv',VFC:'hrv',hrv:'hrv',stress:'stress',Stress:'stress',Estres:'stress',pai:'pai',PAI:'pai',sleepScore:'sleepScore',SleepScore:'sleepScore',readiness:'zeppReadiness',Readiness:'zeppReadiness',Recovery:'zeppReadiness',zeppReadiness:'zeppReadiness'
};
function aggregateImportedValues(key,vals){
 const a=vals.map(Number).filter(Number.isFinite);if(!a.length)return null;
 if(key==='steps'||key==='sleepHours'||key==='workoutMinutes'||key==='workoutCalories')return a.reduce((x,y)=>x+y,0);
 if(key==='weight')return a[a.length-1];
 if(key==='spo2'){let b=[...a].sort((x,y)=>x-y),n=b.length;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2}
 return a.reduce((x,y)=>x+y,0)/a.length
}
function applyVectorImport(payload,source,generatedAt){
 const vectors=payload.series||payload.vectors||payload.columns||null;
 let entries=[];
 if(vectors&&typeof vectors==='object'){
   for(const [rawKey,obj] of Object.entries(vectors)){
     if(!obj||typeof obj!=='object')continue;
     entries.push([rawKey,obj.dates??obj.date??obj.timestamps,obj.values??obj.value])
   }
 }
 for(const [rawKey,key] of Object.entries(importAliases)){
   const dk=rawKey+'Dates',vk=rawKey+'Values';
   if(payload[dk]!==undefined||payload[vk]!==undefined)entries.push([rawKey,payload[dk],payload[vk]])
 }
 const seen=new Set();let importedDays=new Set();
 for(const [rawKey,datesRaw,valuesRaw] of entries){
   const key=importAliases[rawKey]||rawKey;if(seen.has(rawKey+'|'+key+'|'+String(datesRaw)))continue;seen.add(rawKey+'|'+key+'|'+String(datesRaw));
   const dates=asArray(datesRaw),values=asArray(valuesRaw);if(!dates.length||!values.length)continue;
   let byDay={};let n=Math.min(dates.length,values.length);
   for(let i=0;i<n;i++){let d=normalizeImportedDate(dates[i]),v=Number(values[i]);if(!d||!Number.isFinite(v))continue;(byDay[d]??=[]).push(v)}
   for(const [d,vals] of Object.entries(byDay)){
     const v=aggregateImportedValues(key,vals);if(!Number.isFinite(v))continue;
     if(applyDayImport({date:d,metrics:{[key]:v}},source,generatedAt))importedDays.add(d)
   }
 }
 return importedDays.size
}
function payloadValueCI(payload,names){
 const entries=Object.entries(payload||{});for(const n of names){const hit=entries.find(([k])=>k.toLowerCase()===String(n).toLowerCase());if(hit)return hit[1]}return undefined
}
function applyShortcutNamedVectors(payload,source,generatedAt){
 const specs=[
  ['weight',['Peso','Weight'],['PesoFechas','WeightDates']],
  ['steps',['Pasos','Steps'],['PasosFechas','PasosFechad','StepsDates']],
  ['spo2',['SpO2','SpO₂','Oxigeno','Oxígeno'],['SpO2Fechas','SpO2Fechad','SpO₂Fechas','OxigenoFechas','OxígenoFechas']],
  ['restingHR',['FCReposo','FrecuenciaCardiacaReposo'],['FCReposoFechas','FrecuenciaCardiacaReposoFechas']],
  ['respiratoryRate',['Respiracion','Respiración','FrecuenciaRespiratoria'],['RespiracionFechas','RespiraciónFechas','FrecuenciaRespiratoriaFechas']],
  ['hrv',['HRV','VFC','VariabilidadCardiaca'],['HRVFechas','VFCFechas','VariabilidadCardiacaFechas']],
  ['stress',['Stress','Estres','Estrés'],['StressFechas','EstresFechas','EstrésFechas']],
  ['pai',['PAI'],['PAIFechas']],
  ['sleepScore',['SleepScore','PuntuacionSueno','PuntuaciónSueño','PuntuacionDeSueno'],['SleepScoreFechas','PuntuacionSuenoFechas','PuntuaciónSueñoFechas']],
  ['zeppReadiness',['Readiness','Recovery','Recuperacion','Recuperación','ZeppReadiness'],['ReadinessFechas','RecoveryFechas','RecuperacionFechas','RecuperaciónFechas','ZeppReadinessFechas']]
 ];
 let importedDays=new Set();
 for(const [key,valueNames,dateNames] of specs){
   const values=asArray(payloadValueCI(payload,valueNames)),dates=asArray(payloadValueCI(payload,dateNames));if(!values.length||!dates.length)continue;
   let byDay={},n=Math.min(values.length,dates.length);
   for(let i=0;i<n;i++){let d=normalizeImportedDate(dates[i]),v=Number(values[i]);if(!d||!Number.isFinite(v))continue;(byDay[d]??=[]).push(v)}
   for(const [d,vals] of Object.entries(byDay)){const v=aggregateImportedValues(key,vals);if(Number.isFinite(v)&&applyDayImport({date:d,metrics:{[key]:v}},source,generatedAt))importedDays.add(d)}
 }
 return importedDays.size
}
function applyZeppScalars(payload,source,generatedAt){
 const fields=[['hrv',['HRV','VFC','VariabilidadCardiaca']],['stress',['Stress','Estres','Estrés']],['pai',['PAI']],['sleepScore',['SleepScore','PuntuacionSueno','PuntuaciónSueño','PuntuacionDeSueno']],['zeppReadiness',['Readiness','Recovery','Recuperacion','Recuperación','ZeppReadiness']]];
 let metrics={};for(const [key,names] of fields){const raw=payloadValueCI(payload,names);if(raw===undefined)continue;const a=asArray(raw).map(Number).filter(Number.isFinite);if(a.length===1)metrics[key]=a[0]}
 if(!Object.keys(metrics).length)return 0;const d=normalizeImportedDate(payloadValueCI(payload,['Fecha','Date','date']))||iso();return applyDayImport({date:d,metrics},source||'Zepp',generatedAt)?1:0
}
function parseImportedDateTime(v){
 let d=parseEsDateTime(v);if(d)return d;
 if(v===null||v===undefined||v==='')return null;
 let s=String(v).trim();let m=s.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})(?:[, ]+)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
 if(m){let y=Number(m[3]);if(y<100)y+=2000;d=new Date(y,Number(m[2])-1,Number(m[1]),Number(m[4]),Number(m[5]),Number(m[6]||0));return Number.isNaN(d.getTime())?null:d}
 return null
}
function localIsoDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function sleepStageKind(v){
 if(v===null||v===undefined)return 'unknown';let n=Number(v);if(Number.isFinite(n)&&String(v).trim()!==''){if([1,3,4,5].includes(n))return n===4?'deep':n===5?'rem':'asleep';if(n===2)return 'awake';if(n===0)return 'inbed'}
 let s=String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(/despiert|awake/.test(s))return 'awake';if(/en cama|in bed/.test(s))return 'inbed';if(/profund|deep/.test(s))return 'deep';if(/\brem\b/.test(s))return 'rem';if(/liger|esencial|core|dormid|asleep|sueno/.test(s))return 'asleep';return 'unknown'
}
function mergeIntervals(intervals){
 if(!intervals.length)return 0;let a=intervals.slice().sort((x,y)=>x[0]-y[0]),total=0,[s,e]=a[0];for(let i=1;i<a.length;i++){let [ns,ne]=a[i];if(ns<=e)e=Math.max(e,ne);else{total+=e-s;s=ns;e=ne}}return total+(e-s)
}
function applySleepImport(payload,source,generatedAt){
 const starts=asArray(payloadValueCI(payload,['SuenoInicio','SueñoInicio','SleepStart']));
 const ends=asArray(payloadValueCI(payload,['SuenoFin','SueñoFin','SleepEnd']));
 const stages=asArray(payloadValueCI(payload,['SuenoEtapa','SueñoEtapa','SleepStage']));
 let n=Math.min(starts.length,ends.length,stages.length);if(!n)return 0;
 let byDay={};
 for(let i=0;i<n;i++){
   let s=parseImportedDateTime(starts[i]),e=parseImportedDateTime(ends[i]);if(!s||!e||e<=s)continue;
   let kind=sleepStageKind(stages[i]);if(kind==='unknown')continue;
   let d=localIsoDate(e);
   let row=byDay[d]??={sleep:[],deep:[],rem:[],awake:[],inbed:[],segments:[]};
   let seg={start:s.getTime(),end:e.getTime(),kind,label:String(stages[i]||'')};
   if(kind==='inbed'){row.inbed.push([seg.start,seg.end]);continue}
   row.segments.push(seg);
   if(kind==='awake')row.awake.push([seg.start,seg.end]);
   else{
     row.sleep.push([seg.start,seg.end]);
     if(kind==='deep')row.deep.push([seg.start,seg.end]);
     if(kind==='rem')row.rem.push([seg.start,seg.end]);
   }
 }
 let count=0;
 for(const [d,row] of Object.entries(byDay)){
   let sleepMs=mergeIntervals(row.sleep),metrics={};
   if(sleepMs>0)metrics.sleepHours=sleepMs/3600000;
   let deepMs=mergeIntervals(row.deep),remMs=mergeIntervals(row.rem),awakeMs=mergeIntervals(row.awake);
   if(deepMs>=0)metrics.deepSleepMinutes=deepMs/60000;
   if(remMs>=0)metrics.remSleepMinutes=remMs/60000;
   if(awakeMs>=0)metrics.awakeMinutes=awakeMs/60000;

   let all=row.segments.filter(x=>x.kind!=='awake');
   let earliest=all.length?Math.min(...all.map(x=>x.start)):null;
   let latest=all.length?Math.max(...all.map(x=>x.end)):null;
   let inBedMs=mergeIntervals(row.inbed);
   if(!inBedMs && earliest!==null && latest!==null)inBedMs=latest-earliest;
   if(inBedMs>0)metrics.timeInBedMinutes=inBedMs/60000;

   if(Object.keys(metrics).length&&applyDayImport({date:d,metrics},source,generatedAt)){
     let rec=dayObj(d);
     rec.series.sleepStages=row.segments
       .filter(x=>x.end>x.start)
       .sort((a,b)=>a.start-b.start)
       .map(x=>({start:x.start,end:x.end,kind:x.kind,label:x.label}));
     count++
   }
 }
 return count
}
function applyImport(payload){
 if(!payload)return;
 if(payload.version&&payload.profile&&payload.daily){state={...structuredClone(defaultState),...payload};save();return Math.max(1,Object.keys(state.daily||{}).length)}
 const generatedAt=payload.generatedAt||new Date().toISOString();
 const source=(payload.source||payload.sourse||'Atajo Apple Salud').trim?.()||'Atajo Apple Salud';
 let count=applyVectorImport(payload,source,generatedAt);
 count+=applyShortcutNamedVectors(payload,source,generatedAt);
 count+=applyZeppScalars(payload,source,generatedAt);
 count+=applySleepImport(payload,source,generatedAt);
 const hasExplicitDays=Array.isArray(payload.days)||Array.isArray(payload.records);
 if(hasExplicitDays){
   const items=Array.isArray(payload.days)?payload.days:payload.records;
   for(const item of items)if(applyDayImport(item,source,generatedAt))count++
 }else if(!count){
   if(applyDayImport(payload,source,generatedAt))count++
 }
 state.lastSync=generatedAt;
 state.lastSyncSources=[...new Set([...(state.lastSyncSources||[]),source])];
 state.syncLog=state.syncLog.slice(0,100);
 save();
 return count
}

function importSummary(count){let q=syncQuality();return {count,available:q.n,total:q.total,lastSync:state.lastSync}}
function safeImportPayload(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('El contenido no es un objeto JSON de Performance Lab/Apple Salud.');
 const snapshot=structuredClone(state);
 try{
   const count=applyImport(payload);
   if(!Number.isFinite(count)||count<=0){state=snapshot;save();throw new Error('El JSON es válido, pero no contiene campos reconocibles del Atajo.');}
   return importSummary(count)
 }catch(e){state=snapshot;save();throw e}
}
function safeImportText(txt){
 if(typeof txt!=='string'||!txt.trim())throw new Error('El portapapeles está vacío.');
 let payload;try{payload=JSON.parse(txt)}catch{throw new Error('El texto recibido no es JSON válido.');}
 return safeImportPayload(payload)
}
function importResultText(r){return `Importación correcta: ${r.available}/${r.total} métricas automáticas disponibles hoy.`}
function lineSvg(points,color=COLORS.blue){if(!points.length)return '<div class="empty">Sin datos todavía</div>';let vals=points.map(x=>x.value);let min=Math.min(...vals),max=Math.max(...vals);if(max===min){max+=1;min-=1}let w=330,h=150,p=18;let coords=points.map((x,i)=>{let X=p+(w-2*p)*(points.length===1?.5:i/(points.length-1));let Y=h-p-(h-2*p)*(x.value-min)/(max-min);return [X,Y]});let poly=coords.map(x=>x.join(',')).join(' ');let dots=coords.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4" fill="${color}"/>`).join('');return `<svg viewBox="0 0 ${w} ${h}" role="img"><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" class="axis"/><polyline points="${poly}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`}
function miniSpark(key){let s=seriesFor(key,'week');return `<div class="spark">${lineSvg(s,COLORS[clinicalColor(key,s.at(-1)?.value)]||COLORS.blue)}</div>`}
function radarSvg(vals){let entries=Object.entries(vals).filter(([,v])=>Number.isFinite(v));if(entries.length<3)return '<div class="empty">Se necesitan más datos.</div>';let cx=100,cy=100,r=72,n=entries.length;let pts=entries.map(([,v],i)=>{let a=-Math.PI/2+i*2*Math.PI/n,rr=r*clamp(v)/100;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]});let outer=entries.map(([,],i)=>{let a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});let lines=outer.map(([x,y])=>`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e0e6ee"/>`).join('');return `<svg viewBox="0 0 200 200">${lines}<polygon points="${outer.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#d8dfe8"/><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="rgba(54,120,255,.18)" stroke="${COLORS.blue}" stroke-width="3"/></svg>`}
function heatmap(){return daysBack(28).map(d=>{let s=scoreTraining(d);return `<div class="heat ${s.color==='green'?'g':s.color==='yellow'?'y':s.color==='red'?'r':'n'}" title="${d}: ${s.label}"></div>`}).join('')}
function formatMetricValue(key,v){if(!Number.isFinite(v))return '—';if(key==='sleepHours')return fmtMinutes(v*60);if(key==='steps')return Math.round(v).toLocaleString('es-MX');if(key==='waistHeight')return v.toFixed(2);return String(Math.round(v*10)/10)}
function metricSourceLabel(key,date=iso()){const r=state.daily[date];if(!r)return 'Sin fuente';if(['hrv','stress','pai','sleepScore','zeppReadiness'].includes(key))return r.sources?.find(x=>/zepp/i.test(x))||r.sources?.at(-1)||'Zepp/manual';return r.sources?.find(x=>/apple|salud|health/i.test(x))||r.sources?.at(-1)||'Apple Salud'}
function sparkSvg(key,period='week'){const pts=seriesFor(key,period);if(!pts.length)return '<div class="summary-spark-empty">Sin historial</div>';let vals=pts.map(x=>x.value),min=Math.min(...vals),max=Math.max(...vals);if(max===min){max+=1;min-=1}const w=116,h=52,p=5;let xy=pts.map((x,i)=>[p+(w-2*p)*(pts.length===1?.5:i/(pts.length-1)),h-p-(h-2*p)*(x.value-min)/(max-min)]);return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${xy.map(a=>a.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.3" fill="currentColor"/>`).join('')}</svg>`}
function summaryMetricCard(key){const def=metricDefs[key],v=metricValue(iso(),key),t=trendFor(key,'week');let delta=Number.isFinite(t.delta)?`${t.delta>=0?'▲':'▼'} ${Math.abs(t.delta).toFixed(0)}% vs semana previa`:'Historial en construcción';if(!Number.isFinite(v)&&key==='workoutMinutes')delta='Esperando datos de entrenamiento';let tone=def.clinical&&Number.isFinite(v)?clinicalColor(key,v):deviationColor(key,v);return `<button class="summary-card" data-metric="${key}"><div class="summary-copy"><div class="summary-title"><span>${def.icon}</span><strong>${def.name}${def.clinical?'<i>*</i>':''}</strong></div><small>${metricSourceLabel(key)}</small><div class="summary-value mono">${formatMetricValue(key,v)}${Number.isFinite(v)&&key!=='sleepHours'&&def.unit?` <em>${def.unit}</em>`:''}</div><div class="summary-trend ${tone}">${esc(delta)}</div></div><div class="summary-spark ${tone}">${sparkSvg(key)}</div></button>`}
function zeppCoverage(){const keys=['hrv','stress','pai','sleepScore','zeppReadiness'];let n=keys.filter(k=>Number.isFinite(metricValue(iso(),k))).length;return {n,total:keys.length,keys}}
function checkinFields(when){return when==='morning'?[['sleepQuality','Calidad percibida del sueño','Pésima','Excelente',false],['energy','Energía','Agotado','Muy energético',false],['fatigue','Fatiga','Ninguna','Extrema',true],['soreness','Dolor muscular','Ninguno','Intenso',true],['stress','Estrés','Muy bajo','Muy alto',true]]:[['energy','Energía','Agotado','Muy energético',false],['fatigue','Fatiga muscular','Ninguna','Extrema',true],['soreness','Dolor o molestia','Ninguna','Intensa',true],['motivation','Motivación','Nula','Muy alta',false],['readiness','Preparación percibida','Nada preparado','Completamente preparado',false]]}
function subjectiveScore(when,date=iso()){const c=state.daily[date]?.checkins?.[when];if(!c)return null;let vals=[];for(const [k,,,,reverse] of checkinFields(when)){let v=Number(c[k]);if(Number.isFinite(v))vals.push(reverse?6-v:v)}return vals.length?Math.round((mean(vals)-1)/4*100):null}
function checkinSummaryCard(when){let sc=subjectiveScore(when),done=Number.isFinite(sc);return `<button class="checkin-card" data-checkin="${when}"><div><span>${when==='morning'?'☀️':'🏋️'}</span><strong>${when==='morning'?'Al despertar':'Antes de entrenar'}</strong><small>${done?'Registrado hoy':'Pendiente'}</small></div><b>${done?sc+'/100':'1–5'}</b></button>`}
function weeklyHypertrophy(){const ds=daysBack(7),target=Number(state.settings?.weeklySessionTarget||3);const workoutDays=ds.filter(d=>Number.isFinite(metricValue(d,'workoutMinutes'))),completed=workoutDays.filter(d=>Number(metricValue(d,'workoutMinutes'))>0).length;const planned=ds.filter(d=>state.selectedRoutine?.[d]).length,minutes=ds.reduce((a,d)=>a+(Number(metricValue(d,'workoutMinutes'))||0),0);const adherence=workoutDays.length&&target?Math.round(completed/target*100):null;const first=[...state.anthro].sort((a,b)=>a.date.localeCompare(b.date))[0],last=latestAnthro();return {completed,target,planned,minutes,adherence,hasWorkoutData:workoutDays.length>0,weight:last?.weight??null,weightDelta:first&&last&&Number.isFinite(first.weight)&&Number.isFinite(last.weight)?last.weight-first.weight:null}}
function hypertrophySummary(){let h=weeklyHypertrophy();return `<div class="hypertrophy-grid"><div class="mini-kpi"><span>Sesiones realizadas</span><strong>${h.hasWorkoutData?`${h.completed}/${h.target}`:'—'}</strong><small>${h.hasWorkoutData?'últimos 7 días':'falta importar entrenamientos'}</small></div><div class="mini-kpi"><span>Planificadas</span><strong>${h.planned}</strong><small>rutinas elegidas esta semana</small></div><div class="mini-kpi"><span>Peso</span><strong>${Number.isFinite(h.weight)?h.weight.toFixed(1)+' kg':'—'}</strong><small>${Number.isFinite(h.weightDelta)?`${h.weightDelta>=0?'+':''}${h.weightDelta.toFixed(1)} kg vs basal`:'sin comparación'}</small></div></div>`}
function metricCard(key){let def=metricDefs[key],v=metricValue(iso(),key);let t=trendFor(key,'week');let color=def.clinical&&Number.isFinite(v)?clinicalColor(key,v):deviationColor(key,v);let display=Number.isFinite(v)?(key==='sleepHours'?v.toFixed(1):key==='waistHeight'?v.toFixed(2):Math.round(v*10)/10):'—';let tr=Number.isFinite(t.delta)?`${t.delta>=0?'▲':'▼'} ${Math.abs(t.delta).toFixed(0)}% vs semana previa`:'Historial en construcción';if(!Number.isFinite(v)&&key==='workoutMinutes')tr='El Atajo actual aún no importa entrenamientos';return `<div class="card metric" data-metric="${key}"><div class="icon">${def.icon}</div><div class="name">${def.name}${def.clinical?'<span class="asterisk">*</span>':''}</div><div class="value mono">${display} <small>${def.unit}</small></div><div class="trend" style="color:${COLORS[color]||COLORS.gray}">${esc(tr)}</div>${miniSpark(key)}</div>`}
function heroCard(kind){let s=kind==='health'?scoreHealth():scoreTraining();let title=kind==='health'?'Salud':'Preparación para entrenar';let desc=kind==='health'?'Estado objetivo de salud disponible':'Recuperación objetiva para la sesión';return `<div class="card hero ${kind}" style="--p:${s.score??0}"><div class="eyebrow">${title}</div><div class="ring" style="color:${COLORS[s.color]}"><span>${s.score??'—'}</span></div><div class="score mono">${s.score??'—'}${s.score!==null?'<small>/100</small>':''}</div><div class="status">${s.label}</div><div class="desc">${desc}. ${s.factors??s.parts?.length??0} variables disponibles.</div></div>`}
function header(){let q=syncQuality();let sync=state.lastSync?new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(new Date(state.lastSync)):'sin sincronizar';let c=q.n>=4?'green':q.n>=2?'yellow':'gray';return `<div class="topbar"><div class="brand"><div><h1>Performance Lab</h1><small>${esc(fmtFull())}</small></div><button class="sync-pill" id="syncBtn"><span class="dot ${c}"></span>${q.n}/${q.total} · ${sync}</button></div></div>`}
function baselineBanner(){let n=baselineDates().length,ready=n>=15;return `<div class="baseline"><div class="row"><div><strong>${ready?'Línea personal establecida ✓':'Aprendiendo tu línea basal'}</strong><br><small>${ready?'Tus tendencias ya se comparan principalmente contigo mismo.':`Día ${n}/15 · los semáforos son provisionales.`}</small></div><div class="mono">${Math.min(n,15)}/15</div></div><div class="progress"><span style="width:${Math.min(100,n/15*100)}%"></span></div></div>`}
function screenToday(){let routine=currentRoutine(),zc=zeppCoverage();return `${header()}<main>${baselineBanner()}<div class="section-title"><div><h2>Hoy</h2><p>Salud, recuperación y progreso para hipertrofia.</p></div><button id="whyBtn">¿Por qué?</button></div><div class="hero-grid">${heroCard('health')}${heroCard('training')}</div><div class="section-title"><div><h2>Resumen fisiológico</h2><p>Datos automáticos; toca una tarjeta para ver detalle.</p></div></div><div class="summary-list">${['sleepHours','restingHR','spo2','respiratoryRate','steps'].map(summaryMetricCard).join('')}</div><div class="section-title"><div><h2>Zepp</h2><p>VFC, estrés, PAI, puntuación de sueño y recuperación.</p></div><span class="section-badge">${zc.n}/${zc.total}</span></div><div class="summary-list compact">${['hrv','stress','pai','sleepScore','zeppReadiness'].map(summaryMetricCard).join('')}</div><div class="section-title"><div><h2>Check-in subjetivo</h2><p>Escala 1–5. Se analiza por separado y no altera el semáforo objetivo.</p></div></div><div class="checkin-grid">${checkinSummaryCard('morning')}${checkinSummaryCard('pre')}</div><div class="section-title"><div><h2>Progreso de hipertrofia</h2><p>Adherencia al plan + cambios corporales.</p></div><button data-go="progress">Ver progreso</button></div>${hypertrophySummary()}<div class="section-title"><div><h2>Entrenamiento de hoy</h2><p>${routine?'Rutina seleccionada del manual':'Selecciona la sesión que corresponda.'}</p></div><button data-go="train">Rutinas</button></div><div class="card workout-today">${routine?`<div><span class="chip ${routine.accent}">${routine.phase}</span><h3>${routine.label}</h3><p>${routine.exercises.length} ejercicios · seguimiento de sesión global.</p></div>`:`<div class="empty">No has elegido rutina para hoy.</div>`}</div></main>${nav('today')}`}
function screenHealth(){let p=ui.period;return `${header()}<main><div class="section-title"><div><h2>Salud</h2><p>Detalle por variable y evolución personal.</p></div></div>${periodSelector(p)}<div class="section-title sub"><div><h3>Apple Salud</h3><p>Datos fisiológicos importados.</p></div></div><div class="summary-list">${['sleepHours','restingHR','spo2','respiratoryRate','steps'].map(summaryMetricCard).join('')}</div><div class="section-title sub"><div><h3>Zepp</h3><p>Métricas complementarias del Amazfit.</p></div></div><div class="summary-list">${['hrv','stress','pai','sleepScore','zeppReadiness'].map(summaryMetricCard).join('')}</div><div class="card chart-card"><h3>Historial de preparación · 28 días</h3><div class="heatmap">${heatmap()}</div><div class="status-strip" style="margin-top:10px"><span class="chip green">Favorable</span><span class="chip yellow">Precaución</span><span class="chip red">Alerta</span><span class="chip gray">Sin datos</span></div></div></main>${nav('health')}`}
function normalize(k){let v=metricValue(iso(),k);if(!Number.isFinite(v))return null;if(k==='sleepHours')return clamp(v/8*100);if(k==='spo2')return clamp((v-85)/12*100);return 70}
function normalizeVsBase(k){let v=metricValue(iso(),k),b=baselineMetric(k);if(!Number.isFinite(v)||!Number.isFinite(b))return null;return clamp(70+(v-b)/b*150)}
function normalizeDeviation(k){let v=metricValue(iso(),k),b=baselineMetric(k);if(!Number.isFinite(v))return null;if(!Number.isFinite(b))return clamp((v-45)/(100-45)*100);return clamp(Math.abs(v-b)/Math.max(b,1)*400)}
function normalizeSteps(){let v=metricValue(iso(),'steps');return Number.isFinite(v)?clamp(v/8000*100):null}
function periodSelector(p){return `<div class="segmented"><button data-period="day" class="${p==='day'?'active':''}">Día</button><button data-period="week" class="${p==='week'?'active':''}">Semana</button><button data-period="month" class="${p==='month'?'active':''}">Mes</button></div>`}
function screenTrain(){let selected=state.selectedRoutine[iso()];return `${header()}<main><div class="section-title"><div><h2>Entrenar</h2><p>Rutinas exactas del manual. Tú eliges la de hoy.</p></div></div><div class="routine-list">${Object.entries(routines).map(([k,r])=>`<div class="card ${selected===k?'selected-routine':''}"><div class="routine"><div><div class="status-strip"><span class="chip ${r.accent}">${r.phase}</span>${selected===k?'<span class="chip green">Hoy</span>':''}</div><h3>${r.label}</h3><p>${r.exercises.length} ejercicios</p></div><button data-select-routine="${k}">${selected===k?'Elegida':'Elegir'}</button></div><ul class="exercise-list">${r.exercises.map(x=>`<li><span>${x[0]}</span><span>${x[1]}</span></li>`).join('')}</ul></div>`).join('')}</div><div class="card chart-card"><h3>Estadísticas automáticas de sesión</h3><p style="color:var(--muted);font-size:13px">Cuando el Atajo importe un entrenamiento, aquí se consolidan duración, calorías, FC media/máxima, tiempo activo, reposo y variables disponibles.</p><table class="table"><tr><th>Métrica</th><th>Hoy</th></tr>${['workoutMinutes','workoutCalories','workoutAvgHR','activeMinutes','restMinutes'].map(k=>`<tr><td>${metricDefs[k].name}</td><td>${metricValue(iso(),k)??'—'} ${metricDefs[k].unit}</td></tr>`).join('')}</table></div></main>${nav('train')}`}
function screenProgress(){let p=ui.period,h=weeklyHypertrophy();return `${header()}<main><div class="section-title"><div><h2>Progreso de hipertrofia</h2><p>Adherencia, entrenamiento, recuperación y cambios corporales.</p></div></div>${hypertrophySummary()}<div class="card progress-focus"><div class="progress-head"><div><span>Adherencia semanal</span><strong>${Number.isFinite(h.adherence)?h.adherence+'%':'—'}</strong></div><div><span>Minutos entrenados</span><strong>${h.hasWorkoutData?h.minutes:'—'}</strong></div></div><div class="progress"><span style="width:${clamp(h.adherence||0)}%"></span></div><p>Objetivo actual: ${h.target} sesiones/semana. Sólo se cuentan como realizadas las sesiones importadas; la rutina seleccionada se muestra aparte como planificación.</p></div><div class="section-title"><div><h2>Tendencias</h2><p>Compara salud y comportamiento con tu propia historia.</p></div></div>${periodSelector(p)}${['sleepHours','restingHR','spo2','steps','workoutMinutes'].map(k=>chartBlock(k,p)).join('')}<div class="section-title"><div><h2>Antropometría</h2><p>Peso/composición semanal; perímetros cada 15 días.</p></div><button id="anthroBtn">Registrar</button></div>${anthroCadence()}${anthroSummary()}</main>${nav('progress')}`}
function chartBlock(k,p){let def=metricDefs[k],s=seriesFor(k,p),t=trendFor(k,p),avg=mean(s.map(x=>x.value));let col=clinicalColor(k,avg),b=baselineMetric(k),deltaBase=pct(avg,b);let comment=Number.isFinite(avg)?`Promedio ${p==='day'?'del día':p==='week'?'de 7 días':'de 30 días'}: ${round(avg)} ${def.unit}. ${Number.isFinite(deltaBase)?`Frente a tu basal: ${deltaBase>=0?'+':''}${deltaBase.toFixed(1)}%.`:personalBaselineReady()?'Sin comparación basal disponible para esta métrica.':'La línea basal aún está aprendiendo.'}`:'Aún no hay datos suficientes para este periodo.';return `<div class="card chart-card" data-metric="${k}"><div class="chart-title"><div><h3>${def.name}${def.clinical?'<span class="asterisk">*</span>':''}</h3><strong>${Number.isFinite(avg)?round(avg):'—'} <small>${def.unit}</small></strong></div>${Number.isFinite(t.delta)?`<span class="chip ${t.delta>=0?'green':'yellow'}">${t.delta>=0?'▲':'▼'} ${Math.abs(t.delta).toFixed(0)}%</span>`:''}</div><div class="chart">${lineSvg(s,COLORS[col]||COLORS.blue)}</div><div class="comment"><strong>Tu tendencia</strong>${comment}${def.clinical&&def.ref?`<div class="clinical"><b>Valores de referencia:</b> ${def.ref(state.profile)}</div>`:''}</div></div>`}
function round(v){return Math.round(v*10)/10}
function anthroCadence(){let a=[...state.anthro].sort((x,y)=>y.date.localeCompare(x.date))[0];if(!a)return '<div class="warning" style="margin-top:12px">Falta la medición basal.</div>';let days=Math.floor((new Date(iso())-new Date(a.date+'T12:00:00'))/86400000);let bodyDue=days>=15,weightDue=days>=7;return `<div class="status-strip" style="margin:12px 0"><span class="chip ${weightDue?'yellow':'green'}">Peso/composición ${weightDue?'pendiente':'al día'}</span><span class="chip ${bodyDue?'yellow':'green'}">Perímetros 15 días ${bodyDue?'pendientes':'al día'}</span></div>`}
function anthroSummary(){let rows=[...state.anthro].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);if(!rows.length)return '<div class="card empty">Aún no hay mediciones antropométricas.</div>';let l=rows[0],wh=l?.waist&&state.profile?.height?l.waist/state.profile.height:null;return `<div class="card"><div class="status-strip" style="margin-bottom:10px">${Number.isFinite(l?.bmi)?`<span class="chip ${clinicalColor('bmi',l.bmi)}">IMC* ${round(l.bmi)}</span>`:''}${Number.isFinite(l?.waist)?`<span class="chip ${clinicalColor('waist',l.waist)}">Cintura* ${round(l.waist)} cm</span>`:''}${Number.isFinite(wh)?`<span class="chip ${clinicalColor('waistHeight',wh)}">Cintura/altura* ${wh.toFixed(2)}</span>`:''}</div><table class="table"><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Pecho</th><th>Hombros</th></tr>${rows.map(a=>`<tr><td>${fmtDate(a.date)}</td><td>${a.weight??'—'}</td><td>${a.waist??'—'}</td><td>${a.chest??'—'}</td><td>${a.shoulders??'—'}</td></tr>`).join('')}</table><div class="clinical"><b>Valores de referencia:</b> IMC* 18.5–24.9 kg/m² como rango general adulto; cintura* se ajusta por sexo; cintura/altura* &lt;0.50 como referencia práctica. La evolución de hipertrofia se interpreta principalmente contra tu propio basal.</div></div>`}
function corr(x,y){let pairs=x.map((v,i)=>[v,y[i]]).filter(p=>p.every(Number.isFinite));if(pairs.length<6)return null;let mx=mean(pairs.map(p=>p[0])),my=mean(pairs.map(p=>p[1]));let num=pairs.reduce((a,p)=>a+(p[0]-mx)*(p[1]-my),0),dx=Math.sqrt(pairs.reduce((a,p)=>a+(p[0]-mx)**2,0)),dy=Math.sqrt(pairs.reduce((a,p)=>a+(p[1]-my)**2,0));return dx&&dy?num/(dx*dy):null}
function weeklyInsights(){let ds=daysBack(30);let sleep=ds.map(d=>metricValue(d,'sleepHours')),energy=ds.map(d=>state.daily[d]?.checkins?.morning?.energy),stress=ds.map(d=>metricValue(d,'stress')),work=ds.map(d=>metricValue(d,'workoutMinutes'));let out=[];let r1=corr(sleep,energy);if(Number.isFinite(r1))out.push({c:'green',tag:'Sueño × energía',title:r1>.3?'Mayor sueño coincide con mayor energía percibida':'Relación sueño–energía aún débil',text:`Correlación observada r=${r1.toFixed(2)} con ${sleep.filter((v,i)=>Number.isFinite(v)&&Number.isFinite(energy[i])).length} observaciones. Es asociación, no causalidad.`});let r2=corr(stress,work);if(Number.isFinite(r2))out.push({c:'yellow',tag:'Estrés × entrenamiento',title:'Patrón semanal en observación',text:`La relación entre estrés y duración de entrenamiento es r=${r2.toFixed(2)}. Performance Lab seguirá acumulando observaciones antes de convertirlo en una recomendación.`});let tr=scoreTraining();out.push({c:tr.color==='red'?'yellow':'violet',tag:'Preparación',title:tr.score>=80?'Condiciones favorables para progresar carga':'Revisa la dosis, no el compromiso',text:recommendation(tr)});if(!out.length)out.push({c:'violet',tag:'Aprendizaje',title:'Aún faltan observaciones',text:'Los insights semanales aparecerán cuando haya suficientes pares de datos comparables.'});return out}
function screenInsights(){return `${header()}<main><div class="section-title"><div><h2>Insights</h2><p>Análisis semanal explicable y basado en tus propios datos.</p></div></div>${weeklyInsights().map(i=>`<div class="card insight ${i.c}"><div class="tag">${i.tag}</div><h3>${i.title}</h3><p>${i.text}</p></div>`).join('')}<div class="card"><h3>Qué analiza Performance Lab</h3><p style="font-size:13px;color:var(--muted);line-height:1.5">Sueño, recuperación, FC, VFC, SpO₂, respiración, PAI, estrés, actividad, entrenamiento y check-ins subjetivos. Los datos manuales no cambian los semáforos; sólo sirven para comparar y descubrir patrones.</p></div></main>${nav('insights')}`}
function screenMore(){let d=today(),z=zeppCoverage();return `${header()}<main><div class="section-title"><div><h2>Más</h2><p>Fuentes, suplementación, laboratorios y exportación.</p></div></div><div class="card source-card"><div class="source-row"><div><strong>Apple Salud</strong><small>${syncQuality().n}/${syncQuality().total} métricas automáticas hoy</small></div><span class="chip blue">Atajo</span></div><div class="source-row"><div><strong>Zepp / Amazfit</strong><small>${z.n}/${z.total} métricas prioritarias hoy</small></div><button class="secondary" id="zeppBtn">Registrar / importar</button></div><p class="note">Zepp prioritario: VFC/HRV, estrés, PAI, puntuación de sueño y recuperación/readiness. Cada registro conserva su fuente.</p></div><div class="card"><h3>Suplementación diaria</h3><div class="supp-row"><strong>Creatina</strong><input id="creatineG" type="number" min="0" step="0.5" value="${d.supplements.creatineG??3}"/><button class="toggle ${d.supplements.creatineTaken?'on':''}" data-supp="creatineTaken">${d.supplements.creatineTaken?'Tomada ✓':'Pendiente'}</button></div><div class="supp-row"><strong>Proteína</strong><input id="proteinG" type="number" min="0" step="1" value="${d.supplements.proteinG??30}"/><button class="toggle ${d.supplements.proteinTaken?'on':''}" data-supp="proteinTaken">${d.supplements.proteinTaken?'Tomada ✓':'Pendiente'}</button></div><div class="comment">Semana: creatina ${suppWeek('creatine')} g · proteína en batido ${suppWeek('protein')} g.</div></div><div class="card chart-card"><h3>Sincronización <small>v${BUILD}</small></h3>${syncPanel()}</div><div class="card chart-card"><h3>Laboratorios</h3><p class="muted-copy">Opcionales. No modifican los semáforos automáticos.</p><button class="secondary" id="labBtn">Agregar resultado</button></div><div class="card chart-card"><h3>Exportar historial</h3><div class="grid"><button class="secondary" data-export="json">JSON</button><button class="secondary" data-export="csv">CSV</button><button class="secondary" data-export="xls">Excel</button><button class="secondary" data-export="pdf">PDF</button></div></div><div class="card chart-card"><h3>Ajustes</h3><div class="field"><label>Objetivo de sesiones por semana</label><input id="weeklyTarget" type="number" min="1" max="7" value="${state.settings.weeklySessionTarget||3}"></div><button class="secondary" id="profileBtn">Editar perfil basal</button></div></main>${nav('more')}`}
function suppWeek(type){return daysBack(7).reduce((a,d)=>{let s=state.daily[d]?.supplements;if(!s)return a;let on=s[type+'Taken'];return a+(on?Number(s[type+'G']||0):0)},0)}
function syncPanel(){let q=syncQuality();let missing=q.wanted.filter(k=>!Number.isFinite(today().metrics[k])).map(k=>metricDefs[k].name);return `<div class="${q.n>=4?'ok':q.n>=2?'warning':'error'}"><b>${q.n}/${q.total} métricas automáticas disponibles hoy.</b><br>${missing.length?`Faltan: ${missing.join(', ')}.`:'Cobertura automática completa.'}</div><p style="font-size:12px;color:var(--muted)">La VFC/HRV no se incluye en el contador porque Apple Salud no la está recibiendo desde tu Amazfit. Entrenamientos, puntuación de sueño y otras métricas de Zepp requieren ampliar el Atajo o una segunda fuente.</p><p style="font-size:12px;color:var(--muted)">Última actualización: ${state.lastSync?new Date(state.lastSync).toLocaleString('es-MX'):'ninguna'}. Fuentes: ${state.lastSyncSources?.join(', ')||'—'}.</p>${ui.syncMessage?`<div class="${ui.syncMessage.ok?'ok':'error'}" style="margin:10px 0">${esc(ui.syncMessage.text)}</div>`:''}<button class="primary" id="pasteSync">Sincronizar desde Atajo</button><button class="secondary" id="manualPasteBtn" style="margin-left:6px">Pegar datos</button><input type="file" id="fileSync" accept="application/json,.json" style="display:none"><button class="secondary" id="fileSyncBtn" style="margin-left:6px">Importar archivo JSON</button>`}
function nav(active){let items=[['today','⌂','Hoy'],['health','♡','Salud'],['train','⚑','Entrenar'],['progress','⌁','Progreso'],['insights','✦','Insights'],['more','•••','Más']];return `<nav class="nav">${items.map(([k,i,l])=>`<button data-screen="${k}" class="${active===k?'active':''}"><span class="nicon">${i}</span>${l}</button>`).join('')}</nav>`}

function onboarding(){return `<div class="onboarding"><div class="logo">⌁</div><h1>Performance Lab</h1><p class="lead">Tu panel personal de salud, recuperación e hipertrofia. Los datos permanecen en este iPhone.</p><div class="card"><div class="step">Perfil basal · Semana 0</div><h2>Construye tu referencia inicial</h2><form id="profileForm" class="form"><div class="form-grid"><div class="field"><label>Edad</label><input name="age" type="number" min="18" required></div><div class="field"><label>Sexo</label><select name="sex" required><option value="">Seleccionar</option><option value="male">Masculino</option><option value="female">Femenino</option></select></div><div class="field"><label>Altura (cm)</label><input name="height" type="number" step="0.1" required></div><div class="field"><label>Peso inicial (kg)</label><input name="weight" type="number" step="0.1" required></div></div><div class="form-grid"><div class="field"><label>Cuello (cm)</label><input name="neck" type="number" step="0.1"></div><div class="field"><label>Hombros (cm)</label><input name="shoulders" type="number" step="0.1"></div><div class="field"><label>Pecho (cm)</label><input name="chest" type="number" step="0.1"></div><div class="field"><label>Cintura (cm)</label><input name="waist" type="number" step="0.1"></div><div class="field"><label>Cadera (cm)</label><input name="hips" type="number" step="0.1"></div><div class="field"><label>Actividad habitual</label><select name="lifestyle"><option value="sedentary">Mayormente sedentaria</option><option value="mixed" selected>Mixta</option><option value="active">Activa</option></select></div></div><div class="form-grid"><div class="field"><label>Ciudad habitual</label><input name="city" value="Ciudad de México"></div><div class="field"><label>Altitud basal (m)</label><input name="altitude" type="number" value="2240"></div></div><div class="note">Cuello, hombros, pecho, cintura y cadera se repetirán cada 15 días. Peso y composición corporal se analizarán semanalmente.</div><button class="primary" type="submit">Crear mi línea basal</button></form></div></div>`}
function render(){if(!state.profile&&!ui.demo){$('#app').innerHTML=onboarding();bind();return}let html=ui.screen==='today'?screenToday():ui.screen==='health'?screenHealth():ui.screen==='train'?screenTrain():ui.screen==='progress'?screenProgress():ui.screen==='insights'?screenInsights():screenMore();$('#app').innerHTML=`<div class="app">${html}</div>${ui.modal?modalHtml(ui.modal):''}`;bind()}

function fmtMinutes(min){
 if(!Number.isFinite(min))return '—';
 min=Math.max(0,Math.round(min));let h=Math.floor(min/60),m=min%60;
 return h?`${h} h ${m} min`:`${m} min`;
}
function sleepStageLabel(kind){
 return kind==='awake'?'Vigilia':kind==='rem'?'REM':kind==='deep'?'Profundo':'Ligero';
}
function sleepStageOrder(kind){return kind==='awake'?0:kind==='rem'?1:kind==='asleep'?2:kind==='deep'?3:2}
function sleepNightSummary(date=iso()){
 let rec=state.daily[date],m=rec?.metrics||{},segments=(rec?.series?.sleepStages||[]).filter(x=>x&&Number.isFinite(x.start)&&Number.isFinite(x.end));
 let asleep=Number.isFinite(m.sleepHours)?m.sleepHours*60:null;
 let deep=Number.isFinite(m.deepSleepMinutes)?m.deepSleepMinutes:0;
 let rem=Number.isFinite(m.remSleepMinutes)?m.remSleepMinutes:0;
 let awake=Number.isFinite(m.awakeMinutes)?m.awakeMinutes:0;
 let light=Number.isFinite(asleep)?Math.max(0,asleep-deep-rem):null;
 let start=segments.length?Math.min(...segments.map(x=>x.start)):null;
 let end=segments.length?Math.max(...segments.map(x=>x.end)):null;
 let inBed=Number.isFinite(m.timeInBedMinutes)?m.timeInBedMinutes:(start!==null&&end!==null?(end-start)/60000:null);
 return {rec,m,segments,asleep,deep,rem,awake,light,start,end,inBed};
}
function sleepHypnogramSvg(date=iso()){
 let s=sleepNightSummary(date),segs=s.segments;
 if(!segs.length)return '<div class="empty">Vuelve a importar Apple Salud para construir la gráfica de fases.</div>';
 let start=s.start,end=s.end;if(!(end>start))return '<div class="empty">No hay intervalos suficientes.</div>';
 let w=640,h=270,left=92,right=14,top=18,bottom=42,plotW=w-left-right,rowH=(h-top-bottom)/4;
 let labels=['Vigilia','REM','Ligero','Profundo'];
 let bg=labels.map((l,i)=>`<line x1="${left}" y1="${top+i*rowH}" x2="${w-right}" y2="${top+i*rowH}" stroke="#d8dee8"/><text x="8" y="${top+i*rowH+22}" class="sleep-axis-label">${l}</text>`).join('');
 bg+=`<line x1="${left}" y1="${top+4*rowH}" x2="${w-right}" y2="${top+4*rowH}" stroke="#d8dee8"/>`;
 let x=t=>left+(t-start)/(end-start)*plotW;
 let stageY=k=>top+sleepStageOrder(k)*rowH+8;
 let blocks=segs.map(g=>{
   let k=g.kind==='asleep'?'asleep':g.kind;
   let xx=x(g.start),ww=Math.max(3,x(g.end)-xx),yy=stageY(k);
   return `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${ww.toFixed(1)}" height="${Math.max(12,rowH-16).toFixed(1)}" rx="6" class="sleep-stage ${k}"/>`;
 }).join('');
 let ticks=4,axis='';
 for(let i=0;i<=ticks;i++){
   let t=start+(end-start)*i/ticks,xx=x(t),d=new Date(t);
   let lab=d.toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'});
   axis+=`<line x1="${xx}" y1="${top}" x2="${xx}" y2="${top+4*rowH}" stroke="#e7ebf1" stroke-dasharray="4 5"/><text x="${xx}" y="${h-12}" text-anchor="${i===0?'start':i===ticks?'end':'middle'}" class="sleep-time-label">${esc(lab)}</text>`;
 }
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Fases de sueño">${bg}${axis}${blocks}</svg>`;
}
function sleepDaySelector(){
 let ds=daysBack(7).filter(d=>Number.isFinite(metricValue(d,'sleepHours')));
 if(!ds.length)return '';
 return `<div class="sleep-day-strip">${ds.map(d=>`<button data-sleep-date="${d}" class="${(ui.modal?.date||iso())===d?'active':''}"><b>${new Date(d+'T12:00:00').toLocaleDateString('es-MX',{weekday:'short'}).replace('.','')}</b><span>${new Date(d+'T12:00:00').getDate()}</span></button>`).join('')}</div>`;
}
function sleepModal(m){
 let date=m.date||iso(),s=sleepNightSummary(date),mm=s.m;
 let score=Number.isFinite(mm.sleepScore)?Math.round(mm.sleepScore):null;
 let eff=Number.isFinite(s.asleep)&&Number.isFinite(s.inBed)&&s.inBed>0?Math.min(100,s.asleep/s.inBed*100):null;
 let phaseRows=[
   ['awake','Vigilia',s.awake],
   ['rem','REM',s.rem],
   ['asleep','Ligero',s.light],
   ['deep','Profundo',s.deep]
 ];
 return `<div class="modal-back"><div class="modal sleep-modal"><div class="modal-handle"></div><button class="close">×</button>
 <div class="sleep-modal-title"><div><h2>Sueño</h2><p>${fmtDate(date)}</p></div>${score!==null?`<div class="sleep-score"><span>${score}</span><small>/100</small></div>`:''}</div>
 ${sleepDaySelector()}
 <div class="sleep-summary-grid">
   <div><span>TIEMPO EN CAMA</span><strong>${fmtMinutes(s.inBed)}</strong></div>
   <div><span>TIEMPO DE SUEÑO</span><strong>${fmtMinutes(s.asleep)}</strong></div>
 </div>
 <div class="sleep-chart-wrap">${sleepHypnogramSvg(date)}</div>
 <div class="sleep-section-label">Fases de la noche</div>
 <div class="sleep-phase-list">${phaseRows.map(([k,l,v])=>`<div class="sleep-phase-row"><div><i class="sleep-dot ${k}"></i><span>${l}</span></div><strong>${fmtMinutes(v)}</strong></div>`).join('')}</div>
 <div class="sleep-kpis">
   <div><span>Eficiencia</span><strong>${Number.isFinite(eff)?Math.round(eff)+'%':'—'}</strong></div>
   <div><span>FC nocturna</span><strong>${Number.isFinite(mm.avgNightHR)?round(mm.avgNightHR)+' lpm':'—'}</strong></div>
   <div><span>SpO₂ mínima</span><strong>${Number.isFinite(mm.lowestSleepSpo2)?round(mm.lowestSleepSpo2)+'%':'—'}</strong></div>
   <div><span>Puntuación</span><strong>${score!==null?score+'/100':'No disponible'}</strong></div>
 </div>
 <div class="comment"><strong>Lectura de la noche</strong>${Number.isFinite(s.asleep)?`Dormiste ${fmtMinutes(s.asleep)}. REM: ${fmtMinutes(s.rem)} · profundo: ${fmtMinutes(s.deep)} · ligero: ${fmtMinutes(s.light)}.`:'Aún faltan datos de sueño.'}<div class="clinical"><b>Referencia general:</b> en adultos suele recomendarse al menos 7 h de sueño por noche; las fases se interpretan mejor como tendencia personal que como una meta rígida de una sola noche.</div></div>
 </div></div>`;
}

function pasteImportModal(message=''){
 return `<div class="modal-back"><div class="modal import-modal"><div class="modal-handle"></div><button class="close">×</button><h2>Pegar datos de Apple Salud</h2><p class="note">iPhone puede bloquear la lectura automática del portapapeles. Esto no significa que tu JSON esté dañado. Toca dentro del cuadro, elige <b>Pegar</b> y después <b>Validar e importar</b>.</p>${message?`<div class="warning">${esc(message)}</div>`:''}<form id="pasteImportForm" class="form"><div class="field"><label>Paquete JSON del Atajo</label><textarea id="pasteImportText" rows="10" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='Debe comenzar con { y terminar con }'></textarea></div><button class="primary" type="submit">Validar e importar</button></form></div></div>`
}
function modalHtml(m){
 if(m.type==='pasteImport')return pasteImportModal(m.message||'');
 if(m.type==='metric'&&m.key==='sleepHours')return sleepModal(m);
 if(m.type==='metric'){let k=m.key,def=metricDefs[k],p=m.period||ui.period,ser=seriesFor(k,p),t=trendFor(k,p),v=metricValue(iso(),k),avg=mean(ser.map(x=>x.value)),vals=ser.map(x=>x.value),min=vals.length?Math.min(...vals):null,max=vals.length?Math.max(...vals):null;return `<div class="modal-back"><div class="modal metric-detail"><div class="modal-handle"></div><button class="close">×</button><div class="detail-title"><div><span>${def.icon}</span><h2>${def.name}${def.clinical?'<i>*</i>':''}</h2></div><small>${metricSourceLabel(k)}</small></div>${periodSelector(p)}<div class="detail-primary"><span>${p==='day'?'HOY':'PROMEDIO'}</span><strong>${formatMetricValue(k,p==='day'?v:avg)}${Number.isFinite(p==='day'?v:avg)&&k!=='sleepHours'&&def.unit?` <em>${def.unit}</em>`:''}</strong><small>${Number.isFinite(min)&&Number.isFinite(max)&&p!=='day'?`Rango ${formatMetricValue(k,min)}–${formatMetricValue(k,max)} ${def.unit}`:fmtFull()}</small></div><div class="detail-chart">${lineSvg(ser,COLORS[def.clinical?clinicalColor(k,avg):'blue']||COLORS.blue)}</div><div class="detail-panel"><div><span>Más reciente</span><strong>${formatMetricValue(k,v)}${Number.isFinite(v)&&k!=='sleepHours'&&def.unit?` ${def.unit}`:''}</strong></div><div><span>Tendencia</span><strong>${Number.isFinite(t.delta)?`${t.delta>=0?'+':''}${t.delta.toFixed(0)}%`:'—'}</strong></div></div><div class="comment"><strong>Interpretación</strong>${trendComment(k,p,t)}${def.clinical&&def.ref?`<div class="clinical"><b>Referencia:</b> ${def.ref(state.profile)}</div>`:''}</div></div></div>`}
 if(m.type==='why'){let h=scoreHealth(),t=scoreTraining();return `<div class="modal-back"><div class="modal"><div class="modal-handle"></div><button class="close">×</button><h2>¿Por qué?</h2><div class="card flat"><h3>Salud · ${h.label}</h3><p class="note">Sólo utiliza datos objetivos disponibles. Los check-ins subjetivos se muestran por separado.</p></div><div class="card flat" style="margin-top:10px"><h3>Preparación · ${t.label}</h3><table class="table">${t.parts.map(x=>`<tr><td>${metricDefs[x.k].name}</td><td>${Math.round(x.q)}/100</td></tr>`).join('')||'<tr><td>Datos insuficientes</td></tr>'}</table><div class="comment">${recommendation(t)}</div></div></div></div>`}
 if(m.type==='checkin')return checkinModal(m.when);if(m.type==='zepp')return zeppModal();if(m.type==='anthro')return anthroModal();if(m.type==='profile')return profileModal();if(m.type==='lab')return labModal();return ''
}
function metricExtras(k){let m=today().metrics;if(k==='sleepHours'){let rows=[['Sueño profundo',m.deepSleepMinutes,'min'],['Sueño REM',m.remSleepMinutes,'min'],['Despierto',m.awakeMinutes,'min'],['Puntuación de sueño',m.sleepScore,'/100'],['FC nocturna media',m.avgNightHR,'lpm'],['SpO₂ nocturna mínima',m.lowestSleepSpo2,'%'],['Calidad respiratoria',m.breathingQuality,''],['Eventos respiratorios',m.sleepRespiratoryEvents,'']];return `<div class="card flat" style="margin-top:10px"><h3>Analítica de sueño disponible</h3><table class="table">${rows.map(r=>`<tr><td>${r[0]}</td><td>${Number.isFinite(r[1])?`${round(r[1])} ${r[2]}`:'No disponible'}</td></tr>`).join('')}</table><div class="note">Los eventos o índices respiratorios del reloj se muestran tal como los reporta la fuente y no equivalen por sí solos a un diagnóstico de apnea/hipopnea.</div></div>`}if(k==='stress'){let rows=[['Al despertar',m.stressMorning],['Mediodía',m.stressNoon],['Antes de entrenar',m.stressPreWorkout]];return `<div class="card flat" style="margin-top:10px"><h3>Momentos del día</h3><table class="table">${rows.map(r=>`<tr><td>${r[0]}</td><td>${Number.isFinite(r[1])?round(r[1])+'/100':'No disponible'}</td></tr>`).join('')}</table></div>`}return ''}
function trendComment(k,p,t){if(!Number.isFinite(t.cur))return 'No hay suficientes datos para este periodo.';let delta=Number.isFinite(t.delta)?Math.abs(t.delta).toFixed(1):null;let dir=Number.isFinite(t.delta)?(t.delta>0?'aumentó':t.delta<0?'disminuyó':'se mantuvo'):'aún no tiene comparación previa';return `El promedio ${dir}${delta?` ${delta}% frente al periodo anterior`:''}. ${personalBaselineReady()?'También se contrasta con tus primeros 15 días.':'La app todavía está construyendo tu línea basal personal.'}`}
function checkinModal(when){let c=today().checkins[when]||{},score=subjectiveScore(when);return `<div class="modal-back"><div class="modal checkin-modal"><div class="modal-handle"></div><button class="close">×</button><div class="modal-title-row"><div><h2>${when==='morning'?'Check-in al despertar':'Check-in pre-entreno'}</h2><p>Escala 1–5 · tarda menos de un minuto.</p></div>${Number.isFinite(score)?`<span class="subjective-pill">${score}/100</span>`:''}</div><div class="note">Esta evaluación es subjetiva. Se compara con tus datos objetivos, pero no cambia automáticamente Salud ni Preparación.</div><form id="checkinForm" class="form" data-when="${when}">${checkinFields(when).map(([k,l,low,high])=>`<div class="scale-field"><div class="scale-head"><strong>${l}</strong><b id="val-${k}">${c[k]||3}</b></div><input name="${k}" type="range" min="1" max="5" step="1" value="${c[k]||3}" oninput="document.getElementById('val-${k}').textContent=this.value"><div class="scale-ends"><span>1 · ${low}</span><span>5 · ${high}</span></div></div>`).join('')}<button class="primary">Guardar check-in</button></form>${when==='pre'?`<div class="section-title sub"><div><h3>Mapa de molestias</h3><p>Opcional. Sólo si hay dolor o limitación.</p></div></div>${bodyMap()}`:''}</div></div>`}
function bodyMap(){let p=today().pain||{};let zones=['Cuello','Hombros','Espalda','Codos','Cadera','Rodillas'];return `<div class="body-map"><div class="silhouette"><div class="person"><div class="head"></div><div class="torso"></div><div class="arm l"></div><div class="arm r"></div><div class="leg l"></div><div class="leg r"></div></div></div><div class="body-zones">${zones.map(z=>`<button data-pain-zone="${z}" class="${p[z]?'active':''}">${z} ${p[z]?`· ${p[z]}/5`:''}</button>`).join('')}</div></div>`}
function zeppModal(){let m=today().metrics;return `<div class="modal-back"><div class="modal zepp-modal"><div class="modal-handle"></div><button class="close">×</button><h2>Zepp / Amazfit</h2><p class="note">Registra las métricas que Zepp todavía no entrega al puente de Apple Salud. También se aceptan por JSON.</p><form id="zeppForm" class="form"><div class="form-grid"><div class="field"><label>VFC / HRV (ms)</label><input name="hrv" type="number" step="0.1" value="${m.hrv??''}"></div><div class="field"><label>Estrés (0–100)</label><input name="stress" type="number" min="0" max="100" step="1" value="${m.stress??''}"></div><div class="field"><label>PAI</label><input name="pai" type="number" step="1" value="${m.pai??''}"></div><div class="field"><label>Puntuación de sueño</label><input name="sleepScore" type="number" min="0" max="100" step="1" value="${m.sleepScore??''}"></div><div class="field"><label>Recuperación / readiness</label><input name="zeppReadiness" type="number" min="0" max="100" step="1" value="${m.zeppReadiness??''}"></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${iso()}"></div></div><button class="primary">Guardar datos Zepp</button></form></div></div>`}
function anthroModal(){let a=latestAnthro()||{};return `<div class="modal-back"><div class="modal"><div class="modal-handle"></div><button class="close">×</button><h2>Antropometría</h2><p class="note">Peso/composición: semanal. Cuello, hombros, pecho, cintura y cadera: cada 15 días.</p><form id="anthroForm" class="form"><div class="form-grid">${[['weight','Peso (kg)'],['bodyFat','Grasa (%)'],['muscleMass','Masa muscular (kg)'],['neck','Cuello (cm)'],['shoulders','Hombros (cm)'],['chest','Pecho (cm)'],['waist','Cintura (cm)'],['hips','Cadera (cm)']].map(([k,l])=>`<div class="field"><label>${l}</label><input name="${k}" type="number" step="0.1" value="${a[k]??''}"></div>`).join('')}</div><button class="primary">Guardar medición</button></form></div></div>`}
function profileModal(){let p=state.profile||{};return `<div class="modal-back"><div class="modal"><div class="modal-handle"></div><button class="close">×</button><h2>Perfil basal</h2><form id="profileEdit" class="form"><div class="form-grid"><div class="field"><label>Edad</label><input name="age" type="number" value="${p.age||''}"></div><div class="field"><label>Sexo</label><select name="sex"><option value="male" ${p.sex==='male'?'selected':''}>Masculino</option><option value="female" ${p.sex==='female'?'selected':''}>Femenino</option></select></div><div class="field"><label>Altura (cm)</label><input name="height" type="number" step="0.1" value="${p.height||''}"></div><div class="field"><label>Ciudad</label><input name="city" value="${esc(p.city||'Ciudad de México')}"></div><div class="field"><label>Altitud (m)</label><input name="altitude" type="number" value="${p.altitude||2240}"></div><div class="field"><label>Actividad</label><select name="lifestyle"><option value="sedentary" ${p.lifestyle==='sedentary'?'selected':''}>Sedentaria</option><option value="mixed" ${p.lifestyle==='mixed'?'selected':''}>Mixta</option><option value="active" ${p.lifestyle==='active'?'selected':''}>Activa</option></select></div></div><button class="primary">Guardar perfil</button></form></div></div>`}
function labModal(){return `<div class="modal-back"><div class="modal"><div class="modal-handle"></div><button class="close">×</button><h2>Agregar laboratorio</h2><form id="labForm" class="form"><div class="field"><label>Analito</label><input name="name" required></div><div class="form-grid"><div class="field"><label>Valor</label><input name="value" type="number" step="any" required></div><div class="field"><label>Unidad</label><input name="unit"></div></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${iso()}"></div><button class="primary">Guardar</button></form></div></div>`}
function seedDemo(){ui.demo=true;if(!state.profile)state.profile={age:40,sex:'male',height:175,city:'Ciudad de México',altitude:2240,lifestyle:'mixed',createdAt:iso()};for(let i=39;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let k=iso(d),r=dayObj(k);let wave=Math.sin(i/4),rnd=(n)=>((i*17)%n)/n;r.metrics={sleepHours:5.6+((39-i)%7)*.11+wave*.2,restingHR:64+Math.round(wave*3),spo2:93.4+(i%4)*.25,hrv:38+(i%9),steps:5200+((i*431)%3900),respiratoryRate:15+(i%3)*.3,stress:42+((i*7)%28),bioCharge:60+((i*5)%25),workoutMinutes:i%3===0?62+(i%8):0,workoutCalories:i%3===0?330+(i%70):0,workoutAvgHR:i%3===0?118+(i%12):0,activeMinutes:i%3===0?42+(i%7):0,restMinutes:i%3===0?18+(i%6):0};r.checkins.morning={energy:3+(i%3===0?1:0),fatigue:2+(i%5===0?1:0),stress:3,pain:2,motivation:4};r.sources=['Demo']}
state.anthro=[{date:daysBack(31)[0],weight:79.0,waist:90.0,chest:100,shoulders:116,neck:39,hips:99,bmi:25.8},{date:daysBack(16)[0],weight:78.8,waist:89.4,chest:100.5,shoulders:116.5,neck:39,hips:99,bmi:25.7},{date:iso(),weight:78.6,waist:88.9,chest:101.0,shoulders:117.0,neck:39.1,hips:98.8,bmi:25.7}];state.lastSync=new Date().toISOString();state.lastSyncSources=['Demo Apple Salud','Demo Zepp'];render()}

function bind(){
 $('#profileForm')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),p=Object.fromEntries(f.entries());['age','height','altitude','weight','neck','shoulders','chest','waist','hips'].forEach(k=>p[k]=p[k]?Number(p[k]):null);p.createdAt=iso();state.profile=p;state.anthro.push({date:iso(),weight:p.weight,neck:p.neck,shoulders:p.shoulders,chest:p.chest,waist:p.waist,hips:p.hips,bmi:p.weight&&p.height?p.weight/((p.height/100)**2):null});save();render()});
 $$('[data-screen]').forEach(b=>b.onclick=()=>{ui.screen=b.dataset.screen;ui.modal=null;render()});$$('[data-go]').forEach(b=>b.onclick=()=>{ui.screen=b.dataset.go;render()});
 $$('[data-period]').forEach(b=>b.onclick=()=>{ui.period=b.dataset.period;if(ui.modal?.type==='metric')ui.modal.period=ui.period;render()});
 $$('[data-metric]').forEach(b=>b.onclick=()=>{ui.modal={type:'metric',key:b.dataset.metric,period:ui.period};render()});
 $$('[data-sleep-date]').forEach(b=>b.onclick=()=>{if(ui.modal?.type==='metric'&&ui.modal.key==='sleepHours'){ui.modal.date=b.dataset.sleepDate;render()}});
 $('.close')?.addEventListener('click',()=>{ui.modal=null;render()});$('.modal-back')?.addEventListener('click',e=>{if(e.target.classList.contains('modal-back')){ui.modal=null;render()}});
 $('#whyBtn')?.addEventListener('click',()=>{if(state.settings.explain){ui.modal={type:'why'};render()}});$('#anthroBtn')?.addEventListener('click',()=>{ui.modal={type:'anthro'};render()});$('#profileBtn')?.addEventListener('click',()=>{ui.modal={type:'profile'};render()});$('#labBtn')?.addEventListener('click',()=>{ui.modal={type:'lab'};render()});
 $('#zeppBtn')?.addEventListener('click',()=>{ui.modal={type:'zepp'};render()});
 $$('[data-checkin]').forEach(b=>b.onclick=()=>{ui.modal={type:'checkin',when:b.dataset.checkin};render()});
 $$('[data-select-routine]').forEach(b=>b.onclick=()=>{state.selectedRoutine[iso()]=b.dataset.selectRoutine;save();render()});
 $('#checkinForm')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),o=Object.fromEntries([...f].map(([k,v])=>[k,Number(v)]));today().checkins[e.target.dataset.when]=o;save();ui.modal=null;render()});
 $('#zeppForm')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),d=f.get('date')||iso(),r=dayObj(d),changed=false;for(const k of ['hrv','stress','pai','sleepScore','zeppReadiness']){let raw=f.get(k);if(raw!==''&&raw!==null){let v=Number(raw);if(Number.isFinite(v)){r.metrics[k]=v;changed=true}}}if(changed&&!r.sources.includes('Zepp manual'))r.sources.push('Zepp manual');state.lastSync=new Date().toISOString();state.lastSyncSources=[...new Set([...(state.lastSyncSources||[]),'Zepp manual'])];save();ui.modal=null;render()});
 $$('[data-pain-zone]').forEach(b=>b.onclick=()=>{let z=b.dataset.painZone,cur=today().pain[z]||0,n=cur>=5?0:cur+1;if(n)today().pain[z]=n;else delete today().pain[z];save();render()});
 $('#anthroForm')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),a={date:iso()};for(const [k,v] of f.entries())a[k]=v===''?null:Number(v);if(a.weight&&state.profile?.height)a.bmi=a.weight/((state.profile.height/100)**2);state.anthro=state.anthro.filter(x=>x.date!==a.date);state.anthro.push(a);save();ui.modal=null;render()});
 $('#profileEdit')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),p=Object.fromEntries(f.entries());p.age=Number(p.age);p.height=Number(p.height);p.altitude=Number(p.altitude);state.profile={...state.profile,...p};save();ui.modal=null;render()});
 $('#labForm')?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target),x=Object.fromEntries(f.entries());x.value=Number(x.value);state.labs.push(x);save();ui.modal=null;render()});
 $$('[data-supp]').forEach(b=>b.onclick=()=>{let k=b.dataset.supp;today().supplements[k]=!today().supplements[k];save();render()});
 $('#creatineG')?.addEventListener('change',e=>{today().supplements.creatineG=Number(e.target.value);save()});$('#proteinG')?.addEventListener('change',e=>{today().supplements.proteinG=Number(e.target.value);save()});
 $('#explainToggle')?.addEventListener('change',e=>{state.settings.explain=e.target.checked;save()});$('#notifToggle')?.addEventListener('change',e=>{state.settings.notifications=e.target.checked;save()});
 $('#weeklyTarget')?.addEventListener('change',e=>{state.settings.weeklySessionTarget=clamp(Number(e.target.value)||3,1,7);save();render()});
 $('#syncBtn')?.addEventListener('click',()=>{ui.screen='more';render()});
 $('#pasteSync')?.addEventListener('click',async()=>{ui.syncMessage=null;try{if(!navigator.clipboard?.readText)throw new Error('iOS no permitió lectura automática del portapapeles.');let txt=await navigator.clipboard.readText();let r=safeImportText(txt);ui.syncMessage={ok:true,text:importResultText(r)};render()}catch(e){ui.modal={type:'pasteImport',message:e?.message||'iOS bloqueó la lectura automática del portapapeles.'};render()}});
 $('#manualPasteBtn')?.addEventListener('click',()=>{ui.modal={type:'pasteImport'};render()});
 $('#pasteImportForm')?.addEventListener('submit',e=>{e.preventDefault();try{let r=safeImportText($('#pasteImportText')?.value||'');ui.modal=null;ui.syncMessage={ok:true,text:importResultText(r)};render()}catch(err){ui.modal={type:'pasteImport',message:err?.message||'No se pudo importar.'};render()}});
 $('#fileSyncBtn')?.addEventListener('click',()=>$('#fileSync')?.click());$('#fileSync')?.addEventListener('change',async e=>{let f=e.target.files[0];if(!f)return;try{let r=safeImportText(await f.text());ui.syncMessage={ok:true,text:importResultText(r)};render()}catch(err){ui.syncMessage={ok:false,text:err?.message||'No se pudo importar el archivo.'};render()}});
 $$('[data-export]').forEach(b=>b.onclick=()=>exportData(b.dataset.export));
}
function exportData(type){if(type==='pdf'){window.print();return}let blob,name;if(type==='json'){blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});name='performance-lab-historial.json'}else{let rows=[['fecha','sueno_h','fc_reposo','spo2','respiracion','pasos','hrv','estres','pai','sleep_score','zepp_readiness','checkin_manana','checkin_pre','entreno_min','creatina_g','proteina_g']];for(const d of Object.keys(state.daily).sort()){let r=state.daily[d];rows.push([d,r.metrics.sleepHours??'',r.metrics.restingHR??'',r.metrics.spo2??'',r.metrics.respiratoryRate??'',r.metrics.steps??'',r.metrics.hrv??'',r.metrics.stress??'',r.metrics.pai??'',r.metrics.sleepScore??'',r.metrics.zeppReadiness??'',subjectiveScore('morning',d)??'',subjectiveScore('pre',d)??'',r.metrics.workoutMinutes??'',r.supplements?.creatineTaken?r.supplements.creatineG:'',r.supplements?.proteinTaken?r.supplements.proteinG:''])}let sep=type==='xls'? '\t':',';let txt=rows.map(r=>r.join(sep)).join('\n');blob=new Blob([txt],{type:type==='xls'?'application/vnd.ms-excel':'text/csv;charset=utf-8'});name=type==='xls'?'performance-lab-historial.xls':'performance-lab-historial.csv'}let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

// Recuperación 1.0.7: retirar service workers/cachés antiguos para evitar servir builds obsoletos.
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{})}
if('caches' in window){caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('performance-lab-')).map(k=>caches.delete(k)))).catch(()=>{})}
syncFromHash();
purgeDemoDataIfNeeded();
render()
