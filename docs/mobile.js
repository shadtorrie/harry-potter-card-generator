// Simple step-based navigation for mobile card generator
window.addEventListener('DOMContentLoaded', function () {
    const steps = Array.from(document.querySelectorAll('#table tr[data-step]'));
    let current = 0;
    const prevBtn = document.getElementById('step-prev');
    const nextBtn = document.getElementById('step-next');
    function showStep() {
        steps.forEach((row, i) => {
            row.classList.toggle('active', i === current);
        });
        if (prevBtn) prevBtn.style.display = current === 0 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.textContent = current === steps.length - 1 ? 'Finish' : 'Next';
    }
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => { if (current > 0) { current--; showStep(); } });
        nextBtn.addEventListener('click', () => {
            if (current < steps.length - 1) {
                current++; showStep();
            } else {
                document.getElementById('mobile-navigation').style.display = 'none';
                document.getElementById('mobile-final').style.display = 'block';
            }
        });
    }
    const advancedBtn = document.getElementById('mobile-advanced');
    if (advancedBtn) {
        advancedBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'index.html' + window.location.search;
        });
    }
    const saveBtn = document.getElementById('mobile-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            if (window.myFavorites && typeof window.myFavorites.add === 'function') {
                window.myFavorites.add(window.location.search);
            }
        });
    }
    showStep();
});
