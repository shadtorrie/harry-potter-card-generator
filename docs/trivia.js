let currentCard = '';

function loadCard() {
    const frame = document.getElementById('card-frame');
    const msg = document.getElementById('message');
    const editBtn = document.getElementById('edit-card');
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
        editBtn.classList.add('hidden');
        return;
    }
    const sel = triviaCards[Math.floor(Math.random() * triviaCards.length)];
    currentCard = sel;
    const url = 'index.html' + sel + (sel.includes('?') ? '&' : '?') + 'view=card';
    frame.onload = () => adjustFrameHeight(frame);
    frame.src = url;
    frame.style.display = 'block';
    editBtn.classList.remove('hidden');
    msg.textContent = '';
}

function adjustFrameHeight(f) {
    try {
        const innerDoc = f.contentWindow.document;
        const table = innerDoc.getElementById('table');
        const h = table ? table.offsetHeight : innerDoc.documentElement.scrollHeight;
        f.style.height = h + 'px';
    } catch (e) {}
}

document.getElementById('next-card').addEventListener('click', loadCard);

document.getElementById('edit-card').addEventListener('click', () => {
    if (currentCard) {
        window.location.href = 'index.html' + currentCard;
    }
});

// load a card on page load
window.addEventListener('DOMContentLoaded', loadCard);
