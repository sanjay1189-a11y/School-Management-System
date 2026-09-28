/* Phase 8 — final UX polish. No business logic is changed here. */
(function(){
  function currentUser(){return window.EduAuth?.currentUser?.()||{};}
  function initials(name){return String(name||'User').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'U';}
  function syncUserUI(){
    const u=currentUser();
    document.querySelectorAll('.user-name').forEach(el=>el.textContent=u.name||'Admin User');
    document.querySelectorAll('.user-role').forEach(el=>el.textContent=u.role||'Administrator');
    document.querySelectorAll('.user-initials').forEach(el=>el.textContent=initials(u.name));
  }
  function setupMobile(){
    const sidebar=document.getElementById('sidebar'), menu=document.getElementById('mobileMenu'), overlay=document.getElementById('sidebarOverlay');
    if(!sidebar||!menu||!overlay)return;
    const close=()=>{sidebar.classList.remove('open');overlay.style.display='none';overlay.setAttribute('aria-hidden','true');};
    const open=()=>{sidebar.classList.add('open');overlay.style.display='block';overlay.setAttribute('aria-hidden','false');};
    menu.onclick=()=>sidebar.classList.contains('open')?close():open();
    overlay.onclick=close;
    document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',close));
    window.addEventListener('resize',()=>{if(window.innerWidth>760)close();});
  }
  function setupModalAccessibility(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        const root=document.getElementById('modalRoot');
        if(root && root.innerHTML.trim()){
          if(typeof window.closeModal==='function')window.closeModal();
          return;
        }
        const sidebar=document.getElementById('sidebar');
        if(sidebar?.classList.contains('open')){sidebar.classList.remove('open');const o=document.getElementById('sidebarOverlay');if(o)o.style.display='none';}
      }
    });
  }
  function setupExternalSafety(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('button');
      if(!btn)return;
      if(btn.type!=='submit' && btn.closest('.modal-actions') && btn.dataset.busy==='1')e.preventDefault();
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{syncUserUI();setupMobile();setupModalAccessibility();setupExternalSafety();});
  window.addEventListener('storage',()=>syncUserUI());
})();
