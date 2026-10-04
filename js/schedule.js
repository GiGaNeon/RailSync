/* ============================================================
   RailSync — Schedule Page
   ============================================================ */

const SchedulePage = (() => {
  function render(){
    document.getElementById('scheduleList').innerHTML = App.trains.map(t=>`
      <div class="sched-card">
        <div class="tc-top" style="margin-bottom:10px;">
          <span class="tc-tag ${SearchPage.tagClass(t.type)}">${t.tag}</span>
          <span class="tc-num mono">#${t.num}</span>
        </div>
        <div class="tc-name" style="margin-bottom:12px;">${t.name}</div>
        <div class="sched-top">
          <div class="sched-time"><div class="t">${t.dep}</div><div class="s">${t.from}</div></div>
          <div class="sched-mid">
            <div class="sched-dur">${t.dist} km</div>
            <div class="sched-line"></div>
          </div>
          <div class="sched-time"><div class="t">${t.arr}</div><div class="s">${t.to}</div></div>
        </div>
        <div class="sched-days"><span>${t.days}</span><span onclick="App.openTrain('${t.num}')" style="color:var(--accent); cursor:pointer;">Track live →</span></div>
      </div>
    `).join('');
  }
  return { render };
})();
