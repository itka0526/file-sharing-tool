type sendFileProps = {
    zippedFile: Blob;
    zippedFileName: string;
};

type sendFileReturnTypes = {
    status: boolean;
    message: string;
};

export default async function sendFile({ zippedFile, zippedFileName }: sendFileProps): Promise<sendFileReturnTypes> {
    const data = new FormData();
    data.append("file", zippedFile, zippedFileName);

    const pending_response = await fetch("/save", {
        method: "POST",
        body: data,
    });

    const response: sendFileReturnTypes = await pending_response.json();
    return response;
}
