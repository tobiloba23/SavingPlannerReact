import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import multiparty from 'connect-multiparty';

import apiRoutesv1 from './routes/api/v1';

dotenv.config();

const app = express();

// Log requests to the console.
app.use(logger('dev'));

const port = parseInt(process.env.PORT, 10) || 8080;

app.set('Port', port);

// Add middleware to console log every request
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// middle-ware that sets client folder as the default directory
app.use(express.static(path.join(__dirname, '/client')));

// middle-ware for file management
app.use(multiparty());


// Enable parsing of posted forms
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Use Cors to enable pre-flight on http request methods to convert from Options to appropriate verb
app.options('*', cors());

// Enable http request access response from the converted verb of the intial Options request
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Call to server /routes/api/v1
app.use('/api/v1', apiRoutesv1);

const server = app.listen(app.get('Port'), () => {
  const portCheck = server.address().port;
  console.log('Magic happens on port ', portCheck);
});


export default app;
