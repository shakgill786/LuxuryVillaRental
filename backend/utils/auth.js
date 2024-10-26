// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
const { User } = require('../db/models');

const { secret, expiresIn } = jwtConfig;

// Sends a JWT Cookie
const setTokenCookie = (res, user) => {
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const token = jwt.sign(
    { data: safeUser },
    secret,
    { expiresIn: parseInt(expiresIn) }
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie('token', token, {
    maxAge: expiresIn * 1000, // maxAge in milliseconds
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "Lax" : "Strict"
  });

  return token;
};

// Middleware to restore the user session based on JWT token
const restoreUser = async (req, res, next) => {
  const { token } = req.cookies;
  req.user = null;

  if (!token) {
    return next(); // If no token, move to the next middleware
  }

  try {
    const jwtPayload = jwt.verify(token, secret);
    const { id } = jwtPayload.data;

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'username', 'firstName', 'lastName', 'createdAt', 'updatedAt'], // Fetch only necessary fields
    });

    if (user) {
      req.user = user; // Attach user to request
    } else {
      res.clearCookie('token'); // Clear the token if user isn't found
    }

    return next();
  } catch (err) {
    res.clearCookie('token');
    return next(); // If token is invalid or expired, skip to the next middleware
  }
};

// Middleware for requiring user authentication
const requireAuth = (req, _res, next) => {
  if (req.user) return next();

  const err = new Error('Authentication required');
  err.title = 'Authentication required';
  err.errors = { message: 'Authentication required' };
  err.status = 401;
  return next(err);
};

module.exports = { setTokenCookie, restoreUser, requireAuth };
