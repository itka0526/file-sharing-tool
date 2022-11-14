import { useState } from "react";
import { useIOConnect } from "./functions/useIOConnect";
import Spinner from "./components/Spinner";
import JSZip from "jszip";
import { File, FolderPlus, Upload } from "react-feather";
import useUploadFile from "./functions/useUploadFile";

function App() {
    const { activeConnections, downloadableFiles } = useIOConnect();

    const [files, setFiles] = useState<FileList | null>(null);

    const [message, setMessage] = useState("");

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => setFiles(e.target.files);
    const { loading, progress, sendFile } = useUploadFile();

    const handleRequest = async () => {
        if (files?.length === 0) return;
        if (!files) return;

        let zippedFileName: string = "";
        const zip = JSZip();

        for (let file = 0; file < files.length; file++) {
            zippedFileName = files[file].webkitRelativePath.split("/")[0] || files[file].name;
            let fileDir = files[file].webkitRelativePath || files[file].name;
            zip.file(fileDir, files[file]);
        }

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
                <div className="flex justify-evenly my-2">
                    <div className=" h-16 w-16 ">
                        <label htmlFor="folder" className="h-full w-full flex justify-center items-center hover:cursor-pointer overflow-hidden">
                            <FolderPlus className="h-full w-full" />
                        </label>
                        <input
                            className="hidden"
                            id="folder"
                            type={"file"}
                            onChange={handleFile}
                            multiple
                            /*@ts-ignore*/
                            webkitdirectory=""
                            mozdirectory=""
                            msdirectory=""
                            odirectory=""
                            directory=""
                        />
                    </div>

                    <div className=" h-16 w-16 ">
                        <label htmlFor="file" className="h-full w-full flex justify-center items-center hover:cursor-pointer overflow-hidden">
                            <File className="h-full w-full" />
                        </label>
                        <input className="hidden" id="file" type={"file"} onChange={handleFile} multiple />
                    </div>
                    <button className=" h-16 w-16 " onClick={handleRequest}>
                        <Upload className="h-full w-full" />
                    </button>
                </div>
                {downloadableFiles.map(({ id, name }) => (
                    <li key={id}>
                        <a href={process.env.NODE_ENV === "development" ? "http://localhost:4000" + id : id} download={true}>
                            {name}
                        </a>
                    </li>
                ))}
            </ul>
        </main>
    );
}

export default App;
