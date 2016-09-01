import mobx from 'mobx';
const {observable, asReference, useStrict}=mobx;
import {yomoRun} from './cacheFn.js';
useStrict(true);

const ok={
  reducer:1,ViewException:1,run:1,render:1,View:1,css:1
};
export const yomoApp0=(spec,curry)=> {
  if(curry) {
    return (spec2,curry2)=> yomoApp0({...spec,...spec2},curry2);
  }
  const {reducer,ViewException,run,render}=spec;
  for(let k in spec) {if(!ok[k]){
    console.log(`Warning in yomoApp --- unknown key: ${k}`);
  }}

  const state=observable(asReference(undefined));
  const yomo=()=>state.get();
  yomo.yomoCache={};
  yomo.ViewException=ViewException;

  yomo.dispatchSoon=(action)=>
    process.nextTick(yomo.dispatch,action);
  yomo.dispatch=mobx.action((action)=>
    state.set(reducer(state.get(),action)));
  yomo.dispatch({type:'@@redux/INIT'});

  run    && run.forEach(fn=>yomoRun(yomo,()=>fn(yomo)));
  render && render(spec,yomo,spec);
};

