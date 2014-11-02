var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		return _.escape(input);
	}
}); 
Class;