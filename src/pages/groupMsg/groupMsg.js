import React,{Component} from "react";
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import io from "socket.io-client";
import $ from "jquery";
import "./css/groupMsg.css"
//定义组件
class groupMsg extends Component{
	constructor(props){
		super(props);
		this.state = {
			msg:[],
			text:null,
			alluser:[],
			chatobject:"群聊中",
			state:1,//1代表群聊，0代表私聊
			privateobj:{},//私聊对象
			privatechat:{},//用于保存私人聊天信息
			privatemsg:[]
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
					 menu:res.menu,
					 state:1
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
			this.getOnlineUser(socket);
			this.getPrivateMsg(socket);
			//
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
		
		//移除订餐监听
		socket.removeAllListeners("order");
		
		//移除该组件相关监听
		socket.removeAllListeners("alluser");
		
		//移除群聊监听
		socket.removeAllListeners("getmsg");
		
		//移除私聊信息监听
		socket.removeAllListeners("getPrivateMsg");
	}
	
	//textarea同步用户输入的内容
	asynctext(e){
		this.setState({
			text:e.target.value
		})
	}
	
	//向后端提交获取在线用户的请求
	getOnlineUser(socket){
		socket.emit("getOnlineUser")
		socket.on("alluser",res=>{
			console.log("在线人数");
			console.log(res);
			if(res.aid == 0){
				this.setState({
					alluser:[]
				})
			}
			else{
				
				this.setState({
					alluser:res.user
				})
			}
		})
		
		//监听私聊信息
		
	}
	
	//用户接收群聊消息
	recivemsg(socket){
		socket.on("getmsg",res=>{
			console.log(res);
			var ary = this.state.msg;
			res.key = new Date().getTime();
			res.state = 2;
			ary.unshift(res);
			this.setState({
				msg:ary
			})
		})
	}
	//用户发送群聊消息
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
	
	//用户私聊
	chatPrivate(e){
		var chatobj ="与" + $(e.target).data("name") + "聊天中";
		var privateid = $(e.target).data("identity");
		var originName = window.localStorage.getItem("name");
		var mainobj = {
				id:privateid,
				name:originName
			}
		this.setState({
			state:0,
			chatobject:chatobj,
			privateobj:mainobj
		})
	}
	
	//发送私聊信息
	sendPrivateMsg(){
		var obj = this.state.privateobj;
		obj.msg = this.state.text;
		var socket = this.props.socket;
		socket.emit("sendPrivateMsg",obj);
	}
	
	//接收私聊信息且提醒当前用户有新消息了
	getPrivateMsg(socket){
		var _this = this;
		socket.on("getPrivateMsg",res=>{
			console.log("私聊信息");
			console.log(res);
			for(var i = 0; i < _this.state.alluser.length; i++){
				if(res.name == _this.state.alluser[i].name){
					var ary = _this.state.alluser;
					ary[i].reply.push(res);
					_this.setState({
						alluser:ary,
						state:0,
						chatobject:"与" + res.name + "聊天中"
					})
				}
			}
			var mainobj = {
				id:res.fromid,
				name:window.localStorage.getItem("name")
			}
			_this.setState({
				privateobj:mainobj
			})
			
			//将私人聊天信息进行分类
			var privatechat = _this.state.privatechat;
			var privatemsgobj = {
				 key:new Date().getTime(),
				 msg:res.name + " 说：" + res.msg
			}
			if(privatechat[res.fromid]){
				privatechat[res.fromid].unshift(privatemsgobj);
			}
			else{
				privatechat[res.fromid] = [];
				privatechat[res.fromid].unshift(privatemsgobj);
			}
			_this.setState({
				privatemsg:privatechat[res.fromid]
			})
		})
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
		var _this = this;
		return(
			<div className="order">
				<div className="msgcontent">
					
					<div className="allmsg">
						<div className="chatobject">
							<div>{this.state.chatobject}</div>
						</div>
						{
							
							(this.state.state == 0)?this.state.privatemsg.map(function(data){
								return (
									<p className="privatemsg" key={data.key}>
										<span>{data.msg}</span>
									</p>
								)
							}):this.state.msg.map((data)=>{
								if(data.state == 1){
									return (
										<p className="notice" key={data.key}>
											<span>{data.msg}</span>
										</p>
									)
								}
								else if(data.state == 2){
									return (
										<p className="groupmsg">
											{data.msg}
										</p>
									)
								}
								
							})
						}
					</div>
					<div className="clearmsg" onClick={this.clearGroupMsg.bind(this)}>清屏</div>
				
					
					<div className="userlist">
						<h6>在线用户</h6>
							<span>群消息</span>
							<span>{this.state.msg.length}</span>
						{
							this.state.alluser.map(function(data){
								return (
									<div key={data.uuid}>
										<span data-name={data.name} data-identity={data.uuid} onDoubleClick={_this.chatPrivate.bind(_this)}>{data.name}</span>
										{(data.reply==[])?null:<span>{data.reply.length}</span>}
									</div>
								)
							})
						}
					</div>
				</div>
				
				<div className="msginput">
					<textarea ref={(input)=>{this.text = input;}} value={this.state.text} onChange={this.asynctext.bind(this)}></textarea>
					{
						(this.state.state==1)?(
							<div onClick={this.sendmsg.bind(this)}>发送</div>
						):(
							<div onClick={this.sendPrivateMsg.bind(this)}>发送</div>
						)
					}
					
				</div>
			</div>
		)
	}
}

export default groupMsg;