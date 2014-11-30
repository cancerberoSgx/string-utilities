//this file contain both the angular application definition and also this logical application 
//implementation in a separated plain old javascript class Application. An instance of this 
//Application can be found at APP global and acts as an API entry point 
//so you have an instance, if you need the constructor for overriding use APP.constructor.prototype

var angularApp = angular.module('stringUtilitiesApp', [
	'ngRoute'
,	'stringUtilitiesControllers'
]);

//declare the modules here
angular.module('stringUtilitiesControllers', []);

//set defualt route
angularApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.          
      otherwise({
        redirectTo: '/categories'
      });
  }]);



$.ajaxSetup({
  cache: true
});



var Application = function ()
{

}; 

_(Application.prototype).extend({
	
	tools: {}

,	getToolById: function(toolId)
	{
		var tool = null;

		var categories = this.getAppCategoriesData();

		_(categories).each(function(cat)
		{
			_(cat.tools).each(function(t)
			{
				tool = tool || (toolId===t.id ? t : null);
			}); 
		}); 

		return tool;
	}

,	getAppCategoriesData: function()
	{
		return this.data;
	}

,	loadScripts: function(scripts)
	{
		var promises = [];
		_(scripts).each(function(script)
		{
			promises.push(jQuery.getScript(script)); 
		});
		return jQuery.when.apply(jQuery, promises); 
	}

,	registerTool: function(id, Class)
	{
		this.tools[id] = Class;
	}

,	getTool: function(id)
	{
		return APP.tools[id]; 
	}

	//@method execTool @param toolId @param toolInput @returns evaluated tool. Will be a string with the result if everything is allright or an object {error:'some msg'} in case of a tool error. 
,	execTool: function(toolId, toolInput)
	{
		var Tool = APP.getTool(toolId);
		var t = new Tool();
		var opts = {}; 
		try
		{
			/* jshint evil:true */
			opts = eval('(' + toolInput.options + ')') || {}; 
			/* jshint evil:false */ 
		}
		catch(ex) //ignore exception since the user may be writing
		{
			opts = {};
		}
		var result = null;
		try
		{
			result = t.exec(toolInput.input, opts); 
		}
		catch(ex) //ignore exception since the script coun't not be loaded yet
		{
			// throw ex;
			// console.log(ex); 
			result = '';
		}

		return result;
	}

}); 

//initialize singleton

APP = (typeof(APP) === 'undefined') ? {} : APP;

APP = new Application();



//this application contents definition - a categorized set of tools. 
//this should be representable in JSON so try not to use functions. 

