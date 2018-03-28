//用于获取每一个就餐组中的成员且返回就餐组的详细信息
var getGroupInfo = function(async,con,r,cal){
	var str = "select uuid,name,team,ording,price,role from user where team=?";
	var ary = [];
	var groupLength = r.length;
	async.every(r,function(data,callback){
		return con.query(str,[data.team],function(err,re){
			
			if(err){
				data.child = {};
			}
			else{
				data.child = re;
			}
			ary.push(data);
			if(r.indexOf(data) == groupLength-1){
				cal(ary);
			}
		})
	},function(){
		return ary; 
	});
}

var api = {
	getGroupInfo
};

module.exports = api;
