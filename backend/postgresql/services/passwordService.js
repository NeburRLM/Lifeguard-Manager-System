import crypto from 'crypto';
import bcrypt from 'bcrypt';

export const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};