const jwt = require('jsonwebtoken');

exports.generateJWT = (user) => {
  return jwt.sign(
    {
       id: user._id, 
       name: user.name, 
       email:user.email, 
       authType:user.authType 
      },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};
