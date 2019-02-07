import "@babel/polyfill";
import * as ReactDOM from "react-dom";
import * as React from "react";
import App from "./App";
import { createGlobalStyle } from "styled-components";

const GlobalCSS = createGlobalStyle`
  body {
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
  }
`;

const rootElement = document.getElementById("app");
ReactDOM.render(
  <React.Fragment>
    <GlobalCSS />
    <App />
  </React.Fragment>,
  rootElement
);
