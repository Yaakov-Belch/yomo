import {action,observable,asReference} from 'mobx';
import {metaFn,cacheFnu,yomoRun} from './cacheFn.js';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';
import {vWait}           from '../util/my-exceptions.js';

// ipc=(ipcSpec,srv)=>{ unsub, subscribeFn }
// srv=(fnSpec,args,cb)=>done ... cb(data) ... done()
// subscribeFn=(fnSpec,args,cb)=> done ... done()
// ipcSpec={ipcUrl,myId?}
// fnSpec={srcId,fName,pKey, ipcSpec?}
// bSpec={fnMap,pack}
const packFn=(bspec,pKey,k)=>{
  const p=(bSpec.pack||{})[k] || {};
  return [
    p['init'   +k] || (()=>undefined),
    p['reducer'+k] || ((state,data)=>data),
    p['trafo'  +k] || ((state)=>state)
  ];
};

const cacheConn=cacheFnu(([ipc,bSpec],yomo,ipcSpec)=> {
  // apply fnMap and pack as defined in bSpec:
  const srv=(fnSpec,args,handler)=> {
    const fn=bSpec.fnMap[fnSpec.fName];
    const [init,reducer,trafo]=packFn(bSpec,fnSpec.pKey,1);
    let state=init(...args);
    return yomoRun(yomo,()=>{
      state=reducer(state,fn(yomo,...args));
      handler(trafo(state));
    };
  );
  const conn=ipc(ipcSpec,srv);
  const subscribeFn=(fnSpec,args,handler)=>{
    if(!fnSpec.fName) { return ()=>{}; }
    const [init,reducer,trafo]=packFn(bSpec,fnSpec.pKey,2);
    let state=init(...args);
    return conn.subscribeFn(fnSpec,args,data=>{
      state=reducer(state,data,yomo);
      handler(trafo(state));
    });
  };
  return {subscribeFn,conn.unsub};
});

const bridge1=metaFn(([connFn,ipcSpec],yomo,args)=>{
  let fnSpec; [fnSpec,...args]=args;
  const v0=hasOwnProperty(fnSpec)? fnSpec.v0 : vWait;
  const res=observable(asReference(v0));
  const handler=action(data=>res.set(data));
  yomoRun(yomo,()=>{
    res.unsub && res.unsub();
    const conn=connFn(yomo, ipcSpec || fnSpec.ipcSpec);
    res.unsub=conn && conn.subscribeFn(fnSpec,args,handler);
  });
  return res;
});

export const ipcBridge=(ipc,bSpec,ipcSpec)=>
  bridge1(cacheConn(ipc,bSpec),ipcSpec);
