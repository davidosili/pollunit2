const express = require("express");
const Voter = require("../models/voter");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();


// Voter Authentication and Auto-Registration
router.post("/authenticate", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required." });
        }

        let voter = await Voter.findOne({ email });

        if (!voter) {
            // Ensure no duplicate emails exist
            voter = await Voter.findOneAndUpdate(
                { email }, // Search for existing voter by email
                { name, email }, // Set name & email
                { new: true, upsert: true, setDefaultsOnInsert: true } // Create if not found
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { voterId: voter._id, name: voter.name, email: voter.email },
            "your-secret-key",
            { expiresIn: "1h" }
        );

        res.json({ message: "Authentication successful", token, voterId: voter._id });

    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: "Duplicate email detected. Try another email." });
        } else {
            console.error("Error during authentication:", error);
            res.status(500).json({ error: "Server error: " + error.message });
        }
    }
});

module.exports = router;
