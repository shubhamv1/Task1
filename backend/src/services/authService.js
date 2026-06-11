const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');

const register = async ({ name, email, password }) => {
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);
  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = generateToken(user._id);
  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const getMe = async (userId) => {
  return User.findById(userId).select('-password');
};

module.exports = { register, login, getMe };
