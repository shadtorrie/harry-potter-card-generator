(function(){
    const wizard = document.getElementById('wizard');

    const templates = {
        'Trivia': {color: 3, type:'Trivia', size:3},
        'Creature': {color:4, type:'Action Companion', type2:'Creature'},
        'Friend': {color:4, type:'Action Companion Legend', type2:'friend'},
        'Opponent': {color:10, type:'Opponent', size:3},
        'Treasure': {color:1, type:'Treasure'},
        'Spell': {color:3, type:'Action Spell'},
        'Other': {color:0, type:'Other'}
    };

    const TYPE_OPTIONS=['Action','Opponent','Spell','Companion','Legend','Treasure','Friend','Creature','House','Strike'];
    const COLOR_OPTIONS=['Action/Event','Treasure','Victory','Spell','Companion','Reserve','Potion','Shelter','Ruins','Landmark','Opponent','Boon','Hex','State','Artifact','Project','Way','Ally','Trait','Prophecy','Gryffindor','Slytherin','Ravenclaw','Hufflepuff'];

    let card = {};
    let steps = [];
    let current = 0;
    let editing = false;
    let originalQuery = '';

    function buildQuery(params){
        const entries = Object.keys(params)
            .filter(k => params[k] !== undefined && params[k] !== null)
            .map(k => encodeURIComponent(k)+'='+encodeURIComponent(params[k]));
        return '?' + entries.join('&');
    }

    function getQueryParams(qs){
        qs = qs.split('+').join(' ');
        let params = {}, tokens,
            re = /[?&]?([^&=]+)=?([^&]*)/g;
        while(tokens = re.exec(qs)){
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
        return params;
    }

    let updateTimer;

    function scheduleUpdate(){
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateFrame, 200);
    }

    function updateFrame(){
        clearTimeout(updateTimer);
        const frame = document.getElementById('card-frame');
        if(!frame) return;
        let desc = card.description || '';
        if(card.feed && card.type2 === 'Creature'){
            desc = (card.description || '') + '\n-\nAt the end of your turn feed this ' + card.feed + '& or discard it.';
        }
        if(card.type === 'Opponent'){
            desc = '';
            if(card.housePoints) desc += card.housePoints + '%';
            if(card.health){ if(desc) desc += '\n'; desc += card.health + '~'; }
            if(card.description){ if(desc) desc += '\n'; desc += card.description; }
        }
        const query = buildQuery({
            title: card.title || '',
            description: desc,
            price: card.price || '',
            preview: card.preview || '',
            type: card.type || '',
            type2: card.type2 || '',
            color0: card.color,
            size: card.size || 0,
            feed: card.feed || '',
            housePoints: card.housePoints || '',
            health: card.health || '',
            template: card.template || ''
        });
        frame.onload = () => adjustFrameHeight(frame);
        frame.src = 'index.html' + query + '&view=card';
    }
    function adjustFrameHeight(f){
        try {
            f.style.height = f.contentWindow.document.documentElement.scrollHeight + 'px';
        } catch (e) {}
    }

    function createFrame(){
        const f=document.createElement('iframe');
        f.id='card-frame';
        f.style.width='100%';
        f.style.border='none';
        f.style.display='block';
        f.onload=()=>adjustFrameHeight(f);
        return f;
    }

    function scrollTo(el){
        setTimeout(()=>{ el.focus(); el.scrollIntoView({behavior:'smooth',block:'center'}); },100);
    }

    function showTypePicker(){
        wizard.innerHTML='';
        const h=document.createElement('h2');
        h.textContent='What type of card would you like to make?';
        const grid=document.createElement('div');
        grid.className='grid';
        Object.keys(templates).forEach(t=>{
            const b=document.createElement('button');
            b.textContent=t;
            b.addEventListener('click',()=>{
                card=Object.assign({feed:'',housePoints:'',health:'',extraTypes:[],types:[]}, templates[t]);
                card.template = t;
                card.color = (card.color !== undefined && card.color !== null) ? String(card.color) : '0';
                card.size = card.size || 0;
                steps = buildStepsForCard();
                goToStep(0);
            });
            grid.appendChild(b);
        });
        wizard.appendChild(h);
        wizard.appendChild(grid);
    }

    function resetWizard(){
        card={};
        steps=[];
        current=0;
        editing=false;
        originalQuery='';
        showTypePicker();
    }

    function inferTemplateFromCard(){
        if(card.template) return card.template;
        const type = (card.type || '').toLowerCase();
        const type2 = (card.type2 || '').toLowerCase();
        for(const key of Object.keys(templates)){
            const tpl = templates[key];
            const tplType = (tpl.type || '').toLowerCase();
            const tplType2 = (tpl.type2 || '').toLowerCase();
            if(tplType === type && (tplType2 || '') === type2){
                return key;
            }
        }
        if(type2 === 'creature') return 'Creature';
        if(type === 'opponent') return 'Opponent';
        if(type.includes('spell')) return 'Spell';
        if(type.includes('treasure')) return 'Treasure';
        if(type.includes('trivia')) return 'Trivia';
        if(type.includes('friend')) return 'Friend';
        return 'Other';
    }

    function buildStepsForCard(){
        card.template = inferTemplateFromCard();
        const order=[showTitle];
        switch(card.template){
            case 'Creature':
                order.push(showFeed, showDescription);
                break;
            case 'Opponent':
                order.push(showHousePoints, showHealth, showDescription);
                break;
            case 'Other':
                order.push(showDescription, showOtherTypes, showColor);
                break;
            case 'Spell':
                order.push(showDescription, showSpellTypes);
                break;
            default:
                order.push(showDescription);
                break;
        }
        if(card.type !== 'Trivia'){
            order.push(showPrice);
        }
        if(['Treasure','Opponent','Trivia'].includes(card.type)){
            order.push(showPreview);
        }
        return order;
    }

    function goToStep(index){
        current = index;
        steps[current]();
    }

    function prevStep(){
        if(current === 0){
            resetWizard();
        } else {
            goToStep(current - 1);
        }
    }

    function nextStep(){
        if(current < steps.length - 1){
            goToStep(current + 1);
        }
    }

    function navButtons(backFn=prevStep,nextFn){
        if(nextFn === undefined){
            nextFn = current < steps.length - 1 ? nextStep : null;
        }
        const div=document.createElement('div');
        div.className='buttons';
        const back=document.createElement('button');
        back.textContent='Back';
        back.onclick=backFn;
        div.appendChild(back);
        if(nextFn){
            const next=document.createElement('button');
            next.textContent='Next';
            next.onclick=nextFn;
            div.appendChild(next);
        }
        const save=document.createElement('button');
        save.textContent='Save';
        save.onclick=saveFavorite;
        div.appendChild(save);
        return div;
    }

    function showTitle(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent= card.type==='Trivia' ? 'Question' : 'Title';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.title||'';
        inp.addEventListener('input',()=>{card.title=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
    }

    function showDescription(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        let lbl='Description';
        if(card.type==='Trivia') lbl='Answer';
        else if(card.type==='Opponent') lbl='Attack';
        label.textContent=lbl;
        const inp=document.createElement('textarea');
        inp.rows=4;
        inp.value=card.description||'';
        inp.addEventListener('input',()=>{card.description=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
}

    function showFeed(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='How much does it need to be fed?';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.feed||'';
        inp.addEventListener('input',()=>{card.feed=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
    }

    function showHousePoints(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='House Point Value';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.housePoints||'';
        inp.addEventListener('input',()=>{card.housePoints=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
    }

    function showHealth(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Health';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.health||'';
        inp.addEventListener('input',()=>{card.health=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
    }

    function showOtherTypes(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Card Types';
        const div=document.createElement('div');
        div.className='grid';
        if(!card.types) card.types=[];
        TYPE_OPTIONS.forEach(t=>{
            const btn=document.createElement('button');
            btn.textContent=t;
            function upd(){card.types.includes(t)?btn.classList.add('selected'):btn.classList.remove('selected');}
            btn.addEventListener('click',()=>{
                if(card.types.includes(t)) card.types=card.types.filter(x=>x!==t); else card.types.push(t);
                const ordered=TYPE_OPTIONS.filter(x=>card.types.includes(x));
                card.type=ordered.slice(0,2).join(' ');
                card.type2=ordered.slice(2).join(' ');
                upd();
                scheduleUpdate();
            });
            upd();
            div.appendChild(btn);
        });
        wizard.appendChild(label);
        wizard.appendChild(div);
        wizard.appendChild(navButtons());
        scrollTo(div);
    }

    function showColor(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Color';
        const sel=document.createElement('select');
        COLOR_OPTIONS.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c;sel.appendChild(o);});
        sel.value=card.color;
        sel.addEventListener('change',()=>{card.color=sel.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(sel);
        wizard.appendChild(navButtons());
        scrollTo(sel);
    }

    function showSpellTypes(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Types';
        const div=document.createElement('div');
        div.className='grid';
        if(!card.extraTypes) card.extraTypes=[];
        TYPE_OPTIONS.forEach(t=>{
            const btn=document.createElement('button');
            btn.textContent=t;
            function upd(){card.extraTypes.includes(t)?btn.classList.add('selected'):btn.classList.remove('selected');}
            btn.addEventListener('click',()=>{
                if(card.extraTypes.includes(t)) card.extraTypes=card.extraTypes.filter(x=>x!==t); else card.extraTypes.push(t);
                const ordered=['Action','Spell'].concat(card.extraTypes.filter(x=>!['Action','Spell'].includes(x)));
                card.type=ordered.slice(0,2).join(' ');
                card.type2=ordered.slice(2).join(' ');
                upd();
                scheduleUpdate();
            });
            upd();
            div.appendChild(btn);
        });
        wizard.appendChild(label);
        wizard.appendChild(div);
        wizard.appendChild(navButtons());
        scrollTo(div);
    }

    function showPrice(){
        if(card.type==='Trivia'){ showPreview(); return; }
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Price';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.price||'';
        inp.addEventListener('input',()=>{card.price=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons());
        scrollTo(inp);
    }

    function showPreview(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        let prefix='';
        if(card.type==='Treasure'){label.textContent='Value';prefix='$';}
        else if(card.type==='Opponent'){label.textContent='Defeated value';prefix='%';}
        else {label.textContent='Difficulty';prefix='*';}
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.preview||prefix;
        inp.addEventListener('input',()=>{card.preview=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons(prevStep, null));
        scrollTo(inp);
    }

    function saveFavorite(){
        let desc = card.description || '';
        if(card.feed && card.type2==='Creature'){
            desc = (card.description||'') + '\n-\nAt the end of your turn feed this ' + card.feed + '& or discard it.';
        }
        if(card.type==='Opponent'){
            desc = '';
            if(card.housePoints) desc += card.housePoints + '%';
            if(card.health){ if(desc) desc += '\n'; desc += card.health + '~'; }
            if(card.description){ if(desc) desc += '\n'; desc += card.description; }
        }
        const params = buildQuery({
            title:card.title||'',
            description:desc,
            price:card.price||'',
            preview:card.preview||'',
            type:card.type||'',
            type2:card.type2||'',
            color0:card.color,
            size:card.size||0,
            feed:card.feed||'',
            housePoints:card.housePoints||'',
            health:card.health||'',
            template:card.template||''
        });
        let data = localStorage.getItem('favorites');
        let favs = data? JSON.parse(data):[];
        if(editing){
            if(confirm('Overwrite the previous card? Click Cancel to save as new.')){
                favs = favs.filter(f => f !== ('?' + originalQuery) && f !== originalQuery);
            }
        } else {
            favs = favs.filter(f => (getQueryParams(f).title||'') !== (card.title||''));
        }
        favs.push(params);
        localStorage.setItem('favorites', JSON.stringify(favs));
        resetWizard();
    }

    function init(){
        const params = getQueryParams(window.location.search);
        if(params.edit !== undefined){
            editing = true;
            delete params.edit;
            originalQuery = Object.keys(params).length ? buildQuery(params).substring(1) : '';
            card = {
                title: params.title || '',
                description: params.description || '',
                price: params.price || '',
                preview: params.preview || '',
                type: params.type || '',
                type2: params.type2 || '',
                color: params.color0,
                size: params.size || 0,
                feed: params.feed || '',
                housePoints: params.housePoints || '',
                health: params.health || '',
                extraTypes: [],
                types: [],
                template: params.template
            };

            const parts = []
                .concat((card.type || '').split(' '))
                .concat((card.type2 || '').split(' '))
                .filter(Boolean)
                .map(t => t.charAt(0).toUpperCase() + t.slice(1));
            card.types = parts.slice();
            card.extraTypes = parts.filter(t => !['Action','Spell'].includes(t));

            const inferredTemplate = card.template || inferTemplateFromCard();
            card.template = inferredTemplate;
            const tpl = templates[inferredTemplate] || {};
            if(card.color === undefined || card.color === null || card.color === ''){
                card.color = tpl.color !== undefined ? String(tpl.color) : '0';
            } else {
                card.color = String(card.color);
            }
            card.size = card.size || 0;

            steps = buildStepsForCard();
            goToStep(0);
        } else {
            showTypePicker();
        }
    }

    init();
})();
