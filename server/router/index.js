const express =require('express')
const app=express()
const mysql=require("mysql")
const bodyParser=require("body-parser")
const path=require("path")
const router=express.Router()
const base64url=require("base64url")
const fs=require("fs")
const multer = require('multer');
const async = require("async")
const moment = require("moment")//时间格式处理
const tableType = ["web","node"]
const json = require("./funapi/function.js")
const crypto = require("crypto")//加密包
const qiniu = require("qiniu");//七牛云服务SDK包
app.use(express.static(__dirname))
const qiNiuConfig = require("./config/qiNiuConfig.json");
// 数据爬虫（爬取百度新闻信息）
// 引入页面解析包
var cheerio = require("cheerio")
// 引入请求包
var request = require("request")
var http = require("http")
// 设置解析体中间件
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}))
app.use(bodyParser.json({limit:'10mb'}))//设置上传大小
var connection//数据库连接池
// 创建数据库连接池
const pool = mysql.createPool({
	port:3306,
	user:"root",
	// user:"kmz30koljo",
	// password:"4lmwzx43ylkzz3zki34l2yi1l04jiw0252551155",
	password:"root",
	host:"127.0.0.1",
	// host:"w.rdc.sae.sina.com.cn",
	// database:"app_zcyhcx"
	database:"blog"
})
// 获取连接池
pool.getConnection(function(err,con){
	if(err){
		console.log("连接池获取失败")
	}
	else{
		connection = con
		console.log("连接池获取成功")
	}
})
// 文章列表路由查询
router.route("/api/articlelist").post(function(res,res){
	res.header("Access-Control-Allow-Origin","*")
	var tabletype = ["web","node","story","math"];
	var chineseTabletype = ["web前端","web后端","城南故事","算法中心"]
	var allArticle = []

	// 提前准备好四种文章类型的容器
	for(var i = 0; i < tabletype.length; i++){
		var articleTypeInfo = {
			 table:"web",//文章所述数据表，目前只有一张，方便后期系统扩展
			 type:"",//文章类型，目前文章只有四种类型
			 articleType:"",//文章类型（在数据表中的标识）
			 title:[],//储存文章的id与标题
		}
		articleTypeInfo.type = chineseTabletype[i]
		articleTypeInfo.articleType = tabletype[i]
		allArticle.push(articleTypeInfo)
	}

	// 开始查询数据库中的数据（在这里不需要用async进行多次查询，避免增加服务器负担）
	//如果后期增加多张数据表，则需要async控制
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"服务器繁忙，请稍后查询"
			})
		}
		else{
			var str = "select uuid,title,type from web order by time desc";
			con.query(str,function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"查询失败，请稍后查询"
					})
					con.release();
				}
				else{
					// 每一篇文章类型的标题与id
					var singleArticleType = {
						uid:"",
						title:""
					}
					for(var i = 0; i < f.length; i++){
						f[i] .uid = f[i].uuid;
					}
					if(f.length >= 1){
						for(var i = 0; i < tabletype.length; i++){
							for(var k = 0; k < f.length; k++){
								if(f[k].type == tabletype[i]){
									allArticle[i].title.push(f[k]);
								}
							}
						}
					}
					else{

					}
					res.send({
						aid:1,
						allArticle:allArticle
					})
					con.release();
				}
			})
		}
	})
})

