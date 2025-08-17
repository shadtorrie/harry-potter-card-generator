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
        return '?' + Object.keys(params).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(params[k])).join('&');
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
            size: card.size || 0
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
                steps=[showTitle];
                if(t==='Creature') steps.push(showFeed, showDescription);
                else if(t==='Opponent') steps.push(showHousePoints, showHealth, showDescription);
                else if(t==='Other') steps.push(showDescription, showOtherTypes, showColor);
                else if(t==='Spell') steps.push(showDescription, showSpellTypes);
                else steps.push(showDescription);
                if(card.type!=='Trivia') steps.push(showPrice);
                if(['Treasure','Opponent','Trivia'].includes(card.type)) steps.push(showPreview);
                current=0;
                showTitle();
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
        showTypePicker();
    }

    function prevStep(){
        current--;steps[current]();
    }

    function nextStep(){
        current++;steps[current]();
    }

    function navButtons(backFn,nextFn,includeSave){
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
        if(includeSave){
            const save=document.createElement('button');
            save.textContent='Save';
            save.onclick=saveFavorite;
            div.appendChild(save);
        }
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
        wizard.appendChild(navButtons(resetWizard,()=>{current++;showDescription();}));
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
        wizard.appendChild(navButtons(prevStep, steps.length>current+1 ? nextStep : null, true));
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
        wizard.appendChild(navButtons(()=>{current--;showTitle();}, ()=>{current++;showDescription();}));
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
        wizard.appendChild(navButtons(()=>{current--;showTitle();}, ()=>{current++;showHealth();}));
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
        wizard.appendChild(navButtons(()=>{current--;showHousePoints();}, ()=>{current++;showDescription();}));
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
        wizard.appendChild(navButtons(()=>{current--;showDescription();}, ()=>{current++;showColor();}));
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
        let next=steps.length>current+1?()=>{current++;steps[current]();}:null;
        wizard.appendChild(navButtons(()=>{current--;showOtherTypes();}, next, true));
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
        wizard.appendChild(navButtons(()=>{current--;showDescription();}, ()=>{current++;showPrice();}));
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
        const next = steps.length>current+1 ? nextStep : null;
        wizard.appendChild(navButtons(prevStep, next, true));
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
        wizard.appendChild(navButtons(prevStep, null, true));
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
            size:card.size||0
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
                feed: '', housePoints: '', health: '', extraTypes: [], types: []
            };

            // populate type selections for the 'Other' editor flow
            card.types = []
                .concat((card.type || '').split(' '))
                .concat((card.type2 || '').split(' '))
                .filter(Boolean)
                .map(t => t.charAt(0).toUpperCase() + t.slice(1));

            if(card.type === 'Trivia'){
                steps = [showTitle, showDescription, showPreview];
            } else {
                steps = [showTitle, showDescription, showOtherTypes, showColor, showPrice];
                if(card.preview || ['Treasure','Opponent'].includes(card.type)) steps.push(showPreview);
            }
            current = 0;
            showTitle();
        } else {
            showTypePicker();
        }
    }

    init();
})();
