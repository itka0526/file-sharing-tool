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
const crypto_1 = require("crypto");
const stream_1 = __importDefault(require("stream"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1gb" }));
app.use(express_1.default.static(path_1.default.join(__dirname, "/build")));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    maxHttpBufferSize: 1e8,
});
const global = { sockets: [], files: [] };
function checkActiveConnections() {
    global.sockets = Array.from(io.sockets.sockets.keys());
    io.emit("active_connections", global.sockets);
}
function checkActiveFiles() {
    const identifiers = global.files.map(({ id, name }) => ({ id, name }));
    io.emit("receiving_file", identifiers);
}
io.on("connection", (socket) => {
    checkActiveConnections();
    checkActiveFiles();
    socket.on("sending_file", (event) => {
        socket.emit("receiving_file", event);
    });
    socket.on("disconnect", () => checkActiveConnections());
});
app.get("/files", (req, res) => {
    const failedID = { status: false, message: "Invalid file ID" };
    const failed = { status: false, message: "File does not exist" };
    if (!req.query.id)
        return res.send(failedID);
    const result = global.files.find(({ id }) => id === req.query.id);
    if (!result)
        return res.send(failed);
    //@ts-ignore
    const file = result.file.file;
    const readStream = new stream_1.default.PassThrough();
    readStream.end(file.data);
    res.set("Content-disposition", `attachment; filename=${file.name}.zip`);
    res.set("Content-Type", `${file.mimetype}`);
    readStream.pipe(res);
    global.files.splice(global.files.findIndex(({ id }) => id === result.id), 1);
    checkActiveFiles();
});
app.post("/save", (0, express_fileupload_1.default)({ createParentPath: true }), (req, res) => {
    const failed = { status: false, message: "No file uploaded" };
    const error = { status: false, message: "Error reading files" };
    const success = { status: true, message: "File is being shared" };
    try {
        const file = req.files;
        if (!file) {
            return res.send(failed);
        }
        else {
            const name = req.query.name || file.file.name;
            global.files.push({ file: file, id: (0, crypto_1.randomUUID)(), name: name });
            checkActiveFiles();
            res.send(success);
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(error);
    }
});
server.listen(PORT, () => console.log(`Server is on port: ${PORT}`));
