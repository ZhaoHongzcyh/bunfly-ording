import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import $ from "jquery";
import orderapi from "../../api/user/ording.js";
import groupapi from "../../api/user/group.js";
import io from "socket.io-client";
import "./css/chooseGroup.css";

class ChooseGroup extends Component{
	constructor(props){
		super(props);
		this.state = {
			socket:this.props.socket,
			list:[],
			username:null
		}
	}
	componentWillMount(){
		groupapi.selectgroup("state=1").then(res=>{
			this.setState({
				list:res.list
			})
			console.log(res);
		})
	}
	componentDidMount(){
		//监听用户选组之后的通知信息
		var socket = this.state.socket;
		
		var username = window.localStorage.getItem("name");
		
		this.setState({
			username:username
		})
//		io.on("addGroupMsg",function(data){
//			console.log("用户选组成功");
//			console.log(data);
//		});
		
	}
	componentDidUpdate(){
//		console.log(this.props.socket);
	}
	
	//选择就餐组别
	addGroup(e){
		var that = this;
		var uuid = window.localStorage.getItem("uid");
		var team = $(e.target).data("team");
		//向后端发送加入组请求
		var data = "uuid=" + uuid  + "&team=" + team;
		groupapi.addgroup(data).then((res)=>{
			if(res.aid == 1){
				window.localStorage.setItem("group",team);
				that.appendPeople(team,that);
			}
			else{
				alert(res.msg);
			}
		})
	}
	appendPeople(team,that){
		var name = window.localStorage.getItem("name");
		var ary = [];
		var list = that.state.list
		var addPepole = {};
		
		//删除以前加入的组
		for(var i = 0; i < that.state.list.length; i++){
			for(var k = 0; k < that.state.list[i].child.length; k++){
				if(/id/im.test(list[i].child[k].uuid)){
					list[i].child[k] = {};
				}
				else if(name == list[i].child[k].name){
					list[i].child[k] = {};
				}
			}
		}
		
		ary = that.state.list;
		for(var i = 0; i < that.state.list.length; i++){
			if(that.state.list[i].team == team){
				ary = that.state.list[i].child;
				addPepole.uuid = "id" + new Date().getTime();
				addPepole.name = name;
				addPepole.team = team;
				ary.push(addPepole);
				list[i].child = ary;
			}
		}
		that.setState({
			list:list
		})
	}
	render(){
		var that = this;
		return (
			<div className="allgroupinfo">
				<h4>所有就餐组</h4>
				<ul>
				{
					this.state.list.map(function(data){
						return (
							<li key={data.uuid}>
								<div className="allgroup">
									<div>{data.team}-组</div>
									<div className="addGroup" data-name={data.name} data-team={data.team} onClick={that.addGroup.bind(that)}>加入他们</div>
									{
										((that.state.username==data.name) && (data.role==1))?<div className="sureord">点餐</div>:<div></div>
									}
								</div>
								<ul>
									{
										data.child.map(function(dat){
											return (
												<li key={dat.uuid}>{dat.name}</li>
											)
										})
									}
								</ul>
							</li>
						)
					})
				}
				</ul>
			</div>
		)
	}
}

export default ChooseGroup;
