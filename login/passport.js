import passport from 'passport'
import * as passportLocal from 'passport-local'
import mongoose from 'mongoose'
// const User = mongoose.connection.models.User;
import * as utils from '../login/passwordUtils.js'
const validPassword = utils.validPassword
const LocalStrategy = passportLocal.Strategy
import { User } from '../models.js'

const verifyCallback = (username, password, done) => {

    User.findOne({ username: username })
        .then((user) => {
            if (!user) {   
                return done(null, false, {message: "No user found!"}) 
            }
            
            const isValid = validPassword(password, user.hash, user.salt);
            
            if (isValid) {
                return done(null, user, {message: "Success, correct credentials!"});
            } else {
                return done(null, false, {message: "Incorrect username or password!"});
            }
        })
        .catch((err) => {  
            done(err);
        });

}

const strategy  = new LocalStrategy(verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        return done(null, user);
      } catch (error) {
        console.log('HELLO deseri')
        return done(error, null);
      }
});