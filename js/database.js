/* ============================================================
   RailSync — Database Layer
   A small localStorage-backed "database" so the app has real
   persistence (seen searches, live snapshots, user prefs)
   without requiring a server. Structured like tables so it can
   be swapped for a real backend (REST/IndexedDB) later without
   touching the UI code — every consumer goes through RailSyncDB.
   ============================================================ */

const RailSyncDB = (() => {
  const NS = 'railsync:v1:';

  const TABLES = {
    trains: NS + 'trains',
    prefs: NS + 'prefs',
    searchHistory: NS + 'searchHistory',
  };

  function read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function write(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }
    catch(e){ /* storage unavailable — fail silently, app still works in-memory */ }
  }

  /* ---------------- Seed dataset: trains table ---------------- */
  const SEED_TRAINS = [
    { num:"22436", name:"Vande Bharat Express", type:"vb", tag:"Vande Bharat", from:"NDLS", fromName:"New Delhi", to:"BSB", toName:"Varanasi Jn", dist:759, dep:"06:00", arr:"14:00", days:"Runs all days except Tue", maxSpeed:130, baseFare:{ CC:1195, EC:2260 } },
    { num:"12302", name:"Howrah Rajdhani Express", type:"raj", tag:"Rajdhani", from:"NDLS", fromName:"New Delhi", to:"HWH", toName:"Howrah Jn", dist:1451, dep:"16:55", arr:"10:05", days:"Runs all days except Fri", maxSpeed:130, baseFare:{ SL:820, "3A":2150, "2A":3080, "1A":5210 } },
    { num:"12951", name:"Mumbai Rajdhani Express", type:"raj", tag:"Rajdhani", from:"NDLS", fromName:"New Delhi", to:"BCT", toName:"Mumbai Central", dist:1384, dep:"16:25", arr:"08:35", days:"Runs daily", maxSpeed:140, baseFare:{ SL:795, "3A":2080, "2A":2960, "1A":4990 } },
    { num:"12259", name:"Sealdah Duronto Express", type:"dur", tag:"Duronto", from:"NDLS", fromName:"New Delhi", to:"SDAH", toName:"Sealdah", dist:1447, dep:"22:35", arr:"22:00", days:"Runs Mon, Wed, Fri, Sat", maxSpeed:130, baseFare:{ SL:770, "3A":1990, "2A":2870 } },
    { num:"12002", name:"Bhopal Shatabdi Express", type:"sht", tag:"Shatabdi", from:"NDLS", fromName:"New Delhi", to:"BPL", toName:"Bhopal Jn", dist:707, dep:"06:15", arr:"13:50", days:"Runs all days except Sun", maxSpeed:150, baseFare:{ CC:1080, EC:2040 } },
    { num:"12622", name:"Tamil Nadu Express", type:"dur", tag:"Superfast", from:"NDLS", fromName:"New Delhi", to:"MAS", toName:"Chennai Central", dist:2194, dep:"22:30", arr:"07:15", days:"Runs daily", maxSpeed:120, baseFare:{ SL:920, "3A":2480, "2A":3560 } },
    { num:"20502", name:"Rani Kamalapati Vande Bharat", type:"vb", tag:"Vande Bharat", from:"NDLS", fromName:"New Delhi", to:"RKMP", toName:"Rani Kamalapati", dist:701, dep:"05:40", arr:"13:20", days:"Runs all days except Wed", maxSpeed:160, baseFare:{ CC:1150, EC:2190 } },
    { num:"12430", name:"Nizamuddin Rajdhani", type:"raj", tag:"Rajdhani", from:"NZM", fromName:"H Nizamuddin", to:"SC", toName:"Secunderabad", dist:1671, dep:"20:05", arr:"21:35", days:"Runs Mon, Thu, Sat", maxSpeed:130, baseFare:{ SL:850, "3A":2240, "2A":3210, "1A":5420 } },
  ];

  const STATION_COORDS = {
    NDLS:[28.6448,77.2167], NZM:[28.5877,77.2507], HWH:[22.5851,88.3468], BSB:[25.3176,82.9739],
    BCT:[18.9696,72.8194], SDAH:[22.5726,88.3639], BPL:[23.2599,77.4126], RKMP:[23.2408,77.4525],
    MAS:[13.0827,80.2707], SC:[17.4399,78.5011],
  };

  const DEFAULT_PREFS = {
    theme: 'dark',        // 'dark' | 'light' | 'auto'
    accentH: 25,
    accentS: 100,
    accentL: 50,
  };

  /* simulated live snapshot per train (speed, delay, progress %, congestion, weather) */
  function seedLive(t, seedOffset){
    const hash = [...t.num].reduce((a,c)=>a+c.charCodeAt(0),0) + seedOffset;
    const rand = (min,max,salt=0)=> min + ((Math.sin(hash*13.37+salt)+1)/2)*(max-min);
    return {
      speed: Math.round(rand(70, t.maxSpeed-8, 1)),
      delayMin: Math.round(rand(-2, 22, 2)),
      progress: rand(0.12, 0.86, 3),
      congestion: Math.round(rand(28, 88, 4)),
      humidity: Math.round(rand(38, 78, 5)),
      rain: Math.round(rand(2, 55, 6)),
      weather: rand(0,1,7) > 0.7 ? "🌧️" : rand(0,1,8) > 0.5 ? "⛅" : "☀️",
      weatherDesc: rand(0,1,7) > 0.7 ? "Light rain ahead" : rand(0,1,8) > 0.5 ? "Partly cloudy" : "Clear track",
      aheadGap: Number(rand(2,9,9).toFixed(1)),
      block: "Section " + (Math.floor(rand(1,9,10))) + " – Down Line",
    };
  }

  function loadTrains(){
    let trains = read(TABLES.trains, null);
    if(!trains){
      trains = SEED_TRAINS.map((t,i)=> ({ ...t, live: seedLive(t,i) }));
      write(TABLES.trains, trains);
    }
    return trains;
  }

  function saveTrains(trains){ write(TABLES.trains, trains); }

  function loadPrefs(){
    return { ...DEFAULT_PREFS, ...read(TABLES.prefs, {}) };
  }
  function savePrefs(prefs){ write(TABLES.prefs, prefs); }

  function pushSearchHistory(term){
    if(!term) return;
    const hist = read(TABLES.searchHistory, []);
    const next = [term, ...hist.filter(h=>h!==term)].slice(0, 8);
    write(TABLES.searchHistory, next);
  }
  function getSearchHistory(){ return read(TABLES.searchHistory, []); }

  return {
    loadTrains, saveTrains,
    loadPrefs, savePrefs,
    pushSearchHistory, getSearchHistory,
    STATION_COORDS,
  };
})();
