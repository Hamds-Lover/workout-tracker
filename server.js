// requires
const express = require('express');
const db = require('./db');
const path = require('path');

// useables
const app = express();
const port = process.env.PORT || 3000;

// Middle ware for parsing the url encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Server request handling

// workout logging
app.post('/log-workout', async (req, res) => {
	const {exercise, weight, reps} = req.body;
	if(!exercise || !weight || !reps){
		return res.status(400).send("Missing required fields!");
	}
	try{
		const queryText = 'INSERT INTO workouts (exercise, weight, reps) VALUES ($1, $2, $3)';
		const values = [exercise, weight, reps];
		await db.query(queryText, values);
		console.log(`Logged workout: ${exercise}, ${weight}kg, ${reps} reps`);
		res.redirect('/'); // this redirects back to the root form.
	}catch(error){
		console.error('Db error!', error);
		res.status(500).send("Db error");
	}

});


// workout getting
app.get('/api/workouts', async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM workouts ORDER BY id ASC');
		res.json(result.rows);
	} catch (error) {
		console.error("DB ERROR!", error);
		res.status(500).json([]);
	}
});

// delete route
app.delete('/api/delete/:id', async (req, res)=>{
	try{
		const vals = [req.params.id];
		const delQuery = 'DELETE FROM workouts WHERE id = $1';
		await db.query(delQuery, vals);
		res.status(200).json({message : "Deleted successfully"});

	}catch(error){
		console.error("deletion error", error.message);
		res.status(500).send("Some error" + error.message);
	}

});

// workout update
app.put('/api/update/:id', async (req, res)=>{
	const id = parseInt(req.params.id, 10);
	const {exercise, weight, reps} = req.body;

	// validation
	if(!exercise || !weight || !reps){
		return res.status(400).send("Missing required fields!");
	}

	try{
		const updQuery = 'UPDATE workouts SET exercise=$1, weight = $2, reps=$3 WHERE id = $4';
		const values = [exercise, weight, reps, id];
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

// 404 handling
app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, 'public', 'handlepoo.html'));
});

// launching the server I think?
app.listen(port, () => {
	console.log(`Example app is listening on port ${port}`);
});