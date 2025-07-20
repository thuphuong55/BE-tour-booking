const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

// Import existing app setup
const { connectDB } = require('./config/db');

const app = express();

// 🚀 OPTIMIZATION: Apply optimization middleware
// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. Compression (giảm 70-80% kích thước response)
app.use(compression({ 
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 3. CORS optimization
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 4. JSON parsing với limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Optimized', 'true');
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Import routes
app.use('/api/tours', require('./routes/tourRoutes'));
app.use('/api/admin/tours', require('./routes/adminTourRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5005;

// Start server với optimized config
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Optimized server running on http://localhost:${PORT}`);
      console.log(`📊 Performance monitoring: ENABLED`);
      console.log(`🗜️ Response compression: ENABLED`);
      console.log(`🔒 Security headers: ENABLED`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
