// obsolete //
import {action as mobxAction, observable, asReference}
  from 'mobx';
import mqtt from 'mqtt';
import {cacheFn,metaFn,yomoRun} from './cacheFn.js';
import {reuse} from '../util/reuse';
import {mqttBridge} from './mqtt-bridge.js';

// (bridgeFn,[peerId,fName,bSpec,localPipeId,remotePipeId])
export const linkPipes=(bridgeFn,info)=>{
  return remoteFn(bridgeFn,info,
    (yomo,_1,_2,[_a,_b,_c,id,id2])=>[
      data=>{
        const type='pipe';
        const action=
          data.data?{...data,type,id}:{type,id,acc:1,key:data};
        yomo.dispatch(action);
      },
      [id2,topOf(yomo().pipes[id]||emptyPipe)]
    ]
  );
};
const emptyPipe={bottom:0,data:[]};
export const getPipe=cacheFn( (yomo,id)=>
  yomo().pipes[id] || emptyPipe
);
export const pipes=(state={},action)=>{
  if(action.type!=='pipe') { return state; }
  const {id}=action; if(!id) { return state; }
  return reuse(state,{...state,[id]:pipe(state[id],action)});
};
const pipe=(state=emptyPipe,action)=>{
  const {acc,key,value,bottom:b2,data:d2}=action;
  let {bottom,data}=state; let top=bottom+data.length;
  if(d2) {
    if(b2>top) {
      console.log('skipped data2 (ok)',state,action);
      bottom=b2; data=d2;
    } else {
      const tmp=d2.slice(top-b2);
      if(tmp.length>0) { data=[...data,...tmp]; }
    }
  } else if(acc) { if(key>bottom) {
    data=data.slice(key-bottom);
    bottom=key;
  }} else {
    if(key===undefined || key===top) { data=[...data,value]; }
    else if(key>top+1) { console.log('skipped keys',top,key); }
  }
  return reuse(state,{bottom,data});
};

const topOf=({bottom,data})=>bottom+data.length;
const accTop=cacheFn((c,id)=>topOf(getPipe(c,id)));
const accBot=cacheFn((c,id)=>getPipe(c,id).bottom);
const iFuncs={accTop,accBot,pipeData:getPipe};
const compressor={
  pipeData:([id,lastBottom])=>({bottom,data})=> {
    if(bottom>lastBottom) { console.log('skiped data (ok)'); }
    if(bottom<lastBottom) {
      data=data.slice(lastBottom-bottom);
      bottom=lastBottom;
    }
    lastBottom=bottom+data.length;
    return {bottom,data};
  },
};
