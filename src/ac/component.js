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

export const componentState=(component)=>(yomo)=>
  yomo.cState(component.cid);

export const fullState=(yomo)=>yomo.fullState();

// -----------

import mobx from "mobx";
const {Atom}=mobx;
mobx.useStrict(true);
import {reuse} from '../util/reuse.js';

// component: {cid,_initializer?,_reducer?}
//   state=_reducer(state,action,iid,yomo,component)

let yidCounter=0;
export const newYomo=()=>{
  const stores={};
  const yid=++yidCounter;
  const atom=new Atom(`yomoStores:${yid}`); // stores changed
  const atoms={}; // atoms[cid]: stores[cid] changed
  const getStore=(component,iid,action)=>{
    const {cid}=component; let new1, new2;
    const sc=stores[cid]=stores[cid] || (new1={});
    const store=sc[iid]=sc[iid] || (new2=newStore(yomo,component,iid));

    if(new1 || new2) { process.nextTick(()=>{
      atoms[cid]=atoms[cid] || new Atom(`yomoComponent:${yid}:${cid}`);
      atoms[cid].reportChanged();
      new1 && atom.reportChanged();
    });}

    return store;
  };

  const oldStates={};
  const cState=(cid)=>{
    atoms[cid]=atoms[cid] || new Atom(`yomoComponent:${yid}:${cid}`);
    atoms[cid].reportObserved();
    const sc=stores[cid] || {};
    let res={}; let ok=false;
    for(let iid in sc) { ok=true;
      res[iid]=sc[iid].get();
    }
    res=oldStates[cid]=reuse(oldStates[cid],res);
    return ok && res;
  };
  const oldState=undefined;
  const fullState=()=>{
    atom.reportObserved();
    let res={};
    for(let cid in stores { res[cid]=cState(cid); }
    oldState=reuse(oldState,res);
    return oldState;
  }

  const yomo={getStore,cState,fullState};
  return yomo;
};

const newStore=(yomo,component,iid)=>{
  const fn=component._intializer||component._reducer||(()=>undefined);
  const state=fn(undefined,{type:'@@redux/INIT'},iid,yomo,component);
  const store= {
    atom: new Atom(`yomoComponent:${component.cid}:${iid}`),
    set: mobx.action((v)=>{state=v; atom.reportChanged();}),
    get: ()=>{atom.reportObserved(); return state;},
    peek: ()=>state,
  };
  return store;
};
