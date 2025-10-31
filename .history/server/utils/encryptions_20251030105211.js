

export const Encrypt = (data)=>{
  return Buffer.from(data).toString('base64');
}

export const Decrypt = (data)=>{
  return Buffer.from(data)
}