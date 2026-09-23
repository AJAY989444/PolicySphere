import { useState } from 'react';
import { HiX, HiUpload, HiCheckCircle, HiExclamation, HiDownload, HiDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './BulkUploadModal.css';

const SAMPLE_CSV = `EmployeeCode,FullName,WorkEmail,Department,Designation,Tier,Phone
EMP-201,Aarav Singhania,aarav.s@acmetech.in,Engineering,Lead Backend Architect,EXECUTIVE,+91 98201 55667
EMP-202,Diya Sen,diya.sen@acmetech.in,Product,Senior Product Specialist,SENIOR,+91 98202 44332
EMP-203,Karan Mehra,karan.m@acmetech.in,Sales & Growth,Account Director,SENIOR,+91 98203 11223
EMP-204,Tanvi Joshi,tanvi.j@acmetech.in,Human Resources,HR Business Partner,STANDARD,+91 98204 99887
EMP-205,Naveen Pillai,naveen.p@acmetech.in,Design,UI Engineer,STANDARD,+91 98205 33445`;

function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parsingError, setParsingError] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const parseCsv = (text) => {
    try {
      setParsingError(null);
      const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setParsedRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 3) {
          const rowObj = {
            code: parts[0] || '',
            name: parts[1] || '',
            email: parts[2] || '',
            dept: parts[3] || 'Engineering',
            designation: parts[4] || 'Associate',
            tier: (parts[5] || 'STANDARD').toUpperCase(),
            phone: parts[6] || '',
          };
          rows.push(rowObj);
        }
      }

      setParsedRows(rows);
    } catch (err) {
      setParsingError('Failed to parse CSV format. Please ensure comma-separated values.');
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setCsvText(val);
    parseCsv(val);
  };

  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV);
    parseCsv(SAMPLE_CSV);
    toast.success('Sample employee roster loaded!');
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PolicySphere_Corporate_Employee_Roster_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileDrop = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      toast.error('No valid employee records to ingest.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.post('/corporate/employees/bulk', {
        employees: parsedRows,
      });

      if (res.data.success) {
        toast.success(`Successfully enrolled ${res.data.insertedCount} employees! (${res.data.skippedCount} duplicates skipped)`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to ingest employee roster.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="bulk-upload-modal-box">
        <div className="modal-header-corporate">
          <div className="modal-title-wrap">
            <HiUpload className="modal-header-icon" />
            <div>
              <h3>Bulk Ingest Employee Census</h3>
              <p>Upload your organization's employee roster via CSV file or raw spreadsheet data.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose} aria-label="Close">
            <HiX />
          </button>
        </div>

        <div className="modal-body-corporate">
          <div className="template-action-row">
            <div className="template-desc">
              <HiDocumentText /> Expected format: <code>EmployeeCode, FullName, WorkEmail, Department, Designation, Tier, Phone</code>
            </div>
            <div className="template-btn-group">
              <button className="btn-secondary-sm" onClick={handleDownloadSample}>
                <HiDownload /> Template CSV
              </button>
              <button className="btn-accent-sm" onClick={handleLoadSample}>
                Load Sample Roster
              </button>
            </div>
          </div>

          <div className="csv-input-zone">
            <label className="input-zone-label">Paste CSV data or select file:</label>
            <textarea
              className="csv-textarea"
              rows={6}
              placeholder="EmployeeCode,FullName,WorkEmail,Department,Designation,Tier,Phone&#10;EMP-101,Rohan Mehta,rohan@company.com,Engineering,Backend Lead,EXECUTIVE,+919876543210"
              value={csvText}
              onChange={handleTextChange}
            />
            <div className="file-input-wrapper">
              <input type="file" accept=".csv,text/csv" onChange={handleFileDrop} id="csv-file-input" />
              <label htmlFor="csv-file-input" className="file-drop-label">
                <HiUpload /> Or select .CSV file from device
              </label>
            </div>
          </div>

          {parsingError && (
            <div className="parse-error-callout">
              <HiExclamation /> {parsingError}
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="parsed-preview-container">
              <div className="preview-header">
                <strong>Parsed Census Preview ({parsedRows.length} employees detected)</strong>
                <span className="valid-tag"><HiCheckCircle /> Ready for Import</span>
              </div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Work Email</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Cover Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((r, idx) => (
                      <tr key={idx}>
                        <td><code>{r.code}</code></td>
                        <td>{r.name}</td>
                        <td>{r.email}</td>
                        <td>{r.dept}</td>
                        <td>{r.designation}</td>
                        <td>
                          <span className={`tier-badge tier-${r.tier.toLowerCase()}`}>{r.tier}</span>
                        </td>
                      </tr>
                    ))}
                    {parsedRows.length > 5 && (
                      <tr className="more-row">
                        <td colSpan={6}>...and {parsedRows.length - 5} more employees</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer-corporate">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={uploading || parsedRows.length === 0}
          >
            {uploading ? (
              <>Ingesting {parsedRows.length} Employees...</>
            ) : (
              <>
                <HiCheckCircle /> Confirm & Ingest {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkUploadModal;
