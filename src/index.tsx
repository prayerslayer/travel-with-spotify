import "@babel/polyfill";
import * as ReactDOM from "react-dom";
import * as React from "react";
import App from "./App";
import { createGlobalStyle } from "styled-components";
import "intersection-observer";

const GlobalCSS = createGlobalStyle`
  body {
    background-image: linear-gradient(to top right, mistyrose, salmon);
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
    margin: 0;
    padding: 10px;
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
