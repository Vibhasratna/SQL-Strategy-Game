const express = require("express");
const mysql = require("mysql");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// **MySQL Connection**
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "vr@20212",
    database: "schemaverse"
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL");
});

// **Execute SQL Commands**
app.post("/execute", (req, res) => {
    const { sql } = req.body;
    console.log("📢 Executing SQL Command:", sql);

    if (!sql.toLowerCase().includes("update") && !sql.toLowerCase().includes("select")) {
        return res.json({ error: "Only SELECT and UPDATE commands are allowed." });
    }

    db.query(sql, (err, result) => {
        if (err) {
            console.error("SQL Execution Error:", err);
            return res.json({ error: err.sqlMessage });
        }

        // **Check if ships should be removed**
        removeDestroyedShips();

        // **Check if a winner exists**
        checkWinner();

        // **Emit real-time update**
        io.emit("update");
        res.json({ result });
    });
});

// **Remove Destroyed Ships**
function removeDestroyedShips() {
    db.query("DELETE FROM ships WHERE strength <= 0", (err, result) => {
        if (err) {
            console.error("Error removing destroyed ships:", err);
        } else if (result.affectedRows > 0) {
            console.log(`🔥 Removed ${result.affectedRows} destroyed ships`);
            io.emit("update");
        }
    });
}

// **Check for a Winner**
function checkWinner() {
    db.query("SELECT DISTINCT player FROM ships", (err, results) => {
        if (err) {
            console.error("Error checking for winner:", err);
            return;
        }

        if (results.length === 1) {
            let winner = results[0].player;
            io.emit("gameOver", { message: `🎉 ${winner} Wins!` });

            // Bonus points for the winner
            db.query("UPDATE players SET score = score + 500 WHERE username = ?", [winner], (err) => {
                if (err) console.error("Error updating winner's score:", err);
            });
        }
    });
}

// **Get Game Board Data**
app.get("/gameboard", (req, res) => {
    db.query("SELECT * FROM ships", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch game board data" });
        res.json(result);
    });
});

// **Get Leaderboard Data**
app.get("/leaderboard", (req, res) => {
    db.query("SELECT username, score FROM players ORDER BY score DESC", (err, result) => {
        if (err) {
            console.error("❌ Error fetching leaderboard:", err);
            return res.status(500).json({ error: "Failed to fetch leaderboard" });
        }
        console.log("📊 Leaderboard Data:", result); // Debugging output
        res.json(result);
    });
});


// **WebSocket Connection**
io.on("connection", (socket) => {
    console.log(`🔌 Player Connected - ID: ${socket.id}`);
    
    socket.on("disconnect", () => {
        console.log(`❌ Player Disconnected - ID: ${socket.id}`);
    });
});

// **Start Server**
const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
