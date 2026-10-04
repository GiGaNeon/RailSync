/* ============================================================
   RailSync — App Bootstrap
   ============================================================ */

const App = (() => {
  let trains = RailSyncDB.loadTrains();
  let currentTrain = trains.find(t => t.num === "12302") || trains[1] || trains[0];

  function openTrain(num){
    currentTrain = trains.find(t=>t.num===num) || currentTrain;
    Router.go('live');
  }

  function init(){
    SettingsPanel.init();
    ClockModule.start();

    Router.register('search', () => SearchPage.render());
    Router.register('live', () => LivePage.onEnter());
    Router.register('schedule', () => SchedulePage.render());
    Router.register('fare', () => FarePage.render());

    document.getElementById('searchInput').addEventListener('input', SearchPage.render);
    document.querySelectorAll('.nav-btn').forEach(btn=>{
      btn.addEventListener('click', () => Router.go(btn.dataset.p));
    });

    SearchPage.init();
    LivePage.init();
    Router.go('search');
  }

  return {
    get trains(){ return trains; },
    get currentTrain(){ return currentTrain; },
    set currentTrain(t){ currentTrain = t; },
    openTrain,
    init,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