// 通过table与articleid查询文章
router.route("/api/tablearticleid").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")
	// 获取文章的table与articleid
	var table = req.body.table
	var uuid = req.body.uid
	var str = "select *from " + table +" where uuid='" + uuid+"'";
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"查询失败"
			})
		}
		else{
			con.query(str,function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"查询失败"
					})
					con.release();
				}
				else{
					for(var k = 0; k < f.length; k++){
						f[k].time = moment(f[k].time).format('YYYY-MM-DD')
						f[k].type = table
					}
					allArticle = json.readSingleImage(f,fs,async,qiNiuConfig);
					res.send({
						aid:1,
						suc:allArticle
					})
					con.release();
				}
			})
		}
	})
	
})
// 用户进入博客的时候，看到的最新的不同种类的文章
router.route("/api/differentarticle").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")
	var tableType = ["web"]
	var allArticle = []
	if(req.body.state == 1){
		async.every(tableType,function(item){
			var str = "select uuid,title,introduction,love,readnumber,titleimg,time,writer from " + item
			str = str + " order by time desc limit 0,5"
			pool.getConnection(function(err,con){
				if(err){
					res.send({
						aid:0,
						msg:"查询失败,请稍后再试"
					})
				}
				else{
					con.query(str,function(e,f){
						if(e){
							res.send({
								aid:0,
								msg:"查询失败,请稍后再试"
							})
							con.release();
						}
						else{
							if(f.length > 0){
								for(var k = 0; k < f.length; k++){
									f[k].time = moment(f[k].time).format('YYYY-MM-DD')
									f[k].type = item
									allArticle.push(f[k])
								}
								
							}
							allArticle = json.readSingleImage(f,fs,async,qiNiuConfig);
							
							// 查询每一篇评论条数
							// json.searchRepleLength(allArticle,async,res)
							// 检查是否已经查询完成
							con.query("select title,count(1) as counts from reply group by title",function(e,f){
								if(e){
									for(var i = 0; i < allArticle.length; i++){
										allArticle[i].replyNumber = 0
									}
								}
								else{
									for(var i = 0; i < allArticle.length; i++){
										for(var k = 0; k < f.length; k++){
											if(f[k].title == allArticle[i].title){
												allArticle[i].replyNumber = f[k].counts;
											}
										}
									}
								}
								res.send({
									aid:1,
									suc:allArticle
								})
								con.release();
							})
						}
					})
				}
			})
			
		})
	}
	else if(req.body.state == 2){
		var item = req.body.table
		var str ="select uuid,title,introduction,love,readnumber,titleimg,time,writer from web where type=? order by time desc"
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"哎呀!,博主正忙,没时间帮你找更多的文章"
				})
			}
			else{
				con.query(str,[item],function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"哎呀!,博主正忙,没时间帮你找更多的文章"
						})
						con.release();
					}
					else{
						if(f.length == 0){
							res.send({
								aid:0,
								msg:"就在刚才,博主删除了所有文章！！"
							})
							con.release();
						}
						else{
							for(var k = 0; k < f.length; k++){
									f[k].time = moment(f[k].time).format('YYYY-MM-DD')
									f[k].type = item
									allArticle.push(f[k])
								}
							allArticle = json.readSingleImage(f,fs,async,qiNiuConfig);
							res.send({
								aid:1,
								suc:allArticle
							})
							con.release();
						}
					}
				})
			}
		})
	}
	
})

// 博客主题图片（博客主页面的4张图片）
router.route("/api/hotimg").post(function(req,res){
	// res.header("Access-Control-Allow-Origin","*")
	// 读取数据库中阅读量最高文章的图片
	var str
	var ary = []
	var tableType = ["web"]
	var imgUrl = []//用于存储前端热门文章的图片
	var key = [json.uuid(),json.uuid()]
	if(req.body.state == 1){
		var index = {
			url:null,
			type:null,
			title:null,
			key:null
		}
		var end = {}
		// 通过async处理数据库查询异步问题
		async.every(tableType,function(item){
			console.log(item)
			str = "select titleimg,title,uuid from web order by time desc limit 0,4"
			pool.getConnection(function(err,con){
				if(err){
					res.send({
						aid:0,
						msg:"热门文章查询失败"
					})
					con.release();
				}
				else{
					con.query(str,function(e,r){
						if(e){
							res.send({
								aid:0,
								msg:"热门文章查询失败"
							})
							con.release();
						}
						else{
							if(r.length <= 3){
								// 读取默认的图片信息
								imgUrl = json.readImage(r,fs,async)
								res.send({
									aid:1,
									info:imgUrl
								})
								con.release();
							}
							else{
								imgUrl = json.readImage(r,fs,async);
								res.send({
									aid:1,
									info:imgUrl
								})
								con.release();
							}
						}
					})
				}
			})
			
		})
	}
})
// 热点新闻接口
router.route("/api/hotnews").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")
	console.log("热点新闻")
	json.startget("http://news.baidu.com/",http,cheerio,res)
})

