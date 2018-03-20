import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import ChooseMenu from "../chooseMenu/chooseMenu.js";
import HadChoose from "../hadChoose/hadChoose.js";
import ChooseGroup from "../chooseGroup/chooseGroup.js";
import groupMsg from "../groupMsg/groupMsg.js";
import userapi from "../../api/user/user.js";
import {Redirect} from "react-router-dom";
import "./css/ording.css";
import io from "socket.io-client";
import {createStore} from "redux";
import {Provider,connect} from "react-redux";

//环境变量判断
const env = process.env.NODE_ENV;

//创建Redux store用于存放应用的状态
let store = createStore((state={},action)=>{
	switch(action.type){
		case "send_socket":
		return {socket:action.playload};
		break;
		default:
		return {socket:null};
		break;
	}
});

//用于生成action
let produce_action = function(type,playload){
	return {
		type,
		playload
	}
};

//映射redux state到组件的属性
let mapStateToProps = function(state){
		return {socket:state.socket};
}

//映射redux actions到组件的属性
let mapDispatchToProps = function(){
		return {}
}

//链接组件
var SelectGroup = connect(mapStateToProps,mapDispatchToProps)(ChooseGroup);
var getMsg = connect(mapStateToProps,mapDispatchToProps)(groupMsg)
class Ording extends Component {
  constructor(props){
  	super(props);
  	this.state = {
  		checkToken:true,
  	}
  }
  componentWillMount(){
  	setTimeout(function(){
  		
  	})
	var socket = io("/");
		//分发action
		store.dispatch(produce_action("send_socket",socket));
		socket.on("order",(res)=>{
			console.log(res);
		});
  }
  componentDidMount(){
		
  	var token = window.localStorage.getItem("token");
  	if(token == null){
  		this.setState({
  			checkToken:false
  		})
  	}
  	else{
  		var data = "token=" + token;
  		userapi.checkToken(data).then(res=>{
  			if(res.aid == 0){
  				this.setState({
  					checkToken:false
  				})
  			}
  			else{
  				this.setState({
  					checkToken:true
  				})
  			}
  		})
  	}
  }
  render() {
  	if(!this.state.checkToken){
  		return (
  			<div className="logo_out">
  				<Redirect push to="/"/>
  			</div>
  		)
  	}
  	else{
  		return (
  			<Provider store={store}>
  			<Router>
		      <div className="ording">
		      	 <div className="ordingMenu">
		            <ul>
		              <li>
		                <Link to="/ording">开始点餐</Link>
		              </li>
		              <li>
		                <Link to="/personal">个人中心</Link>
		              </li>
		              <li>
		                <Link to="/message">消息</Link>
		              </li>
		              <li>
		                <Link to="/">退出登录</Link>
		              </li>
		            </ul>
		         </div>
		         <div className="ordingAll row">
		            <div className="ordingContent col-xs-12 col-sm-12 col-md-8 col-lg-8">
		              
		              <Route path="/ording" component={ChooseMenu}/>
		            </div>
		           <div className="ordingList col-xs-12 col-sm-12 col-md-4 col-lg-4">
		              
		              <div className="row">
		              
		                <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
		                  <Link to="/ording">已点菜单</Link>
		                </div>
		                
		                <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
		                  <Link to="/ording/msg">组内群消息</Link>
		                </div>
		                
		                <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
		                  <Link to="/ording/chooseGroup">选择就餐组</Link>
		                </div>
		                
		              </div>
		               <Route exact path="/ording"  component={HadChoose}/>
			           <Route exact path="/ording/chooseGroup"  component={SelectGroup}/>
			           
			           <Route exact path="/ording/msg" component={getMsg}/>
		           
		           </div>
		         </div>
		      </div>
	    	</Router>
	    </Provider>
    );
  	}
    
  }
}

export default Ording;
