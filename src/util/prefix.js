export const afterPrefix=(prefix,str)=>{
  if(str.substr(0,prefix.length)===prefix) {
    return str.substr(prefix.length);
  } else {
    return undefined;
  }
};
