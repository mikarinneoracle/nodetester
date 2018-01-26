#!/bin/sh
export PORT=3000
export BACKEND_MONGODB_HOST=127.0.0.1:27017
export LOADERIO_KEY=loaderio-0806b2c02d2b955d22996f2650fc117a
nodemon server.js
