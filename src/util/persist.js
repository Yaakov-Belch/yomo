import {yomoRun} from '../core/cacheFn.js';
export const persistRedux=(yomo,key,longTerm)=>{
  const storage=longTerm? localStorage:sessionStorage;
  const state=storage.getItem(key);
  if(state) { yomo.initState(JSON.parse(state)); }
  yomoRun(yomo,false,()=>
    storage.setItem(key,JSON.stringify(yomo.state()))
  );
};

