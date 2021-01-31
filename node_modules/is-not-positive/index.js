var isPositive=require('is-positive');
module.exports=function(number){
	return !isPositive(number);
}

