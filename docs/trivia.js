function loadCard() {
    const frame = document.getElementById('card-frame');
    const msg = document.getElementById('message');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const triviaCards = favorites.filter(q => {
        const query = q.startsWith('?') ? q.substring(1) : q;
        const params = new URLSearchParams(query);
        const type = (params.get('type') || '').toLowerCase();
        return type.includes('trivia');
    });
    if (triviaCards.length === 0) {
        msg.textContent = 'No trivia cards in favorites.';
        frame.style.display = 'none';
        return;
    }
    const sel = triviaCards[Math.floor(Math.random() * triviaCards.length)];
    frame.onload = () => hideEditor(frame);
    frame.src = 'index.html' + sel;
    frame.style.display = 'block';
    msg.textContent = '';
}

function hideEditor(frame) {
    const doc = frame.contentDocument;
    if (!doc) return;
    const selectors = [
        '#main-nav', '#sizes', '#legend', '#download', '#reset',
        '#share', '#favorites', '#addFavorite', '#manage-favorites',
        '#openFontSettings', '#manage-fonts'
    ];
    selectors.forEach(sel => {
        const el = doc.querySelector(sel);
        if (el) el.style.display = 'none';
    });
    const heading = doc.querySelector('#table tr:first-child th[colspan]');
    if (heading) heading.style.display = 'none';
    doc.querySelectorAll('#table tr:nth-child(n+2)').forEach(row => row.style.display = 'none');
    const table = doc.getElementById('table');
    if (table) {
        table.style.margin = '0';
        table.style.width = 'auto';
    }
    doc.body.style.margin = '0';
}

document.getElementById('next-card').addEventListener('click', loadCard);

// load a card on page load
window.addEventListener('DOMContentLoaded', loadCard);
