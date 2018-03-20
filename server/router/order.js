const router = require("express").Router();
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

var order = function(socket){
	router.route("/api/order/userording").post(function(req,res){
		req = req.body;
		var str = "update user set ording=?,type=?,price=?,num=1,total=? where uuid=?";
		var ary = [req.name,req.type,req.price,req.price,req.uid];
		
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"点餐失败"
				})
			}
			else{
				con.query(str,ary,function(e,r){
					if(e){
						res.send({
							aid:0,
							msg:"服务繁忙，点餐失败"
						});
						con.release();
					}
					else{
						socket.emit("order",{msg:"消息发布成功"})
						
						res.send({
							aid:1,
							msg:"点餐成功"
						});
						con.release();
						
						//提交点餐成功通知
						
					}
				});
			}
		})
	});
	
	
	
	//返回路由
	return router;
}

// 开放接口
module.exports = order;