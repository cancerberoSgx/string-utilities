//intermediate for running tools based in crypto-js - http://code.google.com/p/crypto-js
var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		if(typeof(CryptoJS) === 'undefined')
		{
			return;
		}

		var result = '';

		if(opts.cipher && opts.verb && opts.passphrase)
		{
			var context = CryptoJS[opts.cipher];
			result = context[opts.verb].apply(context, [input, opts.passphrase]); 
			if(opts.verb==='encrypt')
			{
				result = result.toString(); 
			}
			else
			{
				result = this.hex2a(result);
			}
		}
		else if(opts.parse && opts.stringify)
		{

			// CryptoJS example:			
			// var words = CryptoJS.enc.Hex.parse('48656c6c6f2c20576f726c6421');
			// var strUtf8 = CryptoJS.enc.Utf8.stringify(words); 
			var parsed = CryptoJS.enc[opts.parse].parse(input);
			result = CryptoJS.enc[opts.stringify].stringify(parsed);
		}
		else
		{
			result = CryptoJS[opts.cmd].apply(this, [input]) + '';
		}
			
		return result;
	}

	//converts a hex string in UTF - TODO: do this with crypto enc API
,	hex2a: function hex2a(hexx) 
	{
		var s = hexx.toString();//force conversion
		var r = decodeURIComponent(s.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
		return r;
	}
}); 

APP.registerTool('crypto', Class); 

