import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import $ from "jquery";
import orderapi from "../../api/user/ording.js";
import groupapi from "../../api/user/group.js";
import io from "socket.io-client";

class ChooseGroup extends Component{
	constructor(props){
		super(props);
		this.state = {
			socket:this.props.socket
		}
	}
	componentWillMount(){
		groupapi.addgroup("state=1").then(res=>{
//			console.log(res);
		})
	}
	componentDidMount(){
		//监听用户选组之后的通知信息
		var socket = this.state.socket;
		
//		io.on("addGroupMsg",function(data){
//			console.log("用户选组成功");
//			console.log(data);
//		});
		
	}
	componentDidUpdate(){
		console.log("更新");
//		console.log(this.props.socket);
	}
	
	//选择就餐组别
	addGroup(){
		
	}
	
	render(){
		return (
			<div>
				<h4>所有就餐组</h4>
				
			</div>
		)
	}
}

export default ChooseGroup;