// 用户获取某一篇文章的具体内容（代表用户开始阅读某一篇文章）
router.route("/api/readarticle").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")
	var str
	var ary = []
	if(req.body.state == 1){
		str = "select *from " + req.body.table +" where title=?"
		ary = [req.body.title]
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"哎哟,博主好像不愿意分享这篇文章,等他心情好了再来访问吧"
				})
			}
			else{
				con.query(str,ary,function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"哎哟,博主好像不愿意分享这篇文章,等他心情好了再来访问吧"
						})
						con.release();
					}
					else{
						if(f.length == 0){
							res.send({
								aid:0,
								msg:"哎呀,这篇文章可能就在刚才,被博主删除了！！！"
							})
							con.release();
						}
						else{
							for(var k = 0; k < f.length; k++){
								f[k].time = moment(f[k].time).format('YYYY-MM-DD')
								f[k].table = req.body.table
								f[k].title = req.body.title
							}
							res.send({
								aid:1,
								suc:f
							})
							
							// 更新浏览量与阅读量
							str = "update " + req.body.table + " set readnumber=readnumber+1 where title=?"
							con.query(str,[req.body.title],function(e,r){
								if(e){
									console.log("更新失败")
									con.release();
								}
								else{
									console.log("更新成功")
									con.release();
								}
							})
						}
					}
				})
			}
		})
	}
})
// 前端点赞功能
router.route("/api/clickz").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")
	var str;
	var ary = [];
	if(req.body.state == 1){
		str = "update " + req.body.table +" set love=love+1 where title=?"
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"点赞失败了哟！"
				})
			}
			else{
				con.query(str,[req.body.title],function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"运气不好,点赞失败了!"
						})
						con.release();
					}
					else{
						res.send({
							aid:1
						})
						con.release();
					}
				})
			}
		})
	}
})

// 前端具体某一篇文章的评论查询
router.route("/api/getreply").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var str;
	pool.getConnection(function(er,con){
		if(er){
			res.send({
				aid:0
			})
		}
		else{
			str = "select uuid,reply,time from reply where title = ? order by time desc";
			con.query(str,[req.body.title],function(e,f){
				if(e){
					res.send({
						aid:0
					})
					con.release()
				}
				else{
					for(var i = 0; i < f.length; i++){
						f[i].time = moment(f[i].time).format('YYYY-MM-DD,h:mm:ss a');
					}
					res.send({
						aid:1,
						reply:f
					})
					con.release()
				}
			})
		}
	})
})

// 前端用户发表评论
router.route("/api/addreply").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var str = "insert into reply (uuid,title,reply,time) values(?,?,?,?)";
	var time = json.date(new Date);
	var ary = [json.uuid(),req.body.title,req.body.reply,time]
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"服务繁忙,稍后评论吧！"
			})
		}
		else{
			con.query(str,ary,function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"好伤心,评论失败了"
					})
					con.release()
				}
				else{
					res.send({
						aid:1,
						msg:{
							uuid:json.uuid(),
							reply:req.body.reply,
							time:time
						}
					})
					con.release();
				}
			})
		}
	})
})

// 查询用户提交的建议
router.route("/api/searchprops").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var str = "";
	pool.getConnection(function(e,con){
		if(e){
			res.send({
				aid:0
			})
		}
		else{
			str = "select *from music order by time desc";
			con.query(str,function(er,f){
				if(er){
					res.send({
						aid:0
					})
					con.release()
				}
				else{
					for(var i = 0; i < f.length; i++){
						f[i].time = f[i].time = moment(f[i].time).format('YYYY-MM-DD');
					}
					res.send({
						aid:1,
						props:f
					})
					con.release();
				}
			})
		}
	})
})

