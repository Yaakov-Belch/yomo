import mobx from 'mobx';
const{observable,asReference,createTransformer,autorun}=mobx;
import {indexKey} from './indexKey.js';
import {wrapEx,unwrapEx,isWaitX,vWait,vDelay}
  from '../util/my-exceptions.js';

let nextId=1;
export const metaFn=(fnTrafo)=>(...spec)=>{
  const id=nextId++;
  const fn=(yomo,...args)=> {
    const key=indexKey(args);
    const cache=yomo.yomoCache[id]=yomo.yomoCache[id] || {};
    const data=cache[key]=cache[key] ||{
      cache, key, res:fnTrafo(spec,yomo,args),
    };
    return unwrapEx(cacheTrafo(data));
  };
  fn.id=id;
  fn.curry=(...pref)=>(yomo,...args)=>fn(yomo,...pref,...args);
  return fn;
};

const cacheTrafo=createTransformer(
  (data)=>data.res.get(),
  (res,data)=>{
    delete data.cache[data.key];
    process.nextTick(()=>{
      if(!data.cache[data.key]) {
        if(data.res.unsub) { data.res.unsub(); }
      }
    })
  }
);

export const cacheFn=metaFn(([fn],yomo,args)=>{
  return {get:()=>{
    try { return fn(yomo,...args); }
    catch(e) { return wrapEx(e); }
  }};
});

export const cacheFnu=metaFn(([fn],yomo,args)=>{
  let res;
  const unsub=()=>{
    try { res && res.unsub && res.unsub(); }
    catch(e) {console.log('cacheFn/unsub:',e);}
  };
  const get=()=>{
    unsub();
    try { return res=fn(yomo,...args); }
    catch(e) { return wrapEx(e); }
  };
  return { get, unsub };
});

const onOff=cacheFnu((yomo,id,action)=>{
  yomo.dispatchSoon({...action, onOff:+1});
  return { unsub:()=>yomo.dispatch({...action, onOff:-1}) }
});
let onOffCounter=1;
export const onOffActionShared=(yomo,...args)=> {
  onOff(yomo,0,...args); return true;
};
export const onOffAction=(yomo,...args)=> {
  onOff(yomo,onOffCounter++,...args); return true;
};

export const cacheAsync=metaFn(([fn],yomo,args)=>{
  const res=observable(asReference(vWait));
  try {
    fn(yomo,...args).then(mobx.action((v)=>{res.set(v);}));
    return res;
  } catch(e) { return wrapEx(e); }
});
export const cacheSlow=metaFn(([spec],yomo,args)=>{
  const {fn,delay,refresh}=spec;
  const res=observable(asReference(vDelay));
  let id;
  const tick=(dt,wait)=>{
    id=setTimeout(()=>{
      try{
        if(wait){
          mobx.action(()=>res.set(vWait))();
        }
        fn(yomo,...args).then(mobx.action(
          (v)=>{res.set(v); next();}
        ));
      } catch(e){
        mobx.action((v)=>{res.set(wrapEx(e));})()
        next();
      }
    },dt);
  };
  const next=()=>{ if(refresh) { tick(refresh); } };
  tick(delay||1,true);
  res.unsub=()=>clearTimeout(id);
  return res;
});

export const yomoAuditor=metaFn(([fn],yomo,args)=>{
  const res=observable(true);
  res.unsub=yomoRun(yomo,false,()=>{
    const action=fn(yomo,...args);
    if(action) { yomo.dispatch(action); }
  });
  return res;
});

const yomoRun0=(yomo,fn)=>
  autorun(()=>{
    try      { fn(yomo); }
    catch(e) { if(!isWaitX(e)) {
      console.log('yomoRun:',e);
      console.log(e.stack);
    } }
  });

export const yomoRun=(yomo,key,fn)=>{
  if(!key) { return yomoRun0(yomo,fn); }
  const [oldFn,oldStop]=yomo.yomoRuns[key] || [];
  if(oldFn===fn) { return; }
  if(oldFn) {
    oldStop();
    fn && console.log('double yomoRun for',key);
  }
  if(fn) { yomo.yomoRuns[key]=[fn,yomoRun0(yomo,fn)]; }
  else   { delete yomo.yomoRuns[key]; }
  return ()=>{
    const [oldFn,oldStop]=yomo.yomoRuns[key] || [];
    if(fn!==oldFn){console.log('yomoRun stop too late',key); }
    else if(oldStop) { oldStop(); delete yomo.yomoRuns[key]; }
  };
}

