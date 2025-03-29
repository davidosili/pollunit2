const express = require("express");
const jwt = require("jsonwebtoken");
const authenticateUser = require("../middleware/authUser"); // Ensure correct import
const Poll = require("../models/Poll"); // Ensure this model exists
const Voter = require("../models/voter"); // Ensure the correct path

const router = express.Router();

/** 🔹 CREATE A POLL */
router.post("/create", authenticateUser, async (req, res) => {
    try {
        const { question, options } = req.body;
        const userId = req.user?.id; // Ensure user ID exists

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: User ID missing." });
        }

        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ error: "Poll must have a question and at least two options." });
        }

        const newPoll = new Poll({
            question,
            options: options.map((text) => ({ text: text.trim(), votes: 0 })), // Trim option text
            createdBy: userId
        });

        await newPoll.save();

        const pollLink = `${req.protocol}://${req.get("host")}/vote.html?pollId=${newPoll._id}`; // Dynamically set frontend URL

        res.status(201).json({ message: "Poll created successfully!", poll: newPoll, pollLink });
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

/** 🔹 GET ALL POLLS */
router.get("/polls", async (req, res) => {
    try {
        const polls = await Poll.find();
        res.status(200).json(polls);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

/** 🔹 GET A SPECIFIC POLL */
router.get("/:pollId", async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.pollId).select("-options.votes"); // Exclude votes
        if (!poll) return res.status(404).json({ error: "Poll not found." });

        res.json(poll);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

/** 🔹 VOTER AUTHENTICATION MIDDLEWARE */
const authenticateVoter = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, "your-secret-key");
        req.voter = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token." });
    }
};

/** 🔹 VOTE ON A POLL */
router.post("/:pollId/vote", authenticateVoter, async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const poll = await Poll.findById(req.params.pollId);

        if (!poll) return res.status(404).json({ error: "Poll not found." });

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ error: "Invalid option selected." });
        }

        const voter = await Voter.findOne({ email: req.voter.email });
        if (!voter) {
            return res.status(400).json({ error: "Voter not registered." });
        }

        // Check if voter already voted
        const hasVoted = poll.voters.some(voterId => voterId.toString() === voter._id.toString());
        if (hasVoted) {
            return res.status(400).json({ error: "You have already voted on this poll." });
        }

        // ✅ Store only the voter ID
        poll.voters.push(voter._id);
        poll.options[optionIndex].votes += 1;

        await poll.save();
        res.json({ message: "Vote cast successfully!", poll });
    } catch (error) {
        console.error("Error during voting:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

module.exports = router;