// 添加用户的建议
router.route("/api/addprops").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var str = "";
	var ary = [json.uuid(),req.body.content,req.body.name,json.date(new Date)]
	pool.getConnection(function(er,con){
		if(er){
			res.send({
				aid:0,
				msg:"建议提交失败,尴尬！"
			})
		}
		else{
			str = "insert into music (uuid,music,name,time) values(?,?,?,?)"
			con.query(str,ary,function(e,f){
				if(e){
					console.log(e)
					res.send({
						aid:0,
						msg:"服务繁忙,请稍后添加"
					})
					con.release();
				}
				else{
					res.send({
						aid:1,
						msg:"感谢你提出宝贵的意见"
					})
					con.release();
				}
			})
		}
	})
})
// 文件上传接口
var imgName = "";
var storage = multer.diskStorage({
	//设置上传路径
	destination:function(req,file,callback){
		callback(null,"./WebarticleListImg/")
	},
	filename:function(req,file,callback){
		imgName = file.originalname;
		var uuid = json.pointUuid(8,10);
		imgName = uuid + "-" + imgName;
		console.log(imgName);
		callback(null,imgName);
	}
})
var upload = multer({
	storage:storage,
	limits:{
		fieldSize:"50MB"
	}
})
app.all('*',function(req,res,next){
	// console.log(process.env.NODE_ENV)
	res.header("Access-Control-Allow-Origin","*");
	next();
})

// 读取内容页面轮播图片接口
app.post("/api/up",upload.single('file'),function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var str = "select titleimg from web order by time desc";
	
	res.send({
		aid:1,
		src:imgName
	})
})
// 前端添加文章
app.post("/api/addArticle",upload.single('file'),function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	console.log(req.file)
	// 查询用户上传的文件是否为image图片
	var imageType = req.file.mimetype;
	console.log(imageType);
	var reg = /image/im;
	if(!reg.test(imageType)){
		res.send({
			aid:0,
			msg:"图片类型错误"
		})
	}
	else{
		// 判断文件大小尺寸
		if(req.file.size > 4500000){
			res.send({
				aid:0,
				msg:"图片内存太大(最大内存为4.5M)"
			})
		}
		else{
			// console.log(typeof req.body.article);

			var articleInfo = JSON.parse(req.body.article);
			var str = ""
			var ary = [];
			for(k in articleInfo){
				console.log(articleInfo[k])
			}
			
			// 首先检查是否存在相同的文章名字
			str = "select title from web where title=?";
			pool.getConnection(function(err,con){
				if(err){
					res.send({
						aid:0,
						msg:"文章添加失败"
					})
				}
				else{
					con.query(str,[articleInfo.title],function(err,ff){
						if(err){
							res.send({
								aid:0,
								msg:"文章添加失败"
							})
							con.release();
						}
						else{
							if(ff.length >= 1){
								res.send({
									aid:0,
									msg:"该文章已经存在"
								})
								con.release();
							}
							else{

								str = "insert into web (uuid,title,introduction,content,love,readnumber,writer,time,type,titleimg) values(?,?,?,?,?,?,?,?,?,?)";
								ary.push(json.uuid());
								ary.push(articleInfo.title);
								ary.push(articleInfo.introduction);
								ary.push(articleInfo.content);
								// ary.push("234");
								ary.push(0);
								ary.push(0);
								ary.push(articleInfo.writer);
								ary.push(json.date(new Date))
								ary.push(articleInfo.type);
								ary.push(imgName);
								console.log(str);

								// console.log(ary)
								con.query(str,ary,function(e,f){
									if(e){
										console.log(e);
										res.send({
											aid:0,
											msg:"数据库插入错误"
										})
										con.release();
									}
									else{
										res.send({
											aid:1,
											msg:"添加成功"
										})
										con.release();

										// 向七牛云服务器上传图片文件

										json.upImgToQiNiu(qiNiuConfig,qiniu,imgName);
										//json.upImgToQiNiu(qiNiuConfig,qiniu,imgName,res,fs,true);
									}
								})
							}
						}
					})
				}
			})
			
		}
	}
})
// 用户登录
router.route("/api/logoin").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	// 对用户信息加密之后进行查询
	var user = req.body.admin;
	var pwd = json.cryptPwd(req.body.pwd,"I LOVE YOU",crypto);
	//重新生成新的token
	// 查询用户信息是否存在
	var str = "select name,password,role from user where name=? and password=? and role=1";
	var ary = [user,pwd]
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"登录失败"
			})
		}
		else{
			con.query(str,ary,function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"登录失败"
					})
					con.release();
				}
				else{
					if(f.length >= 1){
						res.send({
							aid:1,
							msg:"登录成功",
							token:json.gettoken(crypto)
						})
						con.release();
					}
					else{
						res.send({
							aid:0,
							msg:"账号或密码错误"
						})
						con.release();
					}
				}
			})
		}
	})
	
})

