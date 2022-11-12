"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
dotenv_1.default.config();
const PORT = 4000 || process.env.PORT;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1gb" }));
app.use(express_1.default.static(path_1.default.join(__dirname, "build")));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    maxHttpBufferSize: 1e9,
});
const global = { sockets: [] };
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
app.post("/save", (0, express_fileupload_1.default)({ createParentPath: true }), (req, res) => {
    try {
        const file = req.files;
        if (!file) {
            res.send({
                status: false,
                message: "No file uploaded",
            });
        }
        else {
            io.emit("receiving_file", file);
            res.send({
                status: true,
                message: "File is being shared",
            });
        }
    }
    catch (err) {
        res.status(500).send(err);
    }
});
server.listen(PORT, () => console.log(`Server is on port: ${PORT}`));
