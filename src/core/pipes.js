import {untracked} from 'mobx';
import {cacheFn,yomoRun} from './cacheFn.js';
import {reuse} from '../util/reuse';
import {hasOwnProperty}  from '../util/hasOwnProperty.js';

const startClient=(info)=>{
  const {yomo,args,connect,done}=info;
  done && done(); info.done=undefined;

  const [type,pipeId,type2,pipeId2]=args;
  setType(info,type); info.pipeId=pipeId;

  const top1=untracked(()=>topOf(getPipe(yomo,pipeId)));
  connect([type2,pipeId2,top1]);
};
const startSrv=(info)=>{
  const {yomo,args,sendData}=info;
  const [type,pipeId,top]=args;
  setType(info,type); info.pipeId=pipeId

  const top1=untracked(()=>topOf(getPipe(yomo,pipeId)));
  sendData({top:top1});

  serve(info,top);
};
const types={
  data:   [true,  false   ],
  pipe:   [true,  'bottom'],
  no:     [false, false   ],
  bottom: [false, 'bottom'],
  top:    [false, 'top'   ],
};
const setType=(info,type)=>{
  [info.wantData, info.wantAcc]=types[type||'no'] || [];
};

const serve=(info,top)=>{
  const {yomo,done,wantData,wantAcc,pipeId,sendData}=info;
  done && done();
  info.done=yomoRun(yomo,false,()=>{
    const p=getPipe(yomo,pipeId);

    let msg;
    if(wantData) {
      let {bottom,data}=p;
      if(top>bottom) {
        data=data.slice(top-bottom);
        bottom=top;
      }
      msg={bottom,data};
      top=topOf(msg);
    } else {
      msg={};
    }

    if(wantAcc==='bottom') { msg.acc=p.bottom; }
    if(wantAcc==='top')    { msg.acc=topOf(p); }

    sendData(msg);
  });
};

const proc=(info,data,state)=>{
  if(data.top!==undefined) { return serve(info,data.top); }
  const {yomo,pipeId}=info;
  yomo.dispatch({...data,type:'pipe',id:pipeId});
};

const stop=(info,state)=>{
  const {done}=info;
  done && done(); info.done=undefined;
};

export const linkPipes={
  client: {start:startClient, proc, stop},
  srv:    {start:startSrv,    proc, stop},
};

const emptyPipe={bottom:0,data:[]};
const topOf=({bottom,data})=>bottom+data.length;

export const getPipe=cacheFn( (yomo,id)=>
  yomo.state().pipes[id] || emptyPipe
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
    if(acc!==undefined && acc>top) {top=acc; data=[];}
    if(b2>top) {
      console.log('skipped data2',state,action);
      data=[...data]; data[b2-bottom-1]=undefined; top=b2;
    }

    const tmp=(b2===top)? d2 : d2.slice(top-b2);
    if(tmp.length>0) { data=[...data,...tmp]; }
  }
  if(hasOwnProperty(action,'value')) { data=[...data,value]; }
  if(acc!==undefined && acc>bottom) {
    data=data.slice(acc-bottom);
    bottom=acc;
  }
  return reuse(state,{bottom,data});
};
