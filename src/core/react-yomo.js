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

export const yomoView=(View,options)=>observer(getContext(
  { yomo: React.PropTypes.func }
)((props)=>{
  try { return View(props); }
  catch(exception) {
    const waiting=
      (exception.waitException||0) &&
      (exception.msg==='delay' ? -1:+1);
    const V=props.yomo.ViewException || ViewException;
    return <V {...{waiting,exception,options}}/>;
}}));

export const ViewException=yomoView(({waiting,exception})=> {
  if(waiting) {
    const speed=waiting>0? 1:0;
    return(
      <span style={{
        position:'relative',display:'block',height:'2em'
      }}>
        <Loader options={{scale:0.8,speed}}/>
      </span>
    );
  } else {
    console.log(exception);
    return null;
  }
});

export const yomoReact={
  render: ({View,domId},yomo)=>
    View && ReactDOM.render(
      <Provider yomo={yomo}><View/></Provider>,
      document.getElementById(domId || 'root')
    ),
};
