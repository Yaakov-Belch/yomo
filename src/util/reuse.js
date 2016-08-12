import shallowEqual from 'shallowequal';

export const reuse=(oldValue,newValue)=>
  shallowEqual(oldValue,newValue)? oldValue:newValue;

export const combineReducers=(reducers)=>(state={},action)=>{
  const res={};
  Object.keys(reducers).forEach(k=>
    res[k]=reducers[k](state[k],action)
  );
  return reuse(state,res);
};
