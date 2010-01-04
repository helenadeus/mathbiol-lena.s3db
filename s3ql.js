
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

var S3QLtranslator = function (input) {
	

	//start of by reading all that is before the first |
	var entityNames = {"S":"statement", "R": "rule","C":"collection","I":"item","P":"project","U":"user","D":"deployment"};
	var s3ql_query = "";
	//Detect any operation specification; separate components so that each can be trimmed
	if(!input['query']){
		input['query'] = query;
	}
	
	var op = input['query'].trim().match(/select|update|delete|insert/);
	
	
	if(op) { 
		op = op[0].trim(); 
		var targetAndParams = input['query'].replace(op,"").trim().match(/\((.*)\)/);
		
		if(!targetAndParams){
			alert('invalid query - parameters are required to be inside parenthesis');
			return false;
			}
		targetAndParams = targetAndParams[1];
	}
	else {
		op = "select";
		var targetAndParams = input['query'].trim();
	}
	
	
	var target = targetAndParams.trim().match(/^(D|U|P|C|R|I|S)/);
	if(!target){
		alert('invalid query - one of D|U|P|C|R|I|S is required to initialize the query');
		return false;
	}
	target = target[1];
	
	var params = targetAndParams.trim().match(/\|(.*)/);
	

	//Detect if there is more than 1 paramenter
	var s3ql_params = "";
	if(params){
		s3ql_params += "<where>";
		params = params[1].trim();
		var p = params.split(",");
		for (var i=0; i<p.length; i++) {
			 var pi = p[i].trim();
			 var attrValue = pi.match(/(.*)=(.*)/);
			 if(attrValue){
				var attr = attrValue[1].trim();
				var value = attrValue[2].trim();
				if(attr && value){
					if(entityNames[attr]) {attr =entityNames[attr]+"_id";}
					
				}
				
			 }
			 else if (pi.match(/(D|U|P|C|R|I|S)(.*)/)) {
					var id = pi.match(/(D|U|P|C|R|I|S)(.*)/);
					attr = entityNames[id[1]]+"_id";
					value = id[2];
					
			}
			s3ql_params += "<"+attr+">"+value+"</"+attr+">";
		}
		s3ql_params += "</where>";
	}
	
	//Now build the s3ql query
	if(op=="select"){
		s3ql_query += "<S3QL><select>*</select><from>"+entityNames[target]+"</from>";
	}
	else {
		s3ql_query += "<S3QL><"+op+">"+entityNames[target]+"</"+op+">";
	}
	s3ql_query += s3ql_params;
	s3ql_query += "</S3QL>";
	if(input['url']) 
		{
		s3ql_query = input['url']+"/S3QL.php?query="+s3ql_query;
		if(input['url']){	 //Append all other queries
			for (var j in input) {
				if(j!='url' && j!='query'){
					s3ql_query = s3ql_query + "&"+j+"="+input[j];
				}
			}
				
		}
		
		}
	
	
	return s3ql_query;
	
	
}

var query = unescape(window.location.search.replace("?",""));
if(query){
	//Separate the parameters of the query
	var input = {};
	var splitQuery = query.split("&");
	for (var i in splitQuery) {
		var tmp = splitQuery[i].match(/([A-Za-z0-9_]+)=(.*)/);
		if(tmp.length>=2){
			input[tmp[1]] = tmp[2];
		}

	}
	
	var s3ql = S3QLtranslator(input);

	if(query.match(/redirect\=0/) || !input['url']){
		var span = document.createElement('span');
		document.body.appendChild(span);
		span.style.fontWeight = "bold";
		span.innerHTML = "Your query {"+input['query']+"} translates into XML S3QL format:<br>";
		var txt = document.createElement('textarea');
		document.body.appendChild(txt);
		txt.cols = 100; 
		txt.value = s3ql;
	}
	else {
		window.location = s3ql;
	}
}

else {
	alert("Please provide a query in the URL using ? (for example ?select(S | R = x))");
}

