/* ============================================================
   RailSync — Router
   Tiny hash-free page switcher for the four app pages.
   ============================================================ */

const Router = (() => {
  let current = 'search';
  const onEnter = {};

  function register(page, fn){ onEnter[page] = fn; }

  function go(page){
    current = page;
    document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
    const target = document.getElementById('page-'+page);
    if(target) target.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el=>el.classList.toggle('active', el.dataset.p===page));
    window.scrollTo({ top:0, behavior:'instant' in window ? 'instant' : 'auto' });
    if(onEnter[page]) onEnter[page]();
  }

  function currentPage(){ return current; }

  return { go, register, currentPage };
})();
