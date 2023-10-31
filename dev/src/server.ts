import express from 'express';
import payload from 'payload';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import 'dotenv/config'

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret:
      process.env['PAYLOAD_SECRET'] ||
      payload.logger.info('Missing process.env.PAYLOAD_SECRET') ||
      'unsafe',
    cookie: {
      httpOnly: true,
      secure: false, // set this to true on production
    },
    store: MongoStore.create({ mongoUrl: process.env['MONGODB_URI'] }),
  }
))

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin');
});

// Initialize Payload
payload.init({
  secret: process.env['PAYLOAD_SECRET'] || ``,
  express: app,
  onInit: () => {
    payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
  },
})

// Add your own express routes here

app.listen(3000);
