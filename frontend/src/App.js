import React, { useState, useEffect } from 'react';
import './App.css';
import AuthSection from './components/AuthSection';
import ActorSection from './components/ActorSection';
import SchemaSection from './components/SchemaSection';
import ResultsSection from './components/ResultsSection';
import apiService from './services/api';

function App() {
  const [actors, setActors] = useState([]);
  const [selectedActorId, setSelectedActorId] = useState('');
  const [selectedActor, setSelectedActor] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showActorSection, setShowActorSection] = useState(false);
  const [showSchemaSection, setShowSchemaSection] = useState(false);
  const [showResultsSection, setShowResultsSection] = useState(false);

  // Dynamic app configuration
  const appName = process.env.REACT_APP_NAME || 'Apify Actor Runner';
  const appVersion = process.env.REACT_APP_VERSION || '1.0.0';

  // Health check on app load
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await apiService.checkHealth();
        console.log('Backend health check:', health);
      } catch (error) {
        console.warn('Backend health check failed:', error.message);
      }
    };

    checkBackendHealth();
  }, []);

  const handleApiKeySubmit = async (apiKey) => {
    try {
      console.log('Setting API key and fetching actors...');
      apiService.setApiKey(apiKey);
      
      const response = await apiService.getActors();
      console.log('API Response:', response);
      
      // Dynamic response handling
      let actorsArray = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          actorsArray = response.data;
        }
      } else if (Array.isArray(response)) {
        actorsArray = response;
      }
      
      console.log(`Successfully loaded ${actorsArray.length} actors`);
      
      if (actorsArray.length === 0) {
        throw new Error('No actors found. Please make sure you have actors in your Apify account or add some from the Apify Store.');
      }
      
      setActors(actorsArray);
      setShowActorSection(true);
      setError('');
      
    } catch (error) {
      console.error('Error in handleApiKeySubmit:', error);
      
      let errorMessage = 'Failed to load actors';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid API key. Please check your Apify API token.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Please check your API key permissions.';
        } else {
          const responseError = error.response.data?.details || 
                               error.response.data?.error?.message || 
                               error.response.data?.error || 
                               error.response.data?.message ||
                               errorMessage;
          errorMessage = typeof responseError === 'string' ? responseError : JSON.stringify(responseError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      throw new Error(finalError);
    }
  };

  const handleActorSelect = async (actorId) => {
    setSelectedActorId(actorId);
    setSelectedActor(null);
    setError('');
    
    if (!actorId) {
      setShowSchemaSection(false);
      setShowResultsSection(false);
      return;
    }

    try {
      console.log(`Loading schema for actor: ${actorId}`);
      const actor = await apiService.getActorSchema(actorId);
      console.log('Actor schema loaded:', actor);
      
      setSelectedActor(actor);
      setShowSchemaSection(true);
      setShowResultsSection(false);
      
    } catch (error) {
      console.error('Error loading actor schema:', error);
      
      let errorMessage = 'Failed to load actor schema';
      
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      setError(finalError);
      setShowSchemaSection(false);
    }
  };

  const handleRunActor = async (input, options = {}) => {
    if (!selectedActorId) {
      setError('No actor selected');
      return;
    }

    setLoading(true);
    setResults(null);
    setError('');
    setShowResultsSection(true);

    try {
      console.log(`Running actor ${selectedActorId} with input:`, input);
      
      const result = await apiService.runActor(selectedActorId, input, options);
      console.log('Actor run result:', result);
      
      if (result.status === 'SUCCEEDED') {
        setResults(result);
        setError('');
      } else {
        let errorMsg = 'Actor run failed with unknown error';
        
        if (typeof result.details === 'string') {
          errorMsg = result.details;
        } else if (typeof result.error === 'string') {
          errorMsg = result.error;
        }
        
        setError(`Actor run failed: ${errorMsg}`);
        setResults(null);
      }
      
    } catch (error) {
      console.error('Error running actor:', error);
      
      let errorMessage = 'Failed to run actor';
      
      if (error.response) {
        if (error.response.status === 402) {
          errorMessage = 'Insufficient credits. Please check your Apify account balance.';
        } else if (error.response.status === 408) {
          errorMessage = 'Actor run timed out. The operation took too long to complete.';
        } else {
          const responseError = error.response.data?.details || 
                               error.response.data?.error?.message || 
                               error.response.data?.error ||
                               errorMessage;
          errorMessage = typeof responseError === 'string' ? responseError : JSON.stringify(responseError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      setError(finalError);
      setResults(null);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🚀 {appName}</h1>
          <p>Execute your Apify actors with dynamic schema loading</p>
          <small>Version {appVersion}</small>
        </header>

        <AuthSection onApiKeySubmit={handleApiKeySubmit} />
        
        <ActorSection 
          actors={actors}
          selectedActorId={selectedActorId}
          onActorSelect={handleActorSelect}
          show={showActorSection}
        />
        
        <SchemaSection 
          actor={selectedActor}
          onRun={handleRunActor}
          show={showSchemaSection}
        />
        
        <ResultsSection 
          results={results}
          loading={loading}
          error={error}
          show={showResultsSection}
        />
      </div>
    </div>
  );
}

export default App;
