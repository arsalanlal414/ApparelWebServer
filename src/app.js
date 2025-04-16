// app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import stripeWebhookRoutes from './routes/stripeWebhook.js';
import stripe from 'stripe';
import dotenv from 'dotenv';

stripe(process.env.STRIPE_SECRET_KEY)

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());

app.use('/api/stripe/webhook', stripeWebhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(compression());

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);
// app.use('/api/stripe/webhook', stripeWebhookRoutes); 


// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
