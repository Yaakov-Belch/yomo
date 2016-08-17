import mobx from 'mobx';
const{observable,asReference}=mobx;

import {metaFn,cacheFnu,yomoRun} from './cacheFn.js';
import {mqttIpc}         from './mqtt-ipc.js';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';
import {vWait}           from '../util/my-exceptions.js';

// mqttIpc=({ipcUrl,myId},srv)=>{ disconnect, subscribeFn }
// fnSpec={srcId,fName,cKey}
// srv=(fnSpec,args,cb)=>done ... cb(data) ... done()
// subscribeFn=(fnSpec,args,cb)=> done ... done()

const connect=(bSpec,ipcSpec)=>{
  ...
};
const cacheConn=cacheFnu(([bSpec],yomo,ipcSpec)=> {
  return connect(bSpec,ipcSpec);
});
const makeConnFn=(bSpec,ipcSpec)=>
  if(!ipcSpec) { return cacheConn(bSpec); }
  else {
    const conn=connect(bSpec,ipcSpec);
    return ()=>conn;
  }
};

const bridge1=metaFn(([connFn],yomo,args)=>{
  let fnSpec; [fnSpec,...args]=args;
  const v0=hasOwnProperty(fnSpec)? fnSpec.v0 : vWait;
  const res=observable(asReference(v0));
  const handler=mobx.action(data=>res.set(data));
  yomoRun(yomo,()=>{
    res.unsub && res.unsub();
    const conn=connFn(yomo,fnSpec.ipcSpec);
    res.unsub=conn && conn.subscribeFn(fnSpec,args,handler);
  });
  return res;
});

export const yomoBridge=(bSpec,ipcSpec)=>
  bridge1(makeConnFn(bSpec,ipcSpec));
