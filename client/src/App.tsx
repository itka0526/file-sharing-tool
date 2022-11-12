import { useState } from "react";
import { useIOConnect } from "./functions/useIOConnect";
import Spinner from "./components/Spinner";
import JSZip from "jszip";
import { FolderPlus, Upload } from "react-feather";
import useUploadFile from "./functions/useUploadFile";

function App() {
    const { activeConnections } = useIOConnect();

    const [files, setFiles] = useState<FileList | null>(null);

    const [message, setMessage] = useState("");

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => setFiles(e.target.files);
    const { loading, progress, sendFile } = useUploadFile();

    const handleClick = async () => {
        if (files?.length === 0) return;
        if (!files) return;

        let zippedFileName: string = "";

        const zip = JSZip();

        for (let file = 0; file < files.length; file++) {
            zippedFileName += files[file].name + "|";
            zip.file(files[file].name, files[file]);
        }

        if (zippedFileName.length >= 50) zippedFileName = zippedFileName.substring(0, 25) + "...";

        const zippedFile = await zip.generateAsync({ type: "blob" });
        const { message } = await sendFile({ zippedFile: zippedFile, zippedFileName: zippedFileName });
        setMessage(message);
        setFiles(null);
    };

    return (
        <main className="h-screen w-screen bg-slate-100 flex justify-center items-center max-md:py-4 flex-col">
            {loading && <Spinner progress={progress} />}
            <ul className="my-2">
                <li className="text-center my-2 text-lg">{message}</li>
                {activeConnections.map((val, idx) => (
                    <li key={val}>
                        {idx}: {val}
                    </li>
                ))}
                <div className="flex justify-evenly mt-2">
                    <div className=" h-16 w-16 ">
                        <label htmlFor="files" className="h-full w-full flex justify-center items-center hover:cursor-pointer overflow-hidden">
                            <FolderPlus className="h-full w-full" />
                        </label>
                        <input className="hidden" id="files" type={"file"} onChange={handleFile} multiple />
                    </div>
                    <button className=" h-16 w-16 " onClick={handleClick}>
                        <Upload className="h-full w-full" />
                    </button>
                </div>
            </ul>
        </main>
    );
}

export default App;
