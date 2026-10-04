/* ============================================================
   RailSync — Theme Settings Sheet Controller
   ============================================================ */

const SettingsPanel = (() => {
  const MODES = [
    { id:'light', label:'Light', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' },
    { id:'dark',  label:'Dark',  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>' },
    { id:'auto',  label:'Auto',  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' },
  ];

  function buildModeRow(){
    const prefs = ThemeManager.getPrefs();
    document.getElementById('modeRow').innerHTML = MODES.map(m=>
      `<button type="button" class="mode-opt ${prefs.theme===m.id?'sel':''}" data-mode="${m.id}">${m.icon}<span>${m.label}</span></button>`
    ).join('');
  }

  function buildSwatches(){
    const prefs = ThemeManager.getPrefs();
    const isPreset = ThemeManager.PRESETS.some(p=>p.h===prefs.accentH && p.s===prefs.accentS && p.l===prefs.accentL);
    const row = document.getElementById('swatchRow');
    row.innerHTML = ThemeManager.PRESETS.map(p=>{
      const sel = prefs.accentH===p.h && prefs.accentS===p.s && prefs.accentL===p.l;
      return `<button type="button" class="swatch ${sel?'sel':''}" title="${p.name}" data-h="${p.h}" data-s="${p.s}" data-l="${p.l}" style="background:hsl(${p.h} ${p.s}% ${p.l}%)"></button>`;
    }).join('') + `
      <label class="swatch-custom" title="Custom color">
        <input type="color" id="customColorInput" value="${hslToHex(prefs.accentH, prefs.accentS, prefs.accentL)}">
        ${isPreset ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2 12 12"/></svg>' : ''}
      </label>`;
  }

  function hslToHex(h,s,l){
    s/=100; l/=100;
    const k = n => (n + h/30) % 12;
    const a = s * Math.min(l, 1-l);
    const f = n => l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
    const toHex = x => Math.round(255*x).toString(16).padStart(2,'0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  function refresh(){
    buildModeRow();
    buildSwatches();
  }

  function open(){
    const backdrop = document.getElementById('sheetBackdrop');
    const sheet = document.getElementById('themeSheet');
    backdrop.style.display = '';
    sheet.style.display = '';
    backdrop.classList.add('open');
    backdrop.classList.add('active');
    sheet.classList.add('open');
    sheet.classList.add('active');
    refresh();
  }
  function close(){
    const backdrop = document.getElementById('sheetBackdrop');
    const sheet = document.getElementById('themeSheet');
    backdrop.classList.remove('open');
    backdrop.classList.remove('active');
    sheet.classList.remove('open');
    sheet.classList.remove('active');
    sheet.style.display = 'none';
    backdrop.style.display = 'none';
  }

  function wire(){
    document.getElementById('openSettingsBtn').addEventListener('click', open);
    document.getElementById('sheetCloseBtn').addEventListener('click', close);
    document.getElementById('sheetBackdrop').addEventListener('click', close);

    document.getElementById('modeRow').addEventListener('click', (e)=>{
      const btn = e.target.closest('.mode-opt');
      if(!btn) return;
      ThemeManager.setMode(btn.dataset.mode);
      refresh();
    });

    document.getElementById('swatchRow').addEventListener('click', (e)=>{
      const btn = e.target.closest('.swatch');
      if(!btn) return;
      ThemeManager.setAccentHSL(Number(btn.dataset.h), Number(btn.dataset.s), Number(btn.dataset.l));
      refresh();
    });

    document.getElementById('swatchRow').addEventListener('input', (e)=>{
      if(e.target.id !== 'customColorInput') return;
      ThemeManager.setAccentHex(e.target.value);
      buildSwatches();
    });
  }

  function init(){
    wire();
  }

  return { init, open, close };
})();
