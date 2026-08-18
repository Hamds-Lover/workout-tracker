const workoutSection = document.getElementById('workout-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const loading = document.getElementById('loading');
const wList = document.querySelector('.w-list');

// helper functions

async function getData() {
	const response = await fetch('/api/workouts');
	if (!response.ok) {
		throw new Error(`Response status: ${response.status}`);
	}
	return await response.json();
}

async function loadData() {
	try{
		const workouts = await getData();
		wList.innerHTML = "";
		if(workouts.length === 0){
			wList.innerHTML = '<li>No workouts logged yet. Start tracking!</li>';
       		return;
		}
			workouts.forEach(workout => {
			// the list entry
			const newEntry = document.createElement('li');
			newEntry.id = `workout-${workout.id}`;

			//container for the workout display
			const displayCont = document.createElement('span');
			displayCont.className = 'workout-display';
			displayCont.textContent = `Exercise: ${workout.exercise}, weight: ${workout.weight}Kg for ${workout.reps} reps. `;
			// Edit form container
			const editCont = document.createElement('span');
			editCont.className = 'workout-edit';
			editCont.style.display = 'none';

			// input fields for the edit
			const editExercise = document.createElement('input');
			editExercise.type = 'text';
			editExercise.value = workout.exercise;
			editExercise.placeholder = 'Exercise';
			editExercise.className = 'edit-exercise';

			const editWeight = document.createElement('input');
			editWeight.type = 'number';
			editWeight.value = workout.weight;
			editWeight.placeholder = 'Weight';
			editWeight.className = 'edit-weight';

			const editReps = document.createElement('input');
			editReps.type = 'number';
			editReps.value = workout.reps;
			editReps.placeholder = 'Reps';
			editReps.className = 'edit-reps';

			const saveBtn = document.createElement('button');
			saveBtn.textContent = 'Save';
			saveBtn.className = 'save-btn'

			const cancelBtn = document.createElement('button');
			cancelBtn.textContent = 'cancel';
			cancelBtn.className = 'cancel-btn'

			// appending in the edit cont
	        editCont.appendChild(editExercise);
	        editCont.appendChild(document.createTextNode(' '));
	        editCont.appendChild(editWeight);
	        editCont.appendChild(document.createTextNode(' '));
	        editCont.appendChild(editReps);
	        editCont.appendChild(document.createTextNode(' '));
	        editCont.appendChild(saveBtn);
	        editCont.appendChild(document.createTextNode(' '));
	        editCont.appendChild(cancelBtn);

	        // btns container
	        const btnCont = document.createElement('span');

	        const editBtn = document.createElement('button');
	        editBtn.textContent = 'Edit';
	        editBtn.className = 'edit-btn';

	        const delBtn = document.createElement('button');
	        delBtn.textContent = 'Delete';
	        delBtn.className = `del-work`;

	        btnCont.appendChild(delBtn);
	        btnCont.appendChild(editBtn);

	        newEntry.appendChild(displayCont);
	        newEntry.appendChild(editCont);
	        newEntry.appendChild(btnCont);

	        wList.appendChild(newEntry);
			// event listeners
	        editBtn.addEventListener('click', ()=>{
	        	displayCont.style.display = 'none';
	        	editCont.style.display = 'inline';
	        	editBtn.style.display = 'none';
	        });

	        saveBtn.addEventListener('click', async ()=>{
	        	const updEx = editExercise.value.trim();
	        	const updWeight = parseInt(editWeight.value, 10);
	        	const updReps = parseInt(editReps.value, 10);

	        	// validation
	        	if(!updEx || !updWeight || !updReps){
	        		alert("Please fill in the fields!");
	        		return;
	        	}

	        	await updateWorkout(workout.id, updEx, updWeight, updReps);

	        	await loadData();
	        });

			delBtn.addEventListener('click', ()=>{
				deleteWorkout(workout.id);
			});

			cancelBtn.addEventListener('click', ()=>{
			    displayCont.style.display = 'inline';
			    editCont.style.display = 'none';
			    editBtn.style.display = 'inline';
			});
		});
	} catch(error){
		console.error('Load data error: ', error);
        wList.innerHTML = '<li>Error loading workouts. Please try again.</li>';
	}
}


async function deleteWorkout(id){
	const delUrl = `/api/delete/${id}`;

	try{
		const delResp = await fetch(delUrl, {method: 'DELETE'});
		if(!delResp.ok){
			throw new Error(`Something failed, response status: ${delResp.status}`);
		}
		await loadData();
	} catch(err){
		console.error("Something went wrong: ", err.message);
		alert("failed to delete workout!");
	}

}

async function updateWorkout( id, exercise, weight, reps){
	const updUrl = `/api/update/${id}`;
	const updResp = await fetch(updUrl, {method: 'PUT', headers: {'Content-type': 'application/json',}, body: JSON.stringify({exercise: exercise, weight: weight, reps: reps})});
	if(!updResp.ok){
		throw new Error(`Updating failed, response status: ${updResp.status}`);
	}
	return await updResp.json();
}

async function logoutUser(){
	const response = await fetch('/api/auth/logout', {
		method: 'POST',
		headers: {'Content-type': 'application/json'}
	});

	if(!response.ok){
		throw new Error('Logout failed');
	}

	window.location.href = '/auth.html';
}

// auth check status

async function checkAuthAndInit(){
	try{
		const response = await fetch('/api/auth/me');
		if(!response.ok){
			window.location.href = '/auth.html';
			return;
		}
		const data = await response.json();
		const user = data.user;

		// show ui
		loading.style.display = 'none';
		workoutSection.style.display = 'block';
		userInfo.style.display = 'flex';
		usernameDisplay.textContent = user.username;

		// load workouts
		await loadData();

		// setup logout
		document.getElementById('logout-btn').addEventListener('click', async()=>{
			try{
				await logoutUser();
			} catch(error){
				console.error('Logout failed: ', error.message);
			}
		});
	} catch(error){
		console.error("Auth check failed: ", error);
		window.location.href = '/auth.html';
	}
}

// start the app
checkAuthAndInit();