(function(){
const app=document.getElementById('app');
const state={type:'',title:'',description:'',price:'',preview:'',colorIndex:0};
const colorIndices={Trivia:0,Creature:4,Friend:4,Opponent:10,Treasure:1,Other:0};
function isMobile(){return /Mobi|Android/i.test(navigator.userAgent);}
function buildCardURL(){
 const params=new URLSearchParams();
 params.set('type',state.type);
 params.set('size',state.type==='Trivia'?6:0);
 params.set('color0',state.colorIndex);
 if(state.title)params.set('title',state.title);
 if(state.description)params.set('description',state.description);
 if(state.price)params.set('price',state.price);
 if(state.preview)params.set('preview',state.preview);
 params.set('view','card');
 return 'index.html?'+params.toString();
}
function saveFavorite(){
 const params=new URLSearchParams();
 params.set('type',state.type);
 params.set('size',state.type==='Trivia'?6:0);
 params.set('color0',state.colorIndex);
 if(state.title)params.set('title',state.title);
 if(state.description)params.set('description',state.description);
 if(state.price)params.set('price',state.price);
 if(state.preview)params.set('preview',state.preview);
 const qs='?'+params.toString();
 let data=localStorage.getItem('favorites');
 let arr=data?JSON.parse(data):[];
 arr.push(qs);
 localStorage.setItem('favorites',JSON.stringify(arr));
 showStep1();
}
function focusAndScroll(el){setTimeout(()=>{el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});},50);}
function showCard(){
  return `<iframe class="card" id="card" src="${buildCardURL()}"></iframe>`;
}
function showStep1(){app.innerHTML=`<div class="page"><h2>What type of card would you like to make?</h2><div class="grid">
<button data-t='Trivia'>Trivia</button>
<button data-t='Creature'>Creature</button>
<button data-t='Friend'>Friend</button>
<button data-t='Opponent'>Opponent</button>
<button data-t='Treasure'>Treasure</button>
<button data-t='Other'>Other</button>
</div></div>`;
app.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
 state.type=b.dataset.t;state.colorIndex=colorIndices[state.type]||0;state.title='';state.description='';state.price='';state.preview='';showStep2();
}));}
function showStep2(){app.innerHTML=`${showCard()}<div class="page"><div class="field"><input id="titleInput" placeholder="${state.type==='Trivia'?'Question':'Title'}" value="${state.title||''}"/></div><div class="buttons"><button id="back">Back</button><button id="next">Next</button></div></div>`;document.getElementById('back').onclick=showStep1;document.getElementById('next').onclick=()=>{state.title=document.getElementById('titleInput').value;showStep3();};focusAndScroll(document.getElementById('titleInput'));}
function showStep3(){app.innerHTML=`${showCard()}<div class="page"><div class="field"><input id="descInput" placeholder="${state.type==='Trivia'?'Answer':'Description'}" value="${state.description||''}"/></div><div class="buttons"><button id="back">Back</button><button id="next">Next</button><button id="save">Save</button></div></div>`;document.getElementById('back').onclick=showStep1;document.getElementById('next').onclick=()=>{state.description=document.getElementById('descInput').value;if(state.type==='Trivia'){showStep5();}else{showStep4();}};document.getElementById('save').onclick=()=>{state.description=document.getElementById('descInput').value;saveFavorite();};focusAndScroll(document.getElementById('descInput'));}
function showStep4(){if(state.type==='Trivia'){showStep5();return;}let nextBtn=(state.type==='Treasure'||state.type==='Opponent')?`<button id="next">Next</button>`:'';app.innerHTML=`${showCard()}<div class="page"><div class="field"><input id="priceInput" placeholder="Price" value="${state.price||''}"/></div><div class="buttons"><button id="back">Back</button>${nextBtn}<button id="save">Save</button></div></div>`;document.getElementById('back').onclick=showStep3;const next=document.getElementById('next');if(next)next.onclick=()=>{state.price=document.getElementById('priceInput').value;showStep5();};document.getElementById('save').onclick=()=>{state.price=document.getElementById('priceInput').value;saveFavorite();};focusAndScroll(document.getElementById('priceInput'));}
function showStep5(){let symbol='$';let label='value';if(state.type==='Opponent'){symbol='%';label='Defeated value';}else if(state.type==='Trivia'){symbol='*';label='Difficulty';}app.innerHTML=`${showCard()}<div class="page"><div class="field"><input id="prevInput" placeholder="${label}" value="${state.preview||symbol}"/></div><div class="buttons"><button id="back">Back</button><button id="save">Save</button></div></div>`;document.getElementById('back').onclick=()=>{if(state.type==='Trivia'){showStep3();}else{showStep4();}};document.getElementById('save').onclick=()=>{state.preview=document.getElementById('prevInput').value;saveFavorite();};const inp=document.getElementById('prevInput');if(state.preview===''){inp.value=symbol;}focusAndScroll(inp);} 
window.addEventListener('DOMContentLoaded',()=>{if(!isMobile()){window.location.href='index.html';return;}showStep1();});
})();
