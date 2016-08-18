import mqtt from 'mqtt';
import {wr2,rd2,del2} from '../util/hash2.js';
import {afterPrefix} from '../util/prefix.js';
import shortid from 'shortid';

export const mqttIpc=(ipcSpec,lookup)=>{
  if(!ipcSpec.myId) {
    (ipcSpec={...ipcSpec,myId:`client/${shortid.generate()}`});
  }
  const {ipcUrl,myId}=ipcSpec;

  const online={};   // Which servers are active now?
  const mySubs={};   // My subscriptions with sub messages.
  const peerSubs={}; // Unsub handlers for peer subscriptions.

  let qidCounter=0;  // Message channel id:
  const nextQid=()=>(++qidCounter).toString(36);

  const dataTopic=`data/${myId}`;
  const okTopic=`online/${myId}`;
  const okAll='online/#';
  const qos=1; const retain=true;

  const will={topic:okTopic,payload:'',retain,qos};
  const client=mqtt.connect(ipcUrl,{will});

  const unsub=()=>{
    client.publish(okTopic,'',{retain,qos}); // like will
    client.end();
  };

  client.on('connect',()=>{
    client.subscribe(dataTopic,{qos});
    client.subscribe(okAll,{qos});
    client.publish(okTopic,'ok',{retain,qos});
  });

  const send=(peerId,msg)=>{ try {
    //// console.log(`${myId}==>${peerId}`,msg); ////
    msg=JSON.stringify(msg);
    client.publish(`data/${peerId}`,msg,{qos});
  } catch(e){ console.log('failed send:',peerId, msg); }};

  const subscribeAction=(qid,handler)=> {
    const proc=(info,data)=>handler(data);
    const channel={qid,info:{peerId:'!'},ctrl:{proc}};
    subscribe(channel);
  };
  const subscribe=(channel)=>{
    const {qid, info:{peerId:srvId}}=channel;
    wr2(mySubs,srvId,qid,channel);
    if(online[srvId]) { startChannel(channel); }
  };
  const unsubscribe=(srvId,qid)=>{
    del2(mySubs,srvId,qid);
  };

  const peerSubscribe=(clientId,qid,cb)=>{
    peerUnSubscribe(clientId,qid);
    wr2(peerSubs,clientId,qid,cb);
  };
  const peerUnSubscribe=(clientId,qid)=>{
    const cb=del2(peerSubs,clientId,qid);
    if(cb) { cb(); }
  };
--------------------------------------------------------------
  const connect=(cSpec,recv)=>{
    const {srvId,fname,args}=cSpec;
    const qid=nextQid();
    lookup(cSpec,({yomo,ctrl,fnSpec})=>{
      const connect=(args)=>
      const send=(data)=>
      const info={
        yomo, fname,args, fnSpec,recv,
        connect,send,
        peerId:srvId, ipcSpec, client:true,
      };
      const channel={info,ctrl,qid};
      subscribe(channel);
    });
    return ()=>....
  };

  const startChannel=(channel)=>{
    const {ctrl:{start},info,active}=channel;
    if(start) {
      if(active) { stopChannel(channel); }
      channel.active=true;
      channel.state=start(info);
    }
  };
  const procChannel=(channel,data)=>{
    const {active,ctrl:{proc},info,state}=channel;
    if(active) { channel.state=proc(info,data,state); }
  }
  const stopChannel=(channel)=>{
    const {active,ctrl:{stop},info,state}=channel;
    if(active) { stop(info,state); }
    channel.state=channel.active=undefined;
  };


  // fnSpec={srvId,fName,pKey}
  const subscribeFn=(fnSpec,args,cb)=>{
    const {srvId}=fnSpec; const qid=nextQid();
    const msg=['!','subscribe',[myId,qid,fnSpec,args]];
    subscribe(srvId,qid,msg,cb);
    return ()=>send(srvId,['!','unsubscribe',[myId,qid]]);
  };

  subscribe('!','subscribe',null,([clientId,qid,fnSpec,args])=>{
    const done=srv(fnSpec,args,(data)=>{
      send(clientId,[myId,qid,data]);
    },clientId);
    peerSubscribe(clientId,qid,done);
  });
  subscribe('!','unsubscribe',null,([clientId,qid])=>{
    peerUnSubscribe(clientId,qid);
    send(clientId,['!','confirmUnsub',[myId,qid]]);
  });
  subscribe('!','confirmUnsub',null,([srvId,qid])=>{
    unsubscribe(srvId,qid);
  });
--------------------------------------------------------------

  *** check logic ***

  client.on('message',(topic,data)=>{
    //// console.log(`@${myId} ${topic}: ${data+''}`); ////
    if(topic===myTopic) { try {
      const [peerId,qid,args]=JSON.parse(data.toString());
      const {handler}=(mySubs[peerId]||{})[qid] || {};
      if(handler) { handler(args); }
      else { console.log(
        `unknown qid ${peerId}==>${myId}:`,qid,args
      );}
      return;
    } catch(e) {return console.log('bad message',myId,data,e)}}

    const peerId=afterPrefix('online/',topic);
    if(peerId){
      //// console.log('<== online:', peerId, data+''); ////
      if(data.toString()!=='') { // start-up: (re)subscribe
        const x=mySubs[peerId]||{};
        for(let qid in x){ startChannel(x[qid]); }
        online[peerId]=true;
      } else {                   // shut-down
        const x=peerSubs[peerId]; delete peerSubs[peerId];
        for(let qid in x){ x[qid](); }
        delete online[peerId];
      }
    } else { console.log('unknown topic:', topic, data+''); }
  });

  return {connect,unsub};
};
