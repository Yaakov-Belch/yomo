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

const rxValue=(value)=>{
  const r=observable(asReference(value));
  r.value=value;
  r.write=mobx.action((vv)=>r.set(r.value=vv));
  return r;
}

