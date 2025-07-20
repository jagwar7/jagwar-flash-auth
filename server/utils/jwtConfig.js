const jwt = require('jsonwebtoken');

exports.generateJWT = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};
