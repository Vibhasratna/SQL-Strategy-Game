const socket = io();

// **Execute SQL Command**
document.getElementById("executeBtn").addEventListener("click", () => {
    const sqlCommand = document.getElementById("sqlCommand").value;

    fetch("/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlCommand })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("SQL Error: " + data.error);
        } else {
            displayResults(data.result);
            updateGameBoard();
            updateLeaderboard();
            checkWinner();
        }
    });
});

// **Display SQL Query Results**
function displayResults(data) {
    const resultDiv = document.getElementById("queryResult");
    resultDiv.innerHTML = "";

    if (!data || data.length === 0) {
        resultDiv.innerHTML = "<p>No data found.</p>";
        return;
    }

    let table = "<table border='1'><tr>";
    Object.keys(data[0]).forEach(key => {
        table += `<th>${key}</th>`;
    });
    table += "</tr>";

    data.forEach(row => {
        table += "<tr>";
        Object.values(row).forEach(value => {
            table += `<td>${value}</td>`;
        });
        table += "</tr>";
    });

    table += "</table>";
    resultDiv.innerHTML = table;
}

// **Update Game Board with Row & Column Numbers**
function updateGameBoard() {
    fetch("/gameboard")
    .then(res => res.json())
    .then(data => {
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawGrid(ctx, canvas);

        data.forEach(ship => {
            const x = ship.position_x * 20; 
            const y = ship.position_y * 20;

            ctx.fillStyle = "red";
            ctx.fillRect(x, y, 15, 15);
            ctx.fillStyle = "white";
            ctx.fillText(ship.name, x, y - 5);
        });
    });
}

function updateLeaderboard() {
    fetch("/leaderboard")
    .then(res => res.json())
    .then(data => {
        console.log("📊 Leaderboard Data Received:", data); // Debugging output

        const leaderboardList = document.getElementById("leaderboardList");
        leaderboardList.innerHTML = ""; // Clear previous entries

        if (!data || data.length === 0) {
            leaderboardList.innerHTML = "<li>No players found.</li>";
            return;
        }

        data.forEach((player, index) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `#${index + 1} <b>${player.username}</b> - ${player.score} pts`;
            leaderboardList.appendChild(listItem);
        });
    })
    .catch(error => console.error("❌ Error fetching leaderboard:", error));
}




// **Draw Grid with Numbers**
function drawGrid(ctx, canvas) {
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.fillText(i / 20, i + 5, 10);
    }

    for (let j = 0; j < canvas.height; j += 20) {
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.fillText(j / 20, 5, j + 15);
    }

    ctx.stroke();
}

// **Listen for updates from the server**
socket.on("gameOver", (data) => {
    alert(data.message);
    document.querySelector(".leaderboard").innerHTML += `<p>${data.message}</p>`;
});


// **Initial Load**
updateLeaderboard();
updateGameBoard();
