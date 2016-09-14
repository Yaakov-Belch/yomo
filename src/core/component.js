import {indexFast} from './indexKey.js';

export const yomoSelector=(key)=>(yomo)=>yomo.yomoState(key).get();
export const yomoDispatcher=(key,reducer)=>indexFast((yomo,action)=>
  process.nextTick(()=>{
    const r=yomo.yomoState(key);
    r.write(reducer(r.data,action));
  })
);
