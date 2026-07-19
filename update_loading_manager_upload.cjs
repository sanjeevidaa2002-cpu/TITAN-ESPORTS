const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const uploadFuncs = `
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof BrandingSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validFormats.includes(file.type)) {
      alert("Unsupported format! Choose a valid PNG, JPG, JPEG, WEBP, SVG, or ICO.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const compressed = await resizeAndCompressImage(base64, 512, 512);

        const response = await fetch(compressed);
        const blob = await response.blob();

        const storageRef = ref(storage, \`branding/\${key}/\${Date.now()}_\${file.name}\`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed',
          null,
          (error) => {
            console.error("Firebase Storage upload failed:", error);
            alert("Upload failed: " + error.message);
            setIsSaving(false);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const cacheBustedUrl = \`\${downloadURL}\${downloadURL.includes('?') ? '&' : '?'}v=\${Date.now()}\`;
              
              setLocalSettings(prev => {
                const updated = { ...prev, [key]: cacheBustedUrl };
                return updated;
              });

              // Also persist it so it takes effect instantly
              await updateBrandingSettings({ [key]: cacheBustedUrl });

              setSaveSuccess("Primary Loading Logo Updated Successfully.");
              setTimeout(() => setSaveSuccess(null), 4000);
            } catch (dbErr: any) {
              console.error("Failed to save to database:", dbErr);
              alert("Image uploaded but database save failed: " + dbErr.message);
            } finally {
              setIsSaving(false);
            }
          }
        );
      } catch (err) {
        console.error("Error compressing/uploading image:", err);
        alert("Upload error.");
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resizeAndCompressImage = (base64Str: string, maxW: number, maxH: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width *= ratio;
          height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.9));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

`;

content = content.replace(
  "const handleFieldChange = (key: keyof BrandingSettings, value: any) => {",
  uploadFuncs + "const handleFieldChange = (key: keyof BrandingSettings, value: any) => {"
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
