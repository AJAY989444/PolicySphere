import { useState, useRef } from 'react';
import { HiCloudUpload, HiDocumentText, HiTrash, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './FileUpload.css';

function FileUpload({ onFilesUploaded, uploadedFiles = [], maxFiles = 5 }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (filesList) => {
    const validFiles = Array.from(filesList).filter((file) => {
      const isAllowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isUnderLimit = file.size <= 5 * 1024 * 1024;
      if (!isAllowed) toast.error(`"${file.name}" has invalid type. Use PDF, JPG, or PNG.`);
      if (!isUnderLimit) toast.error(`"${file.name}" exceeds 5MB limit.`);
      return isAllowed && isUnderLimit;
    });

    if (validFiles.length === 0) return;
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      toast.error(`You can attach up to ${maxFiles} evidence documents in total.`);
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => formData.append('files', file));

    try {
      setUploading(true);
      const res = await api.post('/claims/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newFiles = [...uploadedFiles, ...res.data.files];
      onFilesUploaded(newFiles);
      toast.success(`${res.data.files.length} document(s) uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    onFilesUploaded(updated);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  return (
    <div className="file-upload-wrapper">
      <div
        className={`dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        <HiCloudUpload className="upload-icon" />
        <div className="upload-text">
          <p className="primary-text">
            <strong>Click to upload</strong> or drag and drop proof documents
          </p>
          <p className="sub-text">PDF, PNG, JPG or WEBP (Max 5MB each, up to {maxFiles} files)</p>
        </div>

        {uploading && (
          <div className="upload-progress-overlay">
            <div className="spinner"></div>
            <span>Uploading evidence files...</span>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          <h4>Attached Evidence Documents ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="file-item-card">
              <div className="file-info">
                <HiDocumentText className="file-type-icon" />
                <div className="file-details">
                  <span className="file-name" title={file.originalName}>{file.originalName}</span>
                  <span className="file-meta">
                    {formatSize(file.size)} · <HiCheckCircle className="check-icon" /> Ready
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                title="Remove Document"
              >
                <HiTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
