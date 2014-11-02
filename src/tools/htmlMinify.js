var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		return input
			// remove spaces between tags.
			.replace(/\>\s+</g, '><')
			// remove html comments that our markup could have.
			.replace(/<!--[\s\S]*?-->/g, '')
			// replace multiple spaces with a single one.
			.replace(/\s+/g, ' ');
	}
}); 
Class;