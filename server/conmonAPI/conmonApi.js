//生成token的函数
var gettoken=function(crypto){
//设置token头部
const head={
        type:"JWT",
        alg:"HS256"
    }
// 设置token的负载
var timestamp=new Date().getTime();
var exp = timestamp + 1 * 60 * 60;
var payload={
        iss:"zhaohong",
        sub:"reader",
        aud:"user",
        exp:exp,
        iat:timestamp
    }
// 生成加密第一段
var token1=new Buffer(JSON.stringify(head)).toString("base64");
// 生成加密载荷
var token2=new Buffer(JSON.stringify(payload)).toString('base64');
// 拼接加密第一段与加密载荷
var encodedString=token1+"."+token2;
var salt = "I LOVE YOU";
// 通过对第三部分进行密码加盐处理
var token3 = cryptPwd(encodedString,salt,crypto);
//返回加密之后的token
var jtoken = token1+"."+token2+"."+token3;
return jtoken;
}

// 将时间戳转为2017-06-30类似的格式
var date=function(now)   {     
    var year=now.getFullYear();     
    var month=now.getMonth()+1;     
    var date=now.getDate();     
    var hour=now.getHours();     
    var minute=now.getMinutes();     
    var second=now.getSeconds();     
  return  year+"-"+month+"-"+date+"   "+hour+":"+minute+":"+second;     
              }

// 主要是对token的解密以及token信息的载体与有效时长的判断
var checkToken=function(token,crypto){
    var obj = {
        aid:0,//token验证的状态码
        msg:""//token验证返回的验证结果
    }
    var token = token.split(".");
    //现在token包含了头部、躯干、加盐验证
     // 验证躯干信息是否合法
     var token2 = new Buffer(token[1],"base64").toString();
     token2 = JSON.parse(token2);
     if(token2.iss == "zhaohong"){
        var exp = parseInt(new Date().getTime()) - parseInt(token2.iat);
        // 判断时间是否过期
        if(exp > (1 * 60 *60 *1000)){
            // 时间过期
            obj = {
                aid:0,
                msg:"长时间未操作,请重新登录"
            }
            return obj;
        }
        else{
            // 检查加盐算法是否与token3相等
            var encode = token[0] + "." + token[1];
            var salt = "I LOVE YOU";
            var token3 = cryptPwd(encode,salt,crypto);
            if(token3 == token[2]){
                obj = {
                    aid:1,
                    msg:"身份验证成功"
                }
                return obj;
            }
            else{
                obj = {
                    aid:0,
                    msg:"非法登录"
                }
                return obj;
            }
        }
     }
     else{
        obj = {
            aid:0,
            msg:"身份认证失败,请重新登录"
        }
        return obj;
     }
}

// 生成uuid
var uuid=function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
}
//从数据库连接池获取一个连接对象
var getcon = function(pool,connection){
	pool.getConnection(function(err,con){
		if(err){
			console.log("连接池获取失败")
		}
		else{
			connection = con
		}
	})
    return connection
}
// 爬虫模块
var startget = function(url,http,cheerio,send){
    http.get(url,function(res){
        var html = ""//用于存放请求的网页内容
        var titles = []
        res.setEncoding("utf-8")
        res.on("data",function(chunk){
            html = html + chunk;
        })
        res.on("end",function(){
            var ary = []
            var $ = cheerio.load(html)
            // 读取ul新闻的长度
            var ul = $("#pane-news ul").length
            var li = $("#pane-news ul:nth-child(1) li").length
            for(var k=1;k<ul;k++){
                for(var l = 1; l < li+1; l++){
                    var href = $("#pane-news ul:nth-child("+k+")"+" li:nth-child("+l+") a").attr("href")
                    var text = $("#pane-news ul:nth-child("+k+")"+" li:nth-child("+l+") a").text()
                    var obj = {
                        "uid":uuid(),
                        "href":href,
                        "text":text
                    }
                    ary.push(obj)
                }
            }
            send.send({
                aid:1,
                data:ary
            })
        })
    })
}
// 生成指定长度的uuid
var pointUuid = function(len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [], i;
  radix = radix || chars.length;
 
  if (len) {
   // Compact form
   for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
  } else {
   // rfc4122, version 4 form
   var r;
 
   // rfc4122 requires these characters
   uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
   uuid[14] = '4';
 
   // Fill in random data. At i==19 set the high bits of clock sequence as
   // per rfc4122, sec. 4.1.5
   for (i = 0; i < 36; i++) {
    if (!uuid[i]) {
     r = 0 | Math.random()*16;
     uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
    }
   }
  }
  return uuid.join('');
}

