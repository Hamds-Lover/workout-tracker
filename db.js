// db connection stuff

// requires
const { Pool } = require('pg');
require('dotenv').config();

// connections/connections pool
const pool =  new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized : false
	}
});

module.exports = {
	query: (text, params) => pool.query(text, params),
};