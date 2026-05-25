const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async ({ name, email, password, role, class: userClass }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw { status: 409, message: 'Email already registered' };

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: role || 'student',
    class: userClass || null,
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, class: user.class } };
};

module.exports = { register, login };
