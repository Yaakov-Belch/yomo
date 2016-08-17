import mobx from 'mobx';
const{observable,asReference}=mobx;

import {metaFn,cacheFnu,yomoRun} from './cacheFn.js';
import {mqttIpc}         from './mqtt-ipc.js';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';
import {vWait}           from '../util/my-exceptions.js';

// mqttIpc=(ipcSpec,srv)=>{ unsub, subscribeFn }
// srv=(fnSpec,args,cb)=>done ... cb(data) ... done()
// subscribeFn=(fnSpec,args,cb)=> done ... done()
// ipcSpec={ipcUrl,myId?}
// fnSpec={srcId,fName,pKey, ipcSpec?}
// bSpec={fnMap,pack,unpack}

const cacheConn=cacheFnu(([ipc,bSpec],yomo,ipcSpec)=> {
  const srv=(fnSpec,args,handler)=> {
    const {fName,pKey}=fnSpec;
    const fn=bSpec.fnMap[fName];
    const pack=bSpec.pack[pKey]  || {};
    const init   =pack.init      || (()=>undefined);
    const reducer=pack.reducer   || ((state,data)=>data);
    const trafo  =pack.trafo     || (state=>state);
    let state=init(...args);
    return yomoRun(yomo,()=>{
      state=reducer(state,fn(yomo,...args));
      handler(trafo(state));
    };
  );
  const conn=ipc(ipcSpec,srv);
  const subscribeFn=(fnSpec,args,handler)=>{
    const unpack =bSpec.unpack[fnSpec.pKey] || {};
    const init   =unpack.init    || (()=>undefined);
    const reducer=unpack.reducer || ((state,data)=>data);
    const trafo  =unpack.trafo   || (state=>state);
    let state=init(...args);
    const u=conn.subscribeFn(fnSpec,args,data=>{
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
  const handler=mobx.action(data=>res.set(data));
  yomoRun(yomo,()=>{
    res.unsub && res.unsub();
    const conn=connFn(yomo, ipcSpec || fnSpec.ipcSpec);
    res.unsub=conn && conn.subscribeFn(fnSpec,args,handler);
  });
  return res;
});

export const yomoBridge=(ipc,bSpec,ipcSpec)=>
  bridge1(cacheConn(ipc,bSpec),ipcSpec);