var data = [
{
	id: "html"
,	name:"HTML"
,	description: "operations on HTML code"
,	tools: [

		{
			id: "htmlEscape"
		,	name: "escape"
		,	description: "will apply html escape() function"
		,	exampleInput: '<p>hello</p>'
		,	options: {}
		}
	,	{		
			id: "htmlMinify"
		,	name: "minify"
		,	description: "simple HTML minification using regexp"
		,	exampleInput: '<p>hello</p>  <b>Hello\n\n</b>\n\t\n\t\t<span>seb</span>'
		,	options: {}
		} 
	]
}


, 
{
	id: "string"
,	name:"stringjs"
,	description: "miscelaneus string operations based on stringjs.com"
,	tools: [
		{
			id: "stringLatinise"
		,	name: "latinise"
		,	toolId: 'string'
		,	description: "Removes accents from Latin characters"
		,	exampleInput: 'crème brûlée'
		,	options: {cmd:'latinise'}
		,	dependencies: ['lib/string/string.min.js']
		}
	,	{
			id: "stringCamelize"
		,	name: "camelize"
		,	toolId: 'string'
		,	description: "Remove any underscores or dashes and convert a string into camel casing."
		,	exampleInput: 'data_rate sigmun_froid'
		,	options: {cmd:'camelize'}
		,	dependencies: ['lib/string/string.min.js']
		}
	,	{
			id: "stringCapitalize"
		,	name: "capitalize"
		,	toolId: 'string'
		,	description: "Capitalizes the first character of a string."
		,	exampleInput: 'hello world'
		,	options: {cmd:'capitalize', multipleWords: true} 
		,	dependencies: ['lib/string/string.min.js']
		}
	,	{
			id: "stringCollapseWhitespace"
		,	name: "collapseWhitespace"
		,	toolId: 'string'
		,	description: "Converts all adjacent whitespace characters to a single space."
		,	exampleInput: '  String   \t libraries are   \n\n\t fun\n!  '
		,	options: {cmd:'collapseWhitespace'} 
		,	dependencies: ['lib/string/string.min.js']
		}
	,	{
			id: "stringDasherize"
		,	name: "dasherize"
		,	toolId: 'string'
		,	description: "Returns a converted camel cased string into a string delimited by dashes."
		,	exampleInput: 'dataRate DatePing backgroundColor borderRadious'
		,	options: {cmd:'dasherize', multipleWords: true} 
		,	dependencies: ['lib/string/string.min.js']
		}
	,	{
			id: "stringHumanize"
		,	name: "humanize"
		,	toolId: 'string'
		,	description: "Transforms the input into a human friendly form."
		,	exampleInput: 'the_humanize_string_method ThehumanizeStringMethod'
		,	options: {cmd:'humanize', multipleWords: true} 
		,	dependencies: ['lib/string/string.min.js']
		}

	,	{
			id: "stringParseCSV"
		,	name: "parseCSV"
		,	toolId: 'string'
		,	description: "Parses a CSV line into an array."
		,	exampleInput: '"a\na","b","c"\n"a", """b\nb", "a"'
		,	options: {cmd:'humanize', args: [',', '"', '\\', '\n']}
		,	dependencies: ['lib/string/string.min.js']
		}
		
	]
}


, 
{
	id: "crypto"
,	name:"Encryption"		
,	description: "encryption tools using http://code.google.com/p/crypto-js/"
,	tools: [
		{
			id: "cryptoMD5"
		,	name: "MD5"		
		,	toolId: 'crypto'
		,	longDescription: "MD5 is a widely used hash function. It's been used in a variety of security applications and is also commonly used to check the integrity of files. Though, MD5 is not collision resistant, and it isn't suitable for applications like SSL certificates or digital signatures that rely on this property."
		,	exampleInput: 'Message'
		,	options: {cmd: 'MD5'}
		,	dependencies: ['lib/crypto-js/md5.js']
		}
	,	{
			id: "cryptoSHA1"
		,	name: "SHA1"				
		,	toolId: 'crypto'
		,	longDescription: "The SHA hash functions were designed by the National Security Agency (NSA). SHA-1 is the most established of the existing SHA hash functions, and it's used in a variety of security applications and protocols. Though, SHA-1's collision resistance has been weakening as new attacks are discovered or improved."
		,	exampleInput: 'Message'
		,	options: {cmd: 'SHA1'}
		,	dependencies: ['lib/crypto-js/sha1.js']
		}




	,	{
			id: "cryptoSHA2"
		,	name: "SHA2"				
		,	toolId: 'crypto'
		,	longDescription: "SHA-256 is one of the four variants in the SHA-2 set. It isn't as widely used as SHA-1, though it appears to provide much better security."
		,	exampleInput: 'Message'
		,	options: {cmd: 'SHA256'}
		,	dependencies: ['lib/crypto-js/sha256.js']
		}
	,	{
			id: "cryptoSHA512"
		,	name: "SHA512"				
		,	toolId: 'crypto'
		,	longDescription: "SHA-512 is largely identical to SHA-256 but operates on 64-bit words rather than 32"
		,	exampleInput: 'Message'
		,	options: {cmd: 'SHA512'}
		,	dependencies: ['lib/crypto-js/sha512.js']
		}
	,	{
			id: "cryptoSHA3"
		,	name: "SHA3"				
		,	toolId: 'crypto'
		,	longDescription: "SHA-3 is the winner of a five-year competition to select a new cryptographic hash algorithm where 64 competing designs were evaluated. <BR/> SHA-3 can be configured to output hash lengths of one of 224, 256, 384, or 512 bits. The default is 512 bits."
		,	exampleInput: 'Message'
		,	options: {cmd: 'SHA3', args: {outputLength: 384}}
		,	dependencies: ['lib/crypto-js/sha3.js']
		}
	,	{
			id: "cryptoripemd160"
		,	name: "RIPEMD160"				
		,	toolId: 'crypto'
		,	longDescription: 'http://en.wikipedia.org/wiki/RIPEMD'
		,	exampleInput: 'Message'
		,	options: {cmd: 'RIPEMD160'}
		,	dependencies: ['lib/crypto-js/ripemd160.js']
		}				
	,	{
			id: "cryptoripemd160"
		,	name: "RIPEMD160"				
		,	toolId: 'crypto'
		,	longDescription: 'http://en.wikipedia.org/wiki/RIPEMD'
		,	exampleInput: 'Message'
		,	options: {cmd: 'RIPEMD160'}
		,	dependencies: ['lib/crypto-js/ripemd160.js']
		}



	]
	}


,	{
	id: "cryptojsCipher"
,	name:"cryptojsCipher"		
,	description: "cryptojsCipher"
,	tools: [
		{
			id: "cryptoAESEncrypt"
		,	name: "AES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'The Advanced Encryption Standard (AES) is a U.S. Federal Information Processing Standard (FIPS). It was selected after a 5-year process where 15 competing designs were evaluated.. '
		,	exampleInput: 'Message'
		,	options: {cipher: 'AES', verb: 'encrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/aes.js']
		}
	,	{
			id: "cryptoAESDecrypt"
		,	name: "AES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'The Advanced Encryption Standard (AES) is a U.S. Federal Information Processing Standard (FIPS). It was selected after a 5-year process where 15 competing designs were evaluated.. '
		,	exampleInput: 'U2FsdGVkX182eFdB8YZn/6VhKf0QL//nMuV05ki+dXE='
		,	options: {cipher: 'AES', verb: 'decrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/aes.js']
		}


	,	{
			id: "cryptoDESEncrypt"
		,	name: "DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'hola mundo'
		,	options: {cipher: 'DES', verb: 'encrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoDESDecrypt"
		,	name: "DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX18rVFUvvhHXiIqGSz/GNwKzc9NcmuwkWqI='
		,	options: {cipher: 'DES', verb: 'decrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}


	,	{
			id: "cryptoTripleDESEncrypt"
		,	name: "Triple DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'nietzsche es el mdfgejor'
		,	options: {cipher: 'TripleDES', verb: 'encrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoTripleDESDecrypt"
		,	name: "Triple DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX19g5P6wJ/eKsFfEKAbPzLrdrZNd8BZeVV1jr0lZyLTI4pB3CWwSAqJb'
		,	options: {cipher: 'TripleDES', verb: 'decrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}

	,	{
			id: "cryptoTripleDESEncrypt"
		,	name: "Triple DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'nietzsche es el mdfgejor'
		,	options: {cipher: 'TripleDES', verb: 'encrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoTripleDESDecrypt"
		,	name: "Triple DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX19g5P6wJ/eKsFfEKAbPzLrdrZNd8BZeVV1jr0lZyLTI4pB3CWwSAqJb'
		,	options: {cipher: 'TripleDES', verb: 'decrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}

	,	{
			id: "cryptoRabbitEncrypt"
		,	name: "Rabbit Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'Rabbit is a high-performance stream cipher and a finalist in the eSTREAM Portfolio. It is one of the four designs selected after a 3 1/2-year process where 22 designs were evaluated.'
		,	exampleInput: 'los panchos están calientes'
		,	options: {cipher: 'Rabbit', verb: 'encrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/rabbit.js']
		}
	,	{
			id: "cryptoRabbitDecrypt"
		,	name: "Rabbit Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'Rabbit is a high-performance stream cipher and a finalist in the eSTREAM Portfolio. It is one of the four designs selected after a 3 1/2-year process where 22 designs were evaluated.'
		,	exampleInput: 'U2FsdGVkX1/rEtEaIkFz402Ld0GSwZFwp67qW/qu4t9VzGc4chUE/wnGBcY='
		,	options: {cipher: 'Rabbit', verb: 'decrypt', passphrase: 'mySe4ret'}
		// ,	throttle: 800
		,	dependencies: ['lib/crypto-js/rabbit.js']
		}
	]
	}




,	{
	id: "cryptojsEncoding"
,	name:"cryptojsEncoding"		
,	description: "cryptojsEncoding"
,	tools: [



		//encoders & decorders

		//Utf8-base64 conversion
		{
			id: "cryptoUtf82base64"
		,	name: "utf8 string to base64"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: '¡los pollluelos están naciendo!'
		,	options: {parse: 'Utf8', stringify: 'Base64'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptobase642Utf8"
		,	name: "base64 to utf8 string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'wqFsb3MgcG9sbGx1ZWxvcyBlc3TDoW4gbmFjaWVuZG8h'
		,	options: {parse: 'Base64', stringify: 'Utf8'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}


		//Utf16-base64 conversion
	,	{
			id: "cryptoUtf162base64"
		,	name: "utf16 string to base64"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: '¡los pollluelos están naciendo!'
		,	options: {parse: 'Utf16', stringify: 'Base64'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptobase642Utf16"
		,	name: "base64 to utf16 string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'AKEAbABvAHMAIABwAG8AbABsAGwAdQBlAGwAbwBzACAAZQBzAHQA4QBuACAAbgBhAGMAaQBlAG4AZABvACE='
		,	options: {parse: 'Base64', stringify: 'Utf16'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}

		//Utf8-Hex conversion
		,	{
			id: "cryptoUtf82Hex"
		,	name: "utf8 string to Hex"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'pequeños mundos'
		,	options: {parse: 'Utf8', stringify: 'Hex'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptoHex2Utf8"
		,	name: "Hex to utf8 string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: '7065717565c3b16f73206d756e646f73'
		,	options: {parse: 'Hex', stringify: 'Utf8'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}


		//Latin1-Hex conversion
	,	{
			id: "cryptoLatin12Hex"
		,	name: "Latin1 string to Hex"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'pequeños mundos'
		,	options: {parse: 'Latin1', stringify: 'Hex'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptoHex2Latin1"
		,	name: "Hex to Latin1 string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: '7065717565f16f73206d756e646f73'
		,	options: {parse: 'Hex', stringify: 'Latin1'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}


		//Base64-Hex conversion
	,	{
			id: "cryptoBase642Hex"
		,	name: "Base64 string to Hex"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'wqFsb3MgcG9sbGx1ZWxvcyBlc3TDoW4gbmFjaWVuZG8h'
		,	options: {parse: 'Base64', stringify: 'Hex'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptoHex2Base64"
		,	name: "Hex to Base64 string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'c2a16c6f7320706f6c6c6c75656c6f7320657374c3a16e206e616369656e646f21'
		,	options: {parse: 'Hex', stringify: 'Base64'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}

		//Utf16LE-Hex conversion
	,	{
			id: "cryptoUtf16LE2base64"
		,	name: "Utf16LE string to base64"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: '¡los pollluelos están naciendo!'
		,	options: {parse: 'Utf16LE', stringify: 'Base64'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
		,	{
			id: "cryptobase642Utf16LE"
		,	name: "base64 to Utf16LE string"				
		,	toolId: 'crypto'
		,	longDescription: ''
		,	exampleInput: 'oQBsAG8AcwAgAHAAbwBsAGwAbAB1AGUAbABvAHMAIABlAHMAdADhAG4AIABuAGEAYwBpAGUAbgBkAG8AIQA='
		,	options: {parse: 'Base64', stringify: 'Utf16LE'}
		,	dependencies: ['lib/crypto-js/core-min.js', 'lib/crypto-js/enc-utf16-min.js', 'lib/crypto-js/enc-base64-min.js']
		}
	]
	}






,	{
	id: "jsindentator"
,	name:"jsindentator"		
,	description: "jsindentator"
,	tools: [
		{
			id: "jsindentatorStyleOne"
		,	name: "clean style one"				
		,	toolId: 'jsindentator'
		,	longDescription: 'a normal - very common indentation style'
		,	exampleInput: 'var a = {a: 1, \n\t\t\t c: [\t\t{a:[1,2,3],d: {g:2, y: {color: "red", magic: /g+ift/gi}}\n\t}]}'
		,	options: {style: 'style2'}
		,	dependencies: ['lib/esprima/esprima.js', 'lib/js-indentator/js-indentator-bundle.js']
		}
	,	
		{
			id: "jsindentatorStyleChapuzero"
		,	name: "clean comma first"				
		,	toolId: 'jsindentator'
		,	longDescription: 'comma first, spaced indentation style'
		,	exampleInput: 'var a = {a: 1, \n\t\t\t c: [\t\t{a:[1,2,3],d: {g:2, y: {color: "red", magic: /g+ift/gi}}\n\t}]}'
		,	options:{style: 'style1'}
		,	dependencies: ['lib/esprima/esprima.js', 'lib/js-indentator/js-indentator-bundle.js']
		}
	,	
		{
			id: "jsindentatorStyleMinify"
		,	name: "minify"				
		,	toolId: 'jsindentator'
		,	longDescription: 'simple minification tool'
		,	exampleInput: 'var a = {a: 1, \n\t\t\t c: [\t\t{a:[1,2,3],d: {g:2, y: {color: "red", magic: /g+ift/gi}}\n\t}]}'
		,	options:{style: 'clean'}
		,	dependencies: ['lib/esprima/esprima.js', 'lib/js-indentator/js-indentator-bundle.js']
		}
	]
	}





,	{
	id: "programmingUtils"
,	name:"Programming Utilities"		
,	description: "Programming Utilities"
,	tools: [
		{
			id: "toString"
		,	name: "escapes given string to form a valid string for most programming languages"				
		,	toolId: 'programmingToString'
		,	longDescription: ''
		,	exampleInput: '<div>\n\t<%_(items).each(function(item){%>\n\t\t<%= \'Product \' + item.name%>\n\t<%})%>\n</div>'
		,	options: {concat: '+', stringChar: '\''}
		}
	]
	}

]; 

APP = (typeof(APP) === 'undefined') ? {} : APP;
APP.data = data;

angular.module('stringUtilitiesControllers').controller('CategoriesCtrl', 
	['$scope', '$http', function ($scope, $http) 
	{
		$scope.categories = APP.getAppCategoriesData();
	}]
);


 
angular.module('stringUtilitiesApp').config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/categories', {
        templateUrl: 'src/modules/categories/template.html',
        controller: 'CategoriesCtrl'
      });
      
  }]);

angular.module('stringUtilitiesControllers').controller('ToolCtrl', ['$scope', '$routeParams', '$http',

function($scope, $routeParams, $http) 
{
	var toolId = $routeParams.toolId;

	var tool = APP.getToolById(toolId);
	
	$scope.tool = tool;
	$scope.input = tool.exampleInput || '';
	$scope.options = JSON.stringify(tool.options); 
	$scope.longDescription = tool.longDescription || tool.description || ''; 

	toolId = tool.toolId || toolId; 
	$scope.toolId = toolId; 

	var execToolFn = function()
	{
		var toolResult = APP.execTool(toolId, $scope);
		if(toolResult && toolResult.error)
		{
			$scope.toolError = toolResult.error; 
			return toolResult;
		}
		return toolResult;
	}; 

	$scope.execTool = execToolFn; 

	//the exec tool function
	// var throttle = tool.throttle || 0;
	// throttle ? _(execToolFn).throttle(throttle) : execToolFn; 
	//$scope.execTool = throttle ? _(execToolFn).throttle(throttle) : execToolFn; 
	//dirty hack - we have a great throtle time so it is a possibility that the execTool doesn't execute on render time
	// setTimeout(function(){ $scope.$apply();}, throttle+throttle/2); 

	if(tool.dependencies && tool.dependencies.length)
	{
		APP.loadScripts(tool.dependencies).done(function()
		{
			$scope.$apply() ;
		});
	}
}

]);



angular.module('stringUtilitiesApp').config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/tool/:toolId', {
        templateUrl: 'src/modules/tool/template.html',
        controller: 'ToolCtrl'
      });
  }]);

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


var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		return _.escape(input);
	}
}); 
APP.registerTool('htmlEscape', Class); 
var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		var s = input
			// remove spaces between tags.
			.replace(/\>\s+</g, '><')
			// remove html comments that our markup could have.
			.replace(/<!--[\s\S]*?-->/g, '')
			// replace multiple spaces with a single one.
			.replace(/\s+/g, ' ');

		if(opts.removeAttributesBut)
		{
			s = 'TODOOOOO';//  s.replace(//gi)
		}
		return s;
	}
}); 
APP.registerTool('htmlMinify', Class); 
var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		jsindentator.setStyle(jsindentator.styles[opts.style]);
		var indentedCode = '';

		try
		{
			indentedCode = jsindentator.main(input, opts); 
		}
		catch(ex)
		{
			// debugger;
		}

		
		if(indentedCode instanceof Error) 
		{			
		 	//TODO better error handl
			console.err('ERROR: The passed javascript coulnd\'t be parsed!, reason: '+result);
			// return;
			return {error: indentedCode.message || indentedCode.description, errorEx: indentedCode}; 
			// throw indentedCode;
		}

		return indentedCode;
	}
}); 
APP.registerTool('jsindentator', Class); 


// example of jsindentator code:
// jsindentator.setStyle(jsindentator.styles.style2);
// indentedCode = escapeHTML(jsindentator.main(code, config));
// if(indentedCode instanceof Error) {
// alert('ERROR: The passed javascript coulnd\'t be parsed!, reason: '+result);
// return;
// }
// jQuery('#output3').html(indentedCode);
var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		var regex = RegExp(opts.stringChar, 'gi'); 
		var s = input.replace(regex, '\\' + opts.stringChar); 
		s = s.replace(/\n/g, '\\n').replace(/\t/g, '\\t'); 
		return opts.stringChar + s + opts.stringChar;
	}
}); 

APP.registerTool('programmingToString', Class); 


var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{ 
		if(typeof(S) === 'undefined')
		{
			return;
		}
		var result = null;
		if(opts.multipleWords)
		{
			result = input.replace(/([^\s]+)(\s*)/gi, function(all, word, space)
			{
				return S(word)[opts.cmd]().s + space;
			}); 
		}
		else
		{
			var args = opts.args || []; 
			var context = S(input);
			var fn = context[opts.cmd];
			result = fn.apply(context, args).s;
		}

		return result;
	}
}); 

APP.registerTool('string', Class); 