// 用户身份合法性检查
router.route("/api/checktoken").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var token = req.body.token;
	var obj = json.checkToken(token,crypto);
	console.log(obj);
	res.send(obj);
})

// 用户更改个人账号
router.route("/api/changepwd").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var oldpwd = json.cryptPwd(req.body.oldpwd,"I LOVE YOU",crypto);
	var newpwd = json.cryptPwd(req.body.newpwd,"I LOVE YOU",crypto);
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"账号更改失败"
			})
		}
		else{
			var str = "update user set password = ? where password = ?";
			con.query(str,[newpwd,oldpwd],function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"账号更改失败"
					})
					con.release();
				}
				else{
					res.send({
						aid:1,
						msg:"账号更改成功"
					})
					con.release();
				}
			})
		}
	})
})
// 获取所有用户信息
router.route("/api/getAllUser").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	pool.getConnection(function(err,con){
		if(err){
			res.send({
				aid:0,
				msg:"用户信息获取失败"
			})
		}
		else{
			var str = "select uuid,name,time,telephone from user where role =0";
			con.query(str,function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"用户信息获取失败"
					})
				}
				else{
					// 格式化时间
					for(var i = 0; i < f.length; i++){
						f[i].time = moment(f[i].time).format('YYYY-MM-DD');
					}
					res.send({
						aid:1,
						user:f
					})
				}
			})
		}
	})
})
// 添加用户
router.route("/api/adduser").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*")

	// /首先检查用户端token是否过期
	var obj = json.checkToken(req.body.token,crypto);
	if(obj.aid == 0){
		res.send({
			aid:0,
			msg:"登录过期，请重新登录"
		})
	}
	else{
		var password = json.cryptPwd(req.body.pwd,"I LOVE YOU",crypto)
		var time = json.date(new Date);
		var uuid = json.uuid();
		var ary = [uuid,req.body.name,password,time,req.body.telephone,0];

		pool.getConnection(function(err,con){
			var str = [];//储存数据库查询语句

			if(err){
				res.send({
					aid:0,
					msg:"用户添加失败"
				})
			}
			else{
				// 在添加之前检查用户是否已经存在
				str = [
					"select name from user where name=?",
					"insert into user (uuid,name,password,time,telephone,role) values(?,?,?,?,?,?)"
				];

				con.query(str[0],[req.body.name],function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"服务繁忙，请稍后再添加"
						})
						con.release();
					}
					else{
						if(f.length >= 1){
							res.send({
								aid:0,
								msg:"该用户已经存在"
							})
							con.release();
						}
						else{
							con.query(str[1],ary,function(er,re){
								if(er){
									res.send({
										aid:0,
										msg:"用户添加失败"
									})
									con.release();
								}
								else{
									res.send({
										aid:1,
										msg:"用户添加成功",
										uuid:uuid,
										name:req.body.name,
										telephone:req.body.telephone,
										time:time
									})
									con.release();
								}
							})
						}
					}
				})
			}
		})
	}
})

