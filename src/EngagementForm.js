import React, { useState } from 'react';
import './EngagementForm.css';

function EngagementForm() {
  const [engagements, setEngagements] = useState('');
  const [impressions, setImpressions] = useState('');
  const [engagementRate, setEngagementRate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parse the engagement values (e.g., "1,2,3,4,5") into an array, then sum them
    const engagementArray = engagements.split(',').map(Number);
    const totalEngagements = engagementArray.reduce((sum, num) => sum + num, 0);

    // Calculate engagement rate
    const rate = (totalEngagements / Number(impressions)) * 100;
    setEngagementRate(rate.toFixed(2)); // Fix to 2 decimal places
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label htmlFor="engagements">Engagements</label>
        <input
          type="text"
          id="engagements"
          value={engagements}
          onChange={(e) => setEngagements(e.target.value)}
          placeholder="Enter engagements as comma-separated values (e.g., 1,2,3)"
          required
        />
        <small>Enter multiple engagement values separated by commas. They will be summed automatically.</small>
      </div>

      <div className="form-group">
        <label htmlFor="impressions">Impressions</label>
        <input
          type="number"
          id="impressions"
          value={impressions}
          onChange={(e) => setImpressions(e.target.value)}
          placeholder="Enter total impressions (e.g., 1000)"
          required
        />
        <small>Enter the total impressions as a number.</small>
      </div>

      <button type="submit" className="submit-btn">
        Calculate
      </button>

      {engagementRate !== null && (
        <div className="result">
          <h2>Engagement Rate: {engagementRate}%</h2>
        </div>
      )}
    </form>
  );
}

export default EngagementForm;
