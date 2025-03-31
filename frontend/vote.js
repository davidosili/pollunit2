document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get("pollId");

    const pollQuestion = document.getElementById("poll-question");
    const optionsContainer = document.getElementById("options-container");
    const voteBtn = document.getElementById("vote-btn");
    const message = document.getElementById("message");
    const authBtn = document.getElementById("auth-btn");
    const voterNameInput = document.getElementById("voter-name");
    const voterEmailInput = document.getElementById("voter-email");
    const voterAuthSection = document.getElementById("voter-auth");
    const votingSection = document.getElementById("voting-section");

    if (!pollId) {
        message.textContent = "Invalid poll link.";
        return;
    }

    try {
        // ✅ Fetch poll details
        const response = await fetch(`https://pollunit2-1.onrender.com/polls/${pollId}`);
        const poll = await response.json();

        if (!response.ok) {
            throw new Error(poll.error || "Failed to load poll.");
        }

        pollQuestion.textContent = poll.question;

        // ✅ Handle voter authentication (Name & Email)
        authBtn.addEventListener("click", async () => {
            const name = voterNameInput.value.trim();
            const email = voterEmailInput.value.trim();

            if (!name || !email) {
                message.textContent = "Please enter your name and email.";
                return;
            }

            try {
                const response = await fetch("https://pollunit2-1.onrender.com/voters/authenticate", {  // ✅ Fixed API route
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Authentication failed.");

                const token = data.token;  // ✅ Ensure token is received

                // ✅ Save authentication info
                localStorage.setItem("token", token);
                sessionStorage.setItem("voterName", name);
                sessionStorage.setItem("voterEmail", email);

                console.log("Token saved:", token);  // ✅ Debugging

                // ✅ Show voting section after authentication
                voterAuthSection.style.display = "none";
                votingSection.style.display = "block";
            } catch (error) {
                message.textContent = "Error authenticating. Please try again.";
                console.error("Authentication error:", error);
            }
        });

        // ✅ Display poll options as radio buttons
        poll.options.forEach((option, index) => {
            const optionElement = document.createElement("div");
            optionElement.innerHTML = `
                <input type="radio" name="option" value="${index}" id="option${index}">
                <label for="option${index}">${option.text}</label>
            `;
            optionsContainer.appendChild(optionElement);
        });

        // ✅ Handle voting process
        voteBtn.addEventListener("click", async () => {
            const name = sessionStorage.getItem("voterName");
            const email = sessionStorage.getItem("voterEmail");

            if (!name || !email) {
                message.textContent = "Please enter your details first.";
                return;
            }

            const selectedOption = document.querySelector('input[name="option"]:checked');
            if (!selectedOption) {
                message.textContent = "Please select an option!";
                return;
            }

            const selectedOptionIndex = parseInt(selectedOption.value, 10);

            // ✅ Ensure the voter is authenticated
            const token = localStorage.getItem("token"); 
            console.log("Token being sent:", token);  // ✅ Debugging
            
            if (!token) {
                message.textContent = "Error: You must be logged in to vote.";
                return;
            }            

            try {
                const voteResponse = await fetch(`https://pollunit2-1.onrender.com/polls/${pollId}/vote`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`  // ✅ Pass token for authentication
                    },
                    body: JSON.stringify({ name, email, optionIndex: selectedOptionIndex })
                });

                const result = await voteResponse.json();

                if (voteResponse.ok) {
                    message.textContent = "Vote cast successfully!";
                } else {
                    message.textContent = `Error: ${result.error}`;
                }
            } catch (error) {
                message.textContent = "Error submitting vote. Please try again.";
                console.error("Voting error:", error);
            }
        });

    } catch (error) {
        message.textContent = "Error loading poll.";
        console.error("Poll fetch error:", error);
    }
});
