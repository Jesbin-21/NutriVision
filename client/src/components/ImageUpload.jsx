// components/ImageUpload.jsx - Food Image Upload & Sample Selection
import React, { useState, useRef } from 'react';
import Button from './Button';
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ImageUpload({ onAnalyze, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const fileInputRef = useRef(null);

  // Ready-to-test sample food presets with delicious high-quality imagery
  const samplePresets = [
    {
      id: 'avocado-toast',
      name: 'Avocado Toast & Egg',
      caloriesEst: '~380 kcal',
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'salmon-bowl',
      name: 'Grilled Salmon Bowl',
      caloriesEst: '~520 kcal',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'chicken-salad',
      name: 'Mediterranean Chicken Salad',
      caloriesEst: '~410 kcal',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'berry-oatmeal',
      name: 'Superfood Berry Oatmeal',
      caloriesEst: '~310 kcal',
      imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Handle file selection from local filesystem
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image'));

    img.onload = () => {
      const canvas = document.createElement('canvas');

      // Maximum image dimension
      const maxSize = 800;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try different qualities until image is below 150 KB
      const compress = (quality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const sizeKB = blob.size / 1024;

            if (sizeKB <= 150 || quality <= 0.2) {
              const compressedFile = new File(
                [blob],
                'food.webp',
                {
                  type: 'image/webp',
                }
              );

              resolve(compressedFile);
              return;
            }

            compress(quality - 0.1);
          },
          'image/webp',
          quality
        );
      };

      compress(0.7);
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    reader.readAsDataURL(file);
  });
};

 const processFile = async (file) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (JPG, PNG, WEBP).');
    return;
  }

  try {
    console.log(
      '📷 Original image:',
      (file.size / 1024).toFixed(1),
      'KB'
    );

    const compressedFile = await compressImage(file);

    console.log(
      '📦 Compressed image:',
      (compressedFile.size / 1024).toFixed(1),
      'KB'
    );

    setSelectedFile(compressedFile);
    setSelectedPresetName('');

    const reader = new FileReader();

    reader.onload = () => {
      setPreviewUrl(reader.result);
    };

    reader.readAsDataURL(compressedFile);

  } catch (error) {
    console.error('❌ Compression error:', error);
    alert('Failed to compress image. Please try another image.');
  }
};

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle clicking a sample preset
  const handleSelectPreset = async (preset) => {
    setSelectedPresetName(preset.name);
    setPreviewUrl(preset.imageUrl);
    setSelectedFile(null); // Indicates using preset image URL
  };

  // Trigger analysis
  const handleSubmit = () => {
    if (!previewUrl) return;
    onAnalyze({
      file: selectedFile,
      presetName: selectedPresetName,
      imageUrl: previewUrl,
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setSelectedPresetName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>
          Upload Food Image
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Take a photo or upload an image of your meal to calculate calories and nutrients with Gemini Vision.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="food-file-input"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Dropzone Area or Preview */}
      {!previewUrl ? (
        <div
          id="dropzone-area"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: dragActive
              ? '2px dashed #10b981'
              : '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
            Click or drag & drop food image here
          </h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            Supports JPG, PNG, WEBP (up to 10MB)
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              maxHeight: '320px',
              border: '1px solid var(--border-subtle)',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={previewUrl}
              alt="Food preview"
              id="food-preview-img"
              style={{
                width: '100%',
                maxHeight: '320px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {selectedPresetName && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle2 size={14} /> Preset: {selectedPresetName}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.25rem',
              alignItems: 'center',
            }}
          >
            <Button
              id="btn-analyze-food"
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              isLoading={isAnalyzing}
              icon={<Sparkles size={18} />}
              fullWidth
            >
              Analyze Nutrients with Gemini Vision
            </Button>
            <Button
              id="btn-reset-image"
              variant="secondary"
              size="lg"
              onClick={handleReset}
              disabled={isAnalyzing}
              icon={<RefreshCw size={16} />}
            >
              Change
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
