(function(){
    const wizard = document.getElementById('wizard');

    const templates = {
        'Trivia': {color: 3, type:'Trivia'},
        'Creature': {color:4, type:'Creature'},
        'Friend': {color:4, type:'Friend'},
        'Opponent': {color:10, type:'Opponent'},
        'Treasure': {color:1, type:'Treasure'},
        'Other': {color:0, type:'Other'}
    };

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
        const query = buildQuery({
            title:card.title||'',
            description:card.description||'',
            price:card.price||'',
            preview:card.preview||'',
            type:card.type||'',
            color0:card.color
        });
        frame.onload=()=>adjustFrameHeight(frame);
        frame.src = 'index.html'+query+'&view=card';
    }

    function scheduleUpdate(){
        clearTimeout(updateTimer);
        updateTimer=setTimeout(updateFrame,1000);
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
                card=Object.assign({}, templates[t]);
                steps=[showTitle, showDescription];
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
        label.textContent= card.type==='Trivia' ? 'Answer' : 'Description';
        const inp=document.createElement('textarea');
        inp.rows=4;
        inp.value=card.description||'';
        inp.addEventListener('input',()=>{card.description=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons(()=>{current--;showTitle();}, steps.length>current+1 ? next : null, true));
        function next(){current++;steps[current]();}
        scrollTo(inp);
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
        let next=null;
        if(['Treasure','Opponent'].includes(card.type)) next=()=>{current++;showPreview();};
        wizard.appendChild(navButtons(()=>{current--;showDescription();}, next, true));
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
        wizard.appendChild(navButtons(()=>{current--; if(card.type==='Trivia'){showDescription();} else {showPrice();}}, null, true));
        scrollTo(inp);
    }

    function saveFavorite(){
        const params = buildQuery({
            title:card.title||'',
            description:card.description||'',
            price:card.price||'',
            preview:card.preview||'',
            type:card.type||'',
            color0:card.color
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
                title:params.title||'',
                description:params.description||'',
                price:params.price||'',
                preview:params.preview||'',
                type:params.type||'',
                color:params.color0
            };
            if(templates[card.type]){
                steps=[showTitle, showDescription];
                if(card.type!=='Trivia') steps.push(showPrice);
                if(['Treasure','Opponent','Trivia'].includes(card.type)) steps.push(showPreview);
                current=0;
                showTitle();
            } else {
                showTypePicker();
            }
        } else {
            showTypePicker();
        }
    }

    init();
})();
