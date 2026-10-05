import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env, isProduction } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/clients.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import receiptRoutes from './routes/receipts.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import quotationRoutes from './routes/quotations.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  name: 'tko.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({ mongoUrl: env.MONGODB_URI, collectionName: 'sessions', ttl: 8 * 60 * 60 }),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

app.get('/api/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({ ok: databaseConnected, service: 'tko-finance', database: databaseConnected ? 'connected' : 'unavailable' });
});
app.use('/api/finance/auth', authRoutes);
app.use('/api/finance/dashboard', dashboardRoutes);
app.use('/api/finance/clients', clientRoutes);
app.use('/api/finance/quotations', quotationRoutes);
app.use('/api/finance/invoices', invoiceRoutes);
app.use('/api/finance/payments', paymentRoutes);
app.use('/api/finance/receipts', receiptRoutes);
app.use('/api/finance/settings', settingsRoutes);
app.use('/api/finance/catalog', catalogRoutes);
app.use('/api/finance/ai', aiRoutes);

app.use('/api/{*splat}', notFound);

app.use(errorHandler);

export default app;
