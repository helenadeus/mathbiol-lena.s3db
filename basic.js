function IsNumeric(sText)

{
   var ValidChars = "0123456789.";
   var IsNumber=true;
   var Char;

 
   for (i = 0; i < sText.length && IsNumber == true; i++) 
      { 
      Char = sText.charAt(i); 
      if (ValidChars.indexOf(Char) == -1) 
         {
         IsNumber = false;
         }
      }
   return IsNumber;
   
   }

function array_max(arr) {
var max = arr[0];
var len = arr.length;
for (var i = 1; i < len; i++) if (arr[i] > max) max = arr[i];
return max;
}

function array_min(arr) {
var min = arr[0];
var len = arr.length;
for (var i = 1; i < len; i++) if (arr[i] < min) min = arr[i];
return min;
}

//Basic array manipulations
Array.prototype.sum = function(){
	for(var i=0,sum=0;i<this.length;sum+=this[i++]);
	return sum;
}

Array.prototype.max = function(){
	return Math.max.apply({},this)
}
Array.prototype.min = function(){
	return Math.min.apply({},this)
}

ones = function(n){
	var M = [];
	for(var i=0;i<n;i++){
		M[i] = 1;
	}
	return M;
}

zeros = function(n){
	var M = []
	for(var i=0;i<n;i++){
		M[i] = 0;
	}
	return M;
	
}
