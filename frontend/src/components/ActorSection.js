import React from 'react';

const ActorSection = ({ actors, selectedActorId, onActorSelect, show }) => {
  if (!show) return null;

  return (
    <section className="card">
      <h2>Select Actor</h2>
      <select 
        value={selectedActorId} 
        onChange={(e) => onActorSelect(e.target.value)}
      >
        <option value="">Choose an actor...</option>
        {actors.map(actor => (
          <option key={actor.id} value={actor.id}>
            {actor.title || actor.name} ({actor.name})
          </option>
        ))}
      </select>
    </section>
  );
};

export default ActorSection;
