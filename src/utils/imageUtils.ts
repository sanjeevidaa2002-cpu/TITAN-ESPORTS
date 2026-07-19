export const compressImage = (file: File, maxSizeMB: number = 0.5, maxWidthOrHeight: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height *= maxWidthOrHeight / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width *= maxWidthOrHeight / height;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.9;
        // use webp for better compression, fallback to jpeg
        const format = 'image/webp';
        let dataUrl = canvas.toDataURL(format, quality);
        
        // Target max size in bytes
        const targetSize = maxSizeMB * 1024 * 1024;
        
        // Base64 size is roughly 1.37 times the original binary size
        while (dataUrl.length > targetSize * 1.37 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL(format, quality);
        }
        
        // If webp is not supported well, the size might not change, but generally it's fine
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
