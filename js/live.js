/* ============================================================
   RailSync — Live Tracking Page
   ============================================================ */

const LivePage = (() => {
  let jitterTimer, weatherTimer;

  function render(){
    const t = App.currentTrain, L = t.live;

    document.getElementById('liveTag').className = 'tc-tag ' + SearchPage.tagClass(t.type);
    document.getElementById('liveTag').textContent = t.tag;
    document.getElementById('liveName').textContent = t.name + ' · #' + t.num;
    document.getElementById('liveRoute').innerHTML = `<b>${t.from}</b> ${t.fromName} → <b>${t.to}</b> ${t.toName} · ${t.dist} km`;
    document.getElementById('liveDays').textContent = t.days;
    document.getElementById('maxSpeed').textContent = t.maxSpeed;
    document.getElementById('mapOrigin').textContent = t.from;
    document.getElementById('mapDest').textContent = t.to;
    document.getElementById('blockSection').textContent = L.block;
    document.getElementById('distNext').textContent = L.aheadGap + ' km';
    document.getElementById('wxIcon').textContent = L.weather;
    document.getElementById('wxDesc').textContent = L.weatherDesc;
    document.getElementById('wxHum').textContent = L.humidity + '%';
    document.getElementById('wxRain').textContent = (L.rain/10).toFixed(1) + ' mm';

    const late = L.delayMin > 5;
    const pill = document.getElementById('liveStatusPill');
    pill.className = 'status-pill ' + (late?'pill-late':'pill-ontime');
    pill.textContent = late ? `+${L.delayMin}m delayed` : 'On time';
    const delayEl = document.getElementById('delayVal');
    delayEl.textContent = late ? `+${L.delayMin} min` : 'On time';
    delayEl.style.color = late ? 'var(--alert)' : 'var(--live)';

    document.getElementById('diagText').textContent = late
      ? `Detected congestion in ${L.block}. Recovery margin available in downstream sections — projected to cut delay before terminal arrival.`
      : `Train running on schedule with optimal block headway. High probability of on-time destination arrival.`;
    document.getElementById('slackChip').textContent = late ? `${Math.max(2, 25-L.delayMin)}m recoverable slack` : '+18m slack recovery';

    // ---- Dynamic ETA forecast ----
    const f = ETAEngine.forecast(t);
    document.getElementById('forecastEta').textContent = f.etaClock;
    document.getElementById('forecastSub').textContent =
      (f.etaDeltaMin>5 ? `Projected +${f.etaDeltaMin} min vs scheduled ${t.arr}` : `Tracking close to scheduled ${t.arr}`) +
      ` · ${f.confidence}% confidence`;
    document.getElementById('forecastMeterFill').style.width = f.confidence + '%';
    document.getElementById('ffDelay').textContent = f.factors.delay + 'm';
    document.getElementById('ffCongestion').textContent = '+' + f.factors.congestion + 'm';
    document.getElementById('ffWeather').textContent = '+' + f.factors.weather + 'm';

    // gauge
    const pct = L.speed / t.maxSpeed;
    const arcLen = 157;
    document.getElementById('speedArc').style.strokeDashoffset = arcLen - arcLen*pct;
    document.getElementById('speedVal').textContent = L.speed;

    // track map
    const x1=15, x2=385;
    const curX = x1 + (x2-x1)*L.progress;
    document.getElementById('progressLine').setAttribute('x2', curX);
    document.getElementById('trainMarker').setAttribute('transform', `translate(${curX},40)`);
    document.getElementById('tmPct').textContent = Math.round(L.progress*100) + '%';

    // coaches
    const layout = ['ENG','H1','A1','B1','B2','B3','S1','S2','S3','S4','PC'];
    document.getElementById('coachRow').innerHTML = layout.map(c=>
      `<div class="coach ${c==='ENG'?'eng':(c[0]==='A'||c[0]==='B')?'ac':''}">${c}</div>`
    ).join('');

    // upcoming stations (synthetic, scaled to distance/progress)
    const names = ["Jn Central","Riverside","Cantt Junction","Mid Point","East Yard","Hill Cutting","City Outer",t.toName];
    const n = names.length;
    document.getElementById('stationsTable').innerHTML = names.map((nm,i)=>{
      const frac = i/(n-1);
      const passed = frac < L.progress - 0.03;
      const cur = Math.abs(frac - L.progress) < 0.08;
      const etaMin = Math.round((frac - L.progress) * (t.dist/ (L.speed||80)) * 60);
      return `<div class="st-row ${passed?'passed':''} ${cur?'current':''}">
        <span class="st-dot"></span>
        <span class="st-name">${nm}</span>
        <span class="st-eta">${passed? 'Passed' : cur ? 'Approaching' : (etaMin>0? etaMin+' min':'—')}</span>
      </div>`;
    }).join('');
  }

  function startTimers(){
    clearInterval(jitterTimer);
    clearInterval(weatherTimer);
    /* subtle live jitter so numbers feel "live" */
    jitterTimer = setInterval(()=>{
      if(Router.currentPage()!=='live') return;
      const L = App.currentTrain.live;
      L.speed = Math.max(20, Math.min(App.currentTrain.maxSpeed, L.speed + ((Math.random()*6-3)|0)));
      L.progress = Math.min(0.98, L.progress + 0.0009);
      L.aheadGap = Math.max(0.4, (L.aheadGap - 0.03));
      RailSyncDB.saveTrains(App.trains);
      render();
    }, 2200);
    /* refresh real weather every 45s while viewing the live page */
    weatherTimer = setInterval(()=>{
      if(Router.currentPage()==='live') WeatherModule.loadForTrain(App.currentTrain, () => Router.currentPage()==='live');
    }, 45000);
  }

  function onEnter(){
    render();
    WeatherModule.loadForTrain(App.currentTrain, () => Router.currentPage()==='live');
  }

  function init(){
    startTimers();
  }

  return { render, init, onEnter };
})();
