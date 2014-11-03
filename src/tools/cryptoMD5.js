var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		if(typeof(CryptoJS) === 'undefined')
		{
			return;
		}
		var hash = CryptoJS.MD5(input);
		var result = JSON.stringify(hash);	
		return result;
	}
}); 

APP.registerTool('cryptoMD5', Class); 
