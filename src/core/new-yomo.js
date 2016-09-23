import mobx from 'mobx';
const {useStrict, observable, asReference}=mobx;
useStrict(true);

// export const Provider .... attachReduxStore

import {indexFast} from './indexKey.js';

// yc.cid: unique component id ==> yc.reducer set by yomoDispatcher

export const yomoSelector=(yc)=>(yomo)=>yomo.yomoState(yc).get();
export const yomoDispatcher=(yc,reducer)=> {
  yc.reducer=reducer;
  return indexFast((yomo,action)=>yomo.centralDispatch(yomo,yc,action));
}

export const newYomo=()=>{
  const states={};
  const yomoState=(yc)=>{
    let res=states[yc.cid];
    if(!res) { res=states[yc.cid]=rxValue(undefined); }
    return res;
  };
  const centralDispatch=(yomo,yc,action)=>
    process.nextTick(()=>{
      const r=yomo.yomoState(yc);
      r.write(yc.reducer(r.data,action));
    });

  return {yomoState, yomoCache:{}, yomoRuns:{}, centralDispatch};
}

const rxValue=(data)=>{
  const r=observable(asReference(data));
  r.data=data;
  r.write=mobx.action((vv)=>r.set(r.data=vv));
  return r;
}

