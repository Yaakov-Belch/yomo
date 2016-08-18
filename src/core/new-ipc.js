import mqtt from 'mqtt';
import {wr2,rd2,del2} from '../util/hash2.js';
import {afterPrefix} from '../util/prefix.js';
import shortid from 'shortid';

export const mqttIpc=(ipcSpec,lookup)=>{
  if(!ipcSpec.myId) {
    (ipcSpec={...ipcSpec, myId:`client/${shortid.generate()}`});
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

  const subscribeAction=(qid,proc)=>
    subscribe('!',qid, {ctrl:{proc}}); // channel without info

  const subscribe=(peerId,qid,channel)=>{
    wr2(mySubs,peerId,qid,channel);
    if(online[peerId]) { startChannel(channel); }
  };
  const unsubscribe=(peerId,qid,done,confirmed)=>{
    stopChannel(rd2(mySubs,peerId,qid),done,confirmed);
  };

  const peerSubscribe=(clientId,qid,channel)=>{
    peerUnSubscribe(clientId,qid);
    wr2(peerSubs,clientId,qid,channel);
  };
  const peerUnSubscribe=(clientId,qid)=>{
    const channel=del2(peerSubs,clientId,qid);
    stopChannel(channel,true,true);
  };

  const connect=(cSpec,recv)=>{
    const {peerId,fname,args}=cSpec;
    const qid=nextQid();
    let ok=true;
    lookup(false,cSpec,({yomo,ctrl,fnSpec})=>{
      const connect=(args)=>....
      const send=(data)=>....
      const info={
        yomo, fname,args, fnSpec,recv,
        connect,send,
        peerId, ipcSpec, client:true,
      };
      const channel={info,ctrl};
      ok && subscribe(peerId,qid,channel);
    });
    return ()=>{
      ok=false;
      unsubscribe(peerId,qid,true);
      send(peerId,['!','unsubscribe',[myId,qid]]); ??....
    };
  };

  const startChannel=(channel)=>{
    // If the peer is now offline but gets online later,
    // startChannel will be called automatically.
    if(channel && channel.info && online[channel.info.peerId]) {
      const {ctrl:{start},info,active}=channel;
      if(active) { stopChannel(channel); }
      channel.active=true;
      channel.state=start(info);
    }
  };

  const procChannel=(channel,data)=>{ if(channel) {
    const {active,ctrl:{proc},info,state}=channel;
    if(active) { channel.state=proc(info,data,state); }
  }};

  const stopChannel=(channel,done,confirmed)=>{ if(channel) {
    const {active,ctrl:{stop},info,state}=channel;
    if(active && stop) { stop(info,state); }
    channel.state=channel.active=undefined;

    if(done) { info.done=true; }
    if(info.done && (confirmed || !online[info.peerId])) {
      return del2(mySubs,peerId,qid); // remove channel
    }
    // a spurious confirmUnsub triggers a new startChannel:
    if(confirmed && !info.done) { startChannel(channel); }
  }};

  subscribeAction('subscribe',(i,[clientId,qid,fname,args])=>{
    lookup(true,{fname,args},({yomo,ctrl,fnSpec})=>{
      const send=(data)=>....
      const info={
        yomo, fname,args, fnSpec, send
        peerId:clientId, ipcSpec, server:true
      };
      const channel={info,ctrl};
      peerSubscribe(clientId,qid,channel);
      startChannel(channel);
    });
  });
  subscribeAction('unsubscribe',(i,[clientId,qid])=>{
    peerUnSubscribe(clientId,qid);
    send(clientId,['!','confirmUnsub',[myId,qid]]);
  });
  subscribeAction('confirmUnsub',(i,[peerId,qid])=>{
    unsubscribe(peerId,qid,false,true);
  });

  client.on('message',(topic,msg)=>{
    //// console.log(`@${myId} ${topic}: ${msg+''}`); ////
    if(topic===dataTopic) { try {
      const [peerId,qid,data]=JSON.parse(msg.toString());
      const channel=rd2(mySubs,peerId,qid);
      if(channel) { procChannel(channel,data); }
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
        for(let qid in x){ stopChannel(x[qid]); }
        delete online[peerId];
      }
    } else { console.log('unknown topic:', topic, data+''); }
  });

  return {connect,unsub};
};
