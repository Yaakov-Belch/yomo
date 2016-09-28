// import {indexKey} from './indexKey.js';
import {waitException} from '../util/my-exceptions';

export const yomoSelector=(component)=>(yomo,iid)=>{
  const store=yomo.getStore(component,iid);
  if(store) { return store.get(); }
  else { throw waitException; }
};

export const yomoDispatcher=(component,reducer)=>{
  component._reducer=reducer; // for initialization on mounting.
  return (yomo,action,iid)=>{
    iid=iid || action.iid || '';
    const store=yomo.getStore(component,iid);
    if(store) {
      store.set(reducer(store.state,action,iid,yomo,component));
    }
  };
};

// -----------

import mobx from "mobx";
const {Atom}=mobx;
//mobx.useStrict(true);

// component: {cid,_initializer?,_reducer?}
//   state=_reducer(state,action,iid,yomo,component)

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
  const fn=component._intializer||component._reducer||(()=>undefined);
  const store= {
    atom: new Atom(`yomoComponent:${component.cid}:${iid}`),
    state: fn(undefined,{type:'@@redux/INIT'},iid,yomo,component),
    set: mobx.action((v)=>{store.state=v; atom.reportChanged();}),
    get: ()=>{atom.reportObserved(); return store.state;}
  };
  return store;
};

import {observable,asMap,asFlat, isObservable, asReference} from 'mobx';

const obj=observable(asMap({bar:{}}),asFlat);
obj.set('foo',new Foo({}));
console.log(isObservable(obj.get('foo').data));

function Foo(data){ this.data=data; }
