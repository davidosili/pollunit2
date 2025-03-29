document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username"); // ✅ Retrieve username

    if (!token) {
        alert("⚠️ You must log in first!");
        window.location.href = "login.html";  
    } else {
        const welcomeMessage = document.getElementById("welcome-message");
        if (welcomeMessage) {
            welcomeMessage.innerText = `Welcome, ${username}!`;
        } else {
            console.error("❌ Element with ID 'welcome-message' not found.");
        }
    }
});

function logout() {
    localStorage.removeItem("token");  // Remove token
    localStorage.removeItem("username"); // ✅ Remove username
    alert("Logged out successfully!");
    window.location.href = "index.html";  // Redirect to login page
}

async function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:5000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Invalid credentials");

        if (!data.token) {
            throw new Error("No token received from server");
        }

        // ✅ Store token & username
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);

        console.log("Token saved:", data.token);  // ✅ Debugging
        alert("Login successful!");
        window.location.href = "dashboard.html";  

    } catch (error) {
        console.error("Login failed:", error);
        alert(error.message);
    }
}

//voting function
async function vote(pollId, optionIndex) {
    console.log("Voting for Poll ID:", pollId, "Option Index:", optionIndex); // ✅ Debugging

    const token = localStorage.getItem("token"); 
    if (!token) {
        alert("You must be logged in to vote!");
        return;
    }

    if (optionIndex === undefined || optionIndex === null || isNaN(optionIndex)) {
        alert("Invalid option selected.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/polls/${pollId}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ optionIndex: Number(optionIndex) }) // Ensure it's a number
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to vote");
        }

        alert("Vote submitted successfully!");
        loadPolls(); // Refresh polls to update vote counts
    } catch (error) {
        console.error("Error voting:", error);
        alert(error.message);
    }
}
//display link
function displayPollLink(poll) {
    const pollContainer = document.getElementById("polls-container"); // Assuming you have a div with this ID
    const pollElement = document.createElement("div");

    pollElement.innerHTML = `
        <h3>${poll.question}</h3>
        <p>Vote here: <a href="/vote.html?pollId=${poll._id}" target="_blank">Click to vote</a></p>
    `;

    pollContainer.appendChild(pollElement);
}

document.querySelector(".button-drop").addEventListener("click", function () {
    document.querySelector(".nav").classList.toggle("active");
});

document.querySelector(".close-btn").addEventListener("click", function () {
    document.querySelector(".nav").classList.remove("active");
});

