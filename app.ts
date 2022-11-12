import express from "express";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fileUpload from "express-fileupload";

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1gb" }));
app.use(express.static(path.join(__dirname, "build")));

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e9,
});

const global: { sockets: string[] } = { sockets: [] };

function checkActiveConnections() {
    global.sockets = Array.from(io.sockets.sockets.keys());
    io.emit("active_connections", global.sockets);
}

io.on("connection", (socket) => {
    checkActiveConnections();
    socket.on("sending_file", (event) => {
        socket.emit("receiving_file", event);
    });

    socket.on("disconnect", () => checkActiveConnections());
});

app.post("/save", fileUpload({ createParentPath: true }), (req, res) => {
    try {
        const file = req.files;
        if (!file) {
            res.send({
                status: false,
                message: "No file uploaded",
            });
        } else {
            io.emit("receiving_file", file);
            res.send({
                status: true,
                message: "File is being shared",
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

server.listen(PORT, () => console.log(`Server is on port: ${PORT}`));
