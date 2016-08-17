import mqtt from 'mqtt';
import {add2,del2} from '../util/add2.js';
import {afterPrefix} from '../util/prefix.js';
import shortid from 'shortid';

// fnSpec={srcId,fname,ckey}
// srv=(fnSpec,args,cb)=>done ... cb(data) ... done()
export const mqttIpc=({ipcUrl,myId},srv)=>{
  myId=myId || shortid.generate();

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

  const disconnect=()=>{
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

  const subscribe=(srcId,qid,msg,handler)=>{
    add2(mySubs,srcId,qid,{msg,handler});
    if(online[srcId]) { send(srcId,msg); }
  };
  const unsubscribe=(srcId,qid)=>{
    del2(mySubs,srcId,qid);
  };

  const peerSubscribe=(clientId,qid,cb)=>{
    peerUnSubscribe(clientId,qid);
    add2(peerSubs,clientId,qid,cb);
  };
  const peerUnSubscribe=(clientId,qid)=>{
    const cb=del2(peerSubs,clientId,qid);
    if(cb) { cb(); }
  };

  // fnSpec={srcId,fname,ckey}
  const subscribeFn=(fnSpec,args,cb)=>{
    const {srcId}=fnSpec; const qid=nextQid();
    const msg=['!','subscribe',[myId,qid,fnSpec,args]];
    subscribe(srcId,qid,msg,cb);
    return ()=>send(srcId,['!','unsubscribe',[myId,qid]]);
  };

  subscribe('!','subscribe',null,([clientId,qid,fnSpec,args])=>{
    const done=srv(fnSpec,args,(data)=>{
      send(clientId,[myId,qid,data]);
    });
    peerSubscribe(clientId,qid,done);
  });
  subscribe('!','unsubscribe',null,([clientId,qid])=>{
    peerUnSubscribe(clientId,qid);
    send(clientId,['!','confirmUnsub',[myId,qid]]);
  });
  subscribe('!','confirmUnsub',null,([srcId,qid])=>{
    unsubscribe(srcId,qid);
  });

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
        for(let qid in x){
          const {msg}=x[qid];
          msg && send(peerId,msg);
        }
        online[peerId]=true;
      } else {                   // shut-down
        const x=peerSubs[peerId]; delete peerSubs[peerId];
        for(let qid in x){ x[qid](); }
        delete online[peerId];
      }
    } else { console.log('unknown topic:', topic, data+''); }
  });

  return {disconnect, subscribeFn};
};

