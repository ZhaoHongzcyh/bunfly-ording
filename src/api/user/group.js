var groupapi = Object.assign({
		addgroup:function(data){
			return window.fetch("/api/group/addgroup",{
				method:"POST",
				headers:{
					"Content-Type":"application/x-www-form-urlencoded"
				},
				body:data
			}).then(res=>{
				return res.json();
			});
		},
		selectgroup:function(data = null){
			return window.fetch("/api/group/selectgroup",{
				method:"POST",
				headers:{
					"Content-Type":"application/x-www-form-urlencoded",
				},
				body:data
			}).then(res=>{
				return res.json();
			})
		}
})

module.exports = groupapi;