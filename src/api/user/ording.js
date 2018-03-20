var ordingapi = {
	ording:function(data){
		return window.fetch("/api/order/userording",{
			method:"POST",
			headers:{
				"Content-Type":"application/x-www-form-urlencoded"
			},
			body:data
		}).then(res=>{
			return res.json();
		})
	}
}
module.exports = ordingapi;