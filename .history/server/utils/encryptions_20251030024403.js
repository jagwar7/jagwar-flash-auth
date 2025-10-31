const crypto  = require('crypto');

const algorithm = 'aes-256-cbc';
const encryption_key = process.env.CRYPTO_ENCRYPTION_KEY;
const iv_length = 16;