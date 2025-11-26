

const Encrypt = (data)=>{
  return Buffer.from(data).toString('base64');
}

export const Decrypt = (data)=>{
  return Buffer.from(data, 'base64').toString('utf8');
}

module.exports = {Encrypt, Decrypt};