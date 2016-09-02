import mobx from 'mobx';
const {useStrict, observable, asReference}=mobx;
useStrict(true);

export const newYomo=()=>{
  const states={};
  const yomoState=(k)=>{
    let res=states[k];
    if(!res) { res=states[k]=rxValue(undefined); }
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