//删除用户
router.route("/api/deluser").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	// 检查用户的token是否合法
	var obj = json.checkToken(req.body.token,crypto);
	if(obj.aid == 0){
		res.send({
			aid:0,
			msg:"登录过期，请重新登录"
		})
	}
	else{
		// 开始进行删除操作
		pool.getConnection(function(err,con){
			var str = "delete from user where uuid=?"
			if(err){
				res.send({
					aid:0,
					msg:"服务繁忙，请稍后再试"
				})
			}
			else{
				con.query(str,[req.body.uuid],function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"用户删除失败，请稍后再试"
						})
						con.release();
					}
					else{
						res.send({
							aid:1,
							msg:"删除成功",
							delid:req.body.uuid
						})
						con.release();
					}
				})
			}
		})
	}
})
// 文章管理
router.route("/api/articleManage").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var ary = [req.body.type];
	var str = "select uuid,title,introduction,readnumber,writer,time,type from web order by time desc";
	if(req.body.state == 1){
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"服务繁忙，请稍后再试"
				})
			}
			else{
				con.query(str,ary,function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"服务繁忙，请稍后再试"
						})
						con.release();
					}
					else{
						// 时间格式化处理
						if(f.length == 0){
							res.send({
								aid:0,
								msg:"该类型文章为空"
							})
							con.release();
						}
						else{
							var length = f.length;
							for(var i = 0; i < length; i++){
								f[i].time = moment(f[i].time).format('YYYY-MM-DD');
							}
							res.send({
								aid:1,
								article:f
							})
							con.release();
						}
					}
				})
			}
		})
		
	}
	else if(req.body.state == 2){
		// 删除文章的代表图片
		var artid = req.body.artid;
		pool.getConnection(function(err,con){
			str = "select titleimg from web where uuid=?";
			con.query(str,[artid],function(e,f){
				if(e){
					res.send({
						aid:0,
						msg:"文章删除失败"
					})
					con.release();
				}
				else{
					try{
						fs.unlinkSync("./WebarticleListImg/" + f[0].titleimg);
					}
					catch (e){
						res.send({
							aid:0,
							msg:"待会儿再删除吧！"
						})
						return false;
					}
					str = "delete from web where uuid = ?";
					con.query(str,[artid],function(ee,re){
						if(ee){
							res.send({
								aid:0,
								msg:"文章删除失败了哟！"
							})
							con.release();
						}
						else{
							res.send({
								aid:1,
								msg:"删除成功"
							})
							con.release();
						}
					})
				}
			})

		})
		
	}
	else if(req.body.state == 3){
		var info = JSON.parse(req.body.info);
		var artid = info.uuid;
		str = "update web set title=?,writer=?,type=?,introduction=? where uuid=?";
		ary = [info.title,info.writer,info.type,info.introduction,artid]
		pool.getConnection(function(err,con){
			if(err){
				res.send({
					aid:0,
					msg:"服务繁忙，请稍后再试"
				})
			}
			else{
				con.query(str,ary,function(e,f){
					if(e){
						res.send({
							aid:0,
							msg:"服务繁忙，请稍后再试"
						})
						con.release();
					}
					else{
						res.send({
							aid:1,
							msg:"更改成功"
						})
						con.release();
					}
				})
			}
		})
		
	} 
})
// 音乐上传接口
var oldMusicName = "";
var musicname = {
		oldname:"musicfile",
		newname:"newfile"
	}
