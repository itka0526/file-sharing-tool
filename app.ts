import express from "express";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fileUpload, { UploadedFile } from "express-fileupload";
import { randomUUID } from "crypto";
import stream from "stream";
dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1gb" }));
app.use(express.static(path.join(__dirname, "/build")));

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
});

type tempEntry = {
    id: string;
    name: string;
    file: fileUpload.FileArray;
};

type responseType = {
    status: boolean;
    message: "File is being shared" | "No file uploaded" | "File does not exist" | "Error reading files" | "Invalid file ID";
};

const global: { sockets: string[]; files: tempEntry[] } = { sockets: [], files: [] };

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
    const failedID: responseType = { status: false, message: "Invalid file ID" };
    const failed: responseType = { status: false, message: "File does not exist" };
    if (!req.query.id) return res.send(failedID);

    const result: tempEntry | undefined = global.files.find(({ id }) => id === req.query.id);
    if (!result) return res.send(failed);

    //@ts-ignore
    const file: UploadedFile = result.file.file;

    const readStream = new stream.PassThrough();
    readStream.end(file.data);

    res.set("Content-disposition", `attachment; filename=${file.name}.zip`);
    res.set("Content-Type", `${file.mimetype}`);

    readStream.pipe(res);

    global.files.splice(
        global.files.findIndex(({ id }) => id === result.id),
        1
    );

    checkActiveFiles();
});

app.post("/save", fileUpload({ createParentPath: true }), (req, res) => {
    const failed: responseType = { status: false, message: "No file uploaded" };
    const error: responseType = { status: false, message: "Error reading files" };
    const success: responseType = { status: true, message: "File is being shared" };
    try {
        const file: any = req.files;
        if (!file) {
            return res.send(failed);
        } else {
            const name = req.query.name || file.file.name;
            global.files.push({ file: file, id: randomUUID(), name: name });
            checkActiveFiles();
            res.send(success);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send(error);
    }
});

server.listen(PORT, () => console.log(`Server is on port: ${PORT}`));
