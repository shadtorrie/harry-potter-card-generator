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
    const url = 'index.html' + sel + (sel.includes('?') ? '&' : '?') + 'view=card';
    frame.src = url;
    frame.style.display = 'block';
    msg.textContent = '';
}

document.getElementById('next-card').addEventListener('click', loadCard);

// load a card on page load
window.addEventListener('DOMContentLoaded', loadCard);
