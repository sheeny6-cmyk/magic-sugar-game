/* Run: node town/tests/journey.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname,'../assets/town.js'),'utf8');
function boot(seed) {
  const store = new Map(seed ? [['sugartown.v1', JSON.stringify(seed)]] : []);
  const window = { addEventListener(){}, dispatchEvent(){} };
  const document = {currentScript:{src:'https://example.test/town/assets/town.js'}, querySelectorAll:()=>[], addEventListener(){}};
  const localStorage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  const navigator = {locks:{request:(_key,fn)=>Promise.resolve(fn())}};
  vm.runInNewContext(code,{window,document,localStorage,navigator,Event:function(){}});
  return {T:window.SugarTown,store};
}
(async()=>{
  const {T,store}=boot();
  await T.updateWallet(()=>{});
  assert.equal(T.playerLevel().n,1); assert.equal(T.get().coins,60);
  assert.equal(await T.finishShow({work:'waltz',runId:'locked',grade:'S',notes:10,perfect:10}),null);
  const chart={notes:[{t:100,type:'cat'},{t:200,type:'jump'},{t:300,type:'beam'},{t:400,type:'turn'}],total:1000};
  async function practice(id,kind,perfect,great){
    await T.updateWallet(s=>{s.lesson={id,kind,mode:'rhythm',chart,paidFee:0};});
    return T.updateWallet(s=>T.finishRhythm(s,{axis:2,flex:2},{lessonId:id,notes:4,perfect,great,good:0,miss:0,maxCombo:4,moves:{cat:2},comboCoins:0,noteCoins:0}));
  }
  let r=await practice('l1','bar',4,0);
  assert.equal(r.growth.xp,90); assert.equal(T.playerLevel().n,2); assert.equal(T.isOwned('lilac'),true);
  r=await practice('l2','center',0,4);
  assert.equal(r.techniqueCoins,26); assert.equal(r.great,4); assert.equal(T.stageReady(),true);
  assert.equal(await T.updateWallet(s=>T.finishRhythm(s,{axis:2},{lessonId:'l2',notes:4,perfect:4})),null);
  const w=await T.finishShow({work:'waltz',runId:'w1',grade:'A',notes:10,perfect:8,good:2,maxCombo:10,score:930,moves:{jump:16}});
  assert.equal(w.coins,150); assert.equal(w.first,true); assert.equal(T.masteryOf('jump').n,2);
  const coins=T.get().coins;
  assert.equal(await T.finishShow({work:'waltz',runId:'w1',grade:'S',notes:10,perfect:10}),null);
  assert.equal(T.get().coins,coins);
  const replay=await T.finishShow({work:'waltz',runId:'w2',grade:'S',notes:10,perfect:10,maxCombo:10,score:1000});
  assert.equal(replay.coins,100); assert.equal(replay.first,false);
  const restored=boot(JSON.parse(store.get('sugartown.v1'))).T;
  assert.equal(restored.playerLevel().xp,T.playerLevel().xp);
  assert.equal(restored.get().journey.performances.waltz.count,2);
  assert.equal(restored.get().journey.performances.waltz.grade,'S');
  const old=boot({v:1,coins:555,classes:5,shows:1,bestGrade:'A',kingdom:{charter:1,life:12},owned:['basic','lilac','swan'],worn:'lilac',stamps:{bar:3,center:2,piece:0},gifts:[2]}).T;
  await old.updateWallet(()=>{});
  assert.equal(old.get().coins,555); assert.equal(old.get().worn,'lilac'); assert.equal(old.playerLevel().xp,315);
  assert.equal(old.get().journey.performances.debut.count,1);
  const locked=boot().T;
  await locked.updateWallet(s=>{s.classes=2;s.journey.xp=270;});
  assert.equal(locked.workStatus('etu').ready,false);
  assert.equal(await locked.finishShow({work:'etu',runId:'locked-spirit',grade:'A',notes:10,perfect:8}),null);
  await locked.finishShow({work:'waltz',runId:'unlock-waltz',grade:'A',notes:10,perfect:8});
  await locked.updateWallet(s=>{s.journey.xp=270;});
  assert.equal(locked.workStatus('etu').ready,true);
  assert.equal(locked.workStatus('ara').ready,false);
  const previousBond=locked.get().spirits.etu.bond;
  const spirit=await locked.finishShow({work:'etu',runId:'etu1',grade:'A',notes:10,perfect:8,good:2,score:930,moves:{beam:16}});
  assert.equal(spirit.work,'etu');
  assert.equal(locked.get().spirits.etu.bond,previousBond+2);
  assert.equal(locked.get().journey.performances.etu.count,1);
  assert.equal(await locked.finishShow({work:'etu',runId:'etu1',grade:'A',notes:10,perfect:8}),null);
  await locked.updateWallet(s=>{s.journey.xp=1080;});
  assert.equal(Object.keys(locked.WORKS).length,7);
  assert.equal(Object.keys(locked.WORKS).every(k=>locked.workStatus(k).ready),true);
  await T.updateWallet(s=>{s.journey.xp=10000000;});
  assert.equal(T.playerLevel().n,100);
  console.log('Journey V2: all assertions passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
