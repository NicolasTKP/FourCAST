import React from 'react';
import HumanTrackingDisplay from './components/HumanTrackingDisplay';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>FourCAST Human Tracking</h1>
      </header>
      <main>
        <HumanTrackingDisplay />
      </main>
    </div>
  );
}

export default App;
