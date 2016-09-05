import React       from 'react';
import ReactDOM    from 'react-dom';
import withContext from 'recompose/withContext';
import getContext  from 'recompose/getContext';
import {observer}  from 'mobx-react';
import {newYomo}   from './new-yomo.js';
import {isWaitX}   from '../util/my-exceptions.js';

export const attachReduxStore=(yomo,store)=>{
  if(yomo.state || yomo.dispatch) {
    console.log('attachReduxStore: Yomo already attached.');
    return;
  }
  const redux=yomo.yomoState('redux');
  const update=()=>redux.write(store.getState());
  store.subscribe(update); update();
  yomo.initState=(state)=>r.write(state);
  yomo.state=()=>redux.get();
  yomo.dispatch=(action)=>store.dispatch(action);
  yomo.dispatchSoon=(action)=>
    process.nextTick(yomo.dispatch,action);
};

export const Provider = withContext(
  {
    yomo:  React.PropTypes.object,
    store: React.PropTypes.object
  },
  (props)=>{
    let {yomo,store}=props;
    yomo=yomo||newYomo();
    store && attachReduxStore(yomo,store);
    return {yomo,store};
  }
)(
  ({children})=>React.Children.only(children)
);

export const yomoView=(View,options)=>observer(getContext(
  { yomo: React.PropTypes.object }
)((props)=>{
  try { return View(props); }
  catch(exception) {
    const waiting=isWaitX(exception);
    return <ViewException {...{waiting,exception,options}}/>;
}}));

export const ViewException=
  yomoView(({waiting,exception,options})=> {
    const p={size:'1em',...options};
    if(waiting) {
      return waiting>0? <WaitIcon {...p}/>:<DelayIcon {...p}/>;
    } else {
      console.log(exception, exception.stack);
      return <UserErrorIcon {...p}/>;
    }
  });

export const yomoRender=(yomo,View,domId='root')=>
  ReactDOM.render(
    <Provider yomo={yomo}><View/></Provider>,
    document.getElementById(domId || 'root')
  );

// -----------------------------------------------------
// icons included here to avoid cyclic module dependency
// -----------------------------------------------------
const css=
`.yomoSpin1s {
  -moz-animation: yomoSpin1s 1s infinite linear;
  -webkit-animation: yomoSpin1s 1s infinite linear;
  -ms-animation: yomoSpin1s 1s infinite linear;
  animation: yomoSpin1s 1s  infinite linear;
}

@-moz-keyframes yomoSpin1s {
  0% { -moz-transform: rotate(0deg); }
  100% { -moz-transform: rotate(360deg); }
}
@-webkit-keyframes yomoSpin1s {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}
@keyframes yomoSpin1s {
  0% {transform:rotate(0deg);}
  100% {transform:rotate(360deg);}
}`;

const viewBox='0 0 24 24';
const s0='1em';
const strokes={
  strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round'
};
const ySpin='yomoSpin1s';

export const WaitIcon=yomoView(({style,size})=>
  <span>
    <style media="screen" type="text/css">{css}</style>
    <svg {...{style,className:ySpin,width:size||s0,viewBox}}><g>
      <path {...strokes} stroke="#888888" fill="none"
        d="M 12 2 a 10 10 0 1 0 10 10"
      />
    </g></svg>
  </span>
);

export const DelayIcon=yomoView(({style,size})=>
  <svg {...{style,width:size||s0,viewBox}}><g>
    <path {...strokes} stroke="#888888" fill="none"
      d="M 12 2 a 10 10 0 1 0 10 10"
    />
  </g></svg>
);
export const OkIcon=yomoView(({style,size})=>
  <svg {...{style,width:size||s0,viewBox}}><g>
    <circle cx={12} cy={12} r={12} fill="green"/>
    <path {...strokes} stroke="#FFFFFF" fill="none"
      d="M6,13 l4,4 l8.5,-8.5"
    />
  </g></svg>
);
export const UserErrorIcon=yomoView(({style,size})=>
  <svg {...{style,width:size||s0,viewBox}}><g>
    <path {...strokes} stroke="#D80000" fill="#D80000"
      d="M1,23 l22,0 l-11,-22 z"
    />
    <path {...strokes} stroke="#FFFFFF"
      d="M12,8 l0,7"
    />
    <path {...{...strokes, strokeWidth:3}} stroke="#FFFFFF"
     d="M12,19.5 l0,0"
   />
  </g></svg>
);
export const ProgramErrorIcon=yomoView(({style,size})=>
  <svg {...{style,width:size||s0,viewBox}}><g>
    <path {...strokes} stroke="#AA0000" fill="#AA0000"
      d="M1,23 l22,0 l-11,-22 z"
    />
    <path {...strokes} stroke="#FFFF00"
      d="M12,8 l0,7"
    />
    <path {...{...strokes, strokeWidth:3}} stroke="#FFFF00"
     d="M12,19.5 l0,0"
   />
  </g></svg>
);
