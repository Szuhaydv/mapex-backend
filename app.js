import dotenv from "dotenv"
import express from 'express'
import session from 'express-session'
import mongoose from 'mongoose'
import passport from 'passport'
import cors from 'cors'
import MongoDBStore from 'connect-mongodb-session'
import * as passwordUtils from './login/passwordUtils.js'
const genPassword = passwordUtils.genPassword
import isAuth from './login/authMiddleware.js'
import { User, Map } from './models.js'

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const corsAllowed = {
    origin: 'https://mapexsite.netlify.app/',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', '*'],
    credentials: true,
    exposeHeaders: ["set-cookie", "ajax_redirect"]
}

app.use(cors(corsAllowed))

const MongoStore = MongoDBStore(session)

app.set("trust proxy", 1)

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
      uri: process.env.DB_STRING,
      collection: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain: 'mapex-backend.onrender.com'
    }
}));

import './login/passport.js'

app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.status(200).send("Successful login!")
})

app.post('/register', async (req, res, next) => {
  try {
    const existingUser = await User.find({username: req.body.username})
    if (existingUser.length != 0) {
      return res.status(400).send({message: "User already exists"})
    }
    const saltHash = genPassword(req.body.password);
  
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newUser = new User({
        username: req.body.username,
        hash: hash,
        salt: salt
    });

    newUser.save()
        .then((user) => {
            console.log(user);
        });
    return res.status(200).send("Successful registration!");
  } catch (error) {
    res.status(500).send({ message: err.message})
  }
});

app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) {return next(err)}
    res.status(200).send({message: "Successful logout"})
  })  
})

app.get('/api/topthree', async (req, res) => {
  try {
    const maps = await Map.find({ publicStatus: true }).sort({ numberOfLikes: -1 }).limit(3)
    return res.status(200).json({
      count: maps.length,
      data: maps
    })
  } catch (err) {
    console.log(err.message)
    res.status(500).send({ message: err.message })
  }
})

app.get('/api/mymaps', isAuth, async (req, res) => {
  try {
    const maps = await Map.find({ author: req.user.username })
    return res.status(200).json({
      count: maps.length,
      data: maps
    })
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message })
  }
})

app.post('/api/mymaps', isAuth, async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).send({
        message: 'Give a title to the map!'
      })
    }
    const newMap = {
      title: req.body.title,
      author: req.user.username,
      coverImage: req.body.coverImage,
      tags: req.body.tags,
      publicStatus: false,
      landmarks: req.body.landmarks,
      numberOfLikes: 0,
      subscription: "basic",
      markerColor: req.body.color
    }
    const map = await Map.create(newMap)
    return res.status(201).send(map)
  } catch (err) {
    console.log(err.message)
    return res.status(500).send({ message: err.message })
  }
})


app.get('/api/mymaps/:id', isAuth, async (req, res) => {
  try {
    const { id } = req.params
    const map = await Map.findById(id)
    return res.status(200).json(map)
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message })
  }
})

app.put('/api/mymaps/:id', isAuth, async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).send({
        message: 'Give a title to the map!'
      })
    }
    const { id } = req.params
    const result = await Map.findByIdAndUpdate(id, req.body)
    if (!result) {
      return res.status(404).send({message: 'Map not found!'})
    }
    return res.status(200).send({message: 'Map updated successfully!'})
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message })
  }
})

app.delete('/api/mymaps/:id', isAuth, async (req, res) => {
  try {
    const { id } = req.params
    const result = await Map.findByIdAndDelete(id)
    if (!result) {
      return res.status(404).send({ message: 'Map not found'})
    }
    return res.status(200).send({ message: 'Map deleted succesfully!' })
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message })
  }
})

app.get('/api/explore', async (req, res) => {
  try {
    const maps = await Map.find({ publicStatus: true }).sort({ numberOfLikes: -1 })
    return res.status(200).json({
      count: maps.length,
      data: maps
    })
  } catch (err) {
    console.log(err.message)
    res.status(500).send({ message: err.message })
  }
})

mongoose.connect(process.env.DB_STRING)
    .then(() => {
        console.log('App connected to database');
        app.listen(process.env.PORT, () => {
        console.log(`App is listening on port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log(err);
    })