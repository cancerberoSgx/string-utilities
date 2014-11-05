// this file contains sprima aall js-indentator utilities




/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
createLocationMarker: true,
throwError: true, generateStatement: true, peek: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseUnaryExpression: true,
parseStatement: true, parseSourceElement: true */

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        SyntaxTreeDelegate,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        delegate,
        lookahead,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 32) ||  // space
            (ch === 9) ||      // tab
            (ch === 0xB) ||
            (ch === 0xC) ||
            (ch === 0xA0) ||
            (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(String.fromCharCode(ch)) > 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 10) || (ch === 13) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch >= 48 && ch <= 57) ||         // 0..9
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatiblity with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // 7.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (state.lastCommentStart >= start) {
            return;
        }
        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
    }

    function skipSingleLineComment() {
        var start, loc, ch, comment;

        start = index - 2;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - 2
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                if (extra.comments) {
                    comment = source.slice(start + 2, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + 2, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 13 && source.charCodeAt(index + 1) === 10) {
                    ++index;
                }
                ++lineNumber;
                ++index;
                lineStart = index;
                if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            } else if (ch === 42) {
                // Block comment ends with '*/' (char #42, char #47).
                if (source.charCodeAt(index + 1) === 47) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function skipComment() {
        var ch;

        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else if (ch === 47) { // 47 is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 47) {
                    ++index;
                    ++index;
                    skipSingleLineComment();
                } else if (ch === 42) {  // 42 is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function getEscapedIdentifier() {
        var ch, id;

        ch = source.charCodeAt(index++);
        id = String.fromCharCode(ch);

        // '\u' (char #92, char #117) denotes an escaped character.
        if (ch === 92) {
            if (source.charCodeAt(index) !== 117) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            id = ch;
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);

            // '\u' (char #92, char #117) denotes an escaped character.
            if (ch === 92) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 117) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 92) {
                // Blackslash (char #92) marks Unicode escape sequence.
                index = start;
                return getEscapedIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (char #92) starts an escaped character.
        id = (source.charCodeAt(index) === 92) ? getEscapedIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }


    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            code = source.charCodeAt(index),
            code2,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        switch (code) {

        // Check for most common single-character punctuators.
        case 46:   // . dot
        case 40:   // ( open bracket
        case 41:   // ) close bracket
        case 59:   // ; semicolon
        case 44:   // , comma
        case 123:  // { open curly brace
        case 125:  // } close curly brace
        case 91:   // [
        case 93:   // ]
        case 58:   // :
        case 63:   // ?
        case 126:  // ~
            ++index;
            if (extra.tokenize) {
                if (code === 40) {
                    extra.openParenToken = extra.tokens.length;
                } else if (code === 123) {
                    extra.openCurlyToken = extra.tokens.length;
                }
            }
            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };

        default:
            code2 = source.charCodeAt(index + 1);

            // '=' (char #61) marks an assignment or comparison operator.
            if (code2 === 61) {
                switch (code) {
                case 37:  // %
                case 38:  // &
                case 42:  // *:
                case 43:  // +
                case 45:  // -
                case 47:  // /
                case 60:  // <
                case 62:  // >
                case 94:  // ^
                case 124: // |
                    index += 2;
                    return {
                        type: Token.Punctuator,
                        value: String.fromCharCode(code) + String.fromCharCode(code2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };

                case 33: // !
                case 61: // =
                    index += 2;

                    // !== and ===
                    if (source.charCodeAt(index) === 61) {
                        ++index;
                    }
                    return {
                        type: Token.Punctuator,
                        value: source.slice(start, index),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                default:
                    break;
                }
            }
            break;
        }

        // Peek more characters.

        ch2 = source[index + 1];
        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                index += 4;
                return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Other 2-character punctuators: ++ -- << >> && ||

        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0)) {
            index += 2;
            return {
                type: Token.Punctuator,
                value: ch1 + ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    // 7.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanOctalLiteral(start) {
        var number = '0' + source[index++];
        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: true,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (isOctalDigit(ch)) {
                    return scanOctalLiteral(start);
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'u':
                    case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                            str += unescaped;
                        } else {
                            index = restore;
                            str += ch;
                        }
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanRegExp() {
        var str, ch, start, pattern, flags, value, classMarker = false, restore, terminated = false;

        lookahead = null;
        skipComment();

        start = index;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                } else if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                } else {
                    str += '\\';
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }

        peek();


        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
        return {
            literal: str,
            value: value,
            range: [start, index]
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var ch;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
            };
        }

        ch = source.charCodeAt(index);

        // Very common: ( and ) and ;
        if (ch === 40 || ch === 41 || ch === 58) {
            return scanPunctuator();
        }

        // String literal starts with single quote (#39) or double quote (#34).
        if (ch === 39 || ch === 34) {
            return scanStringLiteral();
        }

        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }

        // Dot (.) char #46 can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 46) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        // Slash (/) char #47 can also start a regex.
        if (extra.tokenize && ch === 47) {
            return advanceSlash();
        }

        return scanPunctuator();
    }

    function collectToken() {
        var start, loc, token, range, value;

        skipComment();
        start = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            range = [token.range[0], token.range[1]];
            value = source.slice(token.range[0], token.range[1]);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
            });
        }

        return token;
    }

    function lex() {
        var token;

        token = lookahead;
        index = token.range[1];
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();

        index = token.range[1];
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        return token;
    }

    function peek() {
        var pos, line, start;

        pos = index;
        line = lineNumber;
        start = lineStart;
        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
    }

    SyntaxTreeDelegate = {

        name: 'SyntaxTree',

        markStart: function () {
            if (extra.loc) {
                state.markerStack.push(index - lineStart);
                state.markerStack.push(lineNumber);
            }
            if (extra.range) {
                state.markerStack.push(index);
            }
        },

        markEnd: function (node) {
            if (extra.range) {
                node.range = [state.markerStack.pop(), index];
            }
            if (extra.loc) {
                node.loc = {
                    start: {
                        line: state.markerStack.pop(),
                        column: state.markerStack.pop()
                    },
                    end: {
                        line: lineNumber,
                        column: index - lineStart
                    }
                };
                this.postProcess(node);
            }
            return node;
        },

        markEndIf: function (node) {
            if (node.range || node.loc) {
                if (extra.loc) {
                    state.markerStack.pop();
                    state.markerStack.pop();
                }
                if (extra.range) {
                    state.markerStack.pop();
                }
            } else {
                this.markEnd(node);
            }
            return node;
        },

        postProcess: function (node) {
            if (extra.source) {
                node.loc.source = extra.source;
            }
            return node;
        },

        createArrayExpression: function (elements) {
            return {
                type: Syntax.ArrayExpression,
                elements: elements
            };
        },

        createAssignmentExpression: function (operator, left, right) {
            return {
                type: Syntax.AssignmentExpression,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBinaryExpression: function (operator, left, right) {
            var type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression :
                        Syntax.BinaryExpression;
            return {
                type: type,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBlockStatement: function (body) {
            return {
                type: Syntax.BlockStatement,
                body: body
            };
        },

        createBreakStatement: function (label) {
            return {
                type: Syntax.BreakStatement,
                label: label
            };
        },

        createCallExpression: function (callee, args) {
            return {
                type: Syntax.CallExpression,
                callee: callee,
                'arguments': args
            };
        },

        createCatchClause: function (param, body) {
            return {
                type: Syntax.CatchClause,
                param: param,
                body: body
            };
        },

        createConditionalExpression: function (test, consequent, alternate) {
            return {
                type: Syntax.ConditionalExpression,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createContinueStatement: function (label) {
            return {
                type: Syntax.ContinueStatement,
                label: label
            };
        },

        createDebuggerStatement: function () {
            return {
                type: Syntax.DebuggerStatement
            };
        },

        createDoWhileStatement: function (body, test) {
            return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test
            };
        },

        createEmptyStatement: function () {
            return {
                type: Syntax.EmptyStatement
            };
        },

        createExpressionStatement: function (expression) {
            return {
                type: Syntax.ExpressionStatement,
                expression: expression
            };
        },

        createForStatement: function (init, test, update, body) {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        },

        createForInStatement: function (left, right, body) {
            return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
            };
        },

        createFunctionDeclaration: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createFunctionExpression: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createIdentifier: function (name) {
            return {
                type: Syntax.Identifier,
                name: name
            };
        },

        createIfStatement: function (test, consequent, alternate) {
            return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createLabeledStatement: function (label, body) {
            return {
                type: Syntax.LabeledStatement,
                label: label,
                body: body
            };
        },

        createLiteral: function (token) {
            return {
                type: Syntax.Literal,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
            };
        },

        createMemberExpression: function (accessor, object, property) {
            return {
                type: Syntax.MemberExpression,
                computed: accessor === '[',
                object: object,
                property: property
            };
        },

        createNewExpression: function (callee, args) {
            return {
                type: Syntax.NewExpression,
                callee: callee,
                'arguments': args
            };
        },

        createObjectExpression: function (properties) {
            return {
                type: Syntax.ObjectExpression,
                properties: properties
            };
        },

        createPostfixExpression: function (operator, argument) {
            return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: false
            };
        },

        createProgram: function (body) {
            return {
                type: Syntax.Program,
                body: body
            };
        },

        createProperty: function (kind, key, value) {
            return {
                type: Syntax.Property,
                key: key,
                value: value,
                kind: kind
            };
        },

        createReturnStatement: function (argument) {
            return {
                type: Syntax.ReturnStatement,
                argument: argument
            };
        },

        createSequenceExpression: function (expressions) {
            return {
                type: Syntax.SequenceExpression,
                expressions: expressions
            };
        },

        createSwitchCase: function (test, consequent) {
            return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent
            };
        },

        createSwitchStatement: function (discriminant, cases) {
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        },

        createThisExpression: function () {
            return {
                type: Syntax.ThisExpression
            };
        },

        createThrowStatement: function (argument) {
            return {
                type: Syntax.ThrowStatement,
                argument: argument
            };
        },

        createTryStatement: function (block, guardedHandlers, handlers, finalizer) {
            return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: guardedHandlers,
                handlers: handlers,
                finalizer: finalizer
            };
        },

        createUnaryExpression: function (operator, argument) {
            if (operator === '++' || operator === '--') {
                return {
                    type: Syntax.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true
                };
            }
            return {
                type: Syntax.UnaryExpression,
                operator: operator,
                argument: argument,
                prefix: true
            };
        },

        createVariableDeclaration: function (declarations, kind) {
            return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind
            };
        },

        createVariableDeclarator: function (id, init) {
            return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init
            };
        },

        createWhileStatement: function (test, body) {
            return {
                type: Syntax.WhileStatement,
                test: test,
                body: body
            };
        },

        createWithStatement: function (object, body) {
            return {
                type: Syntax.WithStatement,
                object: object,
                body: body
            };
        }
    };

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    assert(index < args.length, 'Message reference must be in range');
                    return args[index];
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.range[0];
            error.lineNumber = token.lineNumber;
            error.column = token.range[0] - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        error.description = msg;
        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var line;

        // Catch the very common case first: immediately a semicolon (char #59).
        if (source.charCodeAt(index) === 59) {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpected(lookahead);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [];

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        expect(']');

        return delegate.createArrayExpression(elements);
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(param, first) {
        var previousStrict, body;

        previousStrict = strict;
        skipComment();
        delegate.markStart();
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;
        return delegate.markEnd(delegate.createFunctionExpression(null, param, [], body));
    }

    function parseObjectPropertyKey() {
        var token;

        skipComment();
        delegate.markStart();
        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return delegate.markEnd(delegate.createLiteral(token));
        }

        return delegate.markEnd(delegate.createIdentifier(token.value));
    }

    function parseObjectProperty() {
        var token, key, id, value, param;

        token = lookahead;
        skipComment();
        delegate.markStart();

        if (token.type === Token.Identifier) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                value = parsePropertyFunction([]);
                return delegate.markEnd(delegate.createProperty('get', key, value));
            }
            if (token.value === 'set' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead;
                if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
                    value = parsePropertyFunction([]);
                } else {
                    param = [ parseVariableIdentifier() ];
                    expect(')');
                    value = parsePropertyFunction(param, token);
                }
                return delegate.markEnd(delegate.createProperty('set', key, value));
            }
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', id, value));
        }
        if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpected(token);
        } else {
            key = parseObjectPropertyKey();
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', key, value));
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, key, kind, map = {}, toString = String;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

            key = '$' + name;
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[key] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[key] |= kind;
            } else {
                map[key] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return delegate.createObjectExpression(properties);
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        expr = parseExpression();

        expect(')');

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr;

        if (match('(')) {
            return parseGroupExpression();
        }

        type = lookahead.type;
        delegate.markStart();

        if (type === Token.Identifier) {
            expr =  delegate.createIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
            }
            expr = delegate.createLiteral(lex());
        } else if (type === Token.Keyword) {
            if (matchKeyword('this')) {
                lex();
                expr = delegate.createThisExpression();
            } else if (matchKeyword('function')) {
                expr = parseFunctionExpression();
            }
        } else if (type === Token.BooleanLiteral) {
            token = lex();
            token.value = (token.value === 'true');
            expr = delegate.createLiteral(token);
        } else if (type === Token.NullLiteral) {
            token = lex();
            token.value = null;
            expr = delegate.createLiteral(token);
        } else if (match('[')) {
            expr = parseArrayInitialiser();
        } else if (match('{')) {
            expr = parseObjectInitialiser();
        } else if (match('/') || match('/=')) {
            if (typeof extra.tokens !== 'undefined') {
                expr = delegate.createLiteral(collectRegex());
            } else {
                expr = delegate.createLiteral(scanRegExp());
            }
        }

        if (expr) {
            return delegate.markEnd(expr);
        }

        throwUnexpected(lex());
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token;

        delegate.markStart();
        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value));
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var callee, args;

        delegate.markStart();
        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];

        return delegate.markEnd(delegate.createNewExpression(callee, args));
    }

    function parseLeftHandSideExpressionAllowCall() {
        var marker, expr, args, property;

        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(')) {
            if (match('(')) {
                args = parseArguments();
                expr = delegate.createCallExpression(expr, args);
            } else if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            }
            if (marker) {
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function parseLeftHandSideExpression() {
        var marker, expr, property;

        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[')) {
            if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            }
            if (marker) {
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token;

        delegate.markStart();
        expr = parseLeftHandSideExpressionAllowCall();

        if (lookahead.type === Token.Punctuator) {
            if ((match('++') || match('--')) && !peekLineTerminator()) {
                // 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    throwErrorTolerant({}, Messages.StrictLHSPostfix);
                }

                if (!isLeftHandSide(expr)) {
                    throwError({}, Messages.InvalidLHSInAssignment);
                }

                token = lex();
                expr = delegate.createPostfixExpression(token.value, expr);
            }
        }

        return delegate.markEndIf(expr);
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr;

        delegate.markStart();

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            expr = delegate.createUnaryExpression(token.value, expr);
        } else if (match('+') || match('-') || match('~') || match('!')) {
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
        } else {
            expr = parsePostfixExpression();
        }

        return delegate.markEndIf(expr);
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, previousAllowIn, stack, right, operator, left, i;

        previousAllowIn = state.allowIn;
        state.allowIn = true;

        marker = createLocationMarker();
        left = parseUnaryExpression();

        token = lookahead;
        prec = binaryPrecedence(token, previousAllowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();

        markers = [marker, createLocationMarker()];
        right = parseUnaryExpression();

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, previousAllowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                expr = delegate.createBinaryExpression(operator, left, right);
                markers.pop();
                marker = markers.pop();
                if (marker) {
                    marker.end();
                    marker.apply(expr);
                }
                stack.push(expr);
                markers.push(marker);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(createLocationMarker());
            expr = parseUnaryExpression();
            stack.push(expr);
        }

        state.allowIn = previousAllowIn;

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = delegate.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
            marker = markers.pop();
            if (marker) {
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }


    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate;

        delegate.markStart();
        expr = parseBinaryExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();

            expr = delegate.markEnd(delegate.createConditionalExpression(expr, consequent, alternate));
        } else {
            delegate.markEnd({});
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, left, right, node;

        token = lookahead;
        delegate.markStart();
        node = left = parseConditionalExpression();

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(left)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && left.type === Syntax.Identifier && isRestrictedWord(left.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            token = lex();
            right = parseAssignmentExpression();
            node = delegate.createAssignmentExpression(token.value, left, right);
        }

        return delegate.markEndIf(node);
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr;

        delegate.markStart();
        expr = parseAssignmentExpression();

        if (match(',')) {
            expr = delegate.createSequenceExpression([ expr ]);

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }
        }

        return delegate.markEndIf(expr);
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block;

        skipComment();
        delegate.markStart();
        expect('{');

        block = parseStatementList();

        expect('}');

        return delegate.markEnd(delegate.createBlockStatement(block));
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token;

        skipComment();
        delegate.markStart();
        token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value));
    }

    function parseVariableDeclaration(kind) {
        var init = null, id;

        skipComment();
        delegate.markStart();
        id = parseVariableIdentifier();

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }

        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return delegate.markEnd(delegate.createVariableDeclarator(id, init));
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return delegate.createVariableDeclaration(declarations, 'var');
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations;

        skipComment();
        delegate.markStart();

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, kind));
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');
        return delegate.createEmptyStatement();
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();
        consumeSemicolon();
        return delegate.createExpressionStatement(expr);
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return delegate.createIfStatement(test, consequent, alternate);
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return delegate.createDoWhileStatement(body, test);
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return delegate.createWhileStatement(test, body);
    }

    function parseForVariableDeclaration() {
        var token, declarations;

        delegate.markStart();
        token = lex();
        declarations = parseVariableDeclarationList();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, token.value));
    }

    function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        throwError({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                delegate.createForStatement(init, test, update, body) :
                delegate.createForInStatement(left, right, body);
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(index) === 59) {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return delegate.createContinueStatement(label);
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (char #59).
        if (source.charCodeAt(index) === 59) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return delegate.createBreakStatement(label);
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(index) === 32) {
            if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return delegate.createReturnStatement(argument);
            }
        }

        if (peekLineTerminator()) {
            return delegate.createReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return delegate.createReturnStatement(argument);
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return delegate.createWithStatement(object, body);
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test,
            consequent = [],
            statement;

        skipComment();
        delegate.markStart();
        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            consequent.push(statement);
        }

        return delegate.markEnd(delegate.createSwitchCase(test, consequent));
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return delegate.createSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return delegate.createSwitchStatement(discriminant, cases);
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return delegate.createThrowStatement(argument);
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param, body;

        skipComment();
        delegate.markStart();
        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead);
        }

        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return delegate.markEnd(delegate.createCatchClause(param, body));
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return delegate.createTryStatement(block, [], handlers, finalizer);
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return delegate.createDebuggerStatement();
    }

    // 12 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key;

        if (type === Token.EOF) {
            throwUnexpected(lookahead);
        }

        skipComment();
        delegate.markStart();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return delegate.markEnd(parseEmptyStatement());
            case '{':
                return delegate.markEnd(parseBlock());
            case '(':
                return delegate.markEnd(parseExpressionStatement());
            default:
                break;
            }
        }

        if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return delegate.markEnd(parseBreakStatement());
            case 'continue':
                return delegate.markEnd(parseContinueStatement());
            case 'debugger':
                return delegate.markEnd(parseDebuggerStatement());
            case 'do':
                return delegate.markEnd(parseDoWhileStatement());
            case 'for':
                return delegate.markEnd(parseForStatement());
            case 'function':
                return delegate.markEnd(parseFunctionDeclaration());
            case 'if':
                return delegate.markEnd(parseIfStatement());
            case 'return':
                return delegate.markEnd(parseReturnStatement());
            case 'switch':
                return delegate.markEnd(parseSwitchStatement());
            case 'throw':
                return delegate.markEnd(parseThrowStatement());
            case 'try':
                return delegate.markEnd(parseTryStatement());
            case 'var':
                return delegate.markEnd(parseVariableStatement());
            case 'while':
                return delegate.markEnd(parseWhileStatement());
            case 'with':
                return delegate.markEnd(parseWithStatement());
            default:
                break;
            }
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return delegate.markEnd(delegate.createLabeledStatement(expr, labeledBody));
        }

        consumeSemicolon();

        return delegate.markEnd(delegate.createExpressionStatement(expr));
    }

    // 13 Function Definition

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody;

        skipComment();
        delegate.markStart();
        expect('{');

        while (index < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return delegate.markEnd(delegate.createBlockStatement(sourceElements));
    }

    function parseParams(firstRestricted) {
        var param, params = [], token, stricted, paramSet, key, message;
        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead;
                param = parseVariableIdentifier();
                key = '$' + token.value;
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[key] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return {
            params: params,
            stricted: stricted,
            firstRestricted: firstRestricted,
            message: message
        };
    }

    function parseFunctionDeclaration() {
        var id, params = [], body, token, stricted, tmp, firstRestricted, message, previousStrict;

        skipComment();
        delegate.markStart();

        expectKeyword('function');
        token = lookahead;
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionDeclaration(id, params, [], body));
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp, params = [], body, previousStrict;

        delegate.markStart();
        expectKeyword('function');

        if (!match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionExpression(id, params, [], body));
    }

    // 14 Program

    function parseSourceElement() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(lookahead.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (lookahead.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var body;

        skipComment();
        delegate.markStart();
        strict = false;
        peek();
        body = parseSourceElements();
        return delegate.markEnd(delegate.createProgram(body));
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function LocationMarker() {
        this.marker = [index, lineNumber, index - lineStart, 0, 0, 0];
    }

    LocationMarker.prototype = {
        constructor: LocationMarker,

        end: function () {
            this.marker[3] = index;
            this.marker[4] = lineNumber;
            this.marker[5] = index - lineStart;
        },

        apply: function (node) {
            if (extra.range) {
                node.range = [this.marker[0], this.marker[3]];
            }
            if (extra.loc) {
                node.loc = {
                    start: {
                        line: this.marker[1],
                        column: this.marker[2]
                    },
                    end: {
                        line: this.marker[4],
                        column: this.marker[5]
                    }
                };
            }
            node = delegate.postProcess(node);
        }
    };

    function createLocationMarker() {
        if (!extra.loc && !extra.range) {
            return null;
        }

        skipComment();

        return new LocationMarker();
    }

    function tokenize(code, options) {
        var toString,
            token,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }
            }
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            token = lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    token = lex();
                } catch (lexError) {
                    token = lookahead;
                    if (extra.errors) {
                        extra.errors.push(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            markerStack: []
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with package.json and component.json.
    exports.version = '1.1.0-dev';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */










/*! js-indentator 2013-12-08 */
jsindentator={};var ns=jsindentator={};_.extend(ns,{blockCount:0,print:function(a){ns.buffer.push(a)},_printIndent:function(a){for(var b=0;a>b;b++)ns.print(ns.tab)},printIndent:function(a){a||ns.buffer.push(ns.newline),ns._printIndent(ns.blockCount)},styles:{},originalCode:function(a){return a.range?1==a.range.length?ns.code.substring(a.range[0],a.range[1]):ns.code.substring(a.range[0],a.range[1]):""},buffer:[],setStyle:function(a){ns.visitors=a,a.installStyle&&_.isFunction(a.installStyle)&&a.installStyle()},main:function(a,b){b&&!ns.visitors.setStyleConfig?_.extend(ns,b):b&&ns.visitors.setStyleConfig&&ns.visitors.setStyleConfig(b),ns.code=a;var c=null,d=null;try{c=esprima.parse(a,{raw:!0,range:!0,comment:!0})}catch(e){d=e}return c?(ns.syntax=c,ns.buffer=[],_(c.body).each(function(a){ns.visit(a)}),ns.buffer=ns.visitors.postRender&&ns.visitors.postRender()||ns.buffer,ns.buffer.join("")):(console.log("JAVASCRIPT PARSING ERROR: "+d),void 0)},visit:function(a,b,c){if(a){var d=ns.visitors[a.type];if(d)ns._checkComments(a),c&&(a.parentNode=c),d.apply(ns.visitors,[a,b]);else{var e=ns.originalCode(a);console.log("WARNING - Language concept not supported ",a,e),ns.buffer.push(e)}}},_checkComments:function(a){var b=ns._comments_currentNodeRange||[0,0];ns._comments_currentNodeRange=a.range||[0,0];for(var c=0;c<ns.syntax.comments.length;c++){var d=ns.syntax.comments[c];if(d.range[0]>=b[1]&&d.range[1]<=ns._comments_currentNodeRange[0]){ns.visit(d);break}}},logMessages:[],log:function(a){logMessages.push(a)},setConfig:function(a){_.extend(ns,a)}}),function(){var a=jsindentator,b=a.visit,c=a.print,d=a.printIndent;a.styles||(a.styles={}),a.quote="'",a.tab="	",a.newline="\n",jsindentator.styles.style1={installStyle:function(){},VariableDeclaration:function(e,f){f&&f.noFirstNewLine||d(),c("var ");for(var g=0;g<e.declarations.length;g++)b(e.declarations[g]),g<e.declarations.length-1&&(f&&f.noFirstNewLine?c(", "):(d(),c(","+a.tab)));f&&f.noLastSemicolon||c("; ")},VariableDeclarator:function(a){b(a.id),a.init&&(c(" = "),b(a.init))},Literal:function(a){0===a.raw.indexOf('"')||0===a.raw.indexOf("'")?c(a.raw):c(a.raw)},Identifier:function(a){c(a.name||"")},FunctionExpression:function(e){c("function "),b(e.id),c(" ( ");for(var f=0;f<e.params.length;f++)b(e.params[f]),f<e.params.length-1&&c(", ");c(" ) "),e.body.body.length>0?(d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")):c("{}")},BlockStatement:function(a){for(var c=0;c<a.body.length;c++)b(a.body[c])},UpdateExpression:function(a){a.prefix?(c(a.operator),b(a.argument)):(b(a.argument),c(a.operator))},ForStatement:function(e){d(),c("for("),b(e.init,{noFirstNewLine:!0}),b(e.test),c("; "),b(e.update),c(")"),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ArrayExpression:function(a){c("[");for(var d=0;d<a.elements.length;d++)b(a.elements[d]),d<a.elements.length-1&&c(", ");c("]")},ExpressionStatement:function(a){d(),b(a.expression),c(";")},CallExpression:function(a){"FunctionExpression"===a.callee.type&&c("("),b(a.callee),"FunctionExpression"===a.callee.type&&c(")"),c(" ( ");for(var d=0;d<a.arguments.length;d++)b(a.arguments[d]),d<a.arguments.length-1&&c(", ");c(" ) ")},BinaryExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},ObjectExpression:function(e){if(0===e.properties.length)return c("{}"),void 0;c("{"),a.blockCount++,d();for(var f=0;f<e.properties.length;f++){var g=e.properties[f];b(g.key),c(": "),b(g.value),f<e.properties.length-1&&(a.print(a.newline),a._printIndent(a.blockCount-1),c(","+a.tab))}a.blockCount--,d(),c("}")},ReturnStatement:function(a){d(),c("return "),b(a.argument),c(";")},ConditionalExpression:function(a){b(a.test),c(" ? "),b(a.consequent),c(" : "),b(a.alternate)},SwitchStatement:function(a){d(),c("switch ("),b(a.discriminant),c(")"),d(),c("{");for(var e=0;e<a.cases.length;e++)b(a.cases[e]);d(),c("}")},SwitchCase:function(e){d(),c(null==e.test?"default":"case "),b(e.test),c(":"),a.blockCount++;for(var f=0;f<e.consequent.length;f++)b(e.consequent[f]);a.blockCount--},EmptyStatement:function(){c(";")},BreakStatement:function(){d(),c("break;")},WhileStatement:function(e){d(),c("while ( "),b(e.test),c(" ) "),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},AssignmentExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},MemberExpression:function(a){b(a.object),c("."),b(a.property)},ThisExpression:function(){c("this")},SequenceExpression:function(a){c("( ");for(var d=0;d<a.expressions.length;d++)b(a.expressions[d]),d<a.expressions.length-1&&c(", ");c(" )")},DoWhileStatement:function(e){d(),c("do"),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}"),d(),c("while ( "),b(e.test),c(" );")},NewExpression:function(a){c("new "),b(a.callee),c("(");for(var d=0;d<a.arguments.length;d++)b(a.arguments[d]),d<a.arguments.length-1&&c(", ");c(")")},WithStatement:function(e){d(),c("with ( "),b(e.object),c(" )"),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("};"),d()},IfStatement:function(e,f){f&&f.noFirstNewLine||d(),c("if ( "),b(e.test),c(" )"),d(),c("{"),a.blockCount++,b(e.consequent),a.blockCount--,d(),c("}"),e.alternate&&(d(),c("else "),null==e.alternate.test&&(d(),c("{"),a.blockCount++),b(e.alternate,{noFirstNewLine:!0}),null==e.alternate.test&&(a.blockCount--,d(),c("}")))},FunctionDeclaration:function(e){if(d(),c("function "),b(e.id),c(" ( "),e.params)for(var f=0;f<e.params.length;f++)b(e.params[f]),f<e.params.length-1&&c(", ");c(" ) "),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},UnaryExpression:function(a){c(a.operator+" "),b(a.argument)},LogicalExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},TryStatement:function(e){d(),c("try"),d(),c("{"),a.blockCount++,b(e.block),a.blockCount--,d(),c("}");for(var f=0;f<e.handlers.length;f++)b(e.handlers[f]);e.finalizer&&(d(),c("finally"),d(),c("{"),a.blockCount++,b(e.finalizer),a.blockCount--,d(),c("}"))},CatchClause:function(e){d(),c("catch ( "),e.param&&b(e.param),c(" ) "),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ThrowStatement:function(a){d(),c("throw "),b(a.argument),c(";")},ForInStatement:function(e){d(),c("for ( "),b(e.left,{noFirstNewLine:!0,noLastSemicolon:!0}),c(" in "),b(e.right),c(" )"),d(),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ContinueStatement:function(){d(),c("continue;")},Block:function(a){d(),c("/* "),c(a.value),c(" */")},Line:function(a){d(),c("// "),c(a.value),d()}}}(),function(){var a=jsindentator,b=a.visit,c=a.print,d=a.printIndent;a.quote="'",a.tab="	",a.newline="\n",jsindentator.styles||(jsindentator.styles={}),jsindentator.styles.style2={VariableDeclaration:function(e,f){f&&f.noFirstNewLine||d(),c("var ");for(var g=0;g<e.declarations.length;g++)b(e.declarations[g]),g<e.declarations.length-1&&(c(", "),d(),c(a.tab));f&&f.noLastSemicolon||c("; ")},VariableDeclarator:function(a){b(a.id),a.init&&(c(" = "),b(a.init))},Literal:function(a){0===a.raw.indexOf('"')||0===a.raw.indexOf("'")?c(a.raw):c(a.raw)},Identifier:function(a){c(a.name||"")},FunctionExpression:function(e){c("function "),b(e.id),c(" ( ");for(var f=0;f<e.params.length;f++)b(e.params[f]),f<e.params.length-1&&c(", ");c(" ) "),e.body.body.length>0?(c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")):c("{}")},BlockStatement:function(a){for(var c=0;c<a.body.length;c++)b(a.body[c])},UpdateExpression:function(a){a.prefix?(c(a.operator),b(a.argument)):(b(a.argument),c(a.operator))},ForStatement:function(e){d(),c("for ( "),b(e.init,{noFirstNewLine:!0}),b(e.test),c("; "),b(e.update),c(" ) "),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ArrayExpression:function(a){c("[");for(var d=0;d<a.elements.length;d++)b(a.elements[d]),d<a.elements.length-1&&c(", ");c("]")},ExpressionStatement:function(a){d(),b(a.expression),c(";")},CallExpression:function(a){"FunctionExpression"===a.callee.type&&c("("),b(a.callee),"FunctionExpression"===a.callee.type&&c(")"),c(" ( ");for(var d=0;d<a.arguments.length;d++)b(a.arguments[d]),d<a.arguments.length-1&&c(", ");c(" ) ")},BinaryExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},ObjectExpression:function(e){if(0===e.properties.length)return c("{}"),void 0;c("{"),a.blockCount++,d();for(var f=0;f<e.properties.length;f++){var g=e.properties[f];b(g.key),c(": "),b(g.value),f<e.properties.length-1&&(c(", "),d())}a.blockCount--,d(),c("}")},ReturnStatement:function(a){d(),c("return "),b(a.argument),c(";")},ConditionalExpression:function(a){b(a.test),c(" ? "),b(a.consequent),c(" : "),b(a.alternate)},SwitchStatement:function(a){d(),c("switch ("),b(a.discriminant),c(")"),c(" {");for(var e=0;e<a.cases.length;e++)b(a.cases[e]);d(),c("}")},SwitchCase:function(e){d(),c(null==e.test?"default":"case "),b(e.test),c(":"),a.blockCount++;for(var f=0;f<e.consequent.length;f++)b(e.consequent[f]);a.blockCount--},EmptyStatement:function(){c(";")},BreakStatement:function(){d(),c("break;")},WhileStatement:function(e){d(),c("while ( "),b(e.test),c(" ) "),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},AssignmentExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},MemberExpression:function(a){b(a.object),c("."),b(a.property)},ThisExpression:function(){c("this")},SequenceExpression:function(a){c("( ");for(var d=0;d<a.expressions.length;d++)b(a.expressions[d]),d<a.expressions.length-1&&c(", ");c(" )")},DoWhileStatement:function(e){d(),c("do"),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("} "),c("while ( "),b(e.test),c(" );")},NewExpression:function(a){c("new "),b(a.callee),c("(");for(var d=0;d<a.arguments.length;d++)b(a.arguments[d]),d<a.arguments.length-1&&c(", ");c(")")},WithStatement:function(e){d(),c("with ( "),b(e.object),c(" )"),c(" {"),a.blockCount++,b(e.body),a.blockCount--,d(),c("};"),d()},IfStatement:function(e,f){f&&f.noFirstNewLine||d(),c("if ( "),b(e.test),c(" )"),c(" { "),a.blockCount++,b(e.consequent),a.blockCount--,d(),c("}"),e.alternate&&(d(),c("else "),null==e.alternate.test&&(c(" {"),a.blockCount++),b(e.alternate,{noFirstNewLine:!0}),null==e.alternate.test&&(a.blockCount--,d(),c("}")))},FunctionDeclaration:function(e){if(d(),c("function "),b(e.id),c(" ( "),e.params)for(var f=0;f<e.params.length;f++)b(e.params[f]),f<e.params.length-1&&c(", ");c(" ) "),c("{"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},UnaryExpression:function(a){c(a.operator+" "),b(a.argument)},LogicalExpression:function(a){b(a.left),c(" "+a.operator+" "),b(a.right)},TryStatement:function(e){d(),c("try"),c(" {"),a.blockCount++,b(e.block),a.blockCount--,d(),c("}");for(var f=0;f<e.handlers.length;f++)b(e.handlers[f]);e.finalizer&&(d(),c("finally"),c(" {"),a.blockCount++,b(e.finalizer),a.blockCount--,d(),c("}"))},CatchClause:function(e){d(),c("catch ( "),e.param&&b(e.param),c(" )"),c(" {"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ThrowStatement:function(a){d(),c("throw "),b(a.argument),c(";")},ForInStatement:function(e){d(),c("for ( "),b(e.left,{noFirstNewLine:!0,noLastSemicolon:!0}),c(" in "),b(e.right),c(" )"),c(" {"),a.blockCount++,b(e.body),a.blockCount--,d(),c("}")},ContinueStatement:function(){d(),c("continue;")},Block:function(a){d(),c("/* "),c(a.value),c(" */")},Line:function(a){d(),c("// "),c(a.value),d()}}}(),function(){var a=jsindentator,b=a.print;jsindentator.styles||(jsindentator.styles={});var c=a.visit;jsindentator.styles.clean={VariableDeclaration:function(a,d){b("var ");for(var e=0;e<a.declarations.length;e++)c(a.declarations[e],{},a),e<a.declarations.length-1&&b(",");d&&d.noLastSemicolon||b(";")},VariableDeclarator:function(a){c(a.id),a.init&&(b("="),c(a.init,{},a))},Literal:function(a){b(a.raw)},Identifier:function(a){b(a.name||"")},FunctionExpression:function(d){b("function "),c(d.id,{},d),b("(");for(var e=0;e<d.params.length;e++)c(d.params[e],{},d),e<d.params.length-1&&b(",");b("){"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("}")},BlockStatement:function(a){for(var b=0;b<a.body.length;b++)c(a.body[b],{},a)},UpdateExpression:function(a){a.prefix?(b(a.operator),c(a.argument,{},a)):(c(a.argument,{},a),b(a.operator))},ForStatement:function(d){b("for("),c(d.init,{noFirstNewLine:!0},d),c(d.test,{},d),b(";"),c(d.update,{},d),b("){"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("};")},ArrayExpression:function(a){b("[");for(var d=0;d<a.elements.length;d++)c(a.elements[d],{},a),d<a.elements.length-1&&b(",");b("]")},ExpressionStatement:function(a){c(a.expression),b(";")},CallExpression:function(d){"FunctionExpression"===d.callee.type&&(b("("),a.blockCount++),c(d.callee,{},d),"FunctionExpression"===d.callee.type&&(b(")"),a.blockCount--),b("(");for(var e=0;e<d.arguments.length;e++)c(d.arguments[e],{},d),e<d.arguments.length-1&&b(",");b(")")},BinaryExpression:function(a){c(a.left,{},a),b("in"===a.operator?" in ":a.operator),c(a.right,{},a)},ObjectExpression:function(d){b("{"),a.blockCount++;for(var e=0;e<d.properties.length;e++){var f=d.properties[e];c(f.key,{},d),b(":"),c(f.value,{},d),e<d.properties.length-1&&b(",")}a.blockCount--,b("}")},ReturnStatement:function(a){b("return "),c(a.argument,{},a),b(";")},ConditionalExpression:function(a){c(a.test,{},a),b("?"),c(a.consequent,{},a),b(":"),c(a.alternate,{},a)},EmptyStatement:function(){b(";")},SwitchStatement:function(a){b("switch("),c(a.discriminant,{},a),b("){");for(var d=0;d<a.cases.length;d++)c(a.cases[d],{},a);b("}")},SwitchCase:function(a){b(null==a.test?"default":"case "),c(a.test,{},a),b(":");for(var d=0;d<a.consequent.length;d++)c(a.consequent[d],{},a)},BreakStatement:function(){b("break;")},WhileStatement:function(d){b("while("),c(d.test,{},d),b("){"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("}")},AssignmentExpression:function(a){c(a.left,{},a),b(a.operator),c(a.right,{},a)},MemberExpression:function(a){c(a.object,{},a),b("."),c(a.property,{},a)},ThisExpression:function(){b("this")},SequenceExpression:function(a){b("(");for(var d=0;d<a.expressions.length;d++)c(a.expressions[d],{},a),d<a.expressions.length-1&&b(",");b(")")},DoWhileStatement:function(a){b("do{"),c(a.body,{},a),b("}while("),c(a.test,{},a),b(");")},NewExpression:function(a){b("new "),c(a.callee,{},a),b("(");for(var d=0;d<a.arguments.length;d++)c(a.arguments[d],{},a),d<a.arguments.length-1&&b(",");b(")")},WithStatement:function(d){b("with("),c(d.object,{},d),b(")"),b("{"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("};")},IfStatement:function(d){b("if("),c(d.test,{},d),b(")"),b("{"),a.blockCount++,c(d.consequent,{},d),a.blockCount--,d.alternate&&(b("}else "),null==d.alternate.test?(b("{"),a.blockCount++,c(d.alternate,{noFirstNewLine:!0},d),a.blockCount--,b("}")):c(d.alternate,{noFirstNewLine:!0},d))},FunctionDeclaration:function(d){if(b("function"),d.id&&(b(" "),c(d.id,{},d)),b("("),d.params)for(var e=0;e<d.params.length;e++)c(d.params[e],{},d),e<d.params.length-1&&b(",");b("){"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("}")},UnaryExpression:function(a){b(a.operator),c(a.argument,{},a)},LogicalExpression:function(a){c(a.left,{},a),b(a.operator),c(a.right,{},a)},TryStatement:function(d){b("try{"),a.blockCount++,c(d.block,{},d),a.blockCount--,b("}");for(var e=0;e<d.handlers.length;e++)c(d.handlers[e],{},d);d.finalizer&&(b("finally"),b("{"),a.blockCount++,c(d.finalizer,{},d),a.blockCount--,b("}"))},CatchClause:function(d){if(b("catch("),d.params)for(var e=0;e<d.params.length;e++)c(d.params[e],{},d),e<d.params.length-1&&b(",");b("){"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("}")},ThrowStatement:function(a){b("throw "),c(a.argument,{},a),b(";")},ForInStatement:function(d){b("for("),c(d.left,{noFirstNewLine:!0,noLastSemicolon:!0},d),b(" in "),c(d.right,{},d),b(")"),b("{"),a.blockCount++,c(d.body,{},d),a.blockCount--,b("}")},ContinueStatement:function(){b("continue;")},Block:function(){},Line:function(){}}}(),function(){var ns=jsindentator,visit=ns.visit,print=ns.print,indent=ns.printIndent;ns.styles||(ns.styles={});var variable1DefaultConfig=ns.config={tab:"	",newline:"\n",VAR:'return "var "',VAR_COMMA:'return ", "',VAR_COMMA_NEWLINE:'return ns.Indent() + "," + ns.tab',VAR_DECL_INIT:'return " = "',STMT_SEMICOLON:'return "; "+ ns.Indent() ',FUNCTION:'return "function "',FUNCTION_PAREN_LEFT:'return " ( "',FUNCTION_PAREN_RIGHT:'return " ) "',FUNCTION_PARAM_COMMA:'return", "',FUNCTION_CURLY_LEFT:'return "{" + ns.Indent()',FUNCTION_CURLY_RIGHT:'return "}" + ns.Indent()',OPERAND_UPDATE:'return " "+node.operator+" "; ',FOR:'return "for"; ',FOR_COLON:'return "; "; ',FOR_PAREN_LEFT:'return " ( "; ',FOR_PAREN_RIGHT:'return " ) " + ns.Indent(); ',FOR_CURLY_LEFT:'return ns.Indent()+" { "+ ns.Indent() ; ',FOR_CURLY_RIGHT:'return " { "; ',SQUARE_LEFT:'return " [ "; ',SQUARE_RIGHT:'return " ] "; ',CALL_COMMA:'return ", "; ',CALL_PAREN_LEFT:'return " ( "; ',CALL_PAREN_RIGHT:'return " ) "; ',BYNARY_OPERATOR:"return node.operator; ",OBJECT_CURLY_LEFT:'return "{"; ',OBJECT_CURLY_RIGHT:'return "}"; ',OBJECT_COMMA:'return  ns.Indent(false, ns.blockCount-1) + "," + ns.tab;  ',RETURN:'return ns.Indent() + "return"; ',QUESTION:'return " ? "; ',COLON:'return " : "; ',SEQUENCE_PAREN_LEFT:'return "("; ',SEQUENCE_COMMA:'return ", "; ',SEQUENCE_PAREN_RIGHT:'return ")"; ',SWITCH:'return ns.Indent() + "switch"; ',SWITCH_PAREN_LEFT:'return "("; ',SWITCH_PAREN_RIGHT:'return ")"+ns.Indent(); ',SWITCH_CURLY_LEFT:'return "{"; ',SWITCH_CURLY_RIGHT:'return ns.Indent() + "}"; ',SWITCH_CASE:'return ns.Indent() + node.test==null ? "default" : "case "; ',SWITCH_COLON:'return ":"; ',BREAK:'return "break"; ',WHILE:'return "while"; ',WHILE_PAREN_LEFT:'return "("; ',WHILE_PAREN_RIGHT:'return ")"; ',WHILE_CURLY_LEFT:'return "{"; ',WHILE_CURLY_RIGHT:'return "}"; ',OPERATOR_ASSIGNMENT:'return " "+node.operator+" "; ',OPERATOR_DOT:'return "."; ',THIS:'return " this"; ',DO:'return "do "; ',DO_CURLY_LEFT:'return ns.Indent() + "{"; ',DO_CURLY_RIGHT:'return  ns.Indent() + "}"; ',NEW:'return "new "; ',NEW_PAREN_LEFT:'return "( "; ',NEW_PAREN_RIGHT:'return ")"; ',NEW_COMMA:'return ", "; ',WITH:'return  ns.Indent() + "with  "; ',WITH_PAREN_LEFT:'return "("; ',WITH_PAREN_RIGHT:'return ")"; ',WITH_CURLY_LEFT:'return "{" ',WITH_CURLY_RIGHT:'return  ns.Indent() +"}"; ',LITERAL:function(a,b){0===a.raw.indexOf('"')?(b.print("'"+a.raw.replace("'","")),b.print(" /* TODO: HEY, we use single quotes, fix this literal: */"+a.raw)):b.print(a.raw)},IDENTIFIER:"return node.name",Block:'ns.Indent() + "/* " + node.value + " */"',Line:'ns.Indent() + "// " + node.value '};ns.Indent=function(a,b){var c=[];a||c.push(ns.newline);for(var d=b?b:ns.blockCount,e=0;d>e;e++)c.push(ns.tab);return c.join("")},ns.createRenderer=function(s){if(_.isFunction(s))return s;var buf=[];buf.push("(function(node, ns, _){"),buf.push(s),buf.push("})");var str=buf.join("");try{var fn=eval(str),wrapped=_.wrap(fn,function(){var a=arguments[1],b=arguments[2],c=arguments[3];b.print(fn.apply(fn,[a,b,c]))});return wrapped}catch(e){throw console.log('"ERROR evaluating renderer '+s+"\noutput: "+str),e}},jsindentator.styles.variable1={setStyleConfig:function(a){ns.config=variable1DefaultConfig,_.each(_.keys(a),function(b){b&&(ns.config[b]=a[b])}),ns.styles.variable1.installStyle()},installStyle:function(){ns.variables={},_.each(_.keys(ns.config),function(a){if(a)try{ns.variables[a]=ns.createRenderer(ns.config[a])}catch(b){console.log("ERROR PARSING VARIABLE: ",a,b)}})},VariableDeclaration:function(a,b){b&&b.noFirstNewLine||indent(),ns.variables.VAR(a,ns,_);for(var c=0;c<a.declarations.length;c++)visit(a.declarations[c]),c<a.declarations.length-1&&(b&&b.noFirstNewLine?print(ns.variables.VAR_COMMA(a,ns,_)):ns.variables.VAR_COMMA_NEWLINE(a,ns,_));b&&b.noLastSemicolon||print(ns.variables.STMT_SEMICOLON(a,ns,_))},VariableDeclarator:function(a){visit(a.id),a.init&&(ns.variables.VAR_DECL_INIT(a,ns,_),visit(a.init))},Literal:function(a){ns.variables.LITERAL(a,ns,_)},Identifier:function(a){ns.variables.IDENTIFIER(a,ns,_)},FunctionExpression:function(a){ns.variables.FUNCTION(a,ns,_),visit(a.id),print(ns.variables.FUNCTION_PAREN_LEFT(a,ns,_));for(var b=0;b<a.params.length;b++)visit(a.params[b]),b<a.params.length-1&&print(ns.variables.FUNCTION_PARAM_COMMA(a,ns,_));print(ns.variables.FUNCTION_PAREN_RIGHT(a,ns,_)),a.body.body.length>0?(print(ns.variables.FUNCTION_CURLY_LEFT(a,ns,_)),ns.blockCount++,visit(a.body),ns.blockCount--,print(ns.variables.FUNCTION_CURLY_RIGHT(a,ns,_))):(print(ns.variables.FUNCTION_CURLY_LEFT(a,ns,_)),print(ns.variables.FUNCTION_CURLY_RIGHT(a,ns,_)))},BlockStatement:function(a){for(var b=0;b<a.body.length;b++)visit(a.body[b])},UpdateExpression:function(a){a.prefix?(print(ns.variables.OPERAND_UPDATE(a,ns,_)),visit(a.argument)):(visit(a.argument),print(ns.variables.OPERAND_UPDATE(a,ns,_)))},ForStatement:function(a){print(ns.variables.FOR(a,ns,_)),print(ns.variables.FOR_PAREN_LEFT(a,ns,_)),visit(a.init,{noFirstNewLine:!0}),visit(a.test),print(ns.variables.FOR_COLON(a,ns,_)),visit(a.update),print(ns.variables.FOR_PAREN_RIGHT(a,ns,_)),print(ns.variables.FOR_CURLY_LEFT(a,ns,_)),ns.blockCount++,visit(a.body),ns.blockCount--,print(ns.variables.FOR_CURLY_RIGHT(a,ns,_))},ArrayExpression:function(a){print(ns.variables.SQUARE_LEFT(a,ns,_));for(var b=0;b<a.elements.length;b++)visit(a.elements[b]),b<a.elements.length-1&&print(", ");print(ns.variables.SQUARE_RIGHT(a,ns,_))},ExpressionStatement:function(a){visit(a.expression),print(ns.variables.STMT_SEMICOLON(a,ns,_))},CallExpression:function(a){"FunctionExpression"===a.callee.type&&print(ns.variables.CALL_PAREN_LEFT(a,ns,_)),visit(a.callee),"FunctionExpression"===a.callee.type&&print(ns.variables.CALL_PAREN_RIGHT(a,ns,_)),print(ns.variables.CALL_PAREN_LEFT(a,ns,_));for(var b=0;b<a.arguments.length;b++)visit(a.arguments[b]),b<a.arguments.length-1&&print(ns.variables.CALL_COMMA(a,ns,_));print(ns.variables.CALL_PAREN_RIGHT(a,ns,_))},BinaryExpression:function(a){visit(a.left),print(ns.variables.BYNARY_OPERATOR(a,ns,_)),visit(a.right)},ObjectExpression:function(a){print(ns.variables.OBJECT_CURLY_LEFT(a,ns,_)),ns.blockCount++;for(var b=0;b<a.properties.length;b++){var c=a.properties[b];visit(c.key),print(": "),visit(c.value),b<a.properties.length-1&&print(ns.variables.OBJECT_COMMA(a,ns,_))}ns.blockCount--,print(ns.variables.OBJECT_CURLY_RIGHT(a,ns,_))},ReturnStatement:function(a){print(ns.variables.RETURN(a,ns,_)),visit(a.argument),print(ns.variables.STMT_SEMICOLON(a,ns,_))},ConditionalExpression:function(a){visit(a.test),print(ns.variables.QUESTION(a,ns,_)),visit(a.consequent),print(ns.variables.COLON(a,ns,_)),visit(a.alternate)},SwitchStatement:function(a){print(ns.variables.SWITCH(a,ns,_)),print(ns.variables.SWITCH_PAREN_LEFT(a,ns,_)),visit(a.discriminant),print(ns.variables.SWITCH_PAREN_RIGHT(a,ns,_)),print(ns.variables.SWITCH_CURLY_LEFT(a,ns,_));for(var b=0;b<a.cases.length;b++)visit(a.cases[b]);print(ns.variables.SWITCH_CURLY_RIGHT(a,ns,_))},SwitchCase:function(a){print(ns.variables.SWITCH_CASE(a,ns,_)),visit(a.test),print(ns.variables.SWITCH_COLON(a,ns,_)),ns.blockCount++;for(var b=0;b<a.consequent.length;b++)visit(a.consequent[b]);ns.blockCount--},EmptyStatement:function(a){print(ns.variables.STMT_SEMICOLON(a,ns,_))},BreakStatement:function(a){print(ns.variables.BREAK(a,ns,_))},WhileStatement:function(a){print(ns.variables.WHILE(a,ns,_)),print(ns.variables.WHILE_PAREN_LEFT(a,ns,_)),visit(a.test),print(ns.variables.WHILE_PAREN_RIGHT(a,ns,_)),print(ns.variables.WHILE_CURLY_LEFT(a,ns,_)),ns.blockCount++,visit(a.body),ns.blockCount--,print(ns.variables.WHILE_CURLY_RIGHT(a,ns,_))},AssignmentExpression:function(a){visit(a.left),print(ns.variables.OPERATOR_ASSIGNMENT(a,ns,_)),visit(a.right)},MemberExpression:function(a){visit(a.object),print(ns.variables.OPERATOR_DOT(a,ns,_)),visit(a.property)},ThisExpression:function(a){print(ns.variables.THIS(a,ns,_))},SequenceExpression:function(a){print(ns.variables.SEQUENCE_PAREN_LEFT(a,ns,_));for(var b=0;b<a.expressions.length;b++)visit(a.expressions[b]),b<a.expressions.length-1&&print(ns.variables.SEQUENCE_COMMA(a,ns,_));print(ns.variables.SEQUENCE_PAREN_RIGHT(a,ns,_))},DoWhileStatement:function(a){print(ns.variables.DO(a,ns,_)),print(ns.variables.DO_CURLY_LEFT(a,ns,_)),ns.blockCount++,visit(a.body),ns.blockCount--,print(ns.variables.DO_CURLY_RIGHT(a,ns,_)),print(ns.variables.WHILE(a,ns,_)),print(ns.variables.WHILE_PAREN_LEFT(a,ns,_)),visit(a.test),print(ns.variables.WHILE_PAREN_RIGHT(a,ns,_)),print(ns.variables.STMT_SEMICOLON(a,ns,_))},NewExpression:function(a){print(ns.variables.NEW(a,ns,_)),visit(a.callee),print(ns.variables.NEW_PAREN_LEFT(a,ns,_));for(var b=0;b<a.arguments.length;b++)visit(a.arguments[b]),b<a.arguments.length-1&&print(ns.variables.NEW_COMMA(a,ns,_));print(ns.variables.NEW_PAREN_RIGHT(a,ns,_))},WithStatement:function(a){print(ns.variables.WITH(a,ns,_)),print(ns.variables.WITH_PAREN_LEFT(a,ns,_)),visit(a.object),print(ns.variables.WITH_PAREN_RIGHT(a,ns,_)),print(ns.variables.WITH_CURLY_LEFT(a,ns,_)),ns.blockCount++,visit(a.body),ns.blockCount--,print(ns.variables.WITH_CURLY_RIGHT(a,ns,_)),print(ns.variables.STMT_SEMICOLON(a,ns,_))},IfStatement:function(a,b){b&&b.noFirstNewLine||indent(),print("if ( "),visit(a.test),print(" )"),indent(),print("{"),ns.blockCount++,visit(a.consequent),ns.blockCount--,indent(),print("}"),a.alternate&&(indent(),print("else "),null==a.alternate.test&&(indent(),print("{"),ns.blockCount++),visit(a.alternate,{noFirstNewLine:!0}),null==a.alternate.test&&(ns.blockCount--,indent(),print("}")))},FunctionDeclaration:function(a){if(indent(),print("function "),visit(a.id),print(" ( "),a.params)for(var b=0;b<a.params.length;b++)visit(a.params[b]),b<a.params.length-1&&print(", ");print(" ) "),indent(),print("{"),ns.blockCount++,visit(a.body),ns.blockCount--,indent(),print("}")},UnaryExpression:function(a){print(a.operator+" "),visit(a.argument)},LogicalExpression:function(a){visit(a.left),print(" "+a.operator+" "),visit(a.right)},TryStatement:function(a){indent(),print("try"),indent(),print("{"),ns.blockCount++,visit(a.block),ns.blockCount--,indent(),print("}");for(var b=0;b<a.handlers.length;b++)visit(a.handlers[b]);indent(),print("finally"),indent(),print("{"),ns.blockCount++,visit(a.finalizer),ns.blockCount--,indent(),print("}")},CatchClause:function(a){console.log(a),indent(),print("catch ( "),a.param&&visit(a.param),print(" ) "),indent(),print("{"),ns.blockCount++,visit(a.body),ns.blockCount--,indent(),print("}")},ThrowStatement:function(a){indent(),print("throw "),visit(a.argument),print(ns.variables.STMT_SEMICOLON(a,ns,_))},ForInStatement:function(a){indent(),print("for ( "),visit(a.left,{noFirstNewLine:!0,noLastSemicolon:!0}),print(" in "),visit(a.right),print(" )"),indent(),print("{"),ns.blockCount++,visit(a.body),ns.blockCount--,indent(),print("}"),print(ns.variables.STMT_SEMICOLON(a,ns,_))},ContinueStatement:function(a){indent(),print("continue"),print(ns.variables.STMT_SEMICOLON(a,ns,_))},Block:function(a){indent(),print("/* "),print(a.value),print(" */")},Line:function(a){indent(),print("// "),print(a.value),indent()}}}(),function(){var a=jsindentator,b=a.visit,c=a.print,d=a.printIndent;jsindentator.styles||(jsindentator.styles={}),a.styles.prettify1||(a.styles.prettify1={});var e={};a.styles.prettify1.config||(a.styles.prettify1.config=e={tag:"b"});var f=function(a){c("<"+e.tag+(a?' class="'+a+'"':"")+">")},g=function(){c("</"+e.tag+">")},h=function(a,b){f(b),c(a),g()};jsindentator.styles.prettify1={VariableDeclaration:function(a,c){f("VariableDeclaration declaration"+(c&&c.noFirstNewLine?" noNewLine":"")),c&&c.noFirstNewLine||d(),h("var","keyword-var keyword");for(var e=0;e<a.declarations.length;e++)b(a.declarations[e]),e<a.declarations.length-1&&h(",","comma operand");c&&c.noLastSemicolon||h(";","semicolon"),g()},VariableDeclarator:function(a){f("VariableDeclarator"),b(a.id),a.init&&(h("=","operand"),b(a.init)),g()},Literal:function(a){h(a.raw,"Literal")},Identifier:function(a){h(a.name,"Identifier")},FunctionExpression:function(c){f("FunctionExpression expression"),h("function","keyword-function keyword"),b(c.id),h("(","paren-left");for(var d=0;d<c.params.length;d++)b(c.params[d]),d<c.params.length-1&&h(",","comma operand");h(")","paren-right"),c.body.body.length>0?(h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right")):(h("{","curly-left"),h("}","curly-right")),g()},BlockStatement:function(a){f("BlockStatement statement");for(var c=0;c<a.body.length;c++)b(a.body[c]);g()},UpdateExpression:function(a){f("UpdateExpression expression"),a.prefix?(h(a.operator,"operator"),b(a.argument)):(b(a.argument),h(a.operator,"operator")),g()},ForStatement:function(c){f("BlockStatement statement"),h("for","keyword keyword-for"),h("(","paren-left"),b(c.init,{noFirstNewLine:!0}),b(c.test),h(";","semicolon"),b(c.update),h(")","paren-right"),h("{","curly-right"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),g()},ArrayExpression:function(a){f("ArrayExpression expression"),h("[","square-left");for(var c=0;c<a.elements.length;c++)b(a.elements[c]),c<a.elements.length-1&&h(",","comma operand");h("]","square-right"),g()},ExpressionStatement:function(a){f("ExpressionStatement statement"),b(a.expression),h(";","semicolon"),g()},CallExpression:function(a){f("CallExpression expression"),"FunctionExpression"===a.callee.type&&h("(","paren-left"),b(a.callee),"FunctionExpression"===a.callee.type&&h(")","paren-right"),h("(","paren-left");for(var c=0;c<a.arguments.length;c++)b(a.arguments[c]),c<a.arguments.length-1&&h(",","comma operand");h(")","paren-right"),g()},BinaryExpression:function(a){f("BinaryExpression expression"),b(a.left),h(a.operator,"operand"),b(a.right),g()},ObjectExpression:function(c){if(f("ObjectExpression expression"),0===c.properties.length)return h("{","curly-left"),h("}","curly-right"),void 0;h("{","curly-left"),a.blockCount++;for(var d=0;d<c.properties.length;d++){var e=c.properties[d];f("ObjectProperty"),b(e.key),h(":","operand colon"),b(e.value),d<c.properties.length-1&&h(",","comma operand"),g()}a.blockCount--,h("}","curly-right"),g()},ReturnStatement:function(a){f("ReturnStatement statement"),h("return","keyword keyword-return"),b(a.argument),h(";","semicolon"),g()},ConditionalExpression:function(a){f("ConditionalExpression expression"),b(a.test),h("?","question operand"),b(a.consequent),h(":","colon operand"),b(a.alternate),g()},SwitchStatement:function(a){f("SwitchStatement statement"),h("switch","keyword keyword-switch"),h("(","paren-left"),b(a.discriminant),h(")","paren-right"),h("{","curly-left");for(var c=0;c<a.cases.length;c++)b(a.cases[c]);h("}","curly-right"),g()},SwitchCase:function(c){f("SwitchCase"),h(null==c.test?"default":"case","keyword case"),b(c.test),h(":","operand colon"),a.blockCount++;for(var d=0;d<c.consequent.length;d++)b(c.consequent[d]);a.blockCount--,g()},EmptyStatement:function(){f("EmptyStatement statement"),h(";","semicolon"),g()},BreakStatement:function(){f("BreakStatement statement"),h("break","keyword keyword-break"),h(";","semicolon"),g()},WhileStatement:function(c){f("WhileStatement statement"),h("while","keyword keyword-while"),h("(","paren-left"),b(c.test),h(")","paren-right"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),h(";","semicolon"),g()},AssignmentExpression:function(a){f("AssignmentExpression expression"),b(a.left),h(a.operator,"operand"),b(a.right),g()},MemberExpression:function(a){f("MemberExpression expression"),b(a.object),h(".","operand dot"),b(a.property),g()},ThisExpression:function(){f("ThisExpression expression"),h("this","keyword keyword-this"),g()},SequenceExpression:function(a){f("SequenceExpression expression"),h("(","paren-left");for(var c=0;c<a.expressions.length;c++)b(a.expressions[c]),c<a.expressions.length-1&&h(",","comma operand");h(")","paren-right"),g()},DoWhileStatement:function(c){f("DoWhileStatement statement"),h("do","keyword keyword-do"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),h("while","keyword keyword-while"),h("(","paren-left"),b(c.test),h(")","paren-right"),h(";","semicolon"),g()},NewExpression:function(a){f("NewExpression expression"),h("new","keyword keyword-new"),b(a.callee),h("(","paren-left");
for(var c=0;c<a.arguments.length;c++)b(a.arguments[c]),c<a.arguments.length-1&&h(",","comma operand");h(")","paren-right"),g()},WithStatement:function(c){f("WithStatement statement"),h("with","keyword keyword-with"),h("(","paren-left"),b(c.object),h(")","paren-right"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),h(";","semicolon"),g()},IfStatement:function(c,d){f("IfStatement statement "+(d&&d.noFirstNewLine?" noNewLine":"")),h("if","keyword keyword-if"),h("(","paren-left"),b(c.test),h(")","paren-right"),h("{","curly-left"),a.blockCount++,b(c.consequent),a.blockCount--,h("}","curly-right"),c.alternate&&(h("else","keyword keyword-else"),null==c.alternate.test&&(h("{","curly-left"),a.blockCount++),b(c.alternate,{noFirstNewLine:!0}),null==c.alternate.test&&(a.blockCount--,h("}","curly-right"))),g()},FunctionDeclaration:function(c){if(f("FunctionDeclaration declaration"),h("function","keyword keyword-function"),b(c.id),h("(","paren-left"),c.params)for(var d=0;d<c.params.length;d++)b(c.params[d]),d<c.params.length-1&&h(",","comma operand");h(")","paren-right"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),g()},UnaryExpression:function(a){f("UnaryExpression expression"),h(a.operator,"operand"),b(a.argument),g()},LogicalExpression:function(a){f("LogicalExpression expression"),b(a.left),h(a.operator,"operand"),b(a.right),g()},TryStatement:function(c){f("TryStatement statement"),h("try","keyword keyword-try"),h("{","curly-left"),a.blockCount++,b(c.block),a.blockCount--,h("}","curly-right");for(var d=0;d<c.handlers.length;d++)b(c.handlers[d]);c.finalizer&&(h("finally","keyword keyword-finally"),h("{","curly-left"),a.blockCount++,b(c.finalizer),a.blockCount--,h("}","curly-right")),h(";","semicolon"),g()},CatchClause:function(c){f("CatchClause"),h("catch","keyword keyword-catch"),h("(","paren-left"),c.param&&b(c.param),h(")","paren-eight"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),g()},ThrowStatement:function(a){f("ThrowStatement statement"),h("throw","keyword keyword-throw"),b(a.argument),h(";","semicolon"),g()},ForInStatement:function(c){f("ForInStatement statement"),h("for","keyword keyword-for"),h("(","paren-left"),b(c.left,{noFirstNewLine:!0,noLastSemicolon:!0}),h("in","keyword keyword-in"),b(c.right),h(")","paren-right"),h("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,h("}","curly-right"),g()},ContinueStatement:function(){f("ContinueStatement statement"),h("continue","keyword keyword-continue"),g()},Block:function(a){f("Block comment"),h("/*","block-comment-start"),f("comment-value"),c(a.value),g(),h("*/","block-comment-end"),g()},Line:function(a){f("Line comment"),h("//","line-comment-prefix"),c(a.value),g()}}}(),function(){var a=jsindentator,b=a.visit,c=a.print;jsindentator.styles||(jsindentator.styles={}),a.styles.prefttify_spaces1||(a.styles.prefttify_spaces1={});var d={};a.styles.prefttify_spaces1.config||(a.styles.prefttify_spaces1.config=d={tag:"b"});var e=function(a){c("<"+d.tag+(a?' class="'+a+'"':"")+">")},f=function(){c("</"+d.tag+">")},g=function(a,b){e(b),c(a),f()},h=function(){g("&nbsp;","space")},i=function(a){for(var b=0;a>b;b++)k()},j=function(b){b||l(),i(a.blockCount)},k=function(){g("&#09;","tab")},l=function(){g("","newline")};jsindentator.styles.prefttify_spaces1={VariableDeclaration:function(a,c){e("VariableDeclaration declaration"+(c&&c.noFirstNewLine?" noNewLine":"")),c&&c.noFirstNewLine||j(),g("var","keyword-var keyword");for(var d=0;d<a.declarations.length;d++)b(a.declarations[d]),d<a.declarations.length-1&&(g(",","comma operand"),h());c&&c.noLastSemicolon||g(";","semicolon"),f()},VariableDeclarator:function(a){e("VariableDeclarator"),b(a.id),a.init&&(h(),g("=","operand"),h(),b(a.init)),f()},Literal:function(a){g(a.raw,"Literal")},Identifier:function(a){g(a.name,"Identifier")},FunctionExpression:function(c){e("FunctionExpression expression"),g("function","keyword-function keyword"),b(c.id),g("(","paren-left");for(var d=0;d<c.params.length;d++)b(c.params[d]),d<c.params.length-1&&g(",","comma operand"),h();g(")","paren-right"),c.body.body.length>0?(g("{","curly-left"),j(!0),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right")):(g("{","curly-left"),g("}","curly-right")),f()},BlockStatement:function(a){e("BlockStatement statement");for(var c=0;c<a.body.length;c++)b(a.body[c]);f()},UpdateExpression:function(a){e("UpdateExpression expression"),a.prefix?(g(a.operator,"operator"),b(a.argument)):(b(a.argument),g(a.operator,"operator")),f()},ForStatement:function(c){e("BlockStatement statement"),j(),g("for","keyword keyword-for"),g("(","paren-left"),b(c.init,{noFirstNewLine:!0}),b(c.test),g(";","semicolon"),b(c.update),g(")","paren-right"),j(),g("{","curly-right"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),f()},ArrayExpression:function(a){e("ArrayExpression expression"),g("[","square-left");for(var c=0;c<a.elements.length;c++)b(a.elements[c]),c<a.elements.length-1&&g(",","comma operand");g("]","square-right"),f()},ExpressionStatement:function(a){e("ExpressionStatement statement"),j(),b(a.expression),g(";","semicolon"),f()},CallExpression:function(a){e("CallExpression expression"),"FunctionExpression"===a.callee.type&&g("(","paren-left"),b(a.callee),"FunctionExpression"===a.callee.type&&g(")","paren-right"),g("(","paren-left");for(var c=0;c<a.arguments.length;c++)b(a.arguments[c]),c<a.arguments.length-1&&(g(",","comma operand"),h());g(")","paren-right"),f()},BinaryExpression:function(a){e("BinaryExpression expression"),b(a.left),h(),g(a.operator,"operand"),h(),b(a.right),f()},ObjectExpression:function(c){if(e("ObjectExpression expression"),0===c.properties.length)return g("{","curly-left"),g("}","curly-right"),void 0;g("{","curly-left"),a.blockCount++,j();for(var d=0;d<c.properties.length;d++){var i=c.properties[d];e("ObjectProperty"),b(i.key),g(":","operand colon"),h(),b(i.value),d<c.properties.length-1&&(g(",","comma operand"),h()),f()}a.blockCount--,j(),g("}","curly-right"),f()},ReturnStatement:function(a){e("ReturnStatement statement"),j(),g("return","keyword keyword-return"),b(a.argument),g(";","semicolon"),f()},ConditionalExpression:function(a){e("ConditionalExpression expression"),b(a.test),g("?","question operand"),b(a.consequent),g(":","colon operand"),b(a.alternate),f()},SwitchStatement:function(a){e("SwitchStatement statement"),j(),g("switch","keyword keyword-switch"),g("(","paren-left"),b(a.discriminant),g(")","paren-right"),j(),g("{","curly-left");for(var c=0;c<a.cases.length;c++)b(a.cases[c]);j(),g("}","curly-right"),f()},SwitchCase:function(c){e("SwitchCase"),j(),g(null==c.test?"default":"case","keyword case"),b(c.test),g(":","operand colon"),a.blockCount++;for(var d=0;d<c.consequent.length;d++)b(c.consequent[d]);a.blockCount--,f()},EmptyStatement:function(){e("EmptyStatement statement"),g(";","semicolon"),f()},BreakStatement:function(){e("BreakStatement statement"),j(),g("break","keyword keyword-break"),g(";","semicolon"),f()},WhileStatement:function(c){j(),e("WhileStatement statement"),g("while","keyword keyword-while"),g("(","paren-left"),b(c.test),g(")","paren-right"),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),g(";","semicolon"),f()},AssignmentExpression:function(a){e("AssignmentExpression expression"),b(a.left),h(),g(a.operator,"operand"),h(),b(a.right),f()},MemberExpression:function(a){e("MemberExpression expression"),b(a.object),g(".","operand dot"),b(a.property),f()},ThisExpression:function(){e("ThisExpression expression"),g("this","keyword keyword-this"),f()},SequenceExpression:function(a){e("SequenceExpression expression"),g("(","paren-left");for(var c=0;c<a.expressions.length;c++)b(a.expressions[c]),c<a.expressions.length-1&&g(",","comma operand"),h();g(")","paren-right"),f()},DoWhileStatement:function(c){j(),e("DoWhileStatement statement"),g("do","keyword keyword-do"),j(),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),j(),g("while","keyword keyword-while"),g("(","paren-left"),b(c.test),g(")","paren-right"),g(";","semicolon"),f()},NewExpression:function(a){e("NewExpression expression"),g("new","keyword keyword-new"),b(a.callee),g("(","paren-left");for(var c=0;c<a.arguments.length;c++)b(a.arguments[c]),c<a.arguments.length-1&&g(",","comma operand"),h();g(")","paren-right"),f()},WithStatement:function(c){e("WithStatement statement"),j(),g("with","keyword keyword-with"),g("(","paren-left"),b(c.object),j(),g(")","paren-right"),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),g(";","semicolon"),j(),f()},IfStatement:function(c,d){e("IfStatement statement "+(d&&d.noFirstNewLine?" noNewLine":"")),d&&d.noFirstNewLine||j(),g("if","keyword keyword-if"),g("(","paren-left"),b(c.test),j(),g(")","paren-right"),g("{","curly-left"),a.blockCount++,b(c.consequent),a.blockCount--,j(),g("}","curly-right"),c.alternate&&(j(),g("else","keyword keyword-else"),null==c.alternate.test&&(j(),g("{","curly-left"),a.blockCount++),b(c.alternate,{noFirstNewLine:!0}),null==c.alternate.test&&(a.blockCount--,j(),g("}","curly-right"))),f()},FunctionDeclaration:function(c){if(e("FunctionDeclaration declaration"),j(),g("function","keyword keyword-function"),b(c.id),g("(","paren-left"),c.params)for(var d=0;d<c.params.length;d++)b(c.params[d]),d<c.params.length-1&&g(",","comma operand"),h();g(")","paren-right"),j(),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),f()},UnaryExpression:function(a){e("UnaryExpression expression"),h(),g(a.operator,"operand"),h(),b(a.argument),f()},LogicalExpression:function(a){e("LogicalExpression expression"),b(a.left),h(),g(a.operator,"operand"),h(),b(a.right),f()},TryStatement:function(c){e("TryStatement statement"),j(),g("try","keyword keyword-try"),j(),g("{","curly-left"),a.blockCount++,b(c.block),a.blockCount--,j(),g("}","curly-right");for(var d=0;d<c.handlers.length;d++)b(c.handlers[d]);c.finalizer&&(j(),g("finally","keyword keyword-finally"),j(),g("{","curly-left"),a.blockCount++,b(c.finalizer),a.blockCount--,j(),g("}","curly-right")),g(";","semicolon"),f()},CatchClause:function(c){e("CatchClause"),j(),g("catch","keyword keyword-catch"),g("(","paren-left"),c.param&&b(c.param),g(")","paren-eight"),j(),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),f()},ThrowStatement:function(a){e("ThrowStatement statement"),j(),g("throw","keyword keyword-throw"),b(a.argument),g(";","semicolon"),f()},ForInStatement:function(c){e("ForInStatement statement"),j(),g("for","keyword keyword-for"),g("(","paren-left"),b(c.left,{noFirstNewLine:!0,noLastSemicolon:!0}),g("in","keyword keyword-in"),b(c.right),g(")","paren-right"),j(),g("{","curly-left"),a.blockCount++,b(c.body),a.blockCount--,j(),g("}","curly-right"),f()},ContinueStatement:function(){e("ContinueStatement statement"),j(),g("continue","keyword keyword-continue"),f()},Block:function(a){e("Block comment"),j(),g("/*","block-comment-start"),e("comment-value"),c(a.value),f(),g("*/","block-comment-end"),j(),f()},Line:function(a){j(),e("Line comment"),g("//","line-comment-prefix"),c(a.value),j(),f()}}}(),function(){var a=jsindentator;a.visit,a.print,a.printIndent,a.styles||(a.styles={}),a.quote="'",a.tab="	",a.newline="\n";var b=function(a){return a.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,"").replace(/\s+/g," ")};jsindentator.styles.jsdocgenerator1={installStyle:function(){this.data=[]},postRender:function(){return this.data.join("\nJSDOC: ")},Block:function(a){var c=b(a.value);0==c.indexOf("/**")&&this.data.push({text:c})}}}();