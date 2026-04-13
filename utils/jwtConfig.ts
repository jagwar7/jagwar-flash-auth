import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET_KEY as string;

const generateJWT = (user):any => {
  console.log(`🎟️ JWT SECRET: ${secret}`);
  const payload = {
       id: user.id, 
       name: user.name, 
       email:user.email, 
       authType:user.authType 
  }
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN as any || '24h' });
};
export default generateJWT;