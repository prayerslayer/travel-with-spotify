import '@babel/polyfill';
import * as ReactDOM from 'react-dom'
import * as React from 'react';
import App from './App';

const rootElement = document.getElementById("app");
ReactDOM.render(<App />, rootElement);
