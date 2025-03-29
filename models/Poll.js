const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // To generate unique voting links

const pollSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ text: String, votes:  { type: Number, default: 0 } }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deadline: { type: Date },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Voter" }], // Tracks who voted
    votingLink: { type: String, unique: true, default: () => uuidv4() } // Unique voting link
});

module.exports = mongoose.model("Poll", pollSchema);


