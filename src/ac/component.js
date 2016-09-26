import mobx from "mobx";
const {Atom}=mobx;
mobx.useStrict(true);

// import {indexKey} from './indexKey.js';
// component: {cid,initializer?,reducer?}


export const newYomo=()=>{
  const stores={};
  const getStore=(component,iid,action)=>{
    const {cid}=component;
    const sc=stores[cid]=stores[cid] || {};
    const store=sc[iid]=sc[iid] || newStore(yomo,component,iid);
    return store;
  };
  const yomo={getStore};
  return yomo;
};

const newStore=(yomo,component,iid)=>{
  const fn=component.intializer||component.reducer||(()=>undefined);
  const store= {
    atom: new Atom(`yomoComponent:${component.cid}:${iid}`),
    state: fn(undefined,{type:'@@redux/INIT'},iid,yomo,component),
    set: mobx.action((v)=>{store.state=v; atom.reportChanged();}),
    get: ()=>{atom.reportObserved(); return store.state;}
  };
  return store;
};
