// authentication logic
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

// DOM refs
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');

// Helper functions
function showError(element, message){
	element.textContent = message;
	element.style.display = 'block';
	setTimeout(()=>{
		element.style.display = 'none';
	}, 5000);
}

function clearErrors(){
	loginError.style.display = 'none';
	signupError.style.display = 'none';
}

function showLogin(){
	loginForm.style.display = 'block';
	signupForm.style.display = 'none';
	clearErrors();
}

function showSignup(){
	loginForm.style.display = 'none';
	signupForm.style.display = 'block';
	clearErrors();
}

// auth functions
async function loginUser(username, password){
	const response = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-type': 'application/json'},body: JSON.stringify({username, password})});
	if(!response.ok){
		const data = await response.json();
		throw new Error(data.error || 'Login error');
	}
	return await response.json();
}

async function signupUser(username, password){
	const response = await fetch('/api/auth/signup', {method: 'POST', headers: {'Content-type': 'application/json'},body: JSON.stringify({username, password})});
	if(!response.ok){
		const data = await response.json();
		throw new Error(data.error || 'Login error');
	}
	return await response.json();
}

async function checkAut(){
	try{
		const response = await fetch('/api/auth/me');
		if(!response.ok){
			return null;
		}
		const data = await response.json();
		return data.user
	} catch (error){
		console.error("Auth check error "+error);
		return null;
	}
}

// Event listeners

document.getElementById('login-btn').addEventListener('click', async ()=>{
	const username = loginUsername.value.trim();
	const password = loginPassword.value.trim();

	if(!username || !password){
		showError(loginError, 'Please enter both username and password!');
		return;
	}

	try{
		await loginUser(username, password);
		window.location.href = '/'; // success -> redirect to homepage
	} catch(error){
		showError(loginError, error.message);
		loginPassword.value = '';
	}
});

document.getElementById('signup-btn').addEventListener('click', async ()=>{
	const username = signupUsername.value.trim();
	const password = signupPassword.value.trim();

	if(!username || !password){
		showError(signupError, 'Please provide username and password');
		return;
	}

	if(username.length < 3){
        showError(signupError, 'Username must be at least 3 characters');
        return;
    }

    if(password.length < 6){
        showError(signupError, 'Password must be at least 6 characters');
        return;
    }

    try{
    	await signupUser(username, password);
		window.location.href = '/'; // success -> redirect to homepage
    } catch(error){
    	showError(signupError, error.message);
    	signupPassword.value = '';
    }
});

// keyboard enter key support
loginPassword.addEventListener('keypress', (e)=>{
	if(e.key === 'Enter'){
		document.getElementById('login-btn').click();
	}
});

loginUsername.addEventListener('keypress', (e)=>{
	if(e.key === 'Enter'){
		document.getElementById('login-btn').click();
	}
});

signupPassword.addEventListener('keypress', (e)=>{
	if(e.key === 'Enter'){
		document.getElementById('signup-btn').click();
	}
});

signupUsername.addEventListener('keypress', (e)=>{
	if(e.key === 'Enter'){
		document.getElementById('signup-btn').click();
	}
});


// toggle between forms
document.getElementById('show-signup-btn').addEventListener('click', (e)=>{
	e.preventDefault();
	showSignup();
});

document.getElementById('show-login-btn').addEventListener('click', (e)=>{
	e.preventDefault();
	showLogin();
});


// check if user is already lgged in
async function redirectIfLoggedIn(){
	const user = await checkAut();
	if(user){
		window.location.href = '/';
	}
}

redirectIfLoggedIn();