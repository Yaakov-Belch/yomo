import React       from 'react';
import ReactDOM    from 'react-dom';
import withContext from 'recompose/withContext';
import getContext  from 'recompose/getContext';
import {observer}  from 'mobx-react';
import {isWaitX}   from '../util/my-exceptions.js';

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
    const waiting=isWaitX(exception);
    const V=props.yomo.ViewException || null;
    return V && <V {...{waiting,exception,options}}/>;
}}));

export const yomoReact={
  render: ({View,domId},yomo,spec)=>{
    const css=spec.css || null;
    const CSS=css &&
      <style media="screen" type="text/css">{css}</style>;
    return View && ReactDOM.render(
      <Provider yomo={yomo}>{CSS}<View/></Provider>,
      document.getElementById(domId || 'root')
    )
  }
};
