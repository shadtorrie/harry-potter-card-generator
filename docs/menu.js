(function(){
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('side-menu');
    if(hamburger && menu){
        hamburger.addEventListener('click', () => {
            menu.classList.toggle('open');
        });
        menu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => menu.classList.remove('open'));
        });
    }
})();
