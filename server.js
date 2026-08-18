// requires
const express = require('express');
const db = require('./db');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');


// useables
const app = express();
const port = process.env.PORT || 3000;

// Middle ware for parsing the url encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// session middleware
app.use(session({
	store : new pgSession({
		conString : process.env.DATABASE_URL,
		createTableIfMissing : true, // auto create session table
	}),
	secret : process.env.SESSION_SECRET,
	resave : false,
	saveUninitialized : false,
	cookie : {
		secure : process.env.NODE_ENV === 'prod',
		httpOnly : true,
		maxAge : 30 * 24 * 60 * 60 * 1000
	}
}));

// check if user is authenticated middelware
function requireAuth(req, res, next){
	if(!req.session.userId){
		return res.status(401).json({error: "Authentication required"});
	}
	next();
}

// Server request handling

// workout logging
app.post('/log-workout', requireAuth, async (req, res) => {
	const {exercise, weight, reps} = req.body;
	const userId = req.session.userId;
	if(!exercise || !weight || !reps){
		return res.status(400).send("Missing required fields!");
	}
	try{
		const queryText = 'INSERT INTO workouts (exercise, weight, reps, user_id) VALUES ($1, $2, $3, $4)';
		const values = [exercise, weight, reps, userId];
		await db.query(queryText, values);
		console.log(`Logged workout: ${exercise}, ${weight}kg, ${reps} reps (user: ${userId})`);
		res.redirect('/'); // this redirects back to the root form.
	}catch(error){
		console.error('Db error!', error);
		res.status(500).send("Db error");
	}

});


// workout getting
app.get('/api/workouts', requireAuth, async (req, res) => {
	const userId = req.session.userId;
	try {
		const result = await db.query('SELECT * FROM workouts WHERE id = $1 ORDER BY id ASC', [userId]);
		res.json(result.rows);
	} catch (error) {
		console.error("DB ERROR!", error);
		res.status(500).json([]);
	}
});

// delete route
app.delete('//api/delete/:id', requireAuth, async (req, res)=>{
	const userId = req.session.userId;
	const vals = [parseInt(req.params.id, 10), userId];
	try{
		const delQuery = 'DELETE FROM workouts WHERE id = $1 AND user_id = $2';
		await db.query(delQuery, vals);
		res.status(200).json({message : "Deleted successfully"});

	}catch(error){
		console.error("deletion error", error.message);
		res.status(500).send("Some error" + error.message);
	}

});

// workout update
app.put('//api/update/:id', requireAuth, async (req, res)=>{
	const id = parseInt(req.params.id, 10);
	const {exercise, weight, reps} = req.body;
	const userId = req.session.userId;

	// validation
	if(!exercise || !weight || !reps){
		return res.status(400).send("Missing required fields!");
	}

	try{
		const updQuery = 'UPDATE workouts SET exercise=$1, weight = $2, reps=$3 WHERE id = $4 AND user_id = $5';
		const values = [exercise, weight, reps, id, userId];
		const result = await db.query(updQuery, values);

		if(result.rowCount === 0){
			return res.status(404).json({error: "Workout not found!"});
		}

		console.log("successfully updated the db!");
		res.status(200).json({message: "Updated successfully"});
	} catch(error){
		console.error(`Updating error: ${error.message}`);
		res.status(500).send("DB error during update");
	}
});


// signup route
app.post('/api/auth/signup', async(req, res)=>{
	const {username, password} = req.body;

	if(!username || !password){
		return res.status(400).json({error : 'Username and password are required'});
	}

	if(username.length < 3){
		return res.status(400).json({error: 'Username must be atleast 3 characters long'});
	}

	if(password.length < 6){
		return res.status(400).json({error: 'Password must be atleast 6 characters long'});
	}

	try{
		// check if user exists
		const usrCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
		if(usrCheck.rows.length > 0){
			return res.status(400).json({error: 'Username taken'});
		}

		// hashing
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// create the user
		const result = await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at', [username, passwordHash]);
		const user = result.rows[0];

		// login immediatly
		req.session.userId = user.id;
		req.session.username = user.username;

		res.status(201).json({messge: 'User created successfully', user: {
			id: user.id,
			username: user.username,
			created_at: user.created_at
		}});

	} catch(error){
		console.error("Signup went wrong" + error.message);
		res.status(500).json({error: `Internal server error : ${error.message}`});
	}

});

// login route
app.post('/api/auth/login', async (req, res)=>{
	const {username, password} = req.body;

	if(!username || !password){
		return res.status(400).json({error: 'username and password are required'});
	}

	try{
		const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
		if(result.rows.length === 0){ return res.status(401).json({error: 'Invalid usrname or password'});}
		const user = result.rows[0];

		// comparing password with stored hash
		const isMatch = await bcrypt.compare(password, user.password_hash);

		if(!isMatch){
			return res.status(401).json({error: 'Wrong username or password'});
		}

		req.session.userId = user.id;
		req.session.username = user.username;

		res.json({
			message: 'Login successfull',
			user: {
				id: user.id,
				username: user.username
			}
		});
	} catch(error){
		console.error("Login failed " + error.message);
		res.status(500).json({error: "internal server error"});
	}
});

// session check route
app.get('/api/auth/me', async (req, res)=>{
	if(!req.session.userId){
		return res.status(401).json({error: 'Not authenticated'});
	}

	try{
		const result = await db.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.session.userId]);
		if(result.rows.length === 0){
			req.session.destroy();
			return res.status(401).json({error: 'User not found'});
		}

		res.json({user: result.rows[0]});
	} catch (error){
		console.error("Auth check error " + error.messge);
		res.status(500).json({error: 'Internal server error'});
	}
});

// logout route
app.post('/api/auth/logout', (req, res)=>{
	req.session.destroy((err)=>{
		if(err){
			console.error("logout error " + err);
			return res.status(500).json({error: "internal server error"});
		}
		res.clearCookie('connect.sid'); 
		res.json({message: "logout successfull"});
	});
});

// 404 handling
app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, 'public', 'handlepoo.html'));
});

// launching the server I think?
app.listen(port, () => {
	console.log(`Example app is listening on port ${port}`);
});