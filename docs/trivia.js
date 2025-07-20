function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadQuestion() {
    const qEl = document.getElementById('question');
    const aEl = document.getElementById('answers');
    qEl.textContent = 'Loading...';
    aEl.innerHTML = '';
    fetch('https://opentdb.com/api.php?amount=1&type=multiple')
        .then(r => r.json())
        .then(data => {
            const q = data.results[0];
            qEl.innerHTML = q.question;
            const answers = shuffle([q.correct_answer, ...q.incorrect_answers]);
            answers.forEach(ans => {
                const btn = document.createElement('button');
                btn.textContent = ans;
                btn.onclick = () => {
                    alert(ans === q.correct_answer ? 'Correct!' : 'Wrong!');
                };
                aEl.appendChild(btn);
            });
        })
        .catch(err => {
            qEl.textContent = 'Failed to load question.';
            console.error(err);
        });
}

document.getElementById('next-question').addEventListener('click', loadQuestion);

// load first question on page load
loadQuestion();
