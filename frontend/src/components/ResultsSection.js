import React from 'react';

const ResultsSection = ({ results, loading, error, show }) => {
  if (!show) return null;

  return (
    <section className="card">
      <h2>Results</h2>
      
      {loading && (
        <div id="loading">
          <div className="spinner"></div>
          <p>Running actor... This may take a few minutes.</p>
        </div>
      )}
      
      {/* FIX: Ensure error is rendered as string */}
      {error && (
        <div className="error">
          ❌ {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
      
      {results && results.status === 'SUCCEEDED' && (
        <div>
          <div className="success">✅ Actor completed successfully!</div>
          {results.stats && (
            <>
              <p><strong>Runtime:</strong> {Math.round(results.stats.runTimeSecs || 0)}s</p>
              <p><strong>Items:</strong> {results.data.length}</p>
            </>
          )}
          <h3>Data Output:</h3>
          <div className="results-data">
            <pre>{JSON.stringify(results.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </section>
  );
};

export default ResultsSection;
