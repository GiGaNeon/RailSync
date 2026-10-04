/* ============================================================
   RailSync — Theme Manager
   Handles: dark / light / auto (follows OS) mode switching, and
   a user-customizable accent color (preset swatches + a native
   color picker for any custom hex). Preferences persist through
   RailSyncDB so they survive reloads.
   ============================================================ */

const ThemeManager = (() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const PRESETS = [
    { name:'Signal Orange', h:25,  s:100, l:50 },
    { name:'Rail Teal',     h:172, s:66,  l:48 },
    { name:'Alert Rose',    h:346, s:100, l:65 },
    { name:'Electric Blue', h:217, s:91,  l:60 },
    { name:'Violet Line',   h:262, s:83,  l:66 },
    { name:'Meadow Green',  h:142, s:60,  l:45 },
  ];

  let prefs = RailSyncDB.loadPrefs();

  function effectiveMode(){
    if(prefs.theme === 'auto') return media.matches ? 'dark' : 'light';
    return prefs.theme;
  }

  function applyAccent(){
    root.style.setProperty('--accent-h', prefs.accentH);
    root.style.setProperty('--accent-s', prefs.accentS + '%');
    root.style.setProperty('--accent-l', prefs.accentL + '%');
  }

  function applyMode(){
    root.setAttribute('data-theme', effectiveMode());
  }

  function apply(){
    applyMode();
    applyAccent();
  }

  function setMode(mode){
    prefs.theme = mode;
    RailSyncDB.savePrefs(prefs);
    apply();
    document.dispatchEvent(new CustomEvent('railsync:theme-changed'));
  }

  function setAccentHSL(h,s,l){
    prefs.accentH = h; prefs.accentS = s; prefs.accentL = l;
    RailSyncDB.savePrefs(prefs);
    applyAccent();
    document.dispatchEvent(new CustomEvent('railsync:theme-changed'));
  }

  function setAccentHex(hex){
    const { h, s, l } = hexToHsl(hex);
    setAccentHSL(Math.round(h), Math.round(s), Math.round(l));
  }

  function hexToHsl(hex){
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0,2),16)/255;
    const g = parseInt(hex.substring(2,4),16)/255;
    const b = parseInt(hex.substring(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if(max===min){ h=0; s=0; }
    else{
      const d = max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h *= 60;
    }
    return { h, s: s*100, l: l*100 };
  }

  media.addEventListener('change', () => { if(prefs.theme==='auto') applyMode(); });

  apply();

  return {
    PRESETS,
    getPrefs: () => ({ ...prefs }),
    effectiveMode,
    setMode,
    setAccentHSL,
    setAccentHex,
  };
})();

const themeSheet = document.getElementById('themeSheet');
const sheetBackdrop = document.getElementById('sheetBackdrop');
const closeBtn = document.getElementById('sheetCloseBtn');

function setPanelVisible(visible) {
  themeSheet.classList.toggle('open', visible);
  themeSheet.classList.toggle('active', visible);
  sheetBackdrop.classList.toggle('open', visible);
  sheetBackdrop.classList.toggle('active', visible);
  themeSheet.style.display = visible ? '' : 'none';
  sheetBackdrop.style.display = visible ? '' : 'none';
}

function closePanel(e) {
  if (e) e.stopPropagation();
  setPanelVisible(false);
}

closeBtn.addEventListener('click', closePanel);
sheetBackdrop.addEventListener('click', closePanel);