
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
var storageOnlineUser = function(id,name,socket){
	var ary = [id,id,name]
	pool.getConnection(function(err,con){
		if(err){
			
		}
		else{
			var str = "insert into socket (uuid,socketid,name,online) values(?,?,?,1)";
			con.query(str,ary,function(e,r){
				if(e){
					con.release();
				}
				else{
					con.release();
					//通知所用用户，更新在线用户列表
				}
			})
		}
	})
}

//查询在线用户
var selectAllUser = function(socket,io,pool){
	pool.getConnection(function(err,con){
		var str = "select *from socket";
		console.log("执行了")
		if(err){
			io.sockets.emit("alluser",{aid:0,user:[]});
		}
		else{
			con.query(str,function(e,f){
				if(e){
					io.sockets.emit("alluser",{aid:0,user:[]});
				}
				else{
					io.sockets.emit("alluser",{aid:1,user:f});
				}
				con.release();
			})
		}
	})
}

//更改用户状态（离线）
var changeUserState = function(socket,io,pool){
	var uuid = socket.id;
	var str = "delete from socket where uuid=?";
	pool.getConnection(function(e,con){
		if(e){
			setInterval();
		}
		else{
			con.query(str,[uuid],function(err,f){
				if(err){
					console.log("状态更改失败");
				}
				else{
					console.log("状态更改成功");
				}
				con.release();
				selectAllUser(socket,io,pool)
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
		storageOnlineUser(socket.id,res.name,socket)
	})
	
	//推送在线用户信息
	
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
		//推送在线人数
		console.log("获取在线人数")
		selectAllUser(socket,io,pool)
	})
	
	//监听用户离线
	socket.on("disconnect",res=>{
		changeUserState(socket,io,pool);
	})
}

module.exports = skt