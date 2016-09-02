import mobx from 'mobx';
const {observable, asReference, useStrict}=mobx;
import {yomoRun} from './cacheFn.js';
import {yomoRender} from './react-yomo.js';

const ok={ reducer:1,View:1 };
export const yomoApp=(spec)=> {
  const {reducer,View,domId}=spec;
  for(let k in spec) {if(!ok[k]){
    console.log(`Warning in yomoApp --- unknown key: ${k}`);
  }}

  const state=observable(asReference(undefined));
  const yomo=()=>state.get();
  yomo.yomoCache={};

  yomo.dispatchSoon=(action)=>
    process.nextTick(yomo.dispatch,action);
  yomo.dispatch=mobx.action((action)=>
    state.set(reducer(state.get(),action)));
  yomo.dispatch({type:'@@redux/INIT'});

  View && yomoRender(yomo,View,domId);
  return yomo;
};

