
/*
 Performance Lab · Apple Health raw Shortcut import patch
 Load AFTER app.js
 Supports the raw dictionary currently produced by the iOS Shortcut:
 SuenoInicio, SuenoFin, SuenoEtapa, FCReposo, FCReposoFechas,
 Pasos, PasosFechad, SpO2, SpO2Fechad, Respiracion, RespiracionFechas,
 Peso, PesoFechas, sourse/source.
*/
(() => {
  const previousApplyImport = applyImport;

  function lines(v) {
    if (v == null || v === '') return [];
    return String(v)
      .replace(/\r/g, '')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  }

  function nums(v) {
    return lines(v)
      .map(x => Number(String(x).replace(',', '.')))
      .map(x => Number.isFinite(x) ? x : null);
  }

  const MONTHS = {
    ene: 0, enero: 0,
    feb: 1, febrero: 1,
    mar: 2, marzo: 2,
    abr: 3, abril: 3,
    may: 4, mayo: 4,
    jun: 5, junio: 5,
    jul: 6, julio: 6,
    ago: 7, agosto: 7,
    sep: 8, sept: 8, septiembre: 8,
    oct: 9, octubre: 9,
    nov: 10, noviembre: 10,
    dic: 11, diciembre: 11
  };

  function cleanDateText(s) {
    return String(s || '')
      .replace(/\u202f|\u00a0/g, ' ')
      .replace(/[.]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function parseEsDate(s) {
    const t = cleanDateText(s);
    const m = t.match(
      /^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*([ap])\s*m$/
    );
    if (!m) return null;

    const day = Number(m[1]);
    const monKey = m[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const month = MONTHS[monKey];
    const year = Number(m[3]);
    let hour = Number(m[4]);
    const minute = Number(m[5]);
    const ap = m[6];

    if (!Number.isInteger(month)) return null;
    if (ap === 'p' && hour !== 12) hour += 12;
    if (ap === 'a' && hour === 12) hour = 0;

    const d = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function localKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function avg(a) {
    const v = a.filter(Number.isFinite);
    return v.length ? v.reduce((x,y)=>x+y,0) / v.length : null;
  }

  function med(a) {
    const v = a.filter(Number.isFinite).sort((a,b)=>a-b);
    if (!v.length) return null;
    const i = Math.floor(v.length / 2);
    return v.length % 2 ? v[i] : (v[i-1] + v[i]) / 2;
  }

  function groupPairs(valuesRaw, datesRaw) {
    const values = nums(valuesRaw);
    const dates = lines(datesRaw).map(parseEsDate);
    const n = Math.min(values.length, dates.length);
    const out = {};
    for (let i=0; i<n; i++) {
      if (!Number.isFinite(values[i]) || !dates[i]) continue;
      const k = localKey(dates[i]);
      (out[k] ||= []).push(values[i]);
    }
    return out;
  }

  function setDailyMetric(date, key, value) {
    if (!Number.isFinite(value)) return;
    const rec = dayObj(date);
    rec.metrics[key] = value;
  }

  function importRawHealth(p) {
    const source = String(p.source || p.sourse || 'Apple Salud').trim() || 'Apple Salud';
    const touched = new Set();

    // FC en reposo: promedio diario.
    const hr = groupPairs(p.FCReposo, p.FCReposoFechas);
    for (const [d, a] of Object.entries(hr)) {
      setDailyMetric(d, 'restingHR', avg(a));
      touched.add(d);
    }

    // Pasos: suma diaria de todas las muestras/fragmentos.
    const stepDates = p.PasosFechad ?? p.PasosFechas;
    const st = groupPairs(p.Pasos, stepDates);
    for (const [d, a] of Object.entries(st)) {
      setDailyMetric(d, 'steps', a.reduce((x,y)=>x+y,0));
      touched.add(d);
    }

    // SpO2: mediana diaria para reducir el impacto de lecturas aisladas erráticas.
    const spoDates = p.SpO2Fechad ?? p.SpO2Fechas;
    const sp = groupPairs(p.SpO2, spoDates);
    for (const [d, a] of Object.entries(sp)) {
      setDailyMetric(d, 'spo2', med(a));
      const rec = dayObj(d);
      rec.series.spo2 = a;
      touched.add(d);
    }

    // Respiración: mediana diaria.
    const rr = groupPairs(p.Respiracion, p.RespiracionFechas);
    for (const [d, a] of Object.entries(rr)) {
      setDailyMetric(d, 'respiratoryRate', med(a));
      const rec = dayObj(d);
      rec.series.respiratoryRate = a;
      touched.add(d);
    }

    // Sueño: reconstruye duración a partir de intervalos y etapa.
    const starts = lines(p.SuenoInicio).map(parseEsDate);
    const ends   = lines(p.SuenoFin).map(parseEsDate);
    const stages = lines(p.SuenoEtapa);
    const nSleep = Math.min(starts.length, ends.length, stages.length);
    const sleepByDay = {};

    for (let i=0; i<nSleep; i++) {
      const a = starts[i], b = ends[i];
      if (!a || !b) continue;
      let min = (b - a) / 60000;
      if (!Number.isFinite(min) || min < 0 || min > 12*60) continue;

      const stage = stages[i].toLowerCase();
      const d = localKey(b); // asigna el episodio al día en que termina/despiertas
      const x = sleepByDay[d] ||= {sleep:0, deep:0, rem:0, awake:0, light:0};

      if (stage.includes('despierto')) {
        x.awake += min;
      } else if (!stage.includes('en cama')) {
        x.sleep += min;
        if (stage.includes('profundo')) x.deep += min;
        else if (stage.includes('rem')) x.rem += min;
        else x.light += min;
      }
    }

    for (const [d, x] of Object.entries(sleepByDay)) {
      const rec = dayObj(d);
      if (x.sleep > 0) rec.metrics.sleepHours = x.sleep / 60;
      if (x.deep > 0) rec.metrics.deepSleepMinutes = x.deep;
      if (x.rem > 0) rec.metrics.remSleepMinutes = x.rem;
      if (x.awake > 0) rec.metrics.awakeMinutes = x.awake;
      touched.add(d);
    }

    // Peso: si algún día existe en el Atajo, se conserva en antropometría.
    const wt = groupPairs(p.Peso, p.PesoFechas);
    for (const [d, a] of Object.entries(wt)) {
      const weight = med(a);
      if (!Number.isFinite(weight)) continue;
      setDailyMetric(d, 'weight', weight);
      let anth = state.anthro.find(x => x.date === d) || {date:d};
      anth.weight = weight;
      if (state.profile?.height) anth.bmi = weight / ((state.profile.height/100)**2);
      state.anthro = state.anthro.filter(x => x.date !== d);
      state.anthro.push(anth);
      touched.add(d);
    }

    // Marca procedencia en cada día importado.
    for (const d of touched) {
      const rec = dayObj(d);
      if (!rec.sources.includes(source)) rec.sources.push(source);
    }

    state.lastSync = new Date().toISOString();
    state.lastSyncSources = [...new Set([...(state.lastSyncSources || []), source])];
    state.syncLog.unshift({
      at: state.lastSync,
      source,
      rawShortcut: true,
      dates: [...touched].sort(),
      keys: Object.keys(p)
    });
    state.syncLog = state.syncLog.slice(0,100);
    save();
  }

  applyImport = function(payload) {
    if (!payload) return;

    const looksLikeRawShortcut =
      'SuenoInicio' in payload ||
      'FCReposo' in payload ||
      'Pasos' in payload ||
      'SpO2' in payload ||
      'Respiracion' in payload;

    if (looksLikeRawShortcut) {
      importRawHealth(payload);
      return;
    }

    previousApplyImport(payload);
  };
})();
