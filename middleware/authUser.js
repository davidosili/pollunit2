const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "Access denied. No token provided." });

    const token = authHeader.split(" ")[1]; // Extract actual token from "Bearer <token>"

    if (!token) return res.status(401).json({ error: "Invalid token format." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
};

module.exports = authenticateUser;

