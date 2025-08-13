import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageDetails } from '../types';
import { UploadIcon, DownloadIcon, XIcon, LoadingSpinnerIcon, LockClosedIcon, LockOpenIcon } from './icons';

const ImageUploader: React.FC<{ onImageUpload: (file: File) => void }> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type.startsWith('image/')) {
        onImageUpload(e.dataTransfer.files[0]);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type.startsWith('image/')) {
        onImageUpload(e.target.files[0]);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };

  return (
    <div 
      className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-12 text-center h-80 ${isDragging ? 'border-primary bg-surface' : 'border-border-color bg-surface-light'}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
        onChange={handleChange}
      />
      <UploadIcon />
      <h2 className="mt-4 text-xl font-semibold text-white">Drag & drop your image here</h2>
      <p className="mt-1 text-text-secondary">or click to browse</p>
      <p className="mt-4 text-xs text-text-secondary">Supports PNG, JPG, and GIF</p>
    </div>
  );
};


const ImagePreview: React.FC<{ title: string; details: ImageDetails | null; isLoading?: boolean }> = ({ title, details, isLoading = false }) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-surface rounded-xl p-4 flex-1 min-w-0">
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <div className="aspect-square bg-brand-bg rounded-lg flex items-center justify-center overflow-hidden relative">
        {isLoading && <LoadingSpinnerIcon />}
        {!isLoading && details ? (
          <img src={details.url} alt={title} className="max-w-full max-h-full object-contain" />
        ) : !isLoading && (
          <p className="text-text-secondary">Waiting for image...</p>
        )}
      </div>
      {details && (
         <div className="mt-3 text-sm space-y-1">
          <p className="text-text-secondary">Size: <span className="font-medium text-text-main">{formatBytes(details.size)}</span></p>
          <p className="text-text-secondary">Dimensions: <span className="font-medium text-text-main">{details.width} x {details.height}</span></p>
         </div>
      )}
    </div>
  );
};


export const ImageConverter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [originalDetails, setOriginalDetails] = useState<ImageDetails | null>(null);
  const [convertedDetails, setConvertedDetails] = useState<ImageDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState<boolean>(true);

  useEffect(() => {
    // Clean up blob URL to prevent memory leaks
    const urlToRevoke = convertedDetails?.url;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [convertedDetails]);

  const resetState = () => {
      setImageFile(null);
      setOriginalDetails(null);
      setConvertedDetails(null);
      setQuality(75);
      setTargetWidth(0);
      setTargetHeight(0);
      setAspectRatio(1);
      setIsAspectRatioLocked(true);
  }

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalDetails({
          url: img.src,
          size: file.size,
          name: file.name,
          width: img.width,
          height: img.height,
          type: file.type,
        });
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        setAspectRatio(img.width / img.height);
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const convertImage = useCallback(() => {
    if (!originalDetails || !targetWidth || !targetHeight) return;
    
    setIsProcessing(true);
    setConvertedDetails(null); // Clear previous result and revoke old blob URL via useEffect

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const dotIndex = originalDetails.name.lastIndexOf('.');
        const originalName = dotIndex !== -1 ? originalDetails.name.substring(0, dotIndex) : originalDetails.name;
        const newName = `${originalName}.webp`;

        setConvertedDetails({
            url: blobUrl,
            size: blob.size,
            name: newName,
            width: targetWidth,
            height: targetHeight,
            type: 'image/webp',
        });
        setIsProcessing(false);
      }, 'image/webp', quality / 100);
    };
    img.src = originalDetails.url;
  }, [originalDetails, quality, targetWidth, targetHeight]);

  useEffect(() => {
    if (originalDetails) {
      convertImage();
    }
  }, [convertImage]);

  const handleDownload = () => {
    if (!convertedDetails) return;
    const link = document.createElement('a');
    link.href = convertedDetails.url;
    link.download = convertedDetails.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(1, Number(e.target.value));
    setTargetWidth(newWidth);
    if (isAspectRatioLocked) {
      setTargetHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(1, Number(e.target.value));
    setTargetHeight(newHeight);
    if (isAspectRatioLocked) {
      setTargetWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const toggleAspectRatioLock = () => setIsAspectRatioLocked(prev => !prev);


  if (!imageFile) {
    return <ImageUploader onImageUpload={handleImageUpload} />;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-end">
        <button 
            onClick={resetState}
            className="flex items-center gap-2 px-4 py-2 bg-surface-light hover:bg-border-color text-text-main rounded-lg transition-colors"
        >
            <XIcon /> Change Image
        </button>
       </div>
      <div className="flex flex-col md:flex-row gap-6">
        <ImagePreview title="Original" details={originalDetails} />
        <ImagePreview title="Converted (WebP)" details={convertedDetails} isLoading={isProcessing} />
      </div>

      <div className="bg-surface rounded-xl p-6">
        <div className="mb-6 pb-6 border-b border-border-color">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-lg font-bold text-white">Dimensions</label>
                <button 
                    onClick={toggleAspectRatioLock} 
                    aria-label={isAspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    className="p-2 rounded-lg hover:bg-surface-light transition-colors flex items-center gap-2"
                >
                    {isAspectRatioLocked ? <LockClosedIcon /> : <LockOpenIcon />}
                    <span className="text-xs font-semibold">{isAspectRatioLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
            </div>
            <p className="text-sm text-text-secondary mb-3">Resize the image to reduce file size. Aspect ratio is {isAspectRatioLocked ? 'locked' : 'unlocked'}.</p>
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">W</span>
                    <input
                        type="number"
                        min="1"
                        value={Math.round(targetWidth)}
                        onChange={handleWidthChange}
                        className="w-full bg-brand-bg text-center py-2 px-8 rounded-md border border-transparent focus:border-primary focus:outline-none transition"
                        aria-label="Target width"
                    />
                </div>
                <span className="text-text-secondary text-xl font-light">&times;</span>
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">H</span>
                    <input
                        type="number"
                        min="1"
                        value={Math.round(targetHeight)}
                        onChange={handleHeightChange}
                        className="w-full bg-brand-bg text-center py-2 px-8 rounded-md border border-transparent focus:border-primary focus:outline-none transition"
                        aria-label="Target height"
                    />
                </div>
            </div>
        </div>

        <div className="mb-4">
            <label htmlFor="quality" className="block text-lg font-bold text-white mb-1">Quality</label>
            <p className="text-sm text-text-secondary">Lower values mean smaller file size but lower quality.</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            id="quality"
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full h-2 bg-surface-light rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-lg font-semibold bg-brand-bg px-4 py-2 rounded-md w-24 text-center">{quality}</span>
        </div>
      </div>

       {convertedDetails && !isProcessing && (
        <div className="flex justify-center">
            <button
                onClick={handleDownload}
                className="flex items-center gap-3 text-lg font-bold bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl transition-colors shadow-lg shadow-primary/20"
            >
                <DownloadIcon /> Download WebP Image
            </button>
        </div>
       )}
       {originalDetails && convertedDetails && !isProcessing && (originalDetails.size > convertedDetails.size) &&
        <div className="text-center text-2xl font-bold">
            🎉 Saved ~{Math.round(100 - (convertedDetails.size / originalDetails.size) * 100)}% in file size! 🎉
        </div>
       }
    </div>
  );
};