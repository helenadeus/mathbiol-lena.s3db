function get() {
	var query = unescape(window.location.search.replace("?",""));
	if(query){
		//Separate the parameters of the query
		
		var splitQuery = query.split("&");
		for (var i in splitQuery) {
			var tmp = splitQuery[i].match(/([A-Za-z0-9_]+)=(.*)/);
			if(tmp){
				GET[tmp[1]] = tmp[2];
			}

		}

	
	}
}