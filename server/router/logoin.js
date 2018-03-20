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

router.route("/api/user/logoin").post(function(req,res){
	var str = "select uuid,name,pwd from user where name=? and pwd=?";
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"服务繁忙,请稍后登录"
			})
		}
		else{
			con.query(str,[req.body.name,req.body.pwd],function(e,r){
				if(e){
					res.send({
						aid:0,
						msg:"服务繁忙,登录失败"
					})
					con.release();
				}
				else{
					var token = commonAPI.gettoken(crypto);
					res.send({
						aid:1,
						msg:"登录成功",
						token:token,
						uid:r[0].uuid
					})
					con.release();
				}
			})
		}
	})
})

// 开放接口
module.exports = router;