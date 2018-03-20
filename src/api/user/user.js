var userapi = Object.assign({
	logoin:function(data){
		return window.fetch("/api/user/logoin",{
			method:"POST",
			headers:{
				"Content-Type":"application/x-www-form-urlencoded"
			},
			body:data
		}).then(res=>{
			return res.json();
		})
	},
	checkToken:function(data){
		return window.fetch("/api/user/checktoken",{
			method:"POST",
			headers:{
				"Content-Type":"application/x-www-form-urlencoded"
			},
			body:data
		}).then(res=>{
			return res.json();
		})
	}
})

export default userapi;