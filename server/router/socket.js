
const mysql = require("mysql");
const crypto = require("crypto");
const mysql_dev = require("../database.json");
const commonAPI = require("../conmonAPI/conmonApi.js");
// 开始创建一个数据库连接池
const env = process.env.NODE_ENV;
var pool;
if(env == "devlopment"){
	 pool = mysql.createPool(mysql_dev.dev);
}
else{
	 pool = mysql.createPool(mysql_dev.production);
}

//储存在线用户
var storageOnlineUser = function(id,name){
	var ary = [id,id,name]
	pool.getConnection(function(err,con){
		if(err){
			
		}
		else{
			var str = "insert into socket (uuid,socketid,name) values(?,?,?)";
			con.query(str,ary,function(e,r){
				if(e){
					console.log("数据库操作错误")
					console.log(e)
				}
				else{
					console.log("成功")
				}
			})
		}
	})
}

var skt = function(socket,io){
	var allOnLineUser = [];
	var user = {
		 id:"",
		 name:null
	}
	
	//监听用户进入系统
	socket.on("entry",(res)=>{
		storageOnlineUser(socket.id,res.name)
	})
	
	
	//监听用户聊天
	socket.on("chat",res=>{
		//将该消息，广播给所有人
		res = {
			msg:res.from + "说：" + res.msg,
			name:res.from
		}
		io.sockets.emit("getmsg",res);
	})
	
	//监听用户获取在线人数的事件
	socket.on("getOnlineUser",res=>{
		//获取在线用户
		var onLineUser = io.sockets.clients();
		for(var key in io.eio.clients){
			console.log(key);
		}
	})
	
	//监听用户离线
	socket.on("disconnect",res=>{
		console.log("用户断线");
		console.log(socket.id);
	})
}

module.exports = skt