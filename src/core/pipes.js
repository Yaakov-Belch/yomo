// obsolete //
import {action as mobxAction, observable, asReference}
  from 'mobx';
import mqtt from 'mqtt';
import {cacheFn,metaFn,yomoRun} from './cacheFn.js';
import {reuse} from '../util/reuse';
import {mqttBridge} from './mqtt-bridge.js';


export const linkPipes={
  fn:(yomo,type,start,rPipe,wPipe)=>getPipe(yomo,rPipe),
  addId: true,
  init0: ([clientId,type,start])=>({bottom:start,data:[]}),
  reducer0: (old,pipe,[clientId,type])=>{
    switch(type||'pipe') {
      case 'data': case 'pipe':
        let data=pipe.data;
        let bottom=pipe.bottom;
        let top=topOf(old);
        if(top>bottom) {
          data=data.slice(top-bottom);
          bottom=top;
        }
        const acc=(type==='data')? undefined : pipe.bottom;
        return {acc,bottom,data};
      case 'bottom': return {acc:pipe.bottom};
      case 'top':    return {acc:topOf(pipe)};
    }
  },
  // trafo0: (state)=>state,
  // init1: ([type,start])=>undefined,
  reducer1: (state,data,[type,start,rPipe,wPipe],yomo)=>{
    yomo.dispatch({...data,type:'pipe',id:wPipe});
  },
  trafo1: (state)=>1,
}

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
  let {bottom,data}=state; let top=bottom+data.length;
  const {bottom:b2,data:d2,value,acc}=action;
  if(d2) {
    if(b2>top) {
      console.log('skipped data2 (ok)',state,action);
      bottom=b2; data=d2;
    } else {
      const tmp=d2.slice(top-b2);
      if(tmp.length>0) { data=[...data,...tmp]; }
    }
  }
  if(hasOwnProperty(action,'value')) { data=[...data,value]; }
  if(acc!==undefined && acc>bottom) {
    data=data.slice(key-bottom);
    bottom=acc;
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
