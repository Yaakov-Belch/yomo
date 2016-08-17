import {action,observable,asReference} from 'mobx';
import {metaFn,cacheFnu,yomoRun} from './cacheFn.js';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';
import {vWait}           from '../util/my-exceptions.js';

// ipc=(ipcSpec,srv)=>{ unsub, subscribeFn }
// srv=(fnSpec,args,cb,clientId)=>done ... cb(data) ... done()
// subscribeFn=(fnSpec,args,cb)=> done ... done()
// ipcSpec={ipcUrl,myId?}
// fnSpec={srcId,fName,pKey, ipcSpec?}
// bSpec=[fnOut,fnIn]

const packFn=(bspec,k,pKey)=>{
  const fn=bSpec[k] || bSpec[0] || {}
  return [
    fn.fn           || fn,
    fn['init'   +k] || (()=>undefined),
    fn['reducer'+k] || ((state,data)=>data),
    fn['trafo'  +k] || ((state)=>state)
    fn.addId
  ];
};

const cacheConn=cacheFnu(([ipc,bSpec],yomo,ipcSpec)=> {
  // apply fnMap and pack as defined in bSpec:
  const srv=(fnSpec,args,handler,clientId)=> {
    const [fn,init,reducer,trafo,a]=packFn(bSpec,0,fnSpec.pKey);
    if(a) { args=[clientId,...args]; }
    let state=init(args);
    return yomoRun(yomo,()=>{
      state=reducer(state,fn(yomo,...args),args);
      handler(trafo(state,args));
    };
  );
  const conn=ipc(ipcSpec,srv);
  const subscribeFn=(fnSpec,args,handler)=>{
    if(!fnSpec.fName) { return ()=>{}; }
    const [fn,init,reducer,trafo]=packFn(bSpec,1,fnSpec.pKey);
    let state=init(args);
    return conn.subscribeFn(fnSpec,args,data=>{
      state=reducer(state,data,args,yomo);
      handler(trafo(state,args));
    });
  };
  return {subscribeFn,conn.unsub};
});

const connBridge=metaFn(([connFn,ipcSpec],yomo,args)=>{
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
  connBridge(cacheConn(ipc,bSpec),ipcSpec);
