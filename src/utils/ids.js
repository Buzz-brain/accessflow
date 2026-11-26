const crypto = require('crypto');

const generateAccountNumber = () => {
  const prefix = '02';
  const digits = crypto.randomInt(0, 100000000).toString().padStart(8, '0');
  return `${prefix}${digits}`;
};

const generateReference = (prefix = 'AF') => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${date}-${random}`;
};

module.exports = { generateAccountNumber, generateReference };
