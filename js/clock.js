/* ============================================================
   RailSync — Live Clock (IST)
   ============================================================ */

const ClockModule = (() => {
  function tick(){
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hh = String(ist.getHours()).padStart(2,'0');
    const mm = String(ist.getMinutes()).padStart(2,'0');
    const ss = String(ist.getSeconds()).padStart(2,'0');
    const clockEl = document.getElementById('heroClock');
    const dateEl = document.getElementById('heroDate');
    if(clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
    if(dateEl) dateEl.textContent = ist.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  function start(){
    tick();
    setInterval(tick, 1000);
  }
  return { start };
})();
