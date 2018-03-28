import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import userapi from "../../api/user/user.js";
import "./css/logoin.css";
import {Redirect} from "react-router-dom";
import $ from "jquery";
class Logoin extends Component {
  constructor(props){
  	super(props);
  	this.state = {
  		logtitle:"登录",
  		logstate:false
  	}
  }
  componentWillMount(){
  	
  }
  componentDidMount(){
  	
  }
  getUserInfo(){
  	var name = $("#username").val();
  	var pwd = $("#userpwd").val();
  	var obj = {name,pwd}
  	return obj;
  }
  handleUserInfo(obj){
  	var reg = /\s{1,}/img;
  	var nameState = reg.test(obj.name);
  	var pwdState = reg.test(obj.pwd);
  	if(nameState && pwdState){
  		this.setState({
  			logtitle:"登录信息中含有空格"
  		})
  		return false;
  	}
  	else{
  		reg = /^(\d|\w)(\w){5}$/img;
  		pwdState = reg.test(obj.pwd);
  		if(!pwdState){
  			this.setState({
  				logtitle:"密码格式错误"
  			})
  			return false;
  		}
  		else{
  			return obj;
  		}
  	}
  }
  logoin(){
    var that = this;
    var obj = this.getUserInfo();
    obj = this.handleUserInfo(obj);
    var body = "";
    if(!obj){
    	return false;
    }
    else{
    	body = "name=" + obj.name +"&" + "pwd=" + obj.pwd;
    }
    
    that.setState({
        logtitle:"登录中",
    })
    
    userapi.logoin(body).then((res)=>{
    	if(res.aid == 1){
    		console.log(res);
    		window.localStorage.setItem("token",res.token);
    		window.localStorage.setItem("uid",res.uid);
    		window.localStorage.setItem("name",obj.name);
    		this.setState({
    			logstate:true
    		})
    	}
    	else{
    		this.setState({
    			logtitle:res.msg
    		})
    	}
    });
  	
  }
  render() {
  	if(!this.state.logstate){
  		return (
	      <div className="logoin">
	      	<div className="logcommon">
	      		<div className="logtitle">账号：</div>
	      		<div>
		      		<input type="text" placeholder="请输入账号" id="username"/>
		      		<hr/>
		      	</div>
	      	</div>
	      	<div className="logcommon">
	      		<div className="logtitle">密码：</div>
	      		<div>
		      		<input type="password" placeholder="请输入密码" id="userpwd"/>
		      		<hr/>
		      	</div>
	      	</div>
	      	<div className="logcommon logbtn">
	      		<div className="logtitle"></div>
	      		<input type="button" value={this.state.logtitle} onClick={this.logoin.bind(this)}/>
	      	</div>
	      </div>
    	);
  	}
  	else{
  		return (
  			<Redirect push to="/ording"/>
  			)
  	}
    
  }
}

export default Logoin;
