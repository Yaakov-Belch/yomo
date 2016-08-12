import mobx from 'mobx';
const {observable, asReference, autorun, useStrict}=mobx;
useStrict(true);

export const yomoApp0=(spec,curry)=> {
  if(curry) {
    return (spec2,curry2)=> yomoApp0({...spec,...spec2},curry2);
  }
  const {reducer,run,render}=spec;

  const state=observable(asReference(undefined));
  const yomo=()=>state.get();
  yomo.cache={};

  yomo.dispatch=mobx.action((action)=>
    state.set(reducer(state.get(),action)));
  yomo.dispatch({type:'@@redux/INIT'});

  run    && run.forEach(fn=>autorun(()=>fn(yomo)));
  render && render(spec,yomo);
};

