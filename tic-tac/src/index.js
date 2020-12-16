import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Router, Switch, Route, BrowserRouter } from "react-router-dom";
import { createBrowserHistory } from "history";

import Home from "./Home";
import App from "./App";
import PrivateRoute from "./privateRoute";

const history = createBrowserHistory();

class Main extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <PrivateRoute path="/Game" component={App} />
          <Route path="/" component={Home} />
        </Switch>
      </BrowserRouter>
    );
  }
}

ReactDOM.render(
  <Router history={history}>
    <Main history={history} />
  </Router>,
  document.getElementById("root")
);