var music = multer.diskStorage({
	//设置上传路径
	destination:function(req,file,callback){
		callback(null,"./static/media/")
	},
	filename:function(req,file,callback){
		imgName = file.originalname;
		var uuid = json.pointUuid(8,10);
		imgName = uuid + "-" + imgName;
		musicname = {
			oldname:file.originalname,
			newname:imgName
		};
		oldMusicName = file.originalname;
		callback(null,imgName);
	}
})
var musicUpload = multer({
	storage:music,
	limits:{
		fieldSize:"12MB"
	}
})
app.post("/api/upmusic",musicUpload.single("file"),function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	
	
	var homeDir = "./static/media/";
	var localFiles = [];

	try {
		localFiles = fs.readFileSync(homeDir + "package.json",'UTF-8');
		localFiles = JSON.parse(localFiles);
	}
	catch(err) {
		localFiles = [];
	}

	musicname.size = Math.ceil(req.file.size/(1024 * 1024)) + "M";
	musicname.uptime = json.date(new Date);
	localFiles.unshift(musicname);
	fs.writeFileSync(homeDir + "package.json",JSON.stringify(localFiles));
	
	res.send({
		aid:1,
		msg:"上传成功"
	})
})
// 系统管理界面读取音乐列表
router.route("/api/readMusicList").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var localFiles = [];
	var homeDir = "./static/media/";
	try{
		localFiles = fs.readFileSync(homeDir + "package.json",'UTF-8');
		localFiles = JSON.parse(localFiles);
	}
	catch (e){
		localFiles = [];
	}
	res.send({
		aid:1,
		list:localFiles
	})
})
// 用户访问界面读取音乐列表
router.route("/api/userMusicList").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var localFiles = [];
	var homeDir = "./static/media/";
	try{
		localFiles = fs.readFileSync(homeDir + "package.json",'UTF-8');
		localFiles = JSON.parse(localFiles);
	}
	catch (e){
		localFiles = [];
	}

	// 通过循环生成前端可用的音频标签的src
	localFiles.map(function(data,index){
		data.src = "./static/media/" + data.newname;
		data.name = data.oldname;
	})
	res.send({
		aid:1,
		music:localFiles
	})
})

//删除音乐列表
router.route("/api/delMusic").post(function(req,res){
	// 读取文件记录中的详细信息
	var homeDir = "./static/media/";
	var localFiles = []

	try{
		localFiles = fs.readFileSync(homeDir + "package.json",'UTF-8');
		localFiles = JSON.parse(localFiles);
	}
	catch (e){
		localFiles = []
	}

	// 查询相同姓名的文件
	localFiles.map(function(data,index){
		if(data.newname == req.body.delname){
			localFiles.splice(index,1);
		}
	})

	// 重新生成package.json文件
	localFiles = JSON.stringify(localFiles);
	try{
		fs.writeFileSync(homeDir + "package.json",localFiles);
		// 开始删除容器磁盘中的文件
		fs.unlinkSync(homeDir + req.body.delname);
	}
	catch (e){
		res.send({
			aid:0,
			msg:"删除失败"
		})
		return false;
	}
	res.send({
		aid:1,
		msg:"删除成功",
		imgName:req.body.delname
	})
}) 

router.route("/").get(function(req,res){
	console.log(req.protocol);
	console.log(123)
	res.redirect('http://www.baidu.com');
	// res.send("hello")
	// res.sendfile("./build/index.html")
})
router.route("/main").get(function(req,res){
	res.sendfile("./build/index.html")
})
router.route("/music").get(function(req,res){
	res.sendfile("./build/index.html")
})
router.route("/main/*").get(function(req,res){
	res.write("错误")
})
router.route("/api/getWeither").post(function(req,res){
	res.header("Access-Control-Allow-Origin","*");
	var option = {
		latitude:req.body.latitude,
		longitude:req.body.longitude
	}
	//json.getWeither(request,{latitude:31.50470126,longitude:104.70551898},res);
	json.getWeither(request,option,res)
})

// 开始监听
app.use("/",router)
app.listen(80)
