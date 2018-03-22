import React,{Component} from "react";
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import io from "socket.io-client";
//定义组件
class groupMsg extends Component{
	constructor(props){
		super(props);
		
	}
	
	//订餐消息事件监听
	componentDidMount(){
		//监听点菜消息
		console.log("执行事件监听")
		var socket = this.props.socket;
		if(socket == null){
			console.log(this.state);
		}
		else{
			socket.on("order",res=>{
				console.log(res);
			})
		}
		
	}
	componentWillUpdate(){
		
	}
	componentDidUpdate(){
		
	}
	//组件移除生命周期
	componentWillUnmount(){
//		var socket = this.state.socket;
//		socket.removeAllListeners("order");
	}
	
	
	//渲染
	render(){
		return(
			<div className="order">
				<span>324</span>
			</div>
		)
	}
}

export default groupMsg;