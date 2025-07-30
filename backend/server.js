const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

const APIFY_API_BASE = 'https://api.apify.com/v2';

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  req.apiKey = apiKey;
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Get user's actors - CORRECTED FOR YOUR API RESPONSE STRUCTURE
app.get('/api/actors', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching actors from Apify API...');
    console.log('Using API key:', req.apiKey ? `${req.apiKey.substring(0, 20)}...` : 'MISSING');
    
    const response = await axios.get(`${APIFY_API_BASE}/acts`, {
      headers: { 
        'Authorization': `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Raw Apify Response received');
    
    let actors = [];
    
    // CORRECT: Handle the actual Apify API response structure from your account
    if (response.data) {
      if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        // Structure: { data: { data: { items: [...] } } }
        actors = response.data.data.items;
        console.log('✅ Found actors in response.data.data.items');
      } else if (response.data.items && Array.isArray(response.data.items)) {
        // Structure: { data: { items: [...] } }
        actors = response.data.items;
        console.log('✅ Found actors in response.data.items');
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Structure: { data: { data: [...] } }
        actors = response.data.data;
        console.log('✅ Found actors in response.data.data');
      } else if (Array.isArray(response.data)) {
        // Structure: { data: [...] }
        actors = response.data;
        console.log('✅ Found actors in response.data');
      } else {
        console.log('❌ Unknown response structure:', Object.keys(response.data));
      }
    }
    
    console.log(`Found ${actors.length} actors`);
    if (actors.length > 0) {
      console.log('Actor names:', actors.map(a => a.title || a.name));
    }
    
    res.json({
      data: actors,
      total: actors.length,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching actors:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch actors',
      details: error.response?.data?.error || error.message,
      success: false
    });
  }
});

// Get actor input schema
app.get('/api/actors/:actorId/schema', validateApiKey, async (req, res) => {
  try {
    const { actorId } = req.params;
    
    // Handle both user actors and public actors
    let apiPath = actorId;
    if (actorId.includes('/')) {
      // For public actors like 'apify/web-scraper', replace '/' with '~'
      apiPath = actorId.replace('/', '~');
    }
    
    console.log(`Fetching schema for actor: ${actorId} (API path: ${apiPath})`);
    
    const response = await axios.get(`${APIFY_API_BASE}/acts/${apiPath}`, {
      headers: {
        'Authorization': `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const actor = response.data;
    
    // Try to get input schema from different possible locations
    let inputSchema = { type: 'object', properties: {} };
    
    if (actor.defaultRunOptions && actor.defaultRunOptions.inputSchema) {
      inputSchema = actor.defaultRunOptions.inputSchema;
    } else if (actor.versions && actor.versions.length > 0 && actor.versions[0].inputSchema) {
      inputSchema = actor.versions[0].inputSchema;
    } else if (actor.inputSchema) {
      inputSchema = actor.inputSchema;
    }
    
    console.log(`Schema loaded for ${actor.name}`);
    
    res.json({ 
      name: actor.name,
      title: actor.title || actor.name,
      description: actor.description || '',
      inputSchema,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching actor schema:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch actor schema',
      details: error.response?.data?.error || error.message,
      success: false
    });
  }
});

// Run actor
app.post('/api/actors/:actorId/run', validateApiKey, async (req, res) => {
  try {
    const { actorId } = req.params;
    const { input } = req.body;
    
    // Handle both user actors and public actors
    let apiPath = actorId;
    if (actorId.includes('/')) {
      apiPath = actorId.replace('/', '~');
    }
    
    console.log(`Starting actor run for: ${actorId} (API path: ${apiPath})`);
    console.log('Input data:', JSON.stringify(input, null, 2));
    
    // Start the run
    const runResponse = await axios.post(
      `${APIFY_API_BASE}/acts/${apiPath}/runs`,
      input || {},
      {
        headers: {
          'Authorization': `Bearer ${req.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    const runId = runResponse.data.id;
    console.log(`Actor run started with ID: ${runId}`);
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${APIFY_API_BASE}/acts/${apiPath}/runs/${runId}`,
          {
            headers: {
              'Authorization': `Bearer ${req.apiKey}`
            },
            timeout: 10000
          }
        );
        
        const run = statusResponse.data;
        console.log(`Run ${runId} status: ${run.status} (attempt ${attempts + 1})`);
        
        if (run.status === 'SUCCEEDED') {
          console.log(`Run ${runId} completed successfully`);
          
          // Get the dataset items
          try {
            const datasetResponse = await axios.get(
              `${APIFY_API_BASE}/datasets/${run.defaultDatasetId}/items`,
              {
                headers: {
                  'Authorization': `Bearer ${req.apiKey}`
                },
                timeout: 15000
              }
            );
            
            return res.json({
              status: 'SUCCEEDED',
              data: datasetResponse.data || [],
              stats: run.stats || {},
              runId: runId,
              success: true
            });
            
          } catch (datasetError) {
            console.error('Error fetching dataset:', datasetError.message);
            return res.json({
              status: 'SUCCEEDED',
              data: [],
              stats: run.stats || {},
              runId: runId,
              success: true,
              warning: 'Run completed but could not fetch results'
            });
          }
          
        } else if (run.status === 'FAILED' || run.status === 'ABORTED') {
          console.log(`Run ${runId} failed with status: ${run.status}`);
          return res.json({
            status: run.status,
            error: 'Actor run failed',
            details: run.statusMessage || 'No error details available',
            runId: runId,
            success: false
          });
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (pollError) {
        console.error(`Error polling run status (attempt ${attempts + 1}):`, pollError.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Timeout reached
    console.log(`Run ${runId} timed out after ${maxAttempts} attempts`);
    res.status(408).json({ 
      error: 'Actor run timeout',
      details: `Run did not complete within ${maxAttempts * 5} seconds`,
      runId: runId,
      success: false
    });
    
  } catch (error) {
    console.error('Error running actor:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to run actor',
      details: error.response?.data?.error || error.message,
      success: false
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    success: false
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    success: false
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API base: http://localhost:${PORT}/api`);
});

module.exports = app;
