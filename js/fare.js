/* ============================================================
   RailSync — Fare Estimator Page
   ============================================================ */

const FarePage = (() => {
  let paxCount = 1;
  let selectedClass = null;

  function render(){
    const sel = document.getElementById('fareTrainSelect');
    sel.innerHTML = App.trains.map(t=>`<option value="${t.num}">#${t.num} · ${t.name}</option>`).join('');
    sel.value = App.currentTrain.num;
    selectedClass = Object.keys(App.currentTrain.baseFare)[0];
    update();
  }

  function update(){
    const num = document.getElementById('fareTrainSelect').value;
    const t = App.trains.find(x=>x.num===num);
    App.currentTrain = t;
    const classes = Object.keys(t.baseFare);
    if(!classes.includes(selectedClass)) selectedClass = classes[0];
    document.getElementById('classGrid').innerHTML = classes.map(c=>`
      <div class="class-opt ${c===selectedClass?'sel':''}" onclick="FarePage.pickClass('${c}')">
        ${c}<b>₹${t.baseFare[c]}</b>
      </div>
    `).join('');
    compute();
  }

  function pickClass(c){ selectedClass = c; update(); }
  function changePax(d){
    paxCount = Math.max(1, Math.min(6, paxCount+d));
    document.getElementById('paxCount').textContent = paxCount;
    compute();
  }
  function compute(){
    const t = App.currentTrain;
    const base = t.baseFare[selectedClass];
    const total = base * paxCount;
    document.getElementById('fareAmt').textContent = '₹' + total.toLocaleString('en-IN');
    document.getElementById('fareBrk').textContent = `₹${base} × ${paxCount} passenger${paxCount>1?'s':''} · ${selectedClass} class`;
  }

  return { render, update, pickClass, changePax };
})();
