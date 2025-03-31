const API_URL = "https://pollunit2-1.onrender.com"; // Backend URL

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// ✅ Login Function
async function loginUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.token) {
        localStorage.setItem("token", data.token); // Store JWT
        localStorage.setItem("username", data.user.username); // ✅ Store username
        alert("✅ Login Successful!");
        window.location.href = "dashboard.html"; // Redirect to dashboard
    } else {
        alert(`❌ ${data.error}`);
    }
    
}

// ✅ Function to Fetch and Display User Info on Dashboard
async function loadDashboard() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username"); // Get username

    if (!token) {
        alert("⚠️ Not logged in! Redirecting to login...");
        window.location.href = "index.html"; // Redirect to login
        return;
    }

    const response = await fetch(`${API_URL}/dashboard`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
        // ✅ Display username on the dashboard
        document.getElementById("user-greeting").innerText = `👋 Welcome, ${username}!`;
    } else {
        alert("⚠️ Session expired! Login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "index.html";
    }
}

// ✅ Logout Function
function logoutUser() {
    localStorage.removeItem("token");
    alert("✅ Logged out!");
    window.location.href = "index.html"; // Redirect to login page
}

//register function
async function registerUser() {
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!username || !email || !password) {
        alert("⚠️ All fields are required.");
        return;
    }

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }) // ✅ Removed role
    });

    const data = await response.json();

    if (response.ok) {
        alert(`✅ Registration successful! Logging you in...`);

        // ✅ Auto-login the user after registration
        const loginResponse = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
            localStorage.setItem("token", loginData.token);  // Store token
            localStorage.setItem("username", username); // ✅ Store username

            window.location.href = "dashboard.html"; // Redirect to dashboard
        } else {
            alert("❌ Registration successful, but login failed. Please log in manually.");
            window.location.href = "login.html"; 
        }
    } else {
        alert(`❌ Error: ${data.error}`);
    }
}
