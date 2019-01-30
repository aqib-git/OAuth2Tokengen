import React, { Component } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, NavLink} from "react-router-dom";
import Home from './views/Home/Home';
import TokenList from './views/TokenList/TokenList';
import ApiRequest from './views/ApiRequest/ApiRequest';

class App extends Component {

  render() {
    return (
      <Router>
        <div>
          <header className="App-header">
            <h4>TOKENGEN</h4>
            <ul className="App-navbar">
              <li><NavLink exact to="/">New Token</NavLink></li>
              <li><NavLink to="/tokens">Tokens</NavLink></li>
            </ul>
          </header>
          <Route exact path="/" component={Home} />
          <Route path="/tokens" component={TokenList} />
        </div>
      </Router>
    );
  }
}

export default App;
