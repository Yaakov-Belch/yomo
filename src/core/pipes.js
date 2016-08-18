import {cacheFn} from './cacheFn.js';
import {reuse} from '../util/reuse';
import {untracked} from 'mobx';

export const linkPipes={
  fn:(yomo,type,top,rPipe,wPipe)=>getPipe(yomo,rPipe),
  args1: (yomo,[type,rPipe,wPipe])=>
    [ untracked(()=>topOf(getPipe(yomo,wPipe))),
      type,rPipe,wPipe
    ],
  args0: (yomo,[top,type,rPipe,wPipe],clientId)=>
    [clientId,top,type,rPipe],
  init0: ([clientId,top])=>({bottom:top,data:[]}),
  reducer0: (old,pipe,[clientId,top0,type])=>{
    switch(type) {
      case 'data': case 'pipe':
        let data=pipe.data;
        let bottom=pipe.bottom;
        let top=topOf(old);
        if(top>bottom) {
          data=data.slice(top-bottom);
          bottom=top;
        }
        const acc=(type==='data')? undefined : pipe.bottom;
        return {acc,bottom,data};
      case 'bottom': return {acc:pipe.bottom};
      case 'top':    return {acc:topOf(pipe)};
    }
  },
  // trafo0: (state)=>state,
  // init1: ()=>undefined,
  reducer1: (state,data,[top,type,rPipe,wPipe],yomo)=>{
    yomo.dispatch({...data,type:'pipe',id:wPipe});
  },
  trafo1: (state)=>true,
}

const emptyPipe={bottom:0,data:[]};
const topOf=({bottom,data})=>bottom+data.length;

export const getPipe=cacheFn( (yomo,id)=>
  yomo().pipes[id] || emptyPipe
);

export const pipes=(state={},action)=>{
  if(action.type!=='pipe') { return state; }
  const {id}=action; if(!id) { return state; }
  return reuse(state,{...state,[id]:pipe(state[id],action)});
};
const pipe=(state=emptyPipe,action)=>{
  let {bottom,data}=state; let top=bottom+data.length;
  const {bottom:b2,data:d2,value,acc}=action;
  if(d2) {
    if(b2>top) {
      console.log('skipped data2 (ok)',state,action);
      bottom=b2; data=d2;
    } else {
      const tmp=d2.slice(top-b2);
      if(tmp.length>0) { data=[...data,...tmp]; }
    }
  }
  if(hasOwnProperty(action,'value')) { data=[...data,value]; }
  if(acc!==undefined && acc>bottom) {
    data=data.slice(key-bottom);
    bottom=acc;
  }
  return reuse(state,{bottom,data});
};
