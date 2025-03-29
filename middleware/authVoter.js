const express = require("express");
const jwt = require("jsonwebtoken");
const Voter = require("../models/voter");
const router = express.Router();

router.post("/auth/vote", async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required." });
    }

    try {
        let voter = await Voter.findOne({ email });

        if (!voter) {
            // If voter doesn't exist, create a new one
            voter = new Voter({ name, email });
            await voter.save();
        }

        // Generate token (no password needed)
        const token = jwt.sign({ email, name }, "your-secret-key", { expiresIn: "1h" });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

module.exports = router;

