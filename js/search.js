/* ============================================================
   RailSync — Search Page
   ============================================================ */

const SearchPage = (() => {
  const CHIPS = ["Vande Bharat", "Rajdhani", "Duronto", "Shatabdi", "NDLS", "HWH"];
  let activeChip = null;

  function tagClass(type){ return {vb:'tag-vb', raj:'tag-raj', dur:'tag-dur', sht:'tag-sht'}[type] || 'tag-dur'; }

  function initChips(){
    const row = document.getElementById('chipRow');
    row.innerHTML = CHIPS.map(c=>`<div class="chip" onclick="SearchPage.filterChip('${c}')">${c}</div>`).join('');
  }

  function filterChip(c){
    activeChip = activeChip===c ? null : c;
    document.querySelectorAll('.chip').forEach(el=>el.classList.toggle('active', el.textContent===activeChip));
    render();
  }

  function render(){
    const trains = App.trains;
    const q = (document.getElementById('searchInput').value||'').toLowerCase();

    let results = trains.filter(t=>{
      const matchesQ = !q || t.num.includes(q) || t.name.toLowerCase().includes(q) || t.from.toLowerCase().includes(q) || t.to.toLowerCase().includes(q);
      const matchesChip = !activeChip || t.tag===activeChip || t.from===activeChip || t.to===activeChip;
      return matchesQ && matchesChip;
    });

    if(q) RailSyncDB.pushSearchHistory(q);

    document.getElementById('searchResults').innerHTML = results.map(t=>{
      const late = t.live.delayMin > 5;
      const cheapestClass = Object.keys(t.baseFare)[0];
      return `<div class="train-card" onclick="App.openTrain('${t.num}')">
        <div class="tc-top">
          <span class="tc-tag ${tagClass(t.type)}">${t.tag}</span>
          <span class="tc-num mono">#${t.num}</span>
        </div>
        <div class="tc-name">${t.name}</div>
        <div class="tc-route"><b>${t.from}</b> ${t.fromName} <span class="tc-arrow">→</span> <b>${t.to}</b> ${t.toName}</div>
        <div class="tc-bottom">
          <span class="status-pill ${late?'pill-late':'pill-ontime'}">${late? '+'+t.live.delayMin+'m late' : 'On time'}</span>
          <span class="fare-mini">from <b>₹${t.baseFare[cheapestClass]}</b></span>
        </div>
      </div>`;
    }).join('') || `<div class="empty-state">No trains match "${q}".</div>`;

    const busiest = [...trains].sort((a,b)=>b.live.congestion-a.live.congestion).slice(0,3);
    document.getElementById('congestionList').innerHTML = busiest.map(t=>{
      const color = t.live.congestion>70 ? 'var(--alert)' : t.live.congestion>45 ? 'var(--accent)' : 'var(--live)';
      return `<div class="congestion-card">
        <div class="cg-top"><b>${t.fromName} → ${t.toName}</b><span class="mono" style="color:${color}">${t.live.congestion}%</span></div>
        <div class="cg-track"><div class="cg-fill" style="width:${t.live.congestion}%; background:${color};"></div></div>
        <div class="cg-meta"><span>#${t.num} · ${t.tag}</span><span>${t.live.congestion>70?'Heavy traffic':t.live.congestion>45?'Moderate':'Light'}</span></div>
      </div>`;
    }).join('');
  }

  function init(){
    initChips();
    render();
  }

  return { init, render, filterChip, tagClass };
})();
