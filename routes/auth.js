const express = require('express');
const jwt = require('jsonwebtoken');
const user = require('../models/user');
const message = require('../models/message');
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');
const router = new express.Router();
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function(req, res, next){
    try{
        if(user.authenticate(req.body.username, req.body.password)){
            let token = jwt.sign({username: req.body.username, password: req.body.password}, SECRET_KEY);
            user.updateLoginTimestamp(req.body.username);
            return res.json({token});
        }
    }catch(err){
        return next(err);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req, res, next){
    try{
        const newUser = user.register(req.body.username, req.body.password, req.body.first_name,req.body.last_name,req.body.phone)
        let token = jwt.sign(newUser, SECRET_KEY);
        user.updateLoginTimestamp(req.body.username);
        return res.json({token});
    }catch(err){
        return next(err);
    }
})

modules.exports = router;