'use client';

import { uploadAndAnalyzeAction } from "@/app/accounting/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CameraInput() {
  const [isCompressing, setIsCompressing] = useState(false);
  const router = useRouter();

  // Helper: Compress image using Canvas
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Debug alert
      // alert("Step 1: Start Compression");
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        // alert("Step 2: Image Loaded");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Resize logic: Reduced to max 800px for safety
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // alert("Step 3: Drawn to Canvas");

        // Export as JPEG with 0.6 quality
        canvas.toBlob((blob) => {
          if (blob) {
             // alert("Step 4: Blob Created");
             resolve(blob);
          }
          else reject(new Error("Canvas to Blob failed"));
        }, "image/jpeg", 0.6);
      };
      img.onerror = (err) => {
          alert("Image Load Error: " + err);
          reject(err);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // alert("Debug: File Selected");
      
      // Compress
      const compressedBlob = await compressImage(file);
      // alert("Debug: Compression Done. Size: " + compressedBlob.size);
      
      // Prepare FormData
      const formData = new FormData();
      formData.set("file", compressedBlob, "receipt.jpg");

      // Submit manually
      // alert("Debug: Uploading...");
      const result = await uploadAndAnalyzeAction(formData);
      
      if (result?.success && result.url) {
          // alert("Debug: Success! Redirecting...");
          // Ensure we don't double-encode (though router.push handles string URLs)
          router.push(result.url);
      } else {
          // Robust error handling
          const errMsg = result?.error || "Unknown Server Error";
          if (errMsg === "Not authenticated") {
              alert("ログインセッションが切れました。ログイン画面に戻ります。");
              router.push("/login"); // Might need update if not global
          } else {
              throw new Error("Server Error: " + errMsg);
          }
      }
    } catch (error) {
      console.error("Compression/Upload failed", error);
      alert("エラーが発生しました: " + (error as Error).message);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="w-full h-full">
        <label 
        className={`w-full aspect-square bg-[#4D7C0F] rounded-3xl shadow-lg flex flex-col items-center justify-center text-white active:scale-95 transition-transform cursor-pointer ${isCompressing ? "animate-pulse opacity-80" : ""}`}
        aria-label="写真を送る"
        >
        <input 
            type="file" 
            name="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={handleFileChange}
            disabled={isCompressing}
            data-camera-input
        />
        
        {isCompressing ? (
            <div className="flex flex-col items-center">
                 <svg className="animate-spin h-10 w-10 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-bold">処理中...</span>
            </div>
        ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-base font-bold">写真を送る</span>
            </>
        )}
        </label>
    </div>
  );
}
