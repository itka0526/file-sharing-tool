import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface useIOConnectReturnType {
    socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
    activeConnections: string[];
}

interface receivedFileProps {
    file: {
        name: string;
        data: ArrayBuffer;
        size: number;
        encoding: string;
        tempFilePath: string;
        truncated: boolean;
        mimetype: string;
        md5: string;
    };
}

export const useIOConnect = (): useIOConnectReturnType => {
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
    const [activeConnections, setActiveConnections] = useState<string[]>([]);

    useEffect(() => {
        const ws = io();
        setSocket(ws);
    }, []);

    useEffect(() => {
        if (!socket) return;
        async function listenServer({ file }: receivedFileProps) {
            console.log(file);
            const blob = new Blob([file.data]);
            saveAs(blob, `${file.name}.zip`);
        }

        socket.on("receiving_file", listenServer);
        return () => {
            socket.on("receiving_file", listenServer);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        async function listenServer(event: string[]) {
            setActiveConnections(event);
        }

        socket.on("active_connections", listenServer);
        return () => {
            socket.on("active_connections", listenServer);
        };
    }, [socket]);

    return { socket, activeConnections };
};
