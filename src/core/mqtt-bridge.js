import {autorun,action as mobxAction, observable, asReference}
  from 'mobx';
import mqtt from 'mqtt';
import {cacheFn,metaFn} from './cacheFn';
import {reuse} from '../util/reuse';

export const mqttBridge=(yomo,spec,iFuncs,compressor)=>{
  if(!spec) { return; }
  let client, myId;

  const online={}; const mySubs={}; const peerSubs={};
  let qidCounter=0;
  const nextQid=()=>(++qidCounter).toString(36);

  const subscribe=(peerId,qid,msg,handler)=>{
    qid=qid || nextQid();
    add2(mySubs,peerId,qid,{msg,handler});
    if(online[peerId]) { send(peerId,msg); }
    return qid;
  };
  const unsubscribe=(peerId,qid)=>{
    del2(mySubs,peerId,qid);
  };

  const psubAutoRun=(peerId,qid,fn)=>
    peerSubscribe(peerId,qid,autorun(fn));
  const peerSubscribe=(peerId,qid,cb)=>{
    peerUnSubscribe(peerId,qid);
    add2(peerSubs,peerId,qid,cb);
  };
  const peerUnSubscribe=(peerId,qid)=>{
    const cb=del2(peerSubs,peerId,qid);
    if(cb) { cb(); }
  };

  const send=(peerId,msg)=>{ try {
    //// console.log(`${myId}==>${peerId}`,msg); ////
    msg=JSON.stringify(msg);
    client.publish(`data/${peerId}`,msg,{qos:1});
  } catch(e){ console.log('failed send:', peerId) }};

  const end=()=>{
    client.publish(`online/${myId}`,'',{retain:true,qos:1});
    client.end();
  };

  const startIpc=({url,id,fmap})=>{
    myId=id; const myTopic=`data/${myId}`;
    const will=
      {topic:`online/${myId}`,payload:'',retain:true,qos:1};
    client=mqtt.connect(url,{will});
    client.on('connect',()=>{
      client.subscribe('online/#',{qos:1});
      client.subscribe(myTopic,{qos:1});
      client.publish(`online/${myId}`,'ok',{retain:true,qos:1});
    });
    client.on('message',(topic,data)=>{
      //// console.log(`@${myId} ${topic}: ${data+''}`); ////
      if(topic===myTopic) { try {
        data=data.toString();
        const [peerId,qid,args]=JSON.parse(data);
        const {handler}=(mySubs[peerId]||{})[qid] || {};
        if(handler) { handler(args); }
        else {
          console.log(
           `unknown qid ${peerId}==>${myId}:`,qid,args
          );
        }
        return;
      } catch(e) {console.log('bad message',myId,data,e)}}
      const peerId=afterPrefix('online/',topic);
      if(peerId){
        //// console.log('<== online:', peerId, data+''); ////
        if(data.toString()!=='') { // start-up: (re)subscribe
          const x=mySubs[peerId]||{};
          for(let qid in x){
            const {msg}=x[qid];
            if(msg) { send(peerId,msg); }
          }
          online[peerId]=true;
        } else {                   // shut-down
          const x=peerSubs[peerId]; delete peerSubs[peerId];
          for(let qid in x){ x[qid](); }
          delete online[peerId];
        }
      } else { console.log('unknown topic:', topic, data+''); }
    });
  };

  const proxyFn=(peerId,fname,args,cb)=>{
    const qid=nextQid();
    const msg=['!','subscribe',[myId,qid,fname,args]];
    subscribe(peerId,qid,msg,cb);
    return ()=>send(peerId,['!','unsubscribe',[myId,qid]]);
  };

  const initBridge=({url,id,fmap})=>{
    subscribe('!','subscribe',null,([peerId,qid,fname,args])=>{
      const c=(compressor[fname] || (()=>x=>x))(args);
      psubAutoRun(peerId,qid,()=>{ try {
        const fn=fmap[fname] || iFuncs[fname];
        if(fn) {
          send(peerId,[myId,qid,c(fn(yomo,...args))]);
        } else   { console.log('unknown fname:', fname); }
      } catch(e) { console.log('fn exception:',fname,args,e)}});
    });
    subscribe('!','unsubscribe',null,([peerId,qid])=>{
      peerUnSubscribe(peerId,qid);
      send(peerId,['!','confirmUnsub',[myId,qid]]);
    });
    subscribe('!','confirmUnsub',null,([peerId,qid])=>{
      unsubscribe(peerId,qid);
    });
  };
  startIpc(spec);
  initBridge(spec);

  return { proxyFn, end };
};

const add2=(obj,k1,k2,data)=>(obj[k1]=obj[k1]||{})[k2]=data;
const del2=(obj,k1,k2)=>{
  const x=obj[k1]; if(!x) { return undefined; }
  const v=x[k2]; delete x[k2];
  if(emptyObj(x)) { delete obj[k1]; }
  return v;
};
const emptyObj=(obj)=>{
  for(let i in obj) { return false; }
  return true;
}
const afterPrefix=(prefix,str)=>{
  if(str.substr(0,prefix.length)===prefix) {
    return str.substr(prefix.length);
  } else {
    return undefined;
  }
}

