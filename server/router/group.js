const router = require("express").Router();
const mysql = require("mysql");
const crypto = require("crypto");
const mysql_dev = require("../database.json");
const commonAPI = require("../conmonAPI/conmonApi.js");
//import commonAPI from "../commonAPI/commonApi.js";
// 开始创建一个数据库连接池
const env = process.env.NODE_ENV;
var pool;
if(env == "devlopment"){
	 pool = mysql.createPool(mysql_dev.dev);
}
else{
	 pool = mysql.createPool(mysql_dev.production);
}

//用户分组详情查询（某组中具体有那些人）
const selectGroupUser = function(userGroup,async,con){
	var str = "select name,team,ording,price,num from user where team=?"
	async.every(userGroup,function(data){
		con.query(str,[data.team],function(err,end){
			
		})
	})
}

//用户加入组
var group = function(socket){
	
	//用户选择聚餐组
	router.route("/api/group/addgroup").post(function(req,res){
		res.send({
			aid:1,
			msg:"选择聚餐组"
		})
		
		//通知所有用户新用户加入
//		socket.emit()
	});

	//查询所有聚餐组
	router.route("/api/group/selectgroup").post(function(req,res){
		var str = "select uuid,name,team,count(1) as counts from user group by team";
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"查询群组失败"
				})
			}
			else{
				con.query(str,function(e,r){
					if(e){
						res.send({
							aid:0,
							msg:"服务繁忙，请稍后"
						});
						con.release();
					}
					else{
						res.send({
							aid:1,
							list:r
						});
						con.release();
					}
				})
			}
		})
	})
	
	
	return router;
}

// 开放接口
module.exports = group;