// 密码加盐处理
var cryptPwd = function(password,salt,crypto){
    // 密码加盐处理
    var saltPassword = password + salt;
    // 密码加盐的MD5
    var md5 = crypto.createHash("md5");
    var result = md5.update(saltPassword).digest("hex");
    return result;
}
// 读取轮播图中的图片
var readImage = function(ary,fs,async){
    var imgUrl = []
    var head = [3,0]
    var head = [
        {
            titleimg:"1.jpg",
            url:null,
            type:"web",
            title:null,
            key:uuid()
        },
        {
            titleimg:"2.jpg",
            url:null,
            type:"web",
            title:null,
            key:uuid()
        },
        {
            titleimg:"3.jpg",
            url:null,
            type:"web",
            title:null,
            key:uuid()
        },
        {
            titleimg:"4.jpg",
            url:null,
            type:"web",
            title:null,
            key:uuid()
        }
    ]
    // 判断数据库中的热门图片是否足够四张
    if(ary.length <= 3){
        ary = head;
    }
    else{
        
    }
    async.every(ary,function(item){
        var index = {
            url:null,
            type:null,
            title:null,
            key:null
        }
        var buf = "";
        // 将图片读取为base64编码的格式
        try{
            buf = fs.readFileSync("./WebarticleListImg/" + item.titleimg);
            buf = buf.toString("base64");
            buf = "data:image/png;base64," + buf;
            index.url = buf;
            index.type = "web";
            index.title = item.title;
            index.key = uuid();
            imgUrl.push(index);  
        }
        catch (e){
            try{
                buf = fs.readFileSync("./WebarticleListImg/2.jpg");
                buf = buf.toString("base64");
                buf = "data:image/png;base64," + buf;
                index.url = buf;
                index.type = "web";
                index.title = item.title;
                index.key = uuid();
                imgUrl.push(index);
            }
            catch (e){
                console.log("热门文章读取异常")
            }
        }
    })

    // 按照顺序整理轮播图的顺序
    //4、1、2、3、4、1，四张轮播图正常的顺序
    imgUrl.push(imgUrl[0]);
    imgUrl.unshift(imgUrl[3]);
    return imgUrl;
}
// 读取每一篇文章的代表图片
var readSingleImage = function(ary,fs,async,config){
    async.every(ary,function(item){
        try{
            var buf = "";
            // 将图片读取为base64编码的格式
            // buf = fs.readFileSync("./WebarticleListImg/" + item.titleimg);
            // buf = buf.toString("base64");
            // buf = "data:image/png;base64," + buf;
            // item.src = buf 
            item.src = config.address + item.titleimg
        }
        catch (e){
            console.log("读取每一篇文章的代表图片失败")
        }
    })
    return ary;
}

// 获取天气预报接口（对外提供接口）
var getWeither = function(request,location,resd){
    var html = "";
    // 检查用户传递的信息是否正确
    var url = "http://jisutianqi.market.alicloudapi.com/weather/query?location=";
    var option = {
        url:"http://jisutianqi.market.alicloudapi.com/weather/query?location=",
        headers:{
            "Authorization":"APPCODE 6c97bdd755ee418fb9b7bd5def0b11be"
        }
    }
    if(typeof location == "object"){
        location = location.latitude + "," + location.longitude;
        location = encodeURI(location);
        url = url + location;
        option.url = url;
        request(option,function(error,res,body){
            resd.send({
                data:body
            })
        })
    }
    else{

    }
}

// 向七牛云图床服务器上传图片
var upImgToQiNiu = function(config,qiniu,imgName){
        // 七牛云鉴权对象
        var mac = new qiniu.auth.digest.Mac(config.accessKey,config.secretKey);

        // 配置七牛云储存服务器
        var conf = new qiniu.conf.Config();
        conf.zone = qiniu.zone.Zone_z1;
        // 使用CDN加速上传动作
        conf.useCdnDomain = true;
        // 七牛储存对象
        var option = {
                scope:config.bucket,
                returnBody:'{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
                callbackBodyType: 'application/json'
            };
        var localFile = config.localAddress + imgName;

        // 生成七牛云上传对象
        var formUploader = new qiniu.form_up.FormUploader(conf);
        var putExtra = new qiniu.form_up.PutExtra();
        var uploadtoken = new qiniu.rs.PutPolicy(option).uploadToken(mac);
  
       formUploader.putFile(uploadtoken,imgName,localFile,putExtra,function(resErr,resBody,resInfo){
            
            if(resErr){
                console.log("七牛云上传异常");
                // 等待一段时间重新尝试上传动作
                setTimeout(function(){
                    upImgToQiNiu(config,qiniu,imgName,res,fs,false)
                },10000)
            }
            if(resInfo.statusCode == 200){
               console.log(imgName + "上传七牛云成功");
            }
            else{
                console.log("上传七牛云失败,七牛云错误码:" + respInfo.statusCode);
                setTimeout(function(){
                    upImgToQiNiu(config,qiniu,imgName,res,fs,false)
                },10000)
            }
        }) 
}

// 生成json对象，将接口开放出去
var json={
    "gettoken":gettoken,
    "date":date,
    "checkToken":checkToken,
    "uuid":uuid,
    "getcon":getcon,
    "startget":startget,
    "pointUuid":pointUuid,
    "cryptPwd":cryptPwd,
    "readImage":readImage,
    "readSingleImage":readSingleImage,
    "getWeither":getWeither,
    "upImgToQiNiu":upImgToQiNiu
}
module.exports=json;