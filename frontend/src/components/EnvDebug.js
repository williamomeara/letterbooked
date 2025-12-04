import React from 'react';

const EnvDebug = () => {
  const envVars = Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'black', 
      color: 'lime', 
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '400px',
      borderRadius: '5px'
    }}>
      <h4 style={{ color: 'lime', margin: '0 0 10px 0' }}>Environment Variables:</h4>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
};

export default EnvDebug;
