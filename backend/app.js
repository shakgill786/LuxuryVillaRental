const express = require('express');
require('express-async-errors'); // To catch async route errors
const morgan = require('morgan'); // Logging HTTP requests
const cors = require('cors'); // Cross-Origin Resource Sharing
const csurf = require('csurf'); // CSRF protection
const helmet = require('helmet'); // Security middleware
const cookieParser = require('cookie-parser'); // Cookie parsing
const path = require('path'); // Path utilities
const { restoreUser } = require('./utils/auth'); // Restore user session
const { ValidationError } = require('sequelize'); // Sequelize error handler
const routes = require('./routes'); // Routes

const { environment } = require('./config');
const isProduction = environment === 'production';

// Initialize Express app
const app = express();

// --- Middleware Setup ---

// Logger middleware
app.use(morgan('dev'));

// Parse cookies and JSON request bodies
app.use(cookieParser());
app.use(express.json());

// Enable CORS only in development
if (!isProduction) {
  app.use(cors());
}

// Security headers with Helmet
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  })
);

// CSRF Protection
app.use(
  csurf({
    cookie: {
      secure: isProduction, // Secure cookies in production
      sameSite: isProduction ? 'Lax' : 'Strict', // Cross-site handling
      httpOnly: true, // Prevent JS access
    },
  })
);

// Include CSRF token in cookies
app.use((req, res, next) => {
  try {
    const csrfToken = req.csrfToken();
    res.cookie('XSRF-TOKEN', csrfToken); // Set token in cookies
    res.locals.csrfToken = csrfToken; // Optional for templates
    next();
  } catch (error) {
    console.error('CSRF Token Error:', error.message);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

// Restore user session
app.use(restoreUser);

// --- API Routes ---
app.use('/api', routes);

// --- Serve React Frontend in Production ---

if (isProduction) {
  // Serve static files from the React frontend's build folder
  app.use(express.static(path.resolve(__dirname, '../frontend/build')));

  // Serve the React app for all routes except those starting with "/api"
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// --- Error Handling ---

// Handle 404 errors for unhandled requests
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = 'Resource Not Found';
  err.status = 404;
  next(err);
});

// Handle Sequelize validation errors
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach((error) => {
      errors[error.path] = error.message;
    });
    err.title = 'Validation Error';
    err.errors = errors;
  }
  next(err);
});

// General error handler
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error('Error:', err.message);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors || {},
    stack: isProduction ? null : err.stack,
  });
});

// Export the Express app
module.exports = app;