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

    function updateFrame(){
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
        frame.src = 'index.html'+query+'&view=card';
    }

    function createFrame(){
        const f=document.createElement('iframe');
        f.id='card-frame';
        f.style.width='100%';
        f.style.height='250px';
        f.style.border='none';
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
        inp.addEventListener('input',()=>{card.title=inp.value;updateFrame();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons(showTypePicker,()=>{current++;showDescription();}));
        scrollTo(inp);
    }

    function showDescription(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent= card.type==='Trivia' ? 'Answer' : 'Description';
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.description||'';
        inp.addEventListener('input',()=>{card.description=inp.value;updateFrame();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons(showTypePicker, steps.length>current+1 ? next : null, true));
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
        inp.addEventListener('input',()=>{card.price=inp.value;updateFrame();});
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
        inp.addEventListener('input',()=>{card.preview=inp.value;updateFrame();});
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
        favs = favs.filter(f => (getQueryParams(f).title||'') !== (card.title||''));
        favs.push(params);
        localStorage.setItem('favorites', JSON.stringify(favs));
        showTypePicker();
    }

    showTypePicker();
})();
