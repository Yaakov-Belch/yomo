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

  const online={};    // Which peers are online?
  const channels={};  // current channels
  const cmds={};      // ipc commands
  const defCmd=(cmd,handler)=>cmds[cmd]=handler;

  const stopAllChannels=()=>{
    forEach2(channels,channel=>stopChannel(channel));
    channels={};
  };

  let qidCounter=0;  // Message channel id:
  const nextQid=()=>(++qidCounter).toString(36);

  const dataTopic=`data/${myId}`;
  const okTopic=`online/${myId}`;
  const okAll='online/#';
  const qos=1; const retain=true;

  const will={topic:okTopic,payload:'',retain,qos};
  const client=mqtt.connect(ipcUrl,{will});
  const unsub=()=>{
    stopAllChannels();
    client.publish(okTopic,'',{retain,qos}); // like will
    client.end();
  };

  client.on('connect',()=>{
    client.subscribe(dataTopic,{qos});
    client.subscribe(okAll,{qos});
    client.publish(okTopic,'ok',{retain,qos});
  });
  client.on('reconnect', stopAllChannels);
  client.on('close',     stopAllChannels);
  client.on('offline',   stopAllChannels);
  client.on('error', (error)=>console.log(error));

  const send=(peerId,msg)=>{ try {
    //// console.log(`${myId}==>${peerId}`,msg); ////
    msg=JSON.stringify(msg);
    client.publish(`data/${peerId}`,msg,{qos});
  } catch(e){ console.log('failed send:',peerId, msg); }};

  const startChannel=(channel)=>{
    const {ctrl:{start},info}=channel;
    channel.active=true;
    channel.state=start(info);
      // call info.connect?(args) synchronously!
  };
  const procChannel=(channel,data)=>{ if(channel) {
    const {active,ctrl:{proc},info,state}=channel;
    if(active) { channel.state=proc(info,data,state); }
  }};
  const stopChannel=(channel)=>{ if(channel) {
    const {active,ctrl:{stop},info,state}=channel;
    if(active) { stop(info,state); }
    channel.state=channel.active=undefined;
  }};

  defCmd('data',([__,peerId,qid,data])=> {
    procChannel(rd2(channels,peerId,qid),data);
  });

  // qidS (sending) <----> qidR (receiving)
  // in order to allow two peers to connect both ways
  // without clashing qid sequences, the client adds a
  // star to his qidR (the server's qidS).  So, even when
  // the same qid number is used on both sides, the keys
  // will be different.

  const connectFn=(cSpec,recv)=>{
    const qid=nextQid();
    connect2(true,cSpec,'*'+qid,qid,recv);
  };
  defCmd('connect',([__,peerId,qidR,qidS,fname,args])=>{
    connect2(false,{peerId,fname,args},qidS,qidR,null);
  });
  const connect2=(client,cSpec,qidS,qidR,recv)=>{
    const {peerId,fname,args}=cSpec;
    const server=!client;
    let ok=true;
    lookup(server,cSpec, ({yomo,ctrl,fnDef})=>{
      const connect=(args2)=>
        send(peerId,['connect',myId,qidS,qidR,fname,args2]);
      const sendData=(data)=>
        send(peerId,['data',myId,qidS,data]);
      const info={
        yomo, fname,args, fnDef,
        connect, recv, sendData,
        peerId, ipcSpec, client, server,
      }
      const channel={info,ctrl};
      ok && wr2(channels,peerId,qidR,channel);
      ok && (server || online[peerId]) && startChannel(channel);
    });
    return client && (()=>{
      srv && send(peerId,['unsubscribe',myId,qidS]);
      ok=false;
      stopChannel(del2(channels,peerId,qidR));
    });
  };
  defCmd('unsubscribe',([__,peerId,qid)=>{
    stopChannel(del2(channels,peerId,qid));
  });

  // Clients initiate connections and reconnect after connection
  // loss.  Servers just forget about dropped connections.

  const peerOnline=(peerId)=> {
    const x=channels[peerId]||{};
    for(let qid in x){ startChannel(x[qid]); }
  };
  const peerOffline=(peerId)=>{
    const x=channels[peerId]||{};
    for(let qid in x){
      const channel=x[qid];
      stopChannel(channel);
      if(channel.info.server) { delete x[qid]; }
    }
    if(emptyObj(x)) { delete channels[peerId]; }
  };

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
      if(msg.toString()!=='') { // start-up: (re)subscribe
        if(!online[peerId]) {   // un-bounce ok messages
          online[peerId]=true;
          peerOnline(peerId);
        }
      } else {                  // shut-down
        if(online[peerId]) {
          delete online[peerId];
          peerOffline(peerId);
        }
      }
    } else { console.log('unknown topic:', topic, msg+''); }
  });

  return {connectFn,unsub};
};
