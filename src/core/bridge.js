import {action,observable,asReference} from 'mobx';
import {metaFn,cacheFnu,yomoRun} from './cacheFn.js';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';
import {vWait}           from '../util/my-exceptions.js';

// bSpec=[srvMap,clientMap]  Map: fname->fnDef
// fnDef= function || {fn,client?,srv?} client/srv:ctrl
// ctrl={start,proc,stop}

// fnSpec={peerId,fname, ipcSpec?, v0?}
// ipcSpec={ipcUrl,myId?}
// cSpec={peerId,fname,args}

const noFn=()=>false;
const noCtrl={
  client: {
    start: (info)=>info.connect(info.args),
    proc:  (info,data,state)=> info.recv(data),
    stop:  (info,state)=>{},
  },
  srv: {
    start: (info)=>{
      const {yomo,sendData,fnDef,args}=info;
      //++ forward exceptions; catch incorrect fnDef outside
      return yomoRun(yomo,
        ()=> sendData((fnDef.fn||fnDef)(yomo,...args))
      );
    },
    proc: (info,data,state)=>state,
    stop: (info,state)=> state && state(),
  }
};

const cacheConn=(ipc,bSpec)=>cacheFnu((yomo,ipcSpec)=> {
  let [srvMap,clientMap]=bSpec ||[];
  srvMap=srvMap||{}; clientMap=clientMap||srvMap;

  const lookup=(onServer,cSpec,cb)=>{
    const {peerId,fname,args}=cSpec;
    const fnDef=(onServer?srvMap:clientMap)[fname] || noFn;
    const k=onServer? 'srv':'client';
    const ctrl=fnDef[k] || noCtrl[k];
    cb({yomo,ctrl,fnDef});
  };

  return ipc(ipcSpec,lookup);
});

const connBridge=metaFn(([cfn,ipcSpec],yomo,[fnSpec,...args])=>{
  const v0=hasOwnProperty(fnSpec,'v0')? fnSpec.v0 : vWait;
  const res=observable(asReference(v0));
  const recv=action(data=>res.set(data));
  let cDone;
  const done=yomoRun(yomo,()=>{
    cDone && cDone();
    const spec=ipcSpec || fnSpec.ipcSpec;
    const conn=spec && cfn(yomo, spec);
    cDone=conn && conn.connectFn({...fnSpec,args},recv);
  });
  res.unsub=()=>{ done(); cDone && cDone(); };
  return res;
});

export const ipcBridge=(ipc,bSpec,ipcSpec)=>
  connBridge(cacheConn(ipc,bSpec),ipcSpec);
