import React from 'react';
import ReactDOM from 'react-dom';
import withContext from 'recompose/withContext';
import getContext  from 'recompose/getContext';
import {observer}  from 'mobx-react';

export const Provider = withContext(
  {
    yomo:  React.PropTypes.func,
    store: React.PropTypes.object
  },
  (props)=>({yomo:props.yomo, store:props.store})
)(
  ({children})=><div>{children}</div>
);

export const yomoView=(view,waiting,err)=>observer(getContext(
  { yomo: React.PropTypes.func }
)((props)=>{
  try { return view(props); }
  catch(e) {
    const noop=()=>null;
    const show=(e)=>{ console.error(e); return null; };
    const handler=e.waitException? waiting||noop : err||show;
    try { return handler({...props, exception:e}); }
    catch(e) { return show(e); }
  }
}));

export const yomoReact={
  render: ({View,domId},yomo)=>
    View && ReactDOM.render(
      <Provider yomo={yomo}><View/></Provider>,
      document.getElementById(domId || 'root')
    ),
};
