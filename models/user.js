/** User class for message.ly */
const bcrypt = require('bcrypt');
const db = require('../db');
const config = require('../config');
const ExpressError = require('../expressError');


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const result = await db.query(`SELECT username FROM users WHERE username=$1`,[username]);
    let user = result.rows[0];
    if(user){
      throw new ExpressError("username already taken", 400)
    }else{
      const newPassword = await bcrypt.hash(password, config.BCRYPT_WORK_FACTOR);
      await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username`, 
        [username, newPassword, first_name, last_name, phone]);
      return {username, password: newPassword, first_name, last_name, phone};
    }
    
  }  

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let result = await db.query(`SELECT username, password FROM users WHERE username=$1`,[username]);
    const user = result.rows[0];
    if(user){
      result = await bcrypt.compare(password, user.password);
      if(result == true){
        return true;
      }else{
        return false;
      }
    } 
    return false;
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username=$1 Returning last_login_at`, [username]);
    if(result.rows[0]){
      return true;
    } else{
      throw new ExpressError("invalid username", 400);
    }
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(`SELECT username, first_name, last_name, phone
    FROM users`);
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username=$1`,[username]);
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`
    SELECT id, to_username, u.first_name, u.last_name, u.phone,
    body, sent_at, read_at
    FROM messages
    JOIN users u ON messages.to_username = u.username
    WHERE from_username = $1`, [username]);
    return result.rows.map(msg => ({id: msg.id, to_user: {username: msg.to_username, first_name: msg.first_name, last_name: msg.last_name, phone: msg.phone}, body: msg.body, sent_at: msg.sent_at, read_at: msg.read_at}));
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`
    SELECT id, u.username name, u.first_name, u.last_name, u.phone,
    body, sent_at, read_at
    FROM messages
    JOIN users u ON messages.from_username = u.username
    WHERE to_username = $1`, [username]);
    return result.rows.map(msg => ({id: msg.id, from_user: {username: msg.name, first_name: msg.first_name, last_name: msg.last_name, phone: msg.phone}, body: msg.body, sent_at: msg.sent_at, read_at: msg.read_at})); }
}


module.exports = User;