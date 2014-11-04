
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
,	name:"String misc"
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

		//ciphers
	,	{
			id: "cryptoAESEncrypt"
		,	name: "AES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'The Advanced Encryption Standard (AES) is a U.S. Federal Information Processing Standard (FIPS). It was selected after a 5-year process where 15 competing designs were evaluated.. '
		,	exampleInput: 'Message'
		,	options: {cipher: 'AES', verb: 'encrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/aes.js']
		}
	,	{
			id: "cryptoAESDecrypt"
		,	name: "AES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'The Advanced Encryption Standard (AES) is a U.S. Federal Information Processing Standard (FIPS). It was selected after a 5-year process where 15 competing designs were evaluated.. '
		,	exampleInput: 'U2FsdGVkX182eFdB8YZn/6VhKf0QL//nMuV05ki+dXE='
		,	options: {cipher: 'AES', verb: 'decrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/aes.js']
		}


	,	{
			id: "cryptoDESEncrypt"
		,	name: "DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'hola mundo'
		,	options: {cipher: 'DES', verb: 'encrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoDESDecrypt"
		,	name: "DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX18rVFUvvhHXiIqGSz/GNwKzc9NcmuwkWqI='
		,	options: {cipher: 'DES', verb: 'decrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}


	,	{
			id: "cryptoTripleDESEncrypt"
		,	name: "Triple DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'nietzsche es el mdfgejor'
		,	options: {cipher: 'TripleDES', verb: 'encrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoTripleDESDecrypt"
		,	name: "Triple DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX19g5P6wJ/eKsFfEKAbPzLrdrZNd8BZeVV1jr0lZyLTI4pB3CWwSAqJb'
		,	options: {cipher: 'TripleDES', verb: 'decrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}

	,	{
			id: "cryptoTripleDESEncrypt"
		,	name: "Triple DES Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'nietzsche es el mdfgejor'
		,	options: {cipher: 'TripleDES', verb: 'encrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}
	,	{
			id: "cryptoTripleDESDecrypt"
		,	name: "Triple DES Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'DES is a previously dominant algorithm for encryption, and was published as an official Federal Information Processing Standard (FIPS). DES is now considered to be insecure due to the small key size.Triple DES applies DES three times to each block to increase the key size. The algorithm is believed to be secure in this form.'
		,	exampleInput: 'U2FsdGVkX19g5P6wJ/eKsFfEKAbPzLrdrZNd8BZeVV1jr0lZyLTI4pB3CWwSAqJb'
		,	options: {cipher: 'TripleDES', verb: 'decrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/tripledes.js']
		}

	,	{
			id: "cryptoRabbitEncrypt"
		,	name: "Rabbit Encrypt"				
		,	toolId: 'crypto'
		,	longDescription: 'Rabbit is a high-performance stream cipher and a finalist in the eSTREAM Portfolio. It is one of the four designs selected after a 3 1/2-year process where 22 designs were evaluated.'
		,	exampleInput: 'los panchos están calientes'
		,	options: {cipher: 'Rabbit', verb: 'encrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/rabbit.js']
		}
	,	{
			id: "cryptoRabbitDecrypt"
		,	name: "Rabbit Decrypt"	
		,	toolId: 'crypto'
		,	longDescription: 'Rabbit is a high-performance stream cipher and a finalist in the eSTREAM Portfolio. It is one of the four designs selected after a 3 1/2-year process where 22 designs were evaluated.'
		,	exampleInput: 'U2FsdGVkX1/rEtEaIkFz402Ld0GSwZFwp67qW/qu4t9VzGc4chUE/wnGBcY='
		,	options: {cipher: 'Rabbit', verb: 'decrypt', passphrase: 'mySe4ret'}
		,	throttle: 800
		,	dependencies: ['lib/crypto-js/rabbit.js']
		}



		//encoders
	// 	,	{
	// 		id: "cryptoBase64Stringify"
	// 	,	name: "Base64 Stringify"				
	// 	,	toolId: 'crypto'
	// 	,	longDescription: ''
	// 	,	exampleInput: 'los panchos están calientes'
	// 	,	options: {encoder: 'Base64', verb: 'stringify'}
	// 	,	dependencies: ['lib/crypto-js/rabbit.js']
	// 	}
	// ,	{
	// 		id: "cryptoRabbitDecrypt"
	// 	,	name: "Rabbit Decrypt"	
	// 	,	toolId: 'crypto'
	// 	,	longDescription: 'Rabbit is a high-performance stream cipher and a finalist in the eSTREAM Portfolio. It is one of the four designs selected after a 3 1/2-year process where 22 designs were evaluated.'
	// 	,	exampleInput: 'U2FsdGVkX1/rEtEaIkFz402Ld0GSwZFwp67qW/qu4t9VzGc4chUE/wnGBcY='
	// 	,	options: {cipher: 'Rabbit', verb: 'decrypt', passphrase: 'mySe4ret'}
	// 	,	dependencies: ['lib/crypto-js/rabbit.js']
	// 	}
	]
	}
]; 

APP = (typeof(APP) === 'undefined') ? {} : APP;
APP.data = data;

// APP.getAppCategoriesData = function()
// {
// 	if(typeof(APP.appCategoriesData)==='undefined')
// 	{

		
		
// 		APP.appCategoriesData = data; 
// 	}
// 	return APP.appCategoriesData; 
// }; 
