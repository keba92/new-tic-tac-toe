import React from "react";
import { Route, Redirect } from "react-router-dom";

function PrivateRoute({ component: Component, ...rest }) {
  const data = localStorage.getItem('name');

  return (
    <Route
      {...rest}
      render={props =>
        (data) ? (
          <Component {...props} />
        ) : (
            <Redirect
            to={{ pathname: "/", state: { referer: props.location } }}
          />
        )
      }
    />
  );
}

export default PrivateRoute;