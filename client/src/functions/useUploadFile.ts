import axios, { AxiosProgressEvent } from "axios";
import { useState } from "react";

type sendFileProps = {
    zippedFile: Blob;
    zippedFileName: string;
};

type responseType = {
    status: boolean;
    message: string;
};

type useUploadFileReturnType = {
    progress: number;
    sendFile(arg: sendFileProps): Promise<responseType>;
    loading: boolean;
};

export default function useUploadFile(): useUploadFileReturnType {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    async function sendFile({ zippedFile, zippedFileName }: sendFileProps): Promise<responseType> {
        setLoading(true);
        const data = new FormData();
        data.append("file", zippedFile, zippedFileName);

        const pending_response = await axios.request({
            method: "post",
            url: "/save",
            data: data,
            params: {
                name: zippedFileName,
            },
            onUploadProgress: handleProgress,
        });
        const response: Promise<responseType> = pending_response.data;

        setLoading(false);
        return response;
    }

    function handleProgress(e: AxiosProgressEvent) {
        setProgress((e.total && (e.loaded / e.total) * 100) || 0);
    }

    return { progress, sendFile, loading };
}
