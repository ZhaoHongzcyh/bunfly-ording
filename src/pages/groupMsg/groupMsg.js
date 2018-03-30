import React,{Component} from "react";
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import io from "socket.io-client";
import "./css/groupMsg.css"
//定义组件
class groupMsg extends Component{
	constructor(props){
		super(props);
		this.state = {
			msg:[],
			text:null
		}
	}
	
	//订餐消息事件监听
	componentDidMount(){
		//监听点菜消息
		var socket = this.props.socket;
		var that = this;
		var name = window.localStorage.getItem("name");
		
		if(socket == null){
//			console.log(this.state);
		}
		else{
			socket.on("order",function(res){
				var msgobj = {
					 msg:null,
					 name:res.user,
					 menu:res.menu
				}
				var ary = that.state.msg;
				msgobj.menu = res.menu;
				msgobj.msg = res.user + "预定了一份" + res.menu + "/价格为" + res.price;
				msgobj.key = new Date().getTime();
				console.log(1);
				ary.unshift(msgobj);
				that.setState({
					msg:ary
				})
			})
			
			
			//监听聊天信息
			this.recivemsg(socket);
			this.getOnlineUser(socket)
		}
		
		//自动聚焦到消息框
		this.text.focus();
		
	}
	componentWillUpdate(){
		
	}
	componentDidUpdate(){
		
	}
	//组件移除生命周期
	componentWillUnmount(){
		var socket = this.props.socket;
		socket.removeAllListeners("order");
	}
	
	//textarea同步用户输入的内容
	asynctext(e){
		this.setState({
			text:e.target.value
		})
	}
	
	//向后端提交获取在线用户的请求
	getOnlineUser(socket){
		socket.emit("getOnlineUser",res=>{
			console.log("在线人数")
		})
	}
	
	//用户接收消息
	recivemsg(socket){
		socket.on("getmsg",res=>{
			console.log(res);
			var ary = this.state.msg;
			res.key = new Date().getTime();
			ary.unshift(res);
			this.setState({
				msg:ary
			})
		})
	}
	//用户发送消息
	sendmsg(){
		var socket = this.props.socket;
		if(this.state.text == null){
			alert("请输入消息");
			return false;
		}
		else{
			var name = window.localStorage.getItem("name")
			socket.emit("chat",{msg:this.state.text,from:name});
			this.setState({
				text:""
			})
		}
		
	}
	
	//清除所有群聊消息
	clearGroupMsg(){
		this.setState({
			msg:[]
		})
	}
	
	//监听用户进入与离开（在线用户）
	onlineUserListen(socket){
		
		socket.on("leave",res=>{
			
		})
	}

	//渲染
	render(){
		return(
			<div className="order">
				<div className="msgcontent">
					<div className="allmsg">
						{
							this.state.msg.map((data)=>{
								return (
									<p key={data.key}>
										{data.msg}
									</p>
								)
							})
						}
					</div>
					<div className="clearmsg" onClick={this.clearGroupMsg.bind(this)}>清屏</div>
				
					
					<div className="userlist">
					</div>
				</div>
				
				<div className="msginput">
					<textarea ref={(input)=>{this.text = input;}} value={this.state.text} onChange={this.asynctext.bind(this)}></textarea>
					<div onClick={this.sendmsg.bind(this)}>发送</div>
				</div>
			</div>
		)
	}
}

export default groupMsg;