(function(){
  var el = document.getElementById('asStickyFooter');
  var cl = document.getElementById('asSfClose');
  if (!el || !cl) return;
  setTimeout(function(){ el.classList.add('as-sf--show'); }, 5000);
  cl.addEventListener('click', function(){
    el.classList.remove('as-sf--show');
    setTimeout(function(){ el.style.display='none'; }, 350);
  });
})();
