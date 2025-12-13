import React, { useState } from 'react';
import axios from '../axiosConfig';

// Standalone Admin component without Layout
const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
      setError('');
      setMessage('');
    } else {
      setError('Please select a valid .xlsx file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('upload-excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const { records_created, records_skipped, total_database_records } = response.data;
        setMessage(
          `Upload completed successfully! ` +
          `Created ${records_created} new records, ` +
          `preserved ${records_skipped} existing records. ` +
          `Total records in database: ${total_database_records}`
        );
        setFile(null);
        document.getElementById('fileInput').value = '';
      } else {
        setError(response.data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/signin';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '20px 30px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h1 style={{
          margin: 0,
          color: '#2c3e50',
          fontSize: '2rem',
          fontWeight: '700'
        }}>Admin Panel</h1>
        <button onClick={handleLogout} style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          Logout
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          color: '#2c3e50',
          fontSize: '1.5rem',
          marginBottom: '10px'
        }}>Upload Excel File</h2>
        <p style={{
          color: '#7f8c8d',
          marginBottom: '20px'
        }}>Upload book1.xlsx file to add new data to the database</p>
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '30px'
        }}>
          <h4 style={{
            color: '#2e7d32',
            margin: '0 0 10px 0',
            fontSize: '1rem'
          }}>📋 How it works:</h4>
          <ul style={{
            color: '#2e7d32',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li>✅ <strong>Preserves existing data</strong> - Old records remain unchanged</li>
            <li>✅ <strong>Adds new records only</strong> - Only new mobile numbers are imported</li>
            <li>✅ <strong>No data loss</strong> - Your existing database is safe</li>
            <li>✅ <strong>Duplicate prevention</strong> - Same mobile numbers are automatically skipped</li>
          </ul>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" style={{
              display: 'block',
              padding: '15px 20px',
              border: '2px dashed #667eea',
              borderRadius: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#667eea',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              {file ? file.name : 'Choose Excel File (.xlsx)'}
            </label>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            style={{
              background: !file || uploading ? '#bdc3c7' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '15px 30px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              width: '100%'
            }}
          >
            {uploading ? 'Uploading...' : 'Add New Data to Database'}
          </button>
        </form>

        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #c3e6cb'
          }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

