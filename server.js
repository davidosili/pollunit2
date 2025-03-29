require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/User");
const crypto = require("crypto");
const dotenv = require("dotenv");
const pollRoutes = require("./routes/pollRoutes");
const voterRoutes = require("./routes/voterRoutes"); // ✅ ADD THIS


const path = require("path");

dotenv.config();
const app = express();

app.use(express.json());

// Enable CORS for all requests
app.use(cors()); 

// If you want to restrict CORS to your frontend only:
app.use(cors({
    origin: "http://127.0.0.1:5501",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}));

app.use("/api", pollRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/polls", pollRoutes);
app.use("/voters", voterRoutes);

// Middleware
app.use(express.json()); // Enable JSON body parsing
app.use(cors()); // Allow cross-origin requests

// Connect to MongoDBH
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error("❌ MONGO_URI is not defined in the .env file!");
    process.exit(1); // Stop the server if MONGO_URI is missing
}

// ✅ Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log("✅ MongoDB Connected"))
   .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware to authenticate users using JWT
const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Extracts the token after "Bearer"

    if (!token) return res.status(401).json({ error: "Access Denied" });
   false;
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔍 Decoded Token Data:", verified);  // Log token payload

        req.user = verified; // Attach user data to the request
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("✅ API is working! Welcome to the backend.");
});

// ✅ Register Route
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to MongoDB
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "✅ User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in MongoDB
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT Token (Without Role)
        const token = jwt.sign(
            { id: user._id }, // ❌ Removed email & role
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.json({
            message: `✅ Welcome back, ${user.username}!`,
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Dashboard Route (Protected)
app.get("/dashboard", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("username");
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: `Welcome, ${user.username}!` });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

//profile
app.get("/profile", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Password reset

// 📌 Password Reset Request Route
require("dotenv").config(); // Ensure this is at the top of your file

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use the App Password here
    }
});

app.post("/request-password-reset", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        // Ensure token is stored as a string
        // Save token as a string and confirm it saves
        user.resetPasswordToken = String(resetToken);
        user.resetPasswordExpires = Date.now() + 3600000; // 1-hour expiration
        await user.save();

        console.log("✅ Saved User Token:", user.resetPasswordToken);
        console.log("🔍 Check Database: db.users.findOne({ email: '" + user.email + "' })");



        // Send reset email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const resetLink = `http://127.0.0.1:5501/backend-project/frontend/reset-password.html?token=${resetToken}`;
        console.log("🔗 Generated Reset Link:", resetLink);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            text: `Click the link below to reset your password: \n${resetLink}`
        });

        res.json({ message: "✅ Password reset link sent to your email!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 Password Reset Confirmation Route
app.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find the user using the reset token
        console.log("🔍 Token received from frontend:", token);
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        console.log("🔍 Token in database:", user ? user.resetPasswordToken : "No user found");
        
        if (!user) {
            return res.status(400).json({ error: "❌ User with token not found!" });
        }
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log("✅ Password reset successful for:", user.email);
        res.json({ message: "✅ Password reset successful! You can now log in." });
    } catch (error) {
        console.error("❌ Error in password reset:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


const authRoutes = require("./routes/authRoutes");


app.use(express.json()); // Middleware to parse JSON requests

// ✅ Use authentication routes
app.use("/auth", authRoutes);

console.log("🔹 JWT Secret:", process.env.JWT_SECRET);



// ✅ Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, "frontend")));

