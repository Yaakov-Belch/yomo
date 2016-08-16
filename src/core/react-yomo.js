import React       from 'react';
import ReactDOM    from 'react-dom';
import Loader      from 'react-loader';
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

export const yomoView=(View)=>observer(getContext(
  { yomo: React.PropTypes.func }
)((props)=>{
  try { return View(props); }
  catch(e) {
    return ViewException({...props, exception:e});
  }
}));

const ViewException=()=>
  <span style={{
    position:'relative',display:'block',height:'2em'
  }}>
    <Loader options={{scale:0.8}}/>
  </span>;

export const yomoReact={
  render: ({View,domId},yomo)=>
    View && ReactDOM.render(
      <Provider yomo={yomo}><View/></Provider>,
      document.getElementById(domId || 'root')
    ),
};
