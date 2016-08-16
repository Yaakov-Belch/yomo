import mobx from 'mobx';
const {observable, asReference, autorun, useStrict}=mobx;
useStrict(true);

const ok={reducer:1,ViewException:1,run:1,render:1,View:1};
export const yomoApp0=(spec,curry)=> {
  if(curry) {
    return (spec2,curry2)=> yomoApp0({...spec,...spec2},curry2);
  }
  const {reducer,ViewException,run,render}=spec;
  for(let k in spec) {if(!ok[k]){
    console.log(`Warning in yomoApp --- unknown key: ${k}`);
  }}

  const state=observable(asReference(undefined));
  const yomo=()=>state.get();
  yomo.cache={};
  yomo.ViewException=ViewException;

  yomo.dispatch=mobx.action((action)=>
    state.set(reducer(state.get(),action)));
  yomo.dispatch({type:'@@redux/INIT'});

  run    && run.forEach(fn=>autorun(()=>fn(yomo)));
  render && render(spec,yomo);
};

