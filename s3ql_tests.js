var GET = {};
var Deps = {};
var deps2test = 1;
var actI = 0;
var elI = 0;
var actions = ['insert', 'update', 'delete'];
var element_ids = {P: 'project_id',C1: 'collection_id',C2: 'collection_id',R1: 'rule_id',R2: 'rule_id',I1: 'item_id',I2: 'item_id',S1: 'statement_id',S2: 'statement_id'};
var elements = ['P','C1','C2', 'R1','R2','I1','I2', 'S1', 'S2'];
var inputs = {P: { name:'testing', description: 'test s3ql'}, C1: { project_id:'', name:'testC1', description: 'test s3ql'}, C2: { project_id:'', name:'testC2', description: 'test s3ql'},R1: {project_id:'', subject_id:'', verb:'v1', object:'o2'}, R2: {project_id:'', subject_id:'', verb:'v2', object_id:''}, I1:{collection_id:'', name: 'testI'},I2:{collection_id:'', name: 'testI1'}, S1:{item_id:'', rule_id:'', value:'test'}, S2:{item_id:'', rule_id:'', value:''}};

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
		console.log('invalid query - parameters are required to be inside parenthesis');
		return false;
		}
	targetAndParams = targetAndParams[1];
	}
	else {
		op = "select";
		var targetAndParams = query.trim();
	}
	
	
	var target = targetAndParams.trim().match(/^(D|U|P|C|R|I|S)/);
	if(!target){
		console.log('invalid query - one of D|P|C|R|I|S is required to initialize the query');
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
			 else if (pi.match(/(D|P|C|R|I|S)(.*)/)) {
					var id = pi.match(/(D|P|C|R|I|S)(.*)/);
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
	return s3ql_query;
	
}

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

function start() {
	 collect_dep_info ();
	 batch_of_queries(actI, elI);
}

function addURLfields() {
	//create the fields for a new url and key
	
	if (!document.getElementById("url"+deps2test)) {
		var tmpurl = document.createElement('div'); tmpurl.id = "url"+deps2test;
		var tmpkey = document.createElement('div'); tmpkey.id = "key"+deps2test;
		document.body.appendChild(tmpurl);
		document.body.appendChild(tmpkey);
		if(!document.getElementById("onemoreurl")){
			var moreurl = document.createElement('button');
			moreurl.id = "onemoreurl";
			moreurl.text = "Add Another";
			moreurl.onClick = function () { deps2test++;addURLfields();	}();
			document.body.appendChild(moreurl);
		}


	}
	
}

function collect_dep_info () {
		//if dep info is provided in the url, collect it, otherwise, give a form
		if (window.location.search) {
			get();
			Deps.length=0;
			for (var i in GET) {
				var dec = i.match(/^(url)([0-9]*)/);
				if(dec)
				{
					if(typeof(dec[2])=="undefined") { 
						if(GET["key"]) {var k = GET["key"]; }	
						depIn = 0;
					} 
					else { 	depIn = dec[2]; 
						if(GET["key"+depIn]) {var k = GET["key"+depIn]; }
						else {
							var k = "";
						}
					}
					if(!GET[i].match(/\/$/)) { var url = GET[i]+"/";}
					else { var url = GET[i]; }
					Deps.length++;
					Deps[depIn] = { url: url, key: k , s3ql: url+"S3QL.php?key="+k+"&query=" } ; 
				}
			}
		}
		else {
			addURLfields();
		}
	
}

function batch_of_queries(actI, elI) {
	//queries must be separated in stacks because some queries need reference to others;
	
	//batch for insert P
	var qdiv = document.createElement('div');
	document.body.appendChild(qdiv);
	
	var act = actions[actI];
	var el = elements[elI];
	qdiv.background = 'blue';
	qdiv.color = 'yellow';
	qdiv.innerHTML = "Testing "+act+" "+el;
	
	exec(act, el);
	
}

function save(ans, el, act, d) {
	if(typeof(ans[0][element_ids[el]])!='undefined'){
		Deps[d][el] = {};
		Deps[d][el][element_ids[el]] = ans[0][element_ids[el]] ; 
		document.getElementById('resspan'+d+act+el).innerHTML = "Success";
		document.getElementById('resspan'+d+act+el).style.color = 'green';

		//can continue from this point...
		Deps[d][el].success = 1;
		if(d==Deps.length){
			elI++;
			if(typeof(elements[elI])!='undefined'){
				batch_of_queries(actI, elI);
			}
			else {
				//moving on to other actions;
				console.log('moving on to other actions');
			}
		}
	}
	else {
		document.getElementById('resspan'+d+act+el).innerHTML = "Failed: "+ans[0].message;
		document.getElementById('resspan'+d+act+el).style.color = 'red';
		Deps[d][el] = { success : 0 };
	}
}
function queryAssembly(d, act, el) {
		var q1 = act+'('+el+'|';
		var tmp = '';
		for (var i in inputs[el]) {
			
			if(typeof(i)!='undefined'){
				if(tmp!=''){
					tmp += ',';
				}
				if(inputs[el][i]!=''){
					var val  = inputs[el][i];
				}
				else {
					if(i=='project_id'){
						var val  = Deps[d].P.project_id;	
					}
					else if (i=='subject_id') {
						var val  = Deps[d].C1.collection_id;	
					}
					else if (i=='object_id') {
						var val  = Deps[d].C2.collection_id;
					}
					else if (i=='collection_id') {
						if(el=='I1'){
						var val  = Deps[d].C1.collection_id;
						}
						else if (el=='I2') {
						var val  = Deps[d].C2.collection_id;
						}
					}
					else if (i=='item_id') {
						var val  = Deps[d].I1.item_id;
					}
					else if (i=='rule_id') {
						if(el=='S1'){
						var val  = Deps[d].R1.rule_id;
						}
						else if (el=='S2') {
						var val  = Deps[d].R1.rule_id;
						}
					}
					else if (i=='value') {
						var val  = Deps[d].I2.item_id;
					}

				}
				tmp += i+'='+val;
				
			}
		}
		q1 += tmp+')';
		
		var s3ql = S3QLtranslator(q1);
		return s3ql;
	}
		

function exec(act, el) {
		
		
		//run through all deps
		for (var d in Deps) {
			if(typeof(Deps[d].s3ql)!='undefined'){ 
			var s3ql = queryAssembly(d, act, el);
			var q = Deps[d].s3ql+s3ql;
			var depdiv = document.createElement('div');
			var qspan = document.createElement('span');qspan.innerHTML = "<textarea cols='30' rows='3'>"+q+"</textarea>"; 
			var resspan = document.createElement('span');resspan.id = 'resspan'+d+act+el;
			depdiv.appendChild(qspan);
			depdiv.appendChild(resspan);
			document.body.appendChild(depdiv);
			s3dbcall(q, 'save(ans, "'+el+'","'+act+'", '+d+')');
			}
		}
}

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}
