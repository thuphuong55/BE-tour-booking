const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// 🚀 OPTIMIZATION: Security & Performance Middleware (đặt ở đầu)
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để tránh conflict với frontend
  crossOriginEmbedderPolicy: false
}));

// 🚀 OPTIMIZATION: Compression middleware
app.use(compression({ 
  level: 6,           // Compression level (0-9), 6 là optimal cho speed/size
  threshold: 1024,    // Chỉ compress responses > 1KB
  filter: (req, res) => {
    // Không compress images và binary files
    if (req.headers['x-no-compression']) return false;
    if (res.getHeader('Content-Type') && res.getHeader('Content-Type').includes('image/')) return false;
    return compression.filter(req, res);
  }
}));

// 🚀 OPTIMIZATION: CORS với cấu hình tối ưu
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding']
}));

// 🚀 OPTIMIZATION: JSON parsing với limits hợp lý
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 🚀 OPTIMIZATION: Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Optimized', 'true');
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// 🚀 OPTIMIZATION: Request logging chỉ trong development
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

module.exports = app;
