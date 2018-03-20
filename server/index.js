const express = require("express");
const app = express();
const router = express.Router();
const mysql = require("mysql");
const path = require("path");
const base64url=require("base64url")
const async = require("async");
const moment = require("moment");
const bodyParser = require("body-parser");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const mysql_dev = require("./database.json");

const allUser_Connect = [];//用户socket链接 标识
// 静态路径
app.use(express.static(__dirname));

// 引入解析题中间件
app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());

// 开始创建一个数据库连接池
const env = process.env.NODE_ENV;
var pool;
if(env == "devlopment"){
	 pool = mysql.createPool(mysql_dev.dev);
}
else{
	 pool = mysql.createPool(mysql_dev.production);
}

//用户登录模块路径
app.use(require("./router/logoin.js"))


//socket.io链接监听
io.on("connection",function(socket){
	// 用户模块路径（包括登录\更改密码）
	console.log("用户链接成功");
	app.use(require("./router/user.js")(socket));
	
	//分组事件
	app.use(require("./router/group.js")(socket));
	
	//用户订餐路由
	app.use(require("./router/order.js")(socket));
	
})


// 开发端口确定
const port = (env == "devlopment")?8080:80;
server.listen(port,function(){
	console.log("server port is " + port);
})