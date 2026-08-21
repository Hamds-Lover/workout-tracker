const workoutSection = document.getElementById('workout-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const loading = document.getElementById('loading');
const wList = document.querySelector('.w-list');
let volumeChart = null;
let breakdownChart = null;

// helper functions

function formatDate(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    // Example: "Dec 25, 2025, 2:30 PM"
    return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
    });
}

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
			displayCont.textContent = `Exercise: ${workout.exercise}, weight: ${workout.weight}Kg for ${workout.reps} reps, (${formatDate(workout.created_at)}) `;
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

async function loadStats(){
	try{
		const response = await fetch('/api/stats');
		if(!response.ok){
			throw new Error('Failed to get stats');
		}
		const data = await response.json();

		// update stat cards
		document.getElementById('total-workouts').textContent = data.totalWorkouts;
		document.getElementById('total-volume').textContent = data.totalVolume.toLocaleString();
		document.getElementById('top-exercise').textContent = data.topExercise;

		// render personal records
		const prList = document.getElementById('pr-list');
		prList.innerHTML = '';
		if(data.personalRecords.length === 0){
			prList.innerHTML = '<li style="grid-column: 1/-1; text-align: center; color: #6c757d;">No records Yet. Log some workouts!</li>';
		}else{
			data.personalRecords.forEach(pr=>{
				const li = document.createElement('li');
				li.innerHTML = `<span class="pr-exercise">${pr.exercise}</span><span class="pr-weight">${pr.max_weight} kg</span>`;
				prList.appendChild(li);
			});
		}

		// render volume chart
		const ctx1 = document.getElementById('volume-chart').getContext('2d');
		const weekLabels = data.weeklyData.map(d=>{
			const date = new Date(d.week);
			return date.toLocaleString('en-US', {month: 'short', day: 'numeric'});
		});
		const volumeData = data.weeklyData.map(d=>d.volume);

		if(volumeChart){
			volumeChart.destroy();
		}

		volumeChart = new Chart(ctx1,{
			type: 'bar',
			data: {
				labels: weekLabels.length ? weekLabels : ['No Data'],
				datasets: [{
					label: 'Volume (Kg)',
					data: volumeData.length ? volumeData : [0],
					backgroundColor: '#4a90d9',
					borderColor: '#357abd',
					borderWidth: 1,
	                borderRadius: 4,
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: { display: false },
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(0,0,0,0.05)' },
					},
					x: {
						grid: { display: false },
					}
				}
			}
		});

		// Render breakdown chart
		const ctx2 = document.getElementById('breakdown-chart').getContext('2d');
		const exerciseNames = data.exerciseBreakdown.map(e=>e.exercise);
		const exerciseCounts = data.exerciseBreakdown.map(e=>e.count);
		const colors = ['#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db'];

		if(breakdownChart){
			breakdownChart.destroy();
		}
		breakdownChart = new Chart(ctx2, {
           	type: 'doughnut',
            data: {
                labels: exerciseNames.length ? exerciseNames : ['No Data'],
                datasets: [{
                    data: exerciseCounts.length ? exerciseCounts : [1],
                    backgroundColor: exerciseNames.length ? colors.slice(0, exerciseNames.length) : ['#e9ecef'],
                    borderWidth: 2,
                    borderColor: 'white',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 12,
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '60%',
            }
		});
	} catch (error){
        console.error('Stats error:', error);
        document.querySelector('.stats-grid').innerHTML = '<div class="stat-card" style="grid-column: 1/-1; text-align: center; color: #e74c3c;">Error loading stats. Please try again.</div>';
    }
}

// dashboard toggle
let dashboardVisible = false;
const dashboardSection = document.getElementById('dashboard-section');
const toggleBtn = document.getElementById('toggle-dashboard');

toggleBtn.addEventListener('click', async () => {
	dashboardVisible = !dashboardVisible;
	if(dashboardVisible){
		dashboardSection.style.display = 'block';
		toggleBtn.textContent = "Hide Dashboard";
		await loadStats();
	}else{
		dashboardSection.style.display = 'none';
		toggleBtn.textContent = 'Show dashboard';

		// Destroy charts to free mem
		if(volumeChart){volumeChart.destroy(); volumeChart = null;}
		if (breakdownChart){breakdownChart.destroy(); breakdownChart = null;}
	}
});

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

		// Hide dashboard by default
		dashboardSection.style.display = 'none';
		toggleBtn.textContent = 'Show dashboard';

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