const Promise=require('bluebird');
const http =require('http');
const https=require('https');
const url  =require('url');
import {slurp} from './slurp.js';

const bytes=(d)=>Buffer.byteLength(d);
export const getBuffer=Promise.promisify( (opts,cb)=> {
  if(typeof opts ==='string') { opts={url:opts}; }
  if(opts.url) { opts={...opts, ...url.parse(opts.url)}}
  if(opts.body!==undefined) {
    opts={...opts,'Content-Length': bytes(opts.body)};
  }
  const h=opts.protocol==='https:'? https:http;
  const req=h.request(opts,(res)=>slurp(res,cb));
  if(opts.body!==undefined) { req.write(opts.body); }
  req.end();
});

const mget=(trafo)=>url=>getBuffer(url).then(trafo);
export const getText=mget((data)=>data.toString());
export const getJSON=mget((data)=>JSON.parse(data.toString()));
