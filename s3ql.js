
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

var default_ms =  'http://root.s3db.org/';

var dereferece_uri = function (uri, input) {
	 var sep = "|";
	 var deref = {};
	
	 uri =  uri.replace("?","");
	 var separate = uri.match(/\|/);
	 if(!separate){
		var split = uri.match(/(D|P|U|C|R|I|S)([0-9]+)+/g);
	 }
	 else {
		
		var split = uri.split(sep);
	 }

	 if(split){
		//the last alphanumeric of split is the local id; if length is equal to uri, no distributing
		
		deref['uid'] = split[split.length-1];
		deref['letter'] = deref['uid'].slice(0,1);
		deref['s3_id'] = deref['uid'].slice(1,deref['uid'].length);
		//is there more than 1 D? if yes, then the first identifies the mothership and the second the query deployment
		if(uri.match(/^http.*(D|http).*/)){
			deref['ms'] = split[0];
		}
		else  {
			deref['ms'] = default_ms;
		}
		//Did will be the last of the deployments;
		for (var i=0;i<split.length; i++) {
			if(split[i].match(/^D/) || split[i].match(/^http/)){
				deref['did'] = split[i];
				
			}
		}
		
		if(!deref['did'] && typeof(input)!='undefined' && input['url']) {
			if(!input['url'].match(/\/$/)) { input['url'] +="/"; }
			deref['did'] = input['url'];
		}
		else if (!deref['did']) {
			deref['did'] = "";
		}
		
		deref['condensed'] = deref['did']+deref['uid'];
	 }
	return deref; 
	}

var S3QLtranslator = function (input) {


	//start of by reading all that is before the first |
	var entityNames = {"S":"statement", "R": "rule","C":"collection","I":"item","P":"project","U":"user","D":"deployment"};
	var id_letters = {"user_id":"U","created_by":"U","deployment_id":"D","project_id":"P","collection_id":"C","subject_id":"C","verb_id":"I","object_id":"C","item_id":"I","value":"I","rule_id":"R","statement_id":"S"};
	
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
		
		var deployments = {}; // this query may be sent to one or more deployments
		//s3ql_params += "<where>";
		params = params[1].trim();
		var p = params.split(",");
		for (var i=0; i<p.length; i++) {
			 var pi = p[i].trim();
			 var attrValue = pi.match(/(.*)=(.*)/);
			 var condensedID = pi.match(/(D|U|P|C|R|I|S)(.*)/);
			 
			 if(attrValue){
				var attr = attrValue[1].trim();
				var value = attrValue[2].trim();
				
				if(value.match(/^[0-9.]+$/)) { var uri = id_letters[attr]+value; }
				else { var uri = value;	}
			    var deref = dereferece_uri(uri, input);

				if(attr && value){
					if(entityNames[attr]) {attr =entityNames[attr]+"_id";}
					
				}

				
			 }
			 else if (condensedID) {
					var id = pi.match(/(D|U|P|C|R|I|S)(.*)/);
					//attr = entityNames[id[1]]+"_id";
					
					var uri = condensedID[1]+condensedID[2];
					var deref = dereferece_uri(uri, input);

					attr = entityNames[deref['letter']]+"_id";
					value = deref['s3_id'];
										
			}
			
			if(typeof(deployments[deref['did']])=='undefined'){ 
				//create the var
				deployments[deref['did']] = {};	 
				if(!deref['did'].match(/^http/)){
					deployments[deref['did']].did_resolve = deref['ms']+"URI.php?uid="+deref['did']; 
					deployments[deref['did']].ready = 0;
				}
				else {
					deployments[deref['did']].url = deref['did'];
					deployments[deref['did']].ready = 1;	
				}

				deployments[deref['did']].params = "";
			}
				
							
			deployments[deref['did']].params += "<"+attr+">"+value+"</"+attr+">";
			
			
			//s3ql_params += "<"+attr+">"+value+"</"+attr+">";
			}

		//s3ql_params += "</where>";
	}

	//Now build the s3ql queries
	for (var i in deployments) {
	
		if(typeof(i)!='undefined'){
			
			var s3ql_query = "";
			
			if(op=="select"){
				s3ql_query += "<S3QL><select>*</select><from>"+entityNames[target]+"</from>";
			}
			else {
				s3ql_query += "<S3QL><"+op+">"+entityNames[target]+"</"+op+">";
			}
			s3ql_query += "<where>"+deployments[i].params+"</where>";
			s3ql_query += "</S3QL>";
			
			//s3ql_query = "/S3QL.php?query="+s3ql_query;
			//Append all other queries
				for (var j in input) {
				if(j!='url' && j!='query'){
						s3ql_query = s3ql_query + "&"+j+"="+input[j];
					}
				}
							
			deployments[i].q = s3ql_query;
		}
	
	}
	return deployments;


}


var s3ql = {

	deployments_ready : 0,
	deployment_count : 0,
	data : {},
    
	distribute : function (deployments) {
		
		for (var did in deployments) {
			 
			 if(typeof(did)!='undefined'){
				s3ql.deployment_count ++;
				s3ql.call.run(deployments[did]);
			 }
		 }	
	},
	
	call : {
	   	s3ql_query : {},

		resolved_did_url : function (s3ql_query, ans) {
			if(ans[0].url){
			s3ql_query.url = ans[0].url;
			s3ql_query.ready = 1;
			s3ql.call.run(s3ql_query);
			}
		},

		executed_query : function (s3ql_query, ans) {
			s3ql_query.data = ans;
			s3ql_query.executed = 1;
			s3ql.data[s3ql_query.url] = ans;
			s3ql.call.run(s3ql_query);
		},

		run : function (s3ql_query, ans) {
			s3ql.call.s3ql_query = s3ql_query;
			//Find the deployments that are not ready;
			if(!s3ql_query.ready){
					//It is not ready for lack of a url
					s3dbcall(s3ql_query.did_resolve, "s3ql.call.resolved_did_url(s3ql.call.s3ql_query, ans)");	
			}
			else {
				
				//if it's ready, has it been executed?
				if(!s3ql_query.executed){
					//is there only 1 deployment? redirect;
					s3ql_query.complete_q = s3ql_query.url+"S3QL.php?query="+s3ql_query.q;
					if(s3ql.deployment_count==1){
						window.open(s3ql_query.complete_q);
					}
					else {
						s3dbcall(s3ql_query.complete_q, "s3ql.call.executed_query(s3ql.call.s3ql_query, ans)");
					}
				}
				else {
					s3ql.deployments_ready++;
					//Trigger the next event only in the last call;
					if(s3ql.deployments_ready==deployment_count){
						s3ql.combine_results();
					}
				}
			}	
		}
	},

	combine_results : function () {
		//is there only 1 deployment?
		
		//data should not have all the data that matters;
		alert('Data results are ready to be accessed at s3ql.data');
	}
}

var merge_queries = function () {
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

var query = unescape(window.location.search.replace("?",""));
if(query){
	//Separate the parameters of the query
	var input = {};
	var splitQuery = query.split("&");
	for (var i in splitQuery) {
		var tmp = splitQuery[i].match(/([A-Za-z0-9_]+)=(.*)/);
		if(tmp){
			input[tmp[1]] = tmp[2];
		}

	}
	
	var deployments = S3QLtranslator(input);
	 
	 //Result will only me merged once all the queries are in; an event is what is triggered, which in this case will be a function
	s3ql.distribute(deployments);
	 
}
	 
	
 
	
	

