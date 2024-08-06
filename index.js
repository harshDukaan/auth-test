require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Use an environment variable for the base URL, defaulting to localhost for development
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const users = {};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/auth/google/callback`
},
function(accessToken, refreshToken, profile, cb) {
  if (users[profile.id]) {
    console.log('User signed in:', profile.displayName);
    return cb(null, users[profile.id]);
  } else {
    users[profile.id] = { 
      id: profile.id, 
      displayName: profile.displayName, 
      photos: profile.photos,
      email: profile.emails[0].value
    };
    console.log('New user signed up:', profile.displayName);
    return cb(null, users[profile.id]);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, users[id]);
});

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline',
    includeGrantedScopes: true
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/profile');
  }
);

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Hello ${req.user.displayName}</h1>
              <h2>Your email is ${req.user.email}</h2>
              ${req.user.photos ? `<h2>Here's your profile pic</h2><img src="${req.user.photos[0].value}"/>` : ''}
              <br/><a href="/logout">Logout</a>`);
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));