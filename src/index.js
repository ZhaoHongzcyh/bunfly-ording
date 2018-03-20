import React from 'react';
import ReactDOM from 'react-dom';
import './pages/common/css/index.css';
import Entry from './pages/entry/entry.js';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Entry />, document.getElementById('root'));
registerServiceWorker();
