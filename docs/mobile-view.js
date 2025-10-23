(function () {
    const frame = document.getElementById('card-frame');
    const message = document.getElementById('no-card');
    const actions = document.getElementById('mobile-view-actions');
    const editButton = document.getElementById('edit-card');

    function showMessage(text) {
        if (text) {
            message.textContent = text;
        }
        message.classList.remove('hidden');
        frame.classList.add('hidden');
        actions.classList.add('hidden');
        editButton.setAttribute('disabled', 'disabled');
    }

    function adjustFrameHeight() {
        try {
            const doc = frame.contentWindow.document;
            frame.style.height = doc.documentElement.scrollHeight + 'px';
        } catch (err) {
            // Ignore cross-origin errors
        }
    }

    const params = new URLSearchParams(window.location.search);

    if (!params.toString()) {
        showMessage('No card details were provided. Open Favorites to choose a card to view.');
        return;
    }

    const displayParams = new URLSearchParams(params);
    displayParams.set('view', 'card');

    frame.addEventListener('load', adjustFrameHeight);
    frame.src = 'index.html?' + displayParams.toString();
    frame.classList.remove('hidden');
    message.classList.add('hidden');

    const title = (params.get('title') || '').trim();
    if (title) {
        document.title = title + ' – Card Viewer';
    }

    actions.classList.remove('hidden');
    editButton.removeAttribute('disabled');

    const editParams = new URLSearchParams(params);
    editParams.delete('view');
    editParams.delete('edit');
    const editSearch = editParams.toString();
    const editUrl = 'mobile.html' + (editSearch ? '?' + editSearch + '&edit' : '?edit');

    editButton.addEventListener('click', () => {
        window.location.href = editUrl;
    });
})();
