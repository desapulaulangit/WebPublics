/* Simulasi kota 24 jam (dijalankan GitHub Actions, bukan di browser).
   Pemakaian: node simulasi.js kota-masuk.json kota-keluar.json
   Cara kerja: memuat game.js dengan 3D palsu, memulihkan kota dari kota.json, menyusulkan waktu yang terlewat
   (sumber daya, kas, bangunan, pajak pemain dari Firebase), lalu menulis kota.json baru. */
const fs=require('fs'),vm=require('vm');
const [,,IN,OUT]=process.argv;
if(!IN||!OUT){console.log('pakai: node simulasi.js masuk.json keluar.json');process.exit(1)}
let snap;try{snap=JSON.parse(fs.readFileSync(IN,'utf8'))}catch(e){console.log('kota.json belum ada / rusak, dilewati');process.exit(0)}
if(!snap||!snap.bs){console.log('kota.json tidak valid, dilewati');process.exit(0)}
const sel=(Date.now()-(snap.ts||0))/1000;
if(sel<120){console.log('kota baru saja disinkron ('+Math.round(sel)+' dtk lalu), dilewati');process.exit(0)}
const stub=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:k==='length'?0:k==='then'?undefined:stub(),apply:()=>stub(),construct:()=>stub(),set:()=>true});
const els={};
const mkEl=id=>{const e={id,style:{},dataset:{},children:[],innerHTML:'',textContent:'',value:'',_c:new Set(),
 classList:{add(c){e._c.add(c)},remove(c){e._c.delete(c)},toggle(c,f){f?e._c.add(c):e._c.delete(c)},contains:c=>e._c.has(c)},
 appendChild(c){e.children.push(c);return c},prepend(){},remove(){},addEventListener(){},setAttribute(){},getContext:()=>stub(),
 getBoundingClientRect:()=>({left:0,top:0,width:300,height:300}),clientWidth:300,clientHeight:500,querySelectorAll:()=>[],setPointerCapture(){},click(){}};return e};
const document={getElementById:id=>els[id]||(els[id]=mkEl(id)),createElement:t=>mkEl(t),querySelectorAll:()=>[],body:mkEl('body'),head:mkEl('head'),addEventListener(){},hidden:false};
const store={wpl2:JSON.stringify(snap)};
const THREE=new Proxy({},{get:(t,k)=>k==='Color'?function(){return{copy(){return this},lerp(){return this},setHex(){return this},multiplyScalar(){return this}}}:stub()});
const realFetch=globalThis.fetch;
const ctx={THREE,document,console,performance,Date,Math,JSON,Set,Map,Promise,Uint8Array,Uint16Array,Uint32Array,Int32Array,Float32Array,DataView,TextEncoder,Array,Object,String,Number,Error,RegExp,Symbol,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},
 navigator:{onLine:true},location:{protocol:'https:',hostname:'bot.local',hash:'',search:'',host:'bot.local'},
 devicePixelRatio:1,addEventListener(){},ResizeObserver:function(){this.observe=()=>{}},
 setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
 WebSocket:function(){},Image:function(){},FileReader:function(){},Blob:function(){},URL:{createObjectURL:()=>''},crypto:{getRandomValues:a=>a},
 WPL_OPEN:true,
 fetch:async(u,o)=>{u=String(u);if(/kota\.json/.test(u))return{ok:true,status:200,json:async()=>snap};if(/firebase|firebaseio/.test(u)&&realFetch)return realFetch(u,o);return{ok:false,status:404,json:async()=>null}}};
ctx.window=ctx;vm.createContext(ctx);
const dir=process.cwd();
const src=['config.js','game.js'].filter(f=>fs.existsSync(dir+'/'+f)).map(f=>fs.readFileSync(dir+'/'+f,'utf8')).join('\n');
(async()=>{
 try{vm.runInContext(src+`
;globalThis.__G={on:()=>typeof S!=='undefined'&&!!S&&!!S.vil&&S.vil.length>0,snap:()=>JSON.stringify(snapData()),pj:()=>pjTarik(),owner:()=>OWNER,pjT:()=>{pjT=-1e9}};`,ctx,{timeout:60000})}catch(e){console.error('gagal memuat game.js:',e.message);process.exit(1)}
 for(let i=0;i<200&&!ctx.__G.on();i++)await new Promise(r=>setTimeout(r,20));
 if(!ctx.__G.on()){console.error('game tidak selesai dimulai');process.exit(1)}
 if(!ctx.__G.owner()){console.error('mode pemilik tidak aktif');process.exit(1)}
 try{ctx.__G.pjT();await ctx.__G.pj()}catch(e){console.log('pajak dilewati:',e.message)}
 const out=JSON.parse(ctx.__G.snap());
 if(!out||!out.bs){console.error('hasil tidak valid');process.exit(1)}
 const ring=(a,b)=>Object.keys(a).map(k=>k+' '+(a[k]|0)+'→'+(b[k]|0)).join(', ');
 console.log('selang '+Math.round(sel/60)+' menit | bangunan '+snap.bs.length+'→'+out.bs.length+' | kas '+(snap.kas|0)+'→'+(out.kas|0)+' | '+ring(snap.res||{},out.res||{}));
 fs.writeFileSync(OUT,JSON.stringify(out));
})();
