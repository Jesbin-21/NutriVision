
// components/ImageUpload.jsx - Food Image Upload & Sample Selection

import React, { useState, useRef } from 'react';
import Button from './Button';
import {
  UploadCloud,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

import './ImageUpload.css';

export default function ImageUpload({ onAnalyze, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const fileInputRef = useRef(null);

  

  // Compress image to <= 150 KB
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read image'));
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');

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

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compress = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'));
                return;
              }

              const sizeKB = blob.size / 1024;

              console.log(
                `📦 Compression attempt: ${sizeKB.toFixed(
                  1
                )} KB | quality: ${quality.toFixed(1)}`
              );

              if (sizeKB <= 150 || quality <= 0.1) {
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

        compress(0.8);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.readAsDataURL(file);
    });
  };

  // Process uploaded image
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
        '✅ Final compressed image:',
        (compressedFile.size / 1024).toFixed(1),
        'KB'
      );

      if (compressedFile.size > 150 * 1024) {
        console.warn(
          '⚠️ Image is still larger than 150 KB:',
          (compressedFile.size / 1024).toFixed(1),
          'KB'
        );
      }

      setSelectedFile(compressedFile);
      setSelectedPresetName('');

      const previewReader = new FileReader();

      previewReader.onload = () => {
        setPreviewUrl(previewReader.result);
      };

      previewReader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('❌ Compression error:', error);
      alert(
        'Failed to compress image. Please try another image.'
      );
    }
  };

  // File input
  const handleFileChange = (e) => {
    const file =
      e.target.files && e.target.files[0];

    if (file) {
      processFile(file);
    }
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === 'dragenter' ||
      e.type === 'dragover'
    ) {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Select sample preset
  const handleSelectPreset = (preset) => {
    setSelectedPresetName(preset.name);
    setPreviewUrl(preset.imageUrl);
    setSelectedFile(null);
  };

  // Submit analysis
  const handleSubmit = () => {
    if (!previewUrl) {
      return;
    }

    // Local uploaded image
    if (selectedFile) {
      console.log(
        '🚀 Sending compressed file:',
        (selectedFile.size / 1024).toFixed(1),
        'KB'
      );

      onAnalyze({
        file: selectedFile,
        presetName: '',
        imageUrl: '',
      });

      return;
    }

    // Preset image
    if (selectedPresetName) {
      console.log(
        '🚀 Sending preset:',
        selectedPresetName
      );

      onAnalyze({
        file: null,
        presetName: selectedPresetName,
        imageUrl: previewUrl,
      });
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setSelectedPresetName('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-card">

      {/* Header */}
      <div className="image-upload-header">
        <h2>Upload Food Image</h2>

        <p>
          Take a photo or upload an image of your meal
          to calculate calories and nutrients with Gemini
          Vision.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="food-file-input"
        accept="image/*"
        className="hidden-file-input"
        onChange={handleFileChange}
      />

      {/* Upload Area */}
      {!previewUrl ? (
        <div
          id="dropzone-area"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() =>
            fileInputRef.current &&
            fileInputRef.current.click()
          }
          className={`upload-dropzone ${
            dragActive ? 'drag-active' : ''
          }`}
        >
          <div className="upload-icon">
            <UploadCloud size={32} />
          </div>

          <h3>
            Click or drag & drop food image here
          </h3>

          <p>
            Supports JPG, PNG, WEBP (up to 10MB)
          </p>
        </div>
      ) : (
        <div className="image-preview-section">

          {/* Image Preview */}
          <div className="image-preview-container">
            <img
              src={previewUrl}
              alt="Food preview"
              id="food-preview-img"
              className="food-preview-img"
            />

            {/* Preset badge */}
            {selectedPresetName && (
              <div className="preset-badge">
                <CheckCircle2 size={14} />

                <span>
                  Preset: {selectedPresetName}
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="image-action-buttons">

            {/* Analyze */}
            <div className="analyze-button">
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
            </div>

            {/* Change */}
            <div className="change-button">
              <Button
                id="btn-reset-image"
                variant="secondary"
                size="lg"
                onClick={handleReset}
                disabled={isAnalyzing}
                icon={<RefreshCw size={16} />}
                fullWidth
              >
                Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

