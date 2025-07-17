import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your frontend domain if needed
    : ['http://localhost:3000', 'http://localhost:3001']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Bitespeed Identity Reconciliation',
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Root endpoint with API information
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message: 'Bitespeed Identity Reconciliation API',
    version: '1.0.0',
    endpoints: {
      identify: 'POST /identify',
      health: 'GET /health'
    },
    documentation: 'See README.md for API usage',
    environment: NODE_ENV
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Don't expose error details in production
  const errorMessage = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';
    
  res.status(500).json({
    error: errorMessage
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: {
      identify: 'POST /identify',
      health: 'GET /health',
      info: 'GET /'
    }
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Identity endpoint: http://localhost:${PORT}/identify`);
  console.log(`📖 API info: http://localhost:${PORT}/`);
});
