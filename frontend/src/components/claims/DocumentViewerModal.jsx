import { useState } from 'react';
import { HiX, HiDownload, HiExternalLink, HiDocumentText } from 'react-icons/hi';
import './DocumentViewerModal.css';

function DocumentViewerModal({ documents = [], isOpen, onClose, claimTitle = 'Claim Evidence' }) {
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  if (!isOpen || !documents || documents.length === 0) return null;

  const currentDoc = documents[activeDocIndex];
  const backendBaseUrl = 'http://localhost:5000';
  const fileUrl = typeof currentDoc === 'string'
    ? (currentDoc.startsWith('http') ? currentDoc : `${backendBaseUrl}${currentDoc}`)
    : (currentDoc.url?.startsWith('http') ? currentDoc.url : `${backendBaseUrl}${currentDoc.url}`);

  const fileName = typeof currentDoc === 'string'
    ? currentDoc.split('/').pop()
    : (currentDoc.originalName || currentDoc.filename || 'Document');

  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);
  const isPdf = /\.pdf$/i.test(fileUrl);

  return (
    <div className="doc-modal-overlay">
      <div className="doc-modal">
        <div className="doc-modal-header">
          <div>
            <h3>{claimTitle}</h3>
            <p className="doc-count-tag">
              Document {activeDocIndex + 1} of {documents.length}: <strong>{fileName}</strong>
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        {/* Thumbnail Selector Tabs */}
        {documents.length > 1 && (
          <div className="doc-selector-tabs">
            {documents.map((doc, idx) => {
              const name = typeof doc === 'string' ? doc.split('/').pop() : (doc.originalName || `Doc ${idx + 1}`);
              return (
                <button
                  key={idx}
                  className={`doc-tab ${idx === activeDocIndex ? 'active' : ''}`}
                  onClick={() => setActiveDocIndex(idx)}
                >
                  <HiDocumentText /> {name}
                </button>
              );
            })}
          </div>
        )}

        {/* Document Display Area */}
        <div className="doc-preview-container">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="doc-image-preview" />
          ) : isPdf ? (
            <iframe src={fileUrl} title={fileName} className="doc-pdf-iframe" />
          ) : (
            <div className="doc-fallback-box">
              <HiDocumentText className="fallback-icon" />
              <p>Preview not available for this file type.</p>
              <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                <HiExternalLink /> Open in New Tab
              </a>
            </div>
          )}
        </div>

        <div className="doc-modal-footer">
          <a href={fileUrl} target="_blank" rel="noreferrer" download className="btn btn-secondary">
            <HiDownload /> Download File
          </a>
          <button className="btn btn-ghost" onClick={onClose}>
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewerModal;
