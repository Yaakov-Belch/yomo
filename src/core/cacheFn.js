import mobx from 'mobx';
const{observable,asReference,createTransformer,autorun}=mobx;
import canon from 'canon';

let nextId=1;
export const metaFn=(fnTrafo)=>(...spec)=>{
  const id=nextId++;
  const fn=(yomo,...args)=> {
    const key=canon.stringify(args);
    const cache=yomo.cache[id]=yomo.cache[id] || {};
    const data=cache[key]=cache[key] || xPeek({
      cache, key, yomo, id, args,
      res:fnTrafo(spec,yomo,args),
    },yomo,id,args,true);
    return unwrapEx(cacheTrafo(data));
  };
  fn.id=id;
  return fn;
};

const cacheTrafo=createTransformer(
  (data)=>data.res.get(),
  (res,data)=>{
    delete data.cache[data.key];
    xPeek(null,data.yomo,data.id,data.args,false);
    process.nextTick(()=>{
      if(!data.cache[data.key]) {
        if(data.res.unsub) { data.res.unsub(); }
        if(data    .unsub) { data    .unsub(); }
      }
    })
  }
);


const xPeek=(res,yomo,id,args,add)=>{
  let peeks;
  if(yomo.peek && (peeks=yomo.peek[id])){ process.nextTick(()=>{
    for(let k in peeks) { peeks[k](args,add); }
  })};
  return res;
};

export const yomoPeek=metaFn((spec,yomo,args)=>{
  const id=nextId++;
  const [fn,init,reducer,trafo]=spec;
  const trafo2=trafo || (x=>x);
  let state=init(...args);
  const cc=yomo.cache[fn.id] || {};
  for(let k in cc) {
    const data=cc[k];
    state=reducer(yomo,state,data.args,true);
  }
  const res=observable(asReference(trafo2(state)));
  // use add2?
  if(!yomo.peek) { yomo.peek={}; }
  yomo.peek[fn.id]=yomo.peek[fn.id]||{};
  yomo.peek[fn.id][id]=mobx.action((args2,add)=>
    res.set(trafo2(state=reducer(yomo,state,args2,add)))
  );
  res.unsub=()=>{
    delete yomo.peek[fn.id][id]; // use del2?
  };
  return res;
});

export const cacheFn=metaFn(([fn],yomo,args)=>{
  return {get:()=>{
    try { return fn(yomo,...args); }
    catch(e) { return wrapEx(e); }
  }};
});

export const cacheAsync=metaFn(([fn],yomo,args)=>{
  const res=observable(asReference(wrappedWaitException));
  try {
    fn(yomo,...args).then(mobx.action((v)=>{res.set(v);}));
    return res;
  } catch(e) { return wrapEx(e); }
});
export const cacheSlow=metaFn(([spec],yomo,args)=>{
  const {fn,delay,refresh}=spec;
  const res=observable(asReference(wrappedDelayException));
  let id;
  const tick=(dt,wait)=>{
    id=setTimeout(()=>{
      try{
        if(wait){
          mobx.action(()=>res.set(wrappedWaitException))();
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
  res.unsub=autorun(()=>{ try {
    const action=fn(yomo,...args);
    if(action) { yomo.dispatch(action); }
  } catch(e) { console.error(e); }});
  return res;
});
export const yomoRunner=(fn)=>
  yomoAuditor((...args)=>{fn(...args); return 0;});

const unwrapEx=(v)=>{
  const e= v && v.wrappedException;
  if(e) { throw e; } else { return v; }
};
export const wrapEx=(wrappedException)=>({wrappedException});
function WaitException(msg){
  this.waitException=true;
  this.name="waitException";
  this.msg=msg;
}
export const wrappedWaitException=wrapEx(new WaitException());
export const wrappedDelayException=wrapEx(
  new WaitException('delay')
);
