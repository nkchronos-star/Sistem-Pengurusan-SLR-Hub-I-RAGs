import React, { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find((f) => f.name.endsWith(".csv"));
      
      if (csvFile) {
        onFileUpload(csvFile);
      } else {
        alert("Sila muat naik fail berformat CSV.");
      }
    },
    [onFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight text-center">
        Sistem Pengurusan SLR
      </h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Muat naik fail pangkalan data SLR (CSV) anda. Sistem akan secara automatik menyusun dan memaparkan data untuk pengurusan yang lebih sistematik.
      </p>
      
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ease-in-out bg-gray-50/50",
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className={cn(
            "p-4 rounded-full mb-4 transition-colors",
            isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
          )}>
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="mb-2 text-sm text-gray-700 font-medium">
            <span className="font-semibold text-blue-600">Klik untuk muat naik</span> atau tarik & lepas fail
          </p>
          <p className="text-xs text-gray-500">CSV SAHAJA (MAX. 10MB)</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileInput}
        />
      </label>
    </div>
  );
}
