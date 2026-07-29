import React from 'react';

const FeatureTooltip = ({ text, position = 'bottom' }) => {
  return (
    <div
      style={{
        marginTop: '6px',
        padding: '8px 12px',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: '6px',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#c7d2fe',
        display: 'inline-block'
      }}
    >
      {text}
    </div>
  );
};

export default FeatureTooltip;

