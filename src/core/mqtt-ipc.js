import mqtt                    from 'mqtt';
import {wr2,rd2,del2,forEach2} from '../util/hash2.js';
import {emptyObj}              from '../util/emptyObj.js';
import {afterPrefix}           from '../util/prefix.js';
import shortid                 from 'shortid';

export const mqttIpc=(ipcSpec,lookup)=>{
  if(!ipcSpec.myId) {
    (ipcSpec={...ipcSpec, myId:`client/${shortid.generate()}`});
  }
  const {ipcUrl,myId}=ipcSpec;

  const online={};   // Which servers are active now?
  const mySubs={};   // My subscriptions with sub messages.
  const peerSubs={}; // Unsub handlers for peer subscriptions.
  const cmds={};     // ipc commands
  const defCmd=(cmd,handler)=>cmds[cmd]=handler;

  let qidCounter=0;  // Message channel id:
  const nextQid=()=>(++qidCounter).toString(36);

  const dataTopic=`data/${myId}`;
  const okTopic=`online/${myId}`;
  const okAll='online/#';
  const qos=1; const retain=true;

  const will={topic:okTopic,payload:'',retain,qos};
  const client=mqtt.connect(ipcUrl,{will});

  const unsub=()=>{
    forEach2(mySubs,  (channel)=>stopChannel(channel));
    forEach2(peerSubs,(channel)=>stopChannel(channel));
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

  const subscribe=(peerId,qid,channel)=>{
    wr2(mySubs,peerId,qid,channel);
    if(online[peerId]) { startChannel(channel); }
  };
  const unsubscribe=(peerId,qid,done,confirmed)=>{
    if(stopChannel(rd2(mySubs,peerId,qid),done,confirmed)) {
      del2(mySubs,peerId,qid);
    }
  };

  const peerSubscribe=(peerId,qid,channel)=>{
    peerUnSubscribe(peerId,qid);
    wr2(peerSubs,peerId,qid,channel);
    startChannel(channel);
  };
  const peerUnSubscribe=(peerId,qid)=>{
    const channel=del2(peerSubs,peerId,qid);
    stopChannel(channel);
  };

  const connectFn=(cSpec,recv)=>{
    const {peerId,fname,args}=cSpec;
    const qid=nextQid();
    let ok=true;
    lookup(false,cSpec,({yomo,ctrl,fnDef})=>{
      const connect=(args2)=>
        send(peerId,['subscribe',myId,qid,fname,args2]);
      const sendData=(data)=>
        send(peerId,['cData',myId,qid,data]);
      const info={
        yomo, fname,args, fnDef,recv,
        connect,sendData,
        peerId, ipcSpec, client:true,
      };
      const channel={info,ctrl};
      ok && subscribe(peerId,qid,channel);
    });
    return ()=>{
      ok=false;
      unsubscribe(peerId,qid,true,false);
      send(peerId,['unsubscribe',myId,qid]);
    };
  };

  const startChannel=(channel)=>{
    // On the client:
    // If the peer is now offline but gets online later,
    // startChannel will be called automatically.
    if(channel && online[channel.info.peerId]) {
      const {ctrl:{start},info,active}=channel;
      if(active) { stopChannel(channel); }
      channel.active=true;
      channel.state=start(info);
      // ensure to call info.connect?(args) synchronously!
    }
  };

  const procChannel=(channel,data)=>{ if(channel) {
    const {active,ctrl:{proc},info,state}=channel;
    if(active) { channel.state=proc(info,data,state); }
  }};

  const stopChannel=(channel,done,confirmed)=>{ if(channel) {
    const {active,ctrl:{stop},info,state}=channel;
    if(active) { stop(info,state); }
    channel.state=channel.active=undefined;

    if(done) { channel.done=true; }
    if(channel.done && (confirmed || !online[info.peerId])) {
      return true; // ok to delete the channel.
    }
    // a spurious confirmUnsub triggers a new startChannel:
    if(confirmed && !channel.done) { startChannel(channel); }
    return false; // don't delete the channel.
  }};

  defCmd('subscribe',([__,peerId,qid,fname,args])=>{
    lookup(true,{peerId,fname,args},({yomo,ctrl,fnDef})=>{
      const sendData=(data)=>
        send(peerId,['sData',myId,qid,data]);
      const info={
        yomo, fname,args, fnDef, sendData,
        peerId, ipcSpec, server:true
      };
      const channel={info,ctrl};
      peerSubscribe(peerId,qid,channel);
    });
  });
  defCmd('unsubscribe',([__,peerId,qid])=>{
    peerUnSubscribe(peerId,qid);
    send(peerId,['confirmUnsub',myId,qid]);
  });
  defCmd('confirmUnsub',([__,peerId,qid])=>{
    unsubscribe(peerId,qid,false,true);
  });
  defCmd('sData',([__,peerId,qid,data])=>
    const channel=rd2(mySubs,peerId,qid);
    if(!channel) {console.log('no channel1 for:',peerId,qid);}
    procChannel(channel,data);
  );
  defCmd('cData',([__,peerId,qid,data])=>
    const channel=rd2(peerSubs,peerId,qid);
    if(!channel) {console.log('no channel2 for:',peerId,qid);}
    procChannel(channel,data);
  );

  client.on('message',(topic,msg)=>{
    //// console.log(`@${myId} ${topic}: ${msg+''}`); ////
    if(topic===dataTopic) { try {
      msg=JSON.parse(msg.toString());
      const handler=cmds[msg[0]];
      if(handler) { handler(msg); }
      else { console.log('unknown cmd:',msg); }
      return;
    } catch(e) {return console.log('bad message',myId,msg,e);}}

    const peerId=afterPrefix('online/',topic);
    if(peerId){
      //// console.log('<== online:', peerId, data+''); ////
      if(data.toString()!=='') { // start-up: (re)subscribe
        online[peerId]=true;
        const x=mySubs[peerId]||{};
        for(let qid in x){ startChannel(x[qid]); }
      } else {                   // shut-down
        delete online[peerId];
        const x=peerSubs[peerId]; delete peerSubs[peerId];
        for(let qid in x){ stopChannel(x[qid]); }
        const y=mySubs[peerId];
        for(let qid in y){
          if(stopChannel(y[qid],false,false)) { delete y[qid]; }
        }
        if(emptyObj(y)) { delete mySubs[peerId]; }
      }
    } else { console.log('unknown topic:', topic, msg+''); }
  });

  return {connectFn,unsub};
};
