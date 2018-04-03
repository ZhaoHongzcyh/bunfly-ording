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
			privatemsg:[],
			chatobj:null//聊天对象，用于储存聊天对象的id
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
		
		
		//检查是否已交流过
		var privatemsg = this.state.privatemsg;
		if(privatemsg.length>0){
			if(privatemsg[0][privateid] == undefined){
				privatemsg[0][privateid] = [];
			}
		}
		else{
			privatemsg.unshift({});
			privatemsg[0][privateid] = [];
		}
		
		this.setState({
			state:0,
			privatemsg:privatemsg,
			chatobject:chatobj,
			privateobj:mainobj,
			chatobj:privateid
		})
		console.log(privatemsg);
	}
	
	//发送私聊信息
	sendPrivateMsg(){
		var obj = this.state.privateobj;
		obj.msg = this.state.text;
		var socket = this.props.socket;
		socket.emit("sendPrivateMsg",obj);
		//推送消息之后，将发送的消息推入本地消息池
		obj.key = new Date().getTime();
		var selfmsg = {
			key:new Date().getTime(),
			msg:window.localStorage.getItem("name") + " 说：" + obj.msg
		}
		var allUserMsg = this.state.privatemsg;
		if(allUserMsg.length == 0){
			allUserMsg.unshift({})
			allUserMsg[0][obj.id] = [];
			allUserMsg[0][obj.id].unshift(selfmsg);
		}
		else{
			for(var k = 0; k < allUserMsg.length; k++){
				if(allUserMsg[k][obj.id].length>0){
					allUserMsg[k][obj.id].unshift(selfmsg);
				}
				else{
					allUserMsg[k] = {};
					allUserMsg[k][obj.id] = [];
					allUserMsg[k][obj.id].unshift(selfmsg);
				}
			}
		}
		//更新消息池中的信息
		this.setState({
			privatemsg:allUserMsg
		})
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
			
			//将私人聊天信息进行分类
			var privatechat = _this.state.privatechat;
			var privatemsgobj = {
				 key:new Date().getTime(),
				 msg:res.name + " 说：" + res.msg
			}
			if(privatechat[res.fromid]!= undefined){
				privatechat[res.fromid].unshift(privatemsgobj);
			}
			else{
				privatechat[res.fromid] = [];
				privatechat[res.fromid].unshift(privatemsgobj);
			}
//			_this.setState({
//				privatemsg:privatechat[res.fromid]
//			})
			var privatemsg = _this.state.privatemsg;
			privatemsg = [privatechat]
			_this.setState({
				privatemsg:privatemsg,
				privateobj:mainobj,
				chatobj:res.fromid
			})
			console.log("消息");
			console.log(_this.state.privatemsg);
		})
	}
	//清除所有群聊消息
	clearGroupMsg(){
		//判断清除聊天信息的具体信息
		var chatobj = this.state.chatobj;
		var privatemsg = this.state.privatemsg;
		if(chatobj == null){
			this.setState({
				msg:[]
			})
		}
		else{
			privatemsg[0][chatobj].length = 0;
			this.setState({
				privatemsg:privatemsg
			});
		}
		
	}
	
	//监听用户进入与离开（在线用户）
	onlineUserListen(socket){
		
		socket.on("leave",res=>{
			
		})
	}
	
	//返回群聊系统
	returnGroup(){
		this.setState({
			state:1,
			chatobject:"群聊中"
		})
	}
	//渲染
	render(){
		var _this = this;
		var chatobj = this.state.chatobj;
		return(
			<div className="order">
				<div className="msgcontent">
					
					<div className="allmsg">
						<div className="chatobject">
							<div>{this.state.chatobject}</div>
						</div>
						{
							
							(this.state.state == 0)?this.state.privatemsg.map(function(data){
//								
								return data[chatobj].map(function(dat){
									return (
										<p className="privatemsg">
											<span>{dat.msg}</span>
										</p>
									)
								})
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
							<span onClick={this.returnGroup.bind(this)}>群消息</span>
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