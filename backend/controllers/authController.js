const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const useMemory = () => process.env.USE_IN_MEMORY_DB === 'true';

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

  if (useMemory()) {
    const users = global.__USERS__ || [];
    const exists = users.find(u => u.email === email);
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = { id: String(Date.now()), name, email, password: hashed };
    users.push(user);
    global.__USERS__ = users;
    const token = generateToken(user.id);
    return res.status(201).json({ _id: user.id, name: user.name, email: user.email, token });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields required' });

  if (useMemory()) {
    const users = global.__USERS__ || [];
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user.id);
    return res.json({ _id: user.id, name: user.name, email: user.email, token });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.json({ _id: user._id, name: user.name, email: user.email, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  if (useMemory()) {
    const users = global.__USERS__ || [];
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ _id: user.id, name: user.name, email: user.email });
  }
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};