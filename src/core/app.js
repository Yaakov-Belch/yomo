import {newYomo}    from './new-yomo.js';
import {yomoRender} from './react-yomo.js';

export const attachReducer=(yomo,reducer)=>{
  if(yomo.state || yomo.dispatch) {
    console.log('attachReducer: Yomo already attached.');
    return;
  }
  const r=yomo.yomoState('redux');
  yomo.initState=(state)=>r.write(state);
  yomo.state=()=>r.get();
  yomo.dispatch=(action)=>r.write(reducer(r.data,action));
  yomo.dispatchSoon=(action)=>
    process.nextTick(yomo.dispatch,action);
  yomo.dispatch({type:'@@redux/INIT'});
};

const ok={reducer:true,View:true,domId:true};
export const yomoApp=(spec)=>{
  const yomo=newYomo();
  const {reducer,View,domId}=spec;
  for(let k in spec) {if(!ok[k]){
    console.log(`Warning in yomoApp --- unknown key: ${k}`);
  }}
  if(reducer) { attachReducer(yomo,reducer); }
  else { throw new Error('yomoApp requires a reducer'); }
  View && yomoRender(yomo,View,domId);
  return yomo;
}
