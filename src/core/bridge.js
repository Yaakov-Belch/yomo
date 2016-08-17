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

const cacheConn=cacheFnu(([ipc,bSpec],yomo,ipcSpec)=> {
  // apply fnMap and pack as defined in bSpec:
  const pack=bSpec.pack || {};
  const srv=(fnSpec,args,handler)=> {
    const {fName,pKey}=fnSpec;
    const fn=bSpec.fnMap[fName];
    const p=pack[pKey] || {};
    const init   =p.init1    || (()=>undefined);
    const reducer=p.reducer1 || ((state,data)=>data);
    const trafo  =p.trafo1   || (state=>state);
    let state=init(...args);
    return yomoRun(yomo,()=>{
      state=reducer(state,fn(yomo,...args));
      handler(trafo(state));
    };
  );
  const conn=ipc(ipcSpec,srv);
  const subscribeFn=(fnSpec,args,handler)=>{
    if(!fnSpec.fName) { return ()=>{}; }
    const p =pack[fnSpec.pKey] || {};
    const init   =p.init2    || (()=>undefined);
    const reducer=p.reducer2 || ((state,data)=>data);
    const trafo  =p.trafo2   || (state=>state);
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

export const yomoBridge=(ipc,bSpec,ipcSpec)=>
  bridge1(cacheConn(ipc,bSpec),ipcSpec);
