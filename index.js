const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const path = require("path");
require('dotenv').config();
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());
app.use(express.json());

// Add middleware to log ALL incoming requests
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	next();
});

const PORT = process.env.PORT || 5000;

// Define the root route
app.get('/', (req, res) => {
	console.log('ROOT ROUTE HIT!');
	res.status(200).json({ 
		message: "Video chat server is running",
		timestamp: new Date().toISOString(),
		port: PORT
	});
});

// Add a test route
app.get('/health', (req, res) => {
	console.log('HEALTH CHECK ROUTE HIT!');
	res.status(200).json({ 
		status: "OK",
		uptime: process.uptime()
	});
});

// Catch-all for undefined routes
app.use((req, res) => {
	console.log('404 - Route not found:', req.method, req.url);
	res.status(404).json({ 
		error: "Route not found",
		path: req.url,
		method: req.method
	});
});

io.on("connection", (socket) => {
	console.log('Socket.IO client connected:', socket.id);
	socket.emit("me", socket.id);

	socket.on("disconnect", () => {
		console.log('Socket.IO client disconnected:', socket.id);
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		console.log('callUser event:', { from, to: userToCall, name });
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => {
		console.log('answerCall event:', { to: data.to });
		io.to(data.to).emit("callAccepted", data.signal)
	});
});

server.listen(PORT, () => {
	console.log(`=======================================`);
	console.log(`Server is running on port ${PORT}`);
	console.log(`Time: ${new Date().toISOString()}`);
	console.log(`=======================================`);
});