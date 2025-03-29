const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Register a new user (No Role)
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({ username, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" });

    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// ✅ User Login (No Role)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

        // Generate JWT Token (No role in token)
        const token = jwt.sign(
            { id: user._id },  
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful!", token });

    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

module.exports = router;
