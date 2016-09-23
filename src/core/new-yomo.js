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

const reduxYc={cid:'redux'};

export const newYomo=()=>{
  const states={};
  const yomoState=(yc)=>{
    yc=yc||reduxYc;
    let res=states[yc.cid];
    if(!res) { res=states[yc.cid]=mountComponent(yomo,yc); }
    return res;
  };
  const centralDispatch=(yomo,yc,action)=>
    yomo.yomoState(yc).dispatch(action);

  const yomo={yomoState, yomoCache:{}, yomoRuns:{}, centralDispatch};
  return yomo;
}

const mountComponent=(yomo,yc)=>{
  const r=observable(asReference(undefined));
  r.data=undefined;
  r.write=mobx.action((vv)=>r.set(r.data=vv));
  r.dispatch=(action)=>r.write(yc.reducer(r.data,action));
  return r;
}

