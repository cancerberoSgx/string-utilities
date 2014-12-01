var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		var encoder = new DoubleMetaphone();
		var input_arr = input.split(/\s+/gi); 
		var output = []; 
		_(input_arr).each(function(s)
		{
			if(s.match(/[\w']+/))
			{				
				output.push(encoder.doubleMetaphone(s).primary);
			}
			else
			{
				output.push(s);
			}
		});
		return output.join(' '); 
	}
}); 
APP.registerTool('phonetics', Class); 