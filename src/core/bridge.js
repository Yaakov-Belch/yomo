import {metaFn}  from './cacheFn.js';
import {mqttIpc} from './mqtt-ipc.js';
import {hasOwnProperty} from '../util/hasOwnProperty.js';

// mqttIpc=(url,myId,srv)=>{ disconnect, subscribeFn }
// fnSpec={srcId,fname,ckey}
// srv=(fnSpec,args,cb)=>done ... cb(data) ... done()
// subscribeFn=(fnSpec,args,cb)=> done ... done()

export const newBridge=metaFn((bSpec,yomo,args)=>{
  let {fmap,pack,unpack,fnSpec,meta}=bSpec;
    fmap=fmap||{}; pack=pack||{}; unpack=unpack||{};
    fnSpec=fnSpec||{};
  if(meta) { let x; [x,...args]=args; fnSpec={...x,...fnSpec}; }


});

