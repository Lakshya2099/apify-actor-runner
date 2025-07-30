import React, { useState, useEffect } from 'react';

const SchemaSection = ({ actor, onRun, show }) => {
  const [formData, setFormData] = useState({});
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setFormData({});
  }, [actor]);

  if (!show || !actor) return null;

  const handleInputChange = (name, value, type) => {
    let processedValue = value;
    
    switch (type) {
      case 'number':
      case 'integer':
        processedValue = value ? Number(value) : undefined;
        break;
      case 'boolean':
        processedValue = value;
        break;
      case 'array':
        processedValue = value ? value.split('\n').filter(item => item.trim()) : [];
        break;
      default:
        if (name.includes('json') || type === 'object') {
          try {
            processedValue = value ? JSON.parse(value) : undefined;
          } catch (e) {
            processedValue = value;
          }
        }
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await onRun(formData);
    } finally {
      setRunning(false);
    }
  };

  const renderFormField = (name, property, required = false) => {
    switch (property.type) {
      case 'string':
        if (property.enum) {
          return (
            <select 
              value={formData[name] || ''} 
              onChange={(e) => handleInputChange(name, e.target.value, 'string')}
              required={required}
            >
              <option value="">Select...</option>
              {property.enum.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        } else if (property.format === 'textarea' || property.description?.includes('URL')) {
          return (
            <textarea
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value, 'string')}
              placeholder={property.default || ''}
              required={required}
            />
          );
        } else {
          return (
            <input
              type="text"
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value, 'string')}
              placeholder={property.default || ''}
              required={required}
            />
          );
        }
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={formData[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value, property.type)}
            placeholder={property.default || ''}
            min={property.minimum}
            max={property.maximum}
            required={required}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={formData[name] || false}
            onChange={(e) => handleInputChange(name, e.target.checked, 'boolean')}
          />
        );
      case 'array':
        return (
          <textarea
            value={Array.isArray(formData[name]) ? formData[name].join('\n') : ''}
            onChange={(e) => handleInputChange(name, e.target.value, 'array')}
            placeholder="Enter items separated by new lines"
            required={required}
          />
        );
      default:
        return (
          <textarea
            value={typeof formData[name] === 'object' ? JSON.stringify(formData[name], null, 2) : formData[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value, 'object')}
            placeholder="Enter JSON object"
            required={required}
          />
        );
    }
  };

  const schema = actor.inputSchema;
  const hasProperties = schema.properties && Object.keys(schema.properties).length > 0;

  return (
    <section className="card">
      <h2>Actor Configuration</h2>
      <div id="actor-info">
        <h3>{actor.title || actor.name}</h3>
        <p><strong>Name:</strong> {actor.name}</p>
        {actor.description && <p><strong>Description:</strong> {actor.description}</p>}
      </div>
      
      {hasProperties ? (
        <div>
          {Object.entries(schema.properties).map(([name, property]) => (
            <div key={name} className="form-group">
              <label>
                {property.title || name}
                {schema.required?.includes(name) ? ' *' : ''}
              </label>
              {renderFormField(name, property, schema.required?.includes(name))}
              {property.description && (
                <div className="description">{property.description}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>This actor doesn't require any input parameters.</p>
      )}
      
      <button onClick={handleRun} disabled={running}>
        {running ? 'Running...' : 'Run Actor'}
      </button>
    </section>
  );
};

export default SchemaSection;
