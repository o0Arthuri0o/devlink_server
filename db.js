const Pool = require('pg').Pool
require('dotenv').config()

const pool = new Pool({
    user: 'postgres',
    password: '2315',
    port: 5432,
    host: 'localhost',
    database: 'devlinks'
  })

module.exports = pool