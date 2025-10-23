(function(){
    const wizard = document.getElementById('wizard');

    const templates = {
        'Trivia': {color: 3, type:'Trivia', size:3},
        'Creature': {color:4, type:'Action Companion', type2:'Creature'},
        'Friend': {color:4, type:'Action Companion Legend', type2:'friend'},
        'Opponent': {color:10, type:'Opponent', size:3},
        'Treasure': {color:1, type:'Treasure'},
        'Spell': {color:3, type:'Action Spell'},
        'Other': {color:0, type:'Other'},
        'General': {}
    };

    const GENERAL_SIZE_OPTIONS = [
        {value:'0', label:'Portrait'},
        {value:'1', label:'Landscape'},
        {value:'2', label:'Double'},
        {value:'3', label:'Base Card'},
        {value:'4', label:'Pile Marker'},
        {value:'5', label:'Player Mat'},
        {value:'6', label:'Trivia'}
    ];

    const TYPE_OPTIONS=['Action','Opponent','Spell','Companion','Legend','Treasure','Friend','Creature','House','Strike'];
    const COLOR_OPTIONS=['Action/Event','Treasure','Victory','Spell','Companion','Reserve','Potion','Shelter','Ruins','Landmark','Opponent','Boon','Hex','State','Artifact','Project','Way','Ally','Trait','Prophecy','Gryffindor','Slytherin','Ravenclaw','Hufflepuff'];
    const SECONDARY_COLOR_OPTIONS=[{value:'0',label:'SAME'}].concat(COLOR_OPTIONS.map((name,index)=>({value:String(index+1),label:name})));

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

    function scheduleUpdate(){
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateFrame, 100);
    }

    function getCardQueryParams(){
        let desc = card.description || '';
        if(card.feed && card.type2 === 'Creature' && card.editor !== 'general'){
            desc = (card.description || '') + '\n-\nAt the end of your turn feed this ' + card.feed + '& or discard it.';
        }
        if(card.type === 'Opponent' && card.editor !== 'general'){
            desc = '';
            if(card.housePoints) desc += card.housePoints + '%';
            if(card.health){ if(desc) desc += '\n'; desc += card.health + '~'; }
            if(card.description){ if(desc) desc += '\n'; desc += card.description; }
        }
        const params = {
            title: card.title || '',
            description: desc,
            price: card.price || '',
            preview: card.preview || '',
            type: card.type || '',
            type2: card.type2 || '',
            color0: card.color,
            size: card.size || 0
        };
        if(card.editor) params.editor = card.editor;
        if(card.title2) params.title2 = card.title2;
        if(card.description2) params.description2 = card.description2;
        if(card.boldkeys) params.boldkeys = card.boldkeys;
        if(card.customIcon) params['custom-icon'] = card.customIcon;
        if(card.picture) params.picture = card.picture;
        if(card.pictureX !== undefined) params['picture-x'] = card.pictureX;
        if(card.pictureY !== undefined) params['picture-y'] = card.pictureY;
        if(card.pictureZoom !== undefined) params['picture-zoom'] = card.pictureZoom;
        if(card.expansion) params.expansion = card.expansion;
        if(card.credit) params.credit = card.credit;
        if(card.creator) params.creator = card.creator;
        if(card.color1 !== undefined) params.color1 = card.color1;
        if(card.color2split) params.color2split = card.color2split;
        if(card.traveller) params.traveller = 'true';
        if(card.trait) params.trait = 'true';
        return params;
    }

    function updateFrame(){
        clearTimeout(updateTimer);
        const frame = document.getElementById('card-frame');
        if(!frame) return;
        const query = buildQuery(getCardQueryParams());
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
                if(t==='General'){
                    card=createGeneralDefaults();
                    startGeneralWizard();
                    return;
                }
                card=Object.assign({feed:'',housePoints:'',health:'',extraTypes:[],types:[]}, templates[t]);
                card.template=t;
                card.editor=undefined;
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

    function createGeneralDefaults(){
        return {
            template:'General',
            editor:'general',
            size:'0',
            title:'',
            title2:'',
            description:'',
            description2:'',
            type:'',
            type2:'',
            traveller:false,
            trait:false,
            color:'0',
            color1:'0',
            color2split:'1',
            boldkeys:'',
            customIcon:'',
            picture:'',
            pictureX:'0',
            pictureY:'0',
            pictureZoom:'1',
            expansion:'',
            credit:'',
            creator:'',
            price:'',
            preview:'',
            feed:'',
            housePoints:'',
            health:'',
            extraTypes:[],
            types:[]
        };
    }

    function detectFlowFromParams(params){
        const editor = (params.editor || '').toLowerCase();
        if (editor === 'general') {
            return 'general';
        }
        const type = (params.type || '').trim().toLowerCase();
        const type2 = (params.type2 || '').trim().toLowerCase();
        if (type === 'trivia') {
            return 'trivia';
        }
        if (type === 'opponent') {
            return 'opponent';
        }
        if (type === 'treasure') {
            return 'treasure';
        }
        if (type.includes('spell')) {
            return 'spell';
        }
        if (type.includes('companion') && type2 === 'creature') {
            return 'creature';
        }
        if (type.includes('companion') && type2 === 'friend') {
            return 'friend';
        }
        if (type === 'other') {
            return 'other';
        }
        return null;
    }

    function openGeneralEditorFromParams(params){
        card = createGeneralDefaults();
        card.title = params.title || '';
        card.title2 = params.title2 || '';
        card.description = params.description || '';
        card.description2 = params.description2 || '';
        card.price = params.price || '';
        card.preview = params.preview || '';
        card.type = params.type || '';
        card.type2 = params.type2 || '';
        card.color = params.color0 !== undefined ? params.color0 : '0';
        card.color1 = params.color1 !== undefined ? params.color1 : '0';
        card.color2split = params.color2split || '1';
        card.picture = params.picture || '';
        card.pictureX = params['picture-x'] !== undefined ? params['picture-x'] : '0';
        card.pictureY = params['picture-y'] !== undefined ? params['picture-y'] : '0';
        card.pictureZoom = params['picture-zoom'] !== undefined ? params['picture-zoom'] : '1';
        card.expansion = params.expansion || '';
        card.customIcon = params['custom-icon'] || '';
        card.boldkeys = params.boldkeys || '';
        card.credit = params.credit || '';
        card.creator = params.creator || '';
        card.traveller = params.traveller === 'true';
        card.trait = params.trait === 'true';
        card.size = params.size !== undefined ? params.size : '0';
        startGeneralWizard();
    }

    function renderGeneralStep(config){
        wizard.innerHTML='';
        wizard.appendChild(createFrame());
        updateFrame();
        if(config.label !== undefined){
            const label=document.createElement('p');
            label.textContent=config.label;
            wizard.appendChild(label);
        }
        const property=config.property;
        if(config.element==='checkbox' && card[property] === undefined){
            card[property]=false;
        }
        if(card[property] === undefined && config.defaultValue !== undefined){
            card[property]=config.defaultValue;
        }
        let input;
        let focusTarget;
        if(config.element==='textarea'){
            input=document.createElement('textarea');
            input.rows=config.rows||3;
            input.value=card[property]||'';
            input.addEventListener('input',()=>{card[property]=input.value;scheduleUpdate();});
            wizard.appendChild(input);
            focusTarget=input;
        } else if(config.element==='select'){
            input=document.createElement('select');
            (config.options||[]).forEach(opt=>{
                const option=document.createElement('option');
                option.value=String(opt.value);
                option.textContent=opt.label;
                input.appendChild(option);
            });
            const value=card[property] !== undefined ? String(card[property]) : '';
            if(value !== '') input.value=value;
            else if(config.defaultValue !== undefined) input.value=String(config.defaultValue);
            card[property]=input.value;
            input.addEventListener('change',()=>{card[property]=input.value;scheduleUpdate();});
            wizard.appendChild(input);
            focusTarget=input;
        } else if(config.element==='checkbox'){
            input=document.createElement('input');
            input.type='checkbox';
            input.checked=!!card[property];
            input.addEventListener('change',()=>{card[property]=input.checked;scheduleUpdate();});
            const checkboxLabel=document.createElement('label');
            checkboxLabel.appendChild(input);
            const text=document.createElement('span');
            text.textContent=config.checkboxLabel||'Enabled';
            checkboxLabel.appendChild(text);
            wizard.appendChild(checkboxLabel);
            focusTarget=input;
        } else if(config.element==='range'){
            input=document.createElement('input');
            input.type='range';
            if(config.min !== undefined) input.min=config.min;
            if(config.max !== undefined) input.max=config.max;
            if(config.step !== undefined) input.step=config.step;
            const value=card[property] !== undefined ? String(card[property]) : (config.defaultValue !== undefined ? String(config.defaultValue) : '');
            if(value !== '') input.value=value;
            const display=document.createElement('div');
            display.className='value-display';
            const formatFn=config.format || (val=>val);
            display.textContent=formatFn(input.value);
            input.addEventListener('input',()=>{card[property]=input.value;display.textContent=formatFn(input.value);scheduleUpdate();});
            wizard.appendChild(input);
            wizard.appendChild(display);
            focusTarget=input;
        } else {
            input=document.createElement('input');
            input.type=config.inputType||'text';
            if(config.placeholder) input.placeholder=config.placeholder;
            const value=card[property] !== undefined ? card[property] : (config.defaultValue !== undefined ? config.defaultValue : '');
            input.value=value;
            card[property]=input.value;
            const eventName=config.event||'input';
            input.addEventListener(eventName,()=>{card[property]=input.value;scheduleUpdate();});
            wizard.appendChild(input);
            focusTarget=input;
        }
        if(config.helpText){
            const help=document.createElement('p');
            help.className='help-text';
            help.textContent=config.helpText;
            wizard.appendChild(help);
        }
        const backFn=current===0?resetWizard:prevStep;
        const nextFn=steps.length>current+1?nextStep:null;
        wizard.appendChild(navButtons(backFn,nextFn,true));
        scrollTo(focusTarget||wizard);
    }

    function showGeneralSize(){
        renderGeneralStep({label:'Card Size',property:'size',element:'select',options:GENERAL_SIZE_OPTIONS,defaultValue:'0'});
    }

    function showGeneralTitle(){
        renderGeneralStep({label:'Primary Title',property:'title',element:'textarea',rows:2});
    }

    function showGeneralTitle2(){
        renderGeneralStep({label:'Secondary Title',property:'title2',inputType:'text'});
    }

    function showGeneralDescription(){
        renderGeneralStep({label:'Primary Description',property:'description',element:'textarea',rows:5});
    }

    function showGeneralDescription2(){
        renderGeneralStep({label:'Secondary Description',property:'description2',element:'textarea',rows:5});
    }

    function showGeneralType(){
        renderGeneralStep({label:'Type',property:'type',inputType:'text'});
    }

    function showGeneralTraveller(){
        renderGeneralStep({label:'Traveller',property:'traveller',element:'checkbox',checkboxLabel:'Enabled'});
    }

    function showGeneralTrait(){
        renderGeneralStep({label:'Trait',property:'trait',element:'checkbox',checkboxLabel:'Enabled'});
    }

    function showGeneralType2(){
        renderGeneralStep({label:'Secondary Type',property:'type2',inputType:'text'});
    }

    function showGeneralPrimaryColor(){
        renderGeneralStep({label:'Color',property:'color',element:'select',options:COLOR_OPTIONS.map((name,index)=>({value:String(index),label:name})),defaultValue:'0'});
    }

    function showGeneralBoldKeys(){
        renderGeneralStep({label:'Additional Bold Keywords',property:'boldkeys',inputType:'text',placeholder:'Additional boldable keywords; separated by semicolons'});
    }

    function showGeneralCustomIcon(){
        renderGeneralStep({label:'Custom Icon',property:'customIcon',inputType:'url',placeholder:'http://example.com/icon.png'});
    }

    function showGeneralPicture(){
        renderGeneralStep({label:'URL of Illustration',property:'picture',inputType:'url',placeholder:'http://example.com/image.jpg'});
    }

    function showGeneralPictureX(){
        renderGeneralStep({label:'Position X:',property:'pictureX',element:'range',min:'-1',max:'1',step:'0.01',defaultValue:'0',format:val=>Number(val).toFixed(2)});
    }

    function showGeneralPictureY(){
        renderGeneralStep({label:'Position Y:',property:'pictureY',element:'range',min:'-1',max:'1',step:'0.01',defaultValue:'0',format:val=>Number(val).toFixed(2)});
    }

    function showGeneralPictureZoom(){
        renderGeneralStep({label:'Zoom:',property:'pictureZoom',element:'range',min:'0',max:'3',step:'0.1',defaultValue:'1',format:val=>Number(val).toFixed(1)});
    }

    function showGeneralExpansion(){
        renderGeneralStep({label:'URL of Expansion Icon',property:'expansion',inputType:'url',placeholder:'http://example.com/expansion.png'});
    }

    function showGeneralCredit(){
        renderGeneralStep({label:'Art Credit',property:'credit',inputType:'text',placeholder:'Illustration: Jane Doe'});
    }

    function showGeneralCreator(){
        renderGeneralStep({label:'Version & Creator Credit',property:'creator',inputType:'text',placeholder:'v0.1 John Doe'});
    }

    function showGeneralPrice(){
        renderGeneralStep({label:'Price',property:'price',inputType:'text',placeholder:'$3'});
    }

    function showGeneralPreview(){
        renderGeneralStep({label:'Preview',property:'preview',inputType:'text'});
    }

    function showGeneralSecondaryColor(){
        renderGeneralStep({label:'Color',property:'color1',element:'select',options:SECONDARY_COLOR_OPTIONS,defaultValue:'0'});
    }

    function showGeneralColorSplit(){
        renderGeneralStep({label:'Split Position',property:'color2split',element:'select',options:[
            {value:'18',label:'Smaller Top'},
            {value:'1',label:'Half'},
            {value:'19',label:'Smaller Bottom'},
            {value:'12',label:'Blend Night'},
            {value:'27',label:'Half Action'}
        ],defaultValue:'1'});
    }

    function startGeneralWizard(){
        steps=[
            showGeneralTitle,
            showGeneralDescription,
            showGeneralPrice,
            showGeneralPreview,
            showGeneralPrimaryColor,
            showGeneralSecondaryColor,
            showGeneralColorSplit,
            showGeneralType,
            showGeneralType2,
            showGeneralSize,
            showGeneralTraveller,
            showGeneralTrait,
            showGeneralTitle2,
            showGeneralDescription2,
            showGeneralBoldKeys,
            showGeneralCustomIcon,
            showGeneralPicture,
            showGeneralPictureX,
            showGeneralPictureY,
            showGeneralPictureZoom,
            showGeneralExpansion,
            showGeneralCredit,
            showGeneralCreator
        ];
        current=0;
        steps[current]();
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
        const queryString = buildQuery(getCardQueryParams());
        let data = localStorage.getItem('favorites');
        let favs = data? JSON.parse(data):[];
        if(editing){
            if(confirm('Overwrite the previous card? Click Cancel to save as new.')){
                favs = favs.filter(f => f !== ('?' + originalQuery) && f !== originalQuery);
            }
        } else {
            favs = favs.filter(f => (getQueryParams(f).title||'') !== (card.title||''));
        }
        favs.push(queryString);
        localStorage.setItem('favorites', JSON.stringify(favs));
        resetWizard();
    }

    function init(){
        const params = getQueryParams(window.location.search);
        if(params.edit !== undefined){
            editing = true;
            delete params.edit;
            originalQuery = Object.keys(params).length ? buildQuery(params).substring(1) : '';
            const detectedFlow = detectFlowFromParams(params);
            if(detectedFlow === 'general' || detectedFlow === null){
                openGeneralEditorFromParams(params);
                return;
            }
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

            if(detectedFlow === 'trivia'){
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
