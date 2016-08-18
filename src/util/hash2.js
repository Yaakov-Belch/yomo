import {emptyObj} from './util/emptyObj.js';

export const wr2= (obj,k1,k2,data)=>
  (obj[k1]=obj[k1]||{})[k2]=data;

export const rd2= (obj,k1,k2)=>
  (obj[k1]||{})[k2];

export const del2=(obj,k1,k2)=>{
  const x=obj[k1]; if(!x) { return undefined; }
  const v=x[k2]; delete x[k2];
  if(emptyObj(x)) { delete obj[k1]; }
  return v;
};

export const forEach2=(obj,fn)=>{
  for(let i in obj) { const x=obj[i];
    for(let j in x) { const y=x[j];
      fn(y);
    }
  }
}

