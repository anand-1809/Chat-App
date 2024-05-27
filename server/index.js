const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const app = express();

// Resolve CORS error by adding CORS middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));

app.use(express.json());

const server = app.listen(3001, () => {
    console.log("Server Running on Port 3001...");
});

const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log("User Joined Room: " + data);
    });

    socket.on("send_message", (data) => {
        console.log(data);
        socket.to(data.room).emit("receive_message", data.content);
    });

    socket.on("ping", () => {
        console.log("Received ping from client");
    });

    socket.on("disconnect", () => {
        console.log("USER DISCONNECTED");
    });
});
