const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Registration successful', user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
