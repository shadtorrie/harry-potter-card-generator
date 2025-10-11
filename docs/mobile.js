(function(){
    const wizard = document.getElementById('wizard');

    const templates = {
        'Trivia': { color: 3, type: 'Trivia', size: 3 },
        'Creature': { color: 4, type: 'Action Companion', type2: 'Creature' },
        'Friend': { color: 4, type: 'Action Companion Legend', type2: 'friend' },
        'Opponent': { color: 10, type: 'Opponent', size: 3 },
        'Treasure': { color: 1, type: 'Treasure' },
        'Spell': { color: 3, type: 'Action Spell' },
        'Other': { color: 0, type: 'Other' }
    };

    const TYPE_OPTIONS = ['Action', 'Opponent', 'Spell', 'Companion', 'Legend', 'Treasure', 'Friend', 'Creature', 'House', 'Strike'];
    const COLOR_OPTIONS = ['Action/Event', 'Treasure', 'Victory', 'Spell', 'Companion', 'Reserve', 'Potion', 'Shelter', 'Ruins', 'Landmark', 'Opponent', 'Boon', 'Hex', 'State', 'Artifact', 'Project', 'Way', 'Ally', 'Trait', 'Prophecy', 'Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];
    const SIZE_OPTIONS = [
        { value: '0', label: 'Portrait (Standard Card)' },
        { value: '1', label: 'Landscape (Event/Spell)' },
        { value: '2', label: 'Double Sided' },
        { value: '3', label: 'Base Card' },
        { value: '4', label: 'Pile Marker' },
        { value: '5', label: 'Player Mat' },
        { value: '6', label: 'Trivia' }
    ];

    const COLOR_SPLIT_OPTIONS = [
        { value: '18', label: 'Smaller Top' },
        { value: '1', label: 'Half' },
        { value: '19', label: 'Smaller Bottom' },
        { value: '12', label: 'Blend Night' },
        { value: '27', label: 'Half Action' }
    ];

    let card = {};
    let steps = [];
    let current = 0;
    let editing = false;
    let originalQuery = '';

    function buildQuery(params){
        const entries = [];
        Object.keys(params).forEach(key => {
            const value = params[key];
            if(value === undefined || value === null) return;
            entries.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        });
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

    function createBaseCardState(){
        return {
            title: '',
            title2: '',
            description: '',
            description2: '',
            price: '',
            preview: '',
            type: '',
            type2: '',
            color: '0',
            color1: '',
            colorSplit: '1',
            size: '0',
            feed: '',
            housePoints: '',
            health: '',
            extraTypes: [],
            types: [],
            boldkeys: '',
            customIcon: '',
            picture: '',
            pictureX: '0',
            pictureY: '0',
            pictureZoom: '1',
            expansion: '',
            credit: '',
            creator: '',
            traveller: false,
            trait: false
        };
    }

    function createCardFromTemplate(name){
        const template = templates[name] || {};
        const state = createBaseCardState();
        Object.assign(state, template);
        if(state.color !== undefined) state.color = String(state.color);
        if(state.size !== undefined) state.size = String(state.size);
        if(!state.extraTypes) state.extraTypes = [];
        if(!state.types) state.types = [];
        return state;
    }

    let updateTimer;

    function scheduleUpdate(){
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateFrame, 150);
    }

    function getCardParams(){
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

        const params = {
            title: card.title || '',
            title2: card.title2 || '',
            description: desc,
            description2: card.description2 || '',
            price: card.price || '',
            preview: card.preview || '',
            type: card.type || '',
            type2: card.type2 || '',
            color0: card.color !== undefined ? card.color : '0',
            size: card.size !== undefined ? card.size : '0'
        };

        if(card.color1) params.color1 = card.color1;
        if(card.colorSplit && card.color1) params.color2split = card.colorSplit;
        if(card.boldkeys) params.boldkeys = card.boldkeys;
        if(card.customIcon) params['custom-icon'] = card.customIcon;
        if(card.picture) params.picture = card.picture;
        if(card.pictureX) params['picture-x'] = card.pictureX;
        if(card.pictureY) params['picture-y'] = card.pictureY;
        if(card.pictureZoom) params['picture-zoom'] = card.pictureZoom;
        if(card.expansion) params.expansion = card.expansion;
        if(card.credit) params.credit = card.credit;
        if(card.creator) params.creator = card.creator;
        if(card.traveller) params.traveller = 'true';
        if(card.trait) params.trait = 'true';

        return params;
    }

    function updateFrame(){
        clearTimeout(updateTimer);
        const frame = document.getElementById('card-frame');
        if(!frame) return;
        const query = buildQuery(getCardParams());
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
                card = createCardFromTemplate(t);
                steps=[showTitle];
                if(t==='Creature') steps.push(showFeed, showDescription);
                else if(t==='Opponent') steps.push(showHousePoints, showHealth, showDescription);
                else if(t==='Other') {
                    steps = [
                        showTitle,
                        showDescription,
                        showSecondaryText,
                        showOtherTypes,
                        showSize,
                        showColor,
                        showBoldKeywords,
                        showImageOptions,
                        showCredits,
                        showPrice,
                        showPreview
                    ];
                }
                else if(t==='Spell') steps.push(showDescription, showSpellTypes);
                else steps.push(showDescription);
                if(t!=='Other'){
                    if(card.type!=='Trivia') steps.push(showPrice);
                    if(['Treasure','Opponent','Trivia'].includes(card.type)) steps.push(showPreview);
                }
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
        editing=false;
        originalQuery='';
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
        wizard.appendChild(navButtons(resetWizard,()=>{current++;steps[current]();}));
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

    function showSecondaryText(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const intro=document.createElement('p');
        intro.textContent='Add optional text for the reverse side of double cards.';
        const titleLabel=document.createElement('p');
        titleLabel.textContent='Back Title';
        const titleInput=document.createElement('input');
        titleInput.type='text';
        titleInput.value=card.title2||'';
        titleInput.addEventListener('input',()=>{card.title2=titleInput.value;scheduleUpdate();});

        const descLabel=document.createElement('p');
        descLabel.textContent='Back Description';
        const descInput=document.createElement('textarea');
        descInput.rows=4;
        descInput.value=card.description2||'';
        descInput.addEventListener('input',()=>{card.description2=descInput.value;scheduleUpdate();});

        wizard.appendChild(intro);
        wizard.appendChild(titleLabel);
        wizard.appendChild(titleInput);
        wizard.appendChild(descLabel);
        wizard.appendChild(descInput);
        wizard.appendChild(navButtons(prevStep, steps.length>current+1 ? nextStep : null, true));
        scrollTo(titleInput);
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
                updateTypeFromSelections();
                upd();
            });
            upd();
            div.appendChild(btn);
        });
        const typeInputs=document.createElement('div');
        const typeLabel=document.createElement('p');
        typeLabel.textContent='Manual Type Lines';
        const typeInput1=document.createElement('input');
        typeInput1.type='text';
        typeInput1.value=card.type||'';
        typeInput1.addEventListener('input',()=>{card.type=typeInput1.value;scheduleUpdate();});
        const typeInput2=document.createElement('input');
        typeInput2.type='text';
        typeInput2.value=card.type2||'';
        typeInput2.addEventListener('input',()=>{card.type2=typeInput2.value;scheduleUpdate();});

        function updateTypeFromSelections(){
            const ordered=TYPE_OPTIONS.filter(x=>card.types.includes(x));
            card.type=ordered.slice(0,2).join(' ');
            card.type2=ordered.slice(2).join(' ');
            typeInput1.value=card.type;
            typeInput2.value=card.type2;
            scheduleUpdate();
        }

        const toggles=document.createElement('div');
        toggles.className='toggles';
        const travellerLabel=document.createElement('label');
        const travellerInput=document.createElement('input');
        travellerInput.type='checkbox';
        travellerInput.checked=!!card.traveller;
        travellerInput.addEventListener('change',()=>{card.traveller=travellerInput.checked;scheduleUpdate();});
        travellerLabel.appendChild(travellerInput);
        travellerLabel.appendChild(document.createTextNode(' Traveller'));

        const traitLabel=document.createElement('label');
        const traitInput=document.createElement('input');
        traitInput.type='checkbox';
        traitInput.checked=!!card.trait;
        traitInput.addEventListener('change',()=>{card.trait=traitInput.checked;scheduleUpdate();});
        traitLabel.appendChild(traitInput);
        traitLabel.appendChild(document.createTextNode(' Trait'));

        toggles.appendChild(travellerLabel);
        toggles.appendChild(traitLabel);

        wizard.appendChild(label);
        wizard.appendChild(div);
        wizard.appendChild(typeLabel);
        typeInputs.appendChild(typeInput1);
        typeInputs.appendChild(typeInput2);
        wizard.appendChild(typeInputs);
        wizard.appendChild(toggles);
        wizard.appendChild(navButtons(()=>{current--;steps[current]();}, ()=>{current++;showSize();}));
        scrollTo(div);
    }

    function showSize(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const label=document.createElement('p');
        label.textContent='Select Card Layout';
        const sel=document.createElement('select');
        SIZE_OPTIONS.forEach(opt=>{
            const option=document.createElement('option');
            option.value=opt.value;
            option.textContent=opt.label;
            sel.appendChild(option);
        });
        sel.value=card.size||'0';
        sel.addEventListener('change',()=>{card.size=sel.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(sel);
        wizard.appendChild(navButtons(()=>{current--;showOtherTypes();}, ()=>{current++;showColor();}));
        scrollTo(sel);
    }

    function showColor(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const primaryLabel=document.createElement('p');
        primaryLabel.textContent='Primary Color';
        const primary=document.createElement('select');
        COLOR_OPTIONS.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=c;primary.appendChild(o);});
        primary.value=card.color||'0';
        primary.addEventListener('change',()=>{card.color=primary.value;scheduleUpdate();});

        const secondaryLabel=document.createElement('p');
        secondaryLabel.textContent='Secondary Color';
        const secondary=document.createElement('select');
        const same=document.createElement('option');
        same.value='';
        same.textContent='Same as primary';
        secondary.appendChild(same);
        COLOR_OPTIONS.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=c;secondary.appendChild(o);});
        secondary.value=card.color1||'';
        secondary.addEventListener('change',()=>{card.color1=secondary.value;scheduleUpdate();toggleSplit();});

        const splitWrapper=document.createElement('div');
        const splitLabel=document.createElement('p');
        splitLabel.textContent='Secondary Color Layout';
        const splitSelect=document.createElement('select');
        COLOR_SPLIT_OPTIONS.forEach(opt=>{const o=document.createElement('option');o.value=opt.value;o.textContent=opt.label;splitSelect.appendChild(o);});
        splitSelect.value=card.colorSplit||'1';
        splitSelect.addEventListener('change',()=>{card.colorSplit=splitSelect.value;scheduleUpdate();});
        splitWrapper.appendChild(splitLabel);
        splitWrapper.appendChild(splitSelect);

        function toggleSplit(){
            splitWrapper.style.display = card.color1 ? 'block' : 'none';
        }
        toggleSplit();

        wizard.appendChild(primaryLabel);
        wizard.appendChild(primary);
        wizard.appendChild(secondaryLabel);
        wizard.appendChild(secondary);
        wizard.appendChild(splitWrapper);

        let next=steps.length>current+1?()=>{current++;steps[current]();}:null;
        wizard.appendChild(navButtons(()=>{current--;showSize();}, next, true));
        scrollTo(primary);
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
        wizard.appendChild(navButtons(prevStep, next, !next));
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
        else if(card.type==='Trivia'){label.textContent='Difficulty';prefix='*';}
        else {label.textContent='Preview';prefix='';}
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=card.preview||prefix;
        inp.addEventListener('input',()=>{card.preview=inp.value;scheduleUpdate();});
        wizard.appendChild(label);
        wizard.appendChild(inp);
        wizard.appendChild(navButtons(prevStep, null, true));
        scrollTo(inp);
    }

    function createLabeledInput(labelText, inputElement){
        const label=document.createElement('p');
        label.textContent=labelText;
        wizard.appendChild(label);
        wizard.appendChild(inputElement);
    }

    function showBoldKeywords(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        const input=document.createElement('input');
        input.type='text';
        input.placeholder='Additional boldable keywords; separated by semicolons';
        input.value=card.boldkeys||'';
        input.addEventListener('input',()=>{card.boldkeys=input.value;scheduleUpdate();});
        createLabeledInput('Additional Bold Keywords', input);
        wizard.appendChild(navButtons(prevStep, steps.length>current+1 ? nextStep : null, true));
        scrollTo(input);
    }

    function showImageOptions(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();

        const iconInput=document.createElement('input');
        iconInput.type='url';
        iconInput.placeholder='http://example.com/icon.png';
        iconInput.value=card.customIcon||'';
        iconInput.addEventListener('input',()=>{card.customIcon=iconInput.value;scheduleUpdate();});
        createLabeledInput('Custom Icon URL', iconInput);

        const pictureInput=document.createElement('input');
        pictureInput.type='url';
        pictureInput.placeholder='http://example.com/image.jpg';
        pictureInput.value=card.picture||'';
        pictureInput.addEventListener('input',()=>{card.picture=pictureInput.value;scheduleUpdate();});
        createLabeledInput('Illustration URL', pictureInput);

        const positionContainer=document.createElement('div');
        positionContainer.className='position-inputs';

        function createNumberInput(value, min, max, step, onChange){
            const input=document.createElement('input');
            input.type='number';
            if(min!==undefined) input.min=min;
            if(max!==undefined) input.max=max;
            if(step!==undefined) input.step=step;
            input.value=value;
            input.addEventListener('input',()=>{ onChange(input.value); scheduleUpdate();});
            return input;
        }

        const posX=createNumberInput(card.pictureX||'0','-1','1','0.01',val=>card.pictureX=val);
        const posY=createNumberInput(card.pictureY||'0','-1','1','0.01',val=>card.pictureY=val);
        const zoom=createNumberInput(card.pictureZoom||'1','0','3','0.1',val=>card.pictureZoom=val);

        const posXLabel=document.createElement('label');
        posXLabel.textContent='Position X';
        posXLabel.appendChild(posX);
        const posYLabel=document.createElement('label');
        posYLabel.textContent='Position Y';
        posYLabel.appendChild(posY);
        const zoomLabel=document.createElement('label');
        zoomLabel.textContent='Zoom';
        zoomLabel.appendChild(zoom);

        positionContainer.appendChild(posXLabel);
        positionContainer.appendChild(posYLabel);
        positionContainer.appendChild(zoomLabel);
        wizard.appendChild(positionContainer);

        const expansionInput=document.createElement('input');
        expansionInput.type='url';
        expansionInput.placeholder='http://example.com/expansion.png';
        expansionInput.value=card.expansion||'';
        expansionInput.addEventListener('input',()=>{card.expansion=expansionInput.value;scheduleUpdate();});
        createLabeledInput('Expansion Icon URL', expansionInput);

        wizard.appendChild(navButtons(prevStep, steps.length>current+1 ? nextStep : null, true));
        scrollTo(iconInput);
    }

    function showCredits(){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();

        const creditInput=document.createElement('input');
        creditInput.type='text';
        creditInput.placeholder='Illustration: Jane Doe';
        creditInput.value=card.credit||'';
        creditInput.addEventListener('input',()=>{card.credit=creditInput.value;scheduleUpdate();});
        createLabeledInput('Art Credit', creditInput);

        const creatorInput=document.createElement('input');
        creatorInput.type='text';
        creatorInput.placeholder='v0.1 John Doe';
        creatorInput.value=card.creator||'';
        creatorInput.addEventListener('input',()=>{card.creator=creatorInput.value;scheduleUpdate();});
        createLabeledInput('Version & Creator Credit', creatorInput);

        wizard.appendChild(navButtons(prevStep, steps.length>current+1 ? nextStep : null, true));
        scrollTo(creditInput);
    }

    function saveFavorite(){
        const params = buildQuery(getCardParams());
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
            card = createBaseCardState();
            card.title = params.title || '';
            card.title2 = params.title2 || '';
            card.description = params.description || '';
            card.description2 = params.description2 || '';
            card.price = params.price || '';
            card.preview = params.preview || '';
            card.type = params.type || '';
            card.type2 = params.type2 || '';
            card.color = params.color0 !== undefined ? params.color0 : '0';
            card.color1 = params.color1 || '';
            card.colorSplit = params.color2split || '1';
            card.size = params.size !== undefined ? params.size : '0';
            card.customIcon = params['custom-icon'] || '';
            card.picture = params.picture || '';
            card.pictureX = params['picture-x'] || '0';
            card.pictureY = params['picture-y'] || '0';
            card.pictureZoom = params['picture-zoom'] || '1';
            card.expansion = params.expansion || '';
            card.credit = params.credit || '';
            card.creator = params.creator || '';
            card.boldkeys = params.boldkeys || '';
            card.traveller = params.traveller === 'true';
            card.trait = params.trait === 'true';
            card.feed = '';
            card.housePoints = '';
            card.health = '';
            card.extraTypes = [];
            card.types = [];

            // populate type selections for the 'Other' editor flow
            card.types = []
                .concat((card.type || '').split(' '))
                .concat((card.type2 || '').split(' '))
                .filter(Boolean)
                .map(t => t.charAt(0).toUpperCase() + t.slice(1));

            if(card.type === 'Trivia'){
                steps = [showTitle, showDescription, showPreview];
            } else {
                steps = [
                    showTitle,
                    showDescription,
                    showSecondaryText,
                    showOtherTypes,
                    showSize,
                    showColor,
                    showBoldKeywords,
                    showImageOptions,
                    showCredits,
                    showPrice,
                    showPreview
                ];
            }
            current = 0;
            showTitle();
        } else {
            showTypePicker();
        }
    }

    init();
})();
