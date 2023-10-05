const express = require('express');
const user = require('../models/user');
const message = require('../models/message');
const { ensureLoggedIn } = require('../middleware/auth');
const ExpressError = require('../expressError');
const router = new express.Router();



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try{
        const msg = await message.get(req.params.id);
        if(req.user.username == msg.to_username || req.user.username == msg.from_username){
            return res.json(msg);
        } else {
            throw new ExpressError("not a valid party", 400);
        }
    }catch(err){
        return next(err);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next){
    try{
        const msg = await message.create({from_username: req.user.username, to_username: req.body.to_username, body: req.body.body});
        return msg;
    }catch(err){
        return next(err);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try{
        const msg = await message.get(req.params.id);
        if(req.user.username == msg.to_username){
            return res.json(message.markRead(req.params.id));
        } else {
            throw new ExpressError("not the recipiant", 400);
        }
    }catch(err){
        return next(err);
    }
})