import '@babel/polyfill';
import ReactDOM from 'react-dom'
import React from 'react';
import App from './App'

const rootElement = document.getElementById("app");
ReactDOM.render(<App />, rootElement);