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

		if(opts.cipher)
		{
			var context = CryptoJS[opts.cipher];
			result = context[opts.verb].apply(context, [input, opts.passphrase]); 
			// console.log('Crypto cipher ' + opts.cipher + ', verb: ' + opts.verb + ', input: '+ input+ ', passphrase: '+opts.passphrase)
			if(opts.verb==='encrypt')
			{
				result = result.toString(); 
			}
			else
			{
				result = this.hex2a(result);
			}
		}
		else
		{
			result = CryptoJS[opts.cmd].apply(this, [input]) + '';
		}
			
		return result;
	}

,	hex2a: function hex2a(hexx) 
	{
		var hex = hexx.toString();//force conversion
		var str = '';
		for (var i = 0; i < hex.length; i += 2)
		{
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		}
		return str;
	}
}); 


APP.registerTool('crypto', Class); 


// working cypher high level example:
//  	var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");
//     function hex2a(hexx) {
// 	    var hex = hexx.toString();//force conversion
// 	    var str = '';
// 	    for (var i = 0; i < hex.length; i += 2)
// 	        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
// 	    return str;
// 	}
//     var decrypted = CryptoJS.AES.decrypt(encrypted.toString(), "Secret Passphrase");
//     var result = hex2a(decrypted.toString())
//     console.log(result);  	

// testDecryptKeySize128: function () {
//     Y.Assert.areEqual('00112233445566778899aabbccddeeff', 
//     	C.AES.decrypt(
//     		C.lib.CipherParams.create(
// 	    		{ ciphertext: C.enc.Hex.parse('69c4e0d86a7b0430d8cdb78070b4c55a') }
// 	    	), C.enc.Hex.parse('000102030405060708090a0b0c0d0e0f'), 

//     		{ mode: C.mode.ECB, padding: C.pad.NoPadding }

//     	).toString());
// },

