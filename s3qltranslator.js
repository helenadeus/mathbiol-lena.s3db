
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

var S3QLtranslator = function (query) {
	//start of by reading all that is before the first |
	var entityNames = {"S":"statement", "R": "rule","C":"collection","I":"item","P":"project","U":"user","D":"deployment"};
	var s3ql_query = "";
	//Detect any operation specification; separate components so that each can be trimmed
	var op = query.trim().match(/select|update|delete|insert/);
	if(op) { 
	op = op[0].trim(); 
	var targetAndParams = query.replace(op,"").trim().match(/\((.*)\)/);
	
	if(!targetAndParams){
		alert('invalid query - parameters are required to be inside parenthesis');
		return false;
		}
	targetAndParams = targetAndParams[1];
	}
	else {
		op = "select";
		var targetAndParams = query.trim();
	}
	
	
	var target = targetAndParams.trim().match(/^(D|P|C|R|I|S)/);
	if(!target){
		alert('invalid query - one of D|P|C|R|I|S is required to initialize the query');
		return false;
	}
	target = target[1];
	
	var params = targetAndParams.trim().match(/\|(.*)/)[1].trim();

	//Detect if there is more than 1 paramenter
	var s3ql_params = "";
	if(params){
		s3ql_params += "<where>";
		var p = params.split(",");
		for (var i=0; i<p.length; i++) {
			 var pi = p[i].trim();
			 var attrValue = pi.match(/(.*)=(.*)/);
			 if(attrValue){
				var attr = attrValue[1].trim();
				var value = attrValue[2].trim();
				if(attr && value){
					if(entityNames[attr]) {attr =entityNames[attr]+"_id";}
					s3ql_params += "<"+attr+">"+value+"</"+attr+">";
				}
				
			 }
			 else if (pi.match(/(D|P|C|R|I|S)(.*)/)) {
					var id = pi.match(/(D|P|C|R|I|S)(.*)/);
					attr = entityNames[id[1]]+"_id";
					value = id[2];
					s3ql_params += "<"+attr+">"+value+"</"+attr+">";
			}
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
	var span = document.createElement('span');
	document.body.appendChild(span);
	span.style.fontWeight = "bold";
	span.innerHTML = "Your query {"+query+"} translates into XML S3QL format:<br>";
	var txt = document.createElement('textarea');
	document.body.appendChild(txt);
	txt.cols = 100; 
	txt.value = s3ql_query;
	
}

var query = unescape(window.location.search.replace("?",""));
if(query){
S3QLtranslator(query);
}
else {
	alert("Please provide a query in the URL using ? (for example ?select(S | R = x))");
}

