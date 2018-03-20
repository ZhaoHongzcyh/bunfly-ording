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

var user = function(socket){
	//核对用户的token是否过期
	router.route("/api/user/checktoken").post(function(req,res){
		var token = req.body.token;
		var obj = commonAPI.checkToken(token,crypto);
		res.send(obj);
	})
	
	return router;
}


// 开放接口
module.exports = user;