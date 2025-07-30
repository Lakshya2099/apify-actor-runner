import React, { useState } from 'react';

const AuthSection = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Apify API key');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Testing API key...');
      await onApiKeySubmit(apiKey);
      setError(''); // Clear error on success
    } catch (error) {
      console.error('API Key Error:', error);
      // FIX: Convert error object to string
      const errorMessage = typeof error === 'object' && error.message 
        ? error.message 
        : String(error);
      setError(`Failed to load actors: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Authentication</h2>
      <div className="input-group">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Apify API key"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : 'Load Actors'}
        </button>
      </div>
      {/* FIX: Ensure error is always a string */}
      {error && (
        <div className="error" style={{marginTop: '10px', color: 'red'}}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
    </section>
  );
};

export default AuthSection;
