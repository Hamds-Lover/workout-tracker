// Base url
const BASE_URL = window.location.origin + "/api";

console.log("Base url: " + BASE_URL);

async function getData() {
	const url = `${BASE_URL}/workouts`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}
		const result = await response.json();
		//console.log(result);
		return result;
	} catch (error) {
		console.error(`Error: ${error.message}`);
	}
}

async function loadData() {
	const workouts = await getData();
	const wList = document.querySelector('.w-list');
	wList.innerHTML = "";
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
}


async function deleteWorkout(id){
	const delUrl = `${BASE_URL}/delete/${id}`

	try{
		const delResp = await fetch(delUrl, {method: 'DELETE'});
		if(!delResp.ok){
			throw new Error(`Something failed, response status: ${delResp.status}`);
		}
		await loadData();
	} catch(err){
		console.error("Something went wrong: ", err.message);
	}

}

async function updateWorkout( id, exercise, weight, reps){
	const updUrl = `${BASE_URL}/update/${id}`;

	try{
		const updResp = await fetch(updUrl, {method: 'PUT', headers: {'Content-type': 'application/json',}, body: JSON.stringify({exercise: exercise, weight: weight, reps: reps})});
		if(!updResp.ok){
			throw new Error(`Updating failed, response status: ${updResp.status}`);
		}
		console.log("Updated successfully");
	} catch(err){
		console.error("Something went wrong", err.message);
	}
}

// to load data automatically at refresh
loadData();