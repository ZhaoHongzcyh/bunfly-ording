import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import Head from "../head/head.js";
import Logoin from "../logoin/logoin.js";
import Ording from "../ording/ording.js";
class Entry extends Component {
  render() {
    return (
      <Router>
      	<div className="content">
      		<div className="head">
      			<Head/>
      		</div>
      		<div className="ording">
      			<Route exact path="/" component={Logoin}/>
      			<Route path="/ording" component={Ording}/>
      		</div>
      	</div>
      	
      </Router>
    );
  }
}

export default Entry;
