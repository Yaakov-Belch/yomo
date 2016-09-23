import mobx from 'mobx';
const {useStrict, observable, asReference}=mobx;
useStrict(true);

// export const Provider .... attachReduxStore

import {indexFast} from './indexKey.js';

// yc.cid: unique component id ==> yc.reducer set by yomoDispatcher

export const yomoSelector=(yc)=>(yomo)=>yomo.yomoState(yc).get();
export const yomoDispatcher=(yc,reducer)=>indexFast((yomo,action)=>
  process.nextTick(()=>{
    const r=yomo.yomoState(yc);
    r.write(reducer(r.data,action));
  })
);

export const newYomo=()=>{
  const states={};
  const yomoState=(yc)=>{
    let res=states[yc.cid];
    if(!res) { res=states[yc.cid]=rxValue(undefined); }
    return res;
  }
  return {yomoState, yomoCache:{}, yomoRuns:{}};
}

const rxValue=(data)=>{
  const r=observable(asReference(data));
  r.data=data;
  r.write=mobx.action((vv)=>r.set(r.data=vv));
  return r;
}

