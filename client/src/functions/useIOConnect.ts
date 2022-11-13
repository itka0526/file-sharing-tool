import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface useIOConnectReturnType {
    socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
    activeConnections: string[];
    downloadableFiles: string[];
}

export const useIOConnect = (): useIOConnectReturnType => {
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
    const [downloadableFiles, setDownloadableFiles] = useState<string[]>([]);
    const [activeConnections, setActiveConnections] = useState<string[]>([]);

    useEffect(() => {
        const ws = io();
        setSocket(ws);
    }, []);

    useEffect(() => {
        if (!socket) return;
        async function listenServer(urls: string[]) {
            setDownloadableFiles(urls.map((url) => `/files?id=${url}`));
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

    return { socket, activeConnections, downloadableFiles };
};
