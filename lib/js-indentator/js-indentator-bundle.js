// this file contains sprima and all js-indentator utilities







// jsindentator.js

// in this code node name means javascript language ast nodes like expression, declaration, statement, etc, not DOM or xml nodes!
//var GLOBALOBJECT=this; //must be outside any function

jsindentator={}; //global
var ns = jsindentator;

/**
This is not really a class but a static object that comply with this description.
Alias in code: ns
@class jsindentator
*/
_.extend(ns, {
    
    /**
    current block indentation counter. Can be useful for indenting blocks
    @property blockCount
    */
    blockCount: 0  
    /**
    @method print
    */
,   print: function(str) {
        ns.buffer.push(str); 
    }
,   _printIndent: function(num) {
        for(var i = 0; i<num; i++) {
            ns.print(ns.tab); 
        }
    }
    /**
    @method printIndent
    */
,   printIndent: function(nonl) {
        if(!nonl)
            ns.buffer.push(ns.newline); 
        ns._printIndent(ns.blockCount); 
    }

    /**
    @property {Object} styles
    */
,   styles: {}

,   originalCode: function(node) {
        if(!node.range)
            return ''; 
        if(node.range.length==1)
            return ns.code.substring(node.range[0], node.range[0+1]); 
        else
            return ns.code.substring(node.range[0], node.range[1]); 
    }
,   buffer: []
,   reset: function(){
        ns.nodeIdCounter=0;
    }
,   setStyle: function(style) {
        this.reset();
        ns.visitors=style; 
        if(style.installStyle && _.isFunction(style.installStyle)) {
            style.installStyle();
        }
    }

    /**
    @method main
    @param code {String}
    @param config {Object} optional
    @return {Any} the result of performing the source code transformation accordin g to the urrent visitor. 
    */
,   main: function (code, config) { 
        if(config && !ns.visitors.setStyleConfig) {
            _.extend(ns, config); 
        }
        else if(config && ns.visitors.setStyleConfig) {
            ns.visitors.setStyleConfig(config); 
        }
        
        ns.code = code;
        
        var syntax = null;
        try {
            syntax = esprima.parse(code, {
                raw: true                       
            ,   range: true
            ,   comment: true
//              ,   tokens: true
//              ,   loc : true
                }               
            );
        }
        catch(ex){
            return ex;
        }
        ns.syntax = syntax; 

        // ns.visitors.preproccess && ns.visitors.preproccess();

        ns.buffer = [];
        _(syntax.body).each(function(node){
            ns.visit(node); 
        }); 
        
        //postRender
        ns.buffer = ( ns.visitors.postRender && ns.visitors.postRender() ) || ns.buffer;
        
        return ns.buffer.join('');  
    }


/* 

this is the public visit() method which all the visitors will call for sub concept instances, 
like for example the FunctionExpression will call for render its parameter expression and its body
 statements. the visit method will delegate to registered visitor for the given type of by default, 
 if no visitor is registered for that concept it will just dump the original code. */ 

,   visit: function(node, config, parentNode, parentPropertyName) {
        if(!node)
        {
            return; 
        }    
        //do the visiting
        var visitor = ns.visitors[node.type]; 
        if (visitor) 
        {
            ns._checkComments(node);
            if (parentNode)
            {
                node.parentNode=parentNode;
            }
            visitor.apply(ns.visitors, [node, config]); 
            if(ns.visitors.visit) 
            {
                ns.visitors.visit.apply(this, [node, config, parentNode, parentPropertyName]); 
            }
        }
        else 
        {
            var origCode = ns.originalCode(node);
            console.log("WARNING - Language concept not supported ", node, origCode); 
            ns.buffer.push(origCode);
        }
    }

// in esprima there are no comment nodes, just comment meta information so we need to build 
// the comments by our self. TODO: make this work OK. 
,   _checkComments: function(node) {

        var previousNodeRange = ns._comments_currentNodeRange || [0,0]; 
        ns._comments_currentNodeRange=node.range || [0,0]; 
        for ( var i = 0; i < ns.syntax.comments.length; i++) //TODO: do it efficient- save previsou comment node.
        { 
            var c = ns.syntax.comments[i]; 
            // console.log('COMPARING', c.range, previousNodeRange, ns._comments_currentNodeRange); 
            if(c.range[0] >= previousNodeRange[1] && c.range[1] <= ns._comments_currentNodeRange[0]) 
            {
                ns.visit(c); 
                break; 
            }
        }
    }
    
,   logMessages: []
,   log: function(msg) {
        logMessages.push(msg); 
    }
,   setConfig: function(config) {
        _.extend(ns, config); 
    }
});

/**
instantiable jsindentator - this will only work if the indentator impl's main is synchronous
@class JsIndentator
*/
ns.JsIndentator = function() {      
}; 
/**
@method setStyle
*/
ns.JsIndentator.prototype.setStyle = function(style){
    ns.setStyle(style); 
}; 
/**
@method main
*/
ns.JsIndentator.prototype.main = function(code, config){
    this.inputCode=code;
    this.code = ns.main(code, config); 
    this.buffer=ns.buffer;
    this.syntax=ns.syntax; 
    return this.code;
};

/**
User must provide a JsVisitor implementation instance that can be or extend one of the ones in src/styles implementation examples. 
That instance must implement this class, JsVisitor. Reference JsVisitor implementation is styles/style_clean.js and can be extended
@class JsVisitor
*/
/**
@method setStyle
*/
/**
@method visit
*/




















// style_clean.jsindentator

// This implementation is the official one for extending user visirot implementation, see style_springly_extractor. It collect
// all supported aditional meta information defined in jsindentator.js like parentNode, parentPropertyName
// in this code node name means javascript language ast nodes like expression, declaration, statement, etc, not DOM or xml nodes!
// style clean can be used for those concrete data generation tools only for make sure every ast node is iterated. 
// It also support the config.saveParents config prop for saving the parent node
// TODO: only single line code supported !
(function() {
var ns = jsindentator, print=ns.print; 
if(!jsindentator.styles)jsindentator.styles={};
var visit=ns.visit;
//var visit=function(child, config, parent) {
//  config=config||{};
//  config.parentNode=parent?parent:null;       
//  ns.visit(child, config)
//}
jsindentator.styles.clean = {
    
    "VariableDeclaration" : function(node, config) {
        print('var '); 
        for ( var i = 0; i < node.declarations.length; i++) {
            visit(node.declarations[i], {}, node, 'declarations'); 
            if(i< node.declarations.length-1)
                print(',');
        }
        if(!config || !config.noLastSemicolon) 
            print(';'); 
    }

,   "VariableDeclarator" : function(node, config) {
//      ns.print(node.id.name);
        visit(node.id, {}, node, 'id');
        if(node.init) {
            print("="); 
            visit(node.init, {}, node, 'init');
        }
    }
    
    

,   "Literal" : function(node) {
        print(node.raw); 
    }
,   "Identifier": function(node) {
        print(node.name || ''); 
    }
,   "FunctionExpression": function(node) {
        print('function ');
        visit(node.id, {}, node, 'id');
        print('('); 
        for( var i = 0; i < node.params.length; i++) {
            visit(node.params[i], {}, node, 'params_'+i); 
            if(i < node.params.length-1)
                print(',');                 
        }
        print('){');
        ns.blockCount++;
        visit(node.body, {}, node, 'body'); 
        ns.blockCount--;
        print('}'); 
    }
,   "BlockStatement": function(node) {  
        for ( var i = 0; i < node.body.length; i++) {
            visit(node.body[i], {}, node, 'body_'+i);
        }
    }
,   "UpdateExpression": function(node) {                  
        if(node.prefix) {
            print(node.operator);
            visit(node.argument, {}, node, 'prefix'); 
        }
        else {
            visit(node.argument, {}, node, 'argument'); 
            print(node.operator);
        }
    }
    
,   "ForStatement": function(node) {
        print('for('); 
        visit(node.init, {noFirstNewLine: true}, node, 'init');
//              print('; '); 
        visit(node.test, {}, node, 'test');
        print(';');
        visit(node.update, {}, node, 'update');
        print('){'); 
//              ns.printIndent(); 
        ns.blockCount++;
        visit(node.body, {}, node, 'body');
        ns.blockCount--;
//      ns.printIndent(); 
        print('};'); 
    }
,   "ArrayExpression": function(node) { 
        print('['); 
        for ( var i = 0; i < node.elements.length; i++) {
            visit(node.elements[i], {}, node);
            if(i < node.elements.length-1)
                print(',');
        }
        print(']'); 
    }

,   "ExpressionStatement": function(node) {
        visit(node.expression, {}, node);
        print(';'); 
    }
,   "CallExpression": function(node) {  
        if(node.callee.type==="FunctionExpression"){print('(');ns.blockCount++;}//hack - parenthesis around functions
        visit(node.callee, {}, node)
        if(node.callee.type==="FunctionExpression"){print(')');ns.blockCount--;}//hack - parenthesis around functions
        print('('); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i], {}, node);
            if(i < node.arguments.length-1)
                print(',');
        }
        print(')'); 
    }
,   "BinaryExpression": function(node) {
        visit(node.left, {}, node); 
        print(node.operator==='in'?' in ':node.operator); 
        visit(node.right, {}, node); 
    }

,   "ObjectExpression": function(node) {
        print('{'); 
        ns.blockCount++;
        for ( var i = 0; i < node.properties.length; i++) {
            var p = node.properties[i];
            
            visit(p.key, {}, node); //Identifier
            print(':'); 
            visit(p.value, {}, node); //*Expression
            if(i < node.properties.length-1) {
                print(','); 
            }
        }
        ns.blockCount--;
        print('}'); 
    }
,   "ReturnStatement": function(node) {
        print('return '); 
        visit(node.argument, {}, node); 
        print(';'); 
    }

,   "ConditionalExpression": function(node) {
        visit(node.test, {}, node); 
        print('?'); 
        visit(node.consequent, {}, node);
        print(':'); 
        visit(node.alternate, {}, node);
    }
,   "EmptyStatement": function(node) {
        print(';'); 
    }

,   "SwitchStatement": function(node) {
        print('switch(');
        visit(node.discriminant, {}, node); 
        print('){');
        for(var i = 0; i < node.cases.length; i++) {
            visit(node.cases[i], {}, node); 
        }
        print('}'); 
    }
,   "SwitchCase": function(node) {
        print(node.test==null ? 'default' : 'case ');
        visit(node.test, {}, node); 
        print(':'); 
        for(var i = 0; i < node.consequent.length; i++) {           
            visit(node.consequent[i], {}, node); 
        }
    }
,   "BreakStatement": function(node) {
        print('break;');
    }

,   "WhileStatement": function(node) {
        print('while(');
        visit(node.test, {}, node); 
        print('){');
        ns.blockCount++;
        visit(node.body, {}, node);
        ns.blockCount--;
        print('}'); 
    }
,   "AssignmentExpression": function(node) {
        visit(node.left, {}, node);
        print(node.operator); 
        visit(node.right, {}, node); 
    }
,   "MemberExpression": function(node) {
        visit(node.object, {}, node);
        print('.'); 
        visit(node.property, {}, node); 
    }

,   "ThisExpression": function(node) {
        print('this');  
    }

,   "SequenceExpression": function(node) {
        print('(');   
        for ( var i = 0; i < node.expressions.length; i++) {
            visit(node.expressions[i], {}, node);
            if(i < node.expressions.length-1)
                print(',');
        }
        print(')');
    }
,   "DoWhileStatement": function(node) {
        print('do{');
        visit(node.body, {}, node);
        print("}while(");
        visit(node.test, {}, node);
        print(');');
    }

,   "NewExpression": function(node) {
        print('new '); 
        visit(node.callee, {}, node); 
        print('('); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i], {}, node);
            if(i < node.arguments.length-1)
                print(',');
        }
        print(')'); 
    }
,   "WithStatement": function(node) {
        print('with('); 
        visit(node.object, {}, node); 
        print(')'); 
        print('{')
        ns.blockCount++;
        visit(node.body, {}, node);
        ns.blockCount--;
        print('};');
    }

,   "IfStatement": function(node, config) {
        print('if('); 
        visit(node.test, {}, node); 
        print(')');         
        print('{');
        ns.blockCount++;
        visit(node.consequent, {}, node);
        ns.blockCount--;
        if(node.alternate) {
            print('}else ');//TODO: this space can be better minified
            if(node.alternate.test==null) {
                print('{');
                ns.blockCount++;    
                visit(node.alternate, {noFirstNewLine: true}, node);
                ns.blockCount--;
                print('}');
            }
            else
                visit(node.alternate, {noFirstNewLine: true}, node);
        }
    }

,   "FunctionDeclaration": function(node, config) {
        print('function');
        if(node.id) {
            print(' ');
            visit(node.id, {}, node); 
        } 
        print('('); 
        if(node.params) for ( var i = 0; i < node.params.length; i++) {
            visit(node.params[i], {}, node); 
            if(i< node.params.length-1)
                print(',');          
        }
        print('){');
        ns.blockCount++;
        visit(node.body, {}, node); 
        ns.blockCount--;
        print('}');
    }
,   "UnaryExpression": function(node) {
        print(node.operator);
        visit(node.argument, {}, node); 
    }
,   "LogicalExpression": function(node) {
        visit(node.left, {}, node); 
        print(node.operator); 
        visit(node.right, {}, node); 
    }
,   "TryStatement": function(node) {
        print('try{');
        ns.blockCount++;
        visit(node.block, {}, node); 
        ns.blockCount--;
        print('}');
        for ( var i = 0; i < node.handlers.length; i++) {
            visit(node.handlers[i], {}, node); 
        }
        if(node.finalizer) {
            print('finally'); 
            print('{');
            ns.blockCount++;
            visit(node.finalizer, {}, node); 
            ns.blockCount--;
            print('}');
        }
    }
,   "CatchClause": function(node) {
        print('catch('); 
        if(node.params) for ( var i = 0; i < node.params.length; i++) {
            visit(node.params[i], {}, node); 
            if(i< node.params.length-1)
                print(',');          
        }
        print('){');
        ns.blockCount++;
        visit(node.body, {}, node); 
        ns.blockCount--;
        print('}');
    }
,   "ThrowStatement": function(node) {
        print('throw '); 
        visit(node.argument, {}, node);
        print(';')
    }

,   "ForInStatement": function(node) {
        print("for("); 
        visit(node.left, {noFirstNewLine: true, noLastSemicolon: true}, node);  
        print(' in '); 
        visit(node.right, {}, node); 
        print(')')      
        print('{');
        ns.blockCount++;
        visit(node.body, {}, node); 
        ns.blockCount--;
        print('}');
    }
,   "ContinueStatement": function(node){
        print('continue;'); 
    }

,   "Block": function(node) {/* support for block comments like this one*/
    }
,   "Line": function(node) {//support for line comments like this one
    }
}
})();


















// style2

// another style, this one more common, less space for brakets. 
(function() {
var ns = jsindentator, visit=ns.visit, print=ns.print, indent=ns.printIndent;
//add some config props
ns.quote = '\''; 
ns.tab = '\t';
ns.newline = '\n';
if(!jsindentator.styles)jsindentator.styles={};
jsindentator.styles.style2 = {
    
    "VariableDeclaration" : function(node, config) {
        if(!config || !config.noFirstNewLine) //var decls in for stmts
            indent(); 
        print('var '); 
        for ( var i = 0; i < node.declarations.length; i++) {
            visit(node.declarations[i]); 
            if(i< node.declarations.length-1) {
                print(', '); 
                indent();
                print(ns.tab); 
            }    
        }
        if(!config || !config.noLastSemicolon) 
            print('; '); 
    }

,   "VariableDeclarator" : function(node) {
//      ns.print(node.id.name);
        visit(node.id);
        if(node.init) {
            print(" = "); 
            visit(node.init);
        }
    }

,   "Literal" : function(node) {
        if(node.raw.indexOf('"')===0||node.raw.indexOf('\'')===0) {
            //we do not force to configured string quotes because changing it can invalidate the output js but we warned it.
            //print(ns.quote+node.value+ns.quote); 
            print(node.raw);
//          ns.log('String literal with incorrect quotes. Position: '+ns.printNodePosition(node)+' - value: '+node.raw+); 
        }
        else {
            print(node.raw);
        }
    }
,   "Identifier": function(node) {
        print(node.name || ''); 
    }
,   "FunctionExpression": function(node) {
        print('function ');
        visit(node.id);
        print(' ( '); 
        for( var i = 0; i < node.params.length; i++) {
            visit(node.params[i]); 
            if(i < node.params.length-1)
                print(', ');                    
        }
        print(' ) ');
        if(node.body.body.length>0) {
//          indent();
            print('{')
            ns.blockCount++;    
            visit(node.body); 
            ns.blockCount--;
            indent();
            print('}')
        }
        else {
            print('{}');  
        }
            
    }
,   "BlockStatement": function(node) {  
        for ( var i = 0; i < node.body.length; i++) {
            visit(node.body[i]);
        }
    }
,   "UpdateExpression": function(node) {                  
        if(node.prefix) {
            print(node.operator);
            visit(node.argument); 
        }
        else {
            visit(node.argument); 
            print(node.operator);
        }
    }
,   "ForStatement": function(node) {
        indent(); 
        print('for ( '); 
        visit(node.init, {noFirstNewLine: true});
        visit(node.test);
        print('; ');
        visit(node.update);
        print(' ) ');
//      indent();
        print('{'); 
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent(); 
        print('}'); 
    }
,   "ArrayExpression": function(node) { 
        print('['); 
        for ( var i = 0; i < node.elements.length; i++) {
            visit(node.elements[i]);
            if(i < node.elements.length-1)
                print(', ');
        }
        print(']'); 
    }

,   "ExpressionStatement": function(node) {
        indent(); 
        visit(node.expression);
        print(';'); 
    }
,   "CallExpression": function(node) {
        if(node.callee.type==="FunctionExpression"){//hack - parenthesis around functions
            print('(');     
        }
        visit(node.callee); 
        if(node.callee.type==="FunctionExpression"){//hack - parenthesis around functions
            print(')');
        }
    
        print(' ( '); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i]);
            if(i < node.arguments.length-1)
                print(', ');
        }
        print(' ) '); 
    }
,   "BinaryExpression": function(node) {
        visit(node.left); 
        print(' '+node.operator+' '); 
        visit(node.right); 
    }

,   "ObjectExpression": function(node) {
        if(node.properties.length===0) {
            print('{}'); 
            return; 
        }
        print('{'); 
        ns.blockCount++;
        indent();
        for ( var i = 0; i < node.properties.length; i++) {
            var p = node.properties[i];         
            visit(p.key); 
            print(': '); 
            visit(p.value);
            if(i < node.properties.length-1) {
//              ns.print(ns.newline); 
//              ns._printIndent(ns.blockCount-1);
                print(', ');
                indent();
            }
        }
        ns.blockCount--;
        indent();
        print('}'); 
    }
,   "ReturnStatement": function(node) {
        indent();   
        print('return '); 
        visit(node.argument); 
        print(';'); 
    }
,   "ConditionalExpression": function(node) {
        visit(node.test); 
        print(' ? '); 
        visit(node.consequent);
        print(' : '); 
        visit(node.alternate);
    }

,   "SwitchStatement": function(node) {
        indent();
        print('switch (');
        visit(node.discriminant); 
        print(')');
//      indent();
         print(' {'); 
        for(var i = 0; i < node.cases.length; i++) {
            visit(node.cases[i]); 
        }

        indent();
        print('}'); 
    }
,   "SwitchCase": function(node) {
        indent();
        print(node.test==null ? 'default' : 'case ');
        visit(node.test); 
        print(':');
        ns.blockCount++;
        
        for(var i = 0; i < node.consequent.length; i++) {   
            visit(node.consequent[i]); 
        }
        ns.blockCount--;
    }
,   "EmptyStatement": function(node) {
        print(';'); 
    }
,   "BreakStatement": function(node) {
        indent(); 
        print('break;');
    }

,   "WhileStatement": function(node) {
        indent(); 
        print('while ( ');
        visit(node.test); 
        print(' ) ');
//      indent();
        print('{'); 
        
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        
        indent();
        print('}'); 
    }
,   "AssignmentExpression": function(node) {
        visit(node.left);
        print(' '+node.operator+' '); 
        visit(node.right); 
    }
,   "MemberExpression": function(node) {
        visit(node.object);
        print('.'); 
        visit(node.property); 
    }

,   "ThisExpression": function(node) {
        print('this');  
    }

,   "SequenceExpression": function(node) {
        print('( ');   
        for ( var i = 0; i < node.expressions.length; i++) {
            visit(node.expressions[i]);
            if(i < node.expressions.length-1)
                print(', ');
        }
        print(' )');
    }
,   "DoWhileStatement": function(node) {
        indent();
        print('do');
        
//      indent();
        print('{')
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent();
        print('} ');    
//      indent();
        
        print('while ( ');
        visit(node.test);
        print(' );');
    }
,   "NewExpression": function(node) {
        print('new '); 
        visit(node.callee); 
        print('('); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i]);
            if(i < node.arguments.length-1)
                print(', ');
        }
        print(')'); 
    }
,   "WithStatement": function(node) {
        indent();
        print('with ( '); 
        visit(node.object); 
        print(' )'); 
//      indent();
        print(' {')
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent();
        print('};');    
        indent();
    }
,   "IfStatement": function(node, config) {
        if(!config || !config.noFirstNewLine)
            indent(); 
        print('if ( '); 
        visit(node.test); 
        print(' )'); 
//      indent();
        
        print(' { ');
        ns.blockCount++;
        visit(node.consequent);
        ns.blockCount--;
        indent();
        print('}');

        if(node.alternate) {
            indent();
            print('else ');
            if(node.alternate.test==null) {
//              indent();
                print(' {');
                ns.blockCount++;
            }
            visit(node.alternate, {noFirstNewLine: true});
            if(node.alternate.test==null) {
                ns.blockCount--;
                indent();
                print('}');
            }
        }
    }

,   "FunctionDeclaration": function(node, config) {
        indent(); 
        print('function ');
        visit(node.id); 
        print(' ( '); 
        if(node.params) for ( var i = 0; i < node.params.length; i++) {
            visit(node.params[i]); 
            if(i< node.params.length-1)
                print(', ');         
        }
        print(' ) '); 
//      indent();
        print('{');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "UnaryExpression": function(node) {
        print(node.operator+" ");
        visit(node.argument); 
    }
,   "LogicalExpression": function(node) {
        visit(node.left); 
        print(' '+node.operator+' '); 
        visit(node.right); 
    }

,   "TryStatement": function(node) {
        indent();
        print('try');
//      indent();
        print(' {');
        ns.blockCount++;
        visit(node.block); 
        ns.blockCount--;
        indent();
        print('}');
        for ( var i = 0; i < node.handlers.length; i++) {
            visit(node.handlers[i]); 
        }
        if(node.finalizer) {
            indent();
            print('finally'); 
//          indent();
            print(' {');
            ns.blockCount++;
            visit(node.finalizer); 
            ns.blockCount--;
            indent();
            print('}');
        }
    }
,   "CatchClause": function(node) {
//      console.log(node); 
        indent();
        print('catch ( '); 
        node.param && visit(node.param); 
//      if(node.params) for ( var i = 0; i < node.params.length; i++) {
//          visit(node.params[i]); 
//          if(i< node.params.length-1)
//              print(', ');         
//      }
        print(' )');
//      indent();
        print(' {');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "ThrowStatement": function(node) {
        indent();
        print('throw '); 
        visit(node.argument);
        print(';')
    }
,   "ForInStatement": function(node) {
        indent();
        print("for ( "); 
        visit(node.left, {noFirstNewLine: true, noLastSemicolon: true});    
        print(' in '); 
        visit(node.right); 
        print(' )')
        
//      indent();
        print(' {');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "ContinueStatement": function(node){
        indent();
        print('continue;'); 
    }

,   "Block": function(node) {/* support for block comments like this one*/
        indent();
        print('/* '); 
        print(node.value); 
        print(' */'); 
//      indent(); 
    }
,   "Line": function(node) {//support for line comments like this one
        indent(); 
        print('// '); 
        print(node.value); 
        indent(); 
    }

}   
})();









//style 1



// in this code node name means javascript language ast nodes like expression, declaration, statement, etc, not DOM or xml nodes!
// rules for indentation: 1) who call visit(anIndentedBlock) is responsible of incrementing and decrementing the indentation counter. 2) statements are responsible of indenting before and printing a last ';'
(function() {

//  var _ = null, jsindentator=null; 
//  if(typeof window === 'undefined'){ //in node
//      _ = require('underscore');  
//      jsindentator = require()
//  }
//  else {
//      _=window._;
//  }
    
var ns = jsindentator, visit=ns.visit, print=ns.print, indent=ns.printIndent; 
if(!ns.styles) ns.styles={}; 

//if(!jsindentator.styles.style) jsindentator.styles.style1={};

//add some config props
ns.quote = '\''; 
ns.tab = '\t';
ns.newline = '\n';

 
jsindentator.styles.style1 = {
//  'StyleName': 'style1'
        
    installStyle: function() {
    }
    
,   "VariableDeclaration" : function(node, config) {
        if(!config || !config.noFirstNewLine) //var decls in for stmts
            indent(); 
        print('var '); 
        for ( var i = 0; i < node.declarations.length; i++) {
            visit(node.declarations[i]); 
            if(i< node.declarations.length-1) {
                if(!config || !config.noFirstNewLine) {
                    indent(); 
                    print(','+ns.tab);  
                }
                else {
                    print(', '); 
                }
            }    
        }
        if(!config || !config.noLastSemicolon) 
            print('; '); 
    }

,   "VariableDeclarator" : function(node) {
//      ns.print(node.id.name);
        visit(node.id);
        if(node.init) {
            print(" = "); 
            visit(node.init);
        }
    }

,   "Literal" : function(node) {
        if(node.raw.indexOf('"')===0||node.raw.indexOf('\'')===0) {
            //we do not force to configured string quotes because changing it can invalidate the output js but we warned it.
            //print(ns.quote+node.value+ns.quote); 
            print(node.raw);
    //      ns.log('String literal with incorrect quotes. Position: '+ns.printNodePosition(node)+' - value: '+node.raw+); 
        }
        else {
            print(node.raw);
        }
    }
,   "Identifier": function(node) {
        print(node.name || ''); 
    }
,   "FunctionExpression": function(node) {
        print('function ');
        visit(node.id);
        print(' ( '); 
        for( var i = 0; i < node.params.length; i++) {
            visit(node.params[i]); 
            if(i < node.params.length-1)
                print(', ');                    
        }
        print(' ) ');
        if(node.body.body.length>0) {
            indent();
            print('{')
            ns.blockCount++;    
            visit(node.body); 
            ns.blockCount--;
            indent();
            print('}')
        }
        else {
            print('{}');  
        }
            
    }
,   "BlockStatement": function(node) {  
        for ( var i = 0; i < node.body.length; i++) {
            visit(node.body[i]);
        }
    }
,   "UpdateExpression": function(node) {                  
        if(node.prefix) {
            print(node.operator);
            visit(node.argument); 
        }
        else {
            visit(node.argument); 
            print(node.operator);
        }
    }
,   "ForStatement": function(node) {
        indent(); 
        print('for('); 
        visit(node.init, {noFirstNewLine: true});
        visit(node.test);
        print('; ');
        visit(node.update);
        print(')');
        indent();
        print('{'); 
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent(); 
        print('}'); 
    }
,   "ArrayExpression": function(node) { 
        print('['); 
        for ( var i = 0; i < node.elements.length; i++) {
            visit(node.elements[i]);
            if(i < node.elements.length-1)
                print(', ');
        }
        print(']'); 
    }

,   "ExpressionStatement": function(node) {
        indent(); 
        visit(node.expression);
        print(';'); 
    }
,   "CallExpression": function(node) {
        if(node.callee.type==="FunctionExpression"){//hack - parenthesis around functions
            print('(');     
        }
        visit(node.callee); 
        if(node.callee.type==="FunctionExpression"){//hack - parenthesis around functions
            print(')');
        }
    
        print(' ( '); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i]);
            if(i < node.arguments.length-1)
                print(', ');
        }
        print(' ) '); 
    }
,   "BinaryExpression": function(node) {
        visit(node.left); 
        print(' '+node.operator+' '); 
        visit(node.right); 
    }

,   "ObjectExpression": function(node) {
        if(node.properties.length===0) {
            print('{}'); 
            return; 
        }
        print('{'); 
        ns.blockCount++;
        indent();
        for ( var i = 0; i < node.properties.length; i++) {
            var p = node.properties[i];         
            visit(p.key); 
            print(': '); 
            visit(p.value);
            if(i < node.properties.length-1) {
                ns.print(ns.newline); 
                ns._printIndent(ns.blockCount-1);
                print(','+ns.tab); 
            }
        }
        ns.blockCount--;
        indent();
        print('}'); 
    }
,   "ReturnStatement": function(node) {
        indent();   
        print('return '); 
        visit(node.argument); 
        print(';'); 
    }
,   "ConditionalExpression": function(node) {
        visit(node.test); 
        print(' ? '); 
        visit(node.consequent);
        print(' : '); 
        visit(node.alternate);
    }

,   "SwitchStatement": function(node) {
        indent();
        print('switch (');
        visit(node.discriminant); 
        print(')');
        indent();
         print('{'); 
        for(var i = 0; i < node.cases.length; i++) {
            visit(node.cases[i]); 
        }

        indent();
        print('}'); 
    }
,   "SwitchCase": function(node) {
        indent();
        print(node.test==null ? 'default' : 'case ');
        visit(node.test); 
        print(':');
        ns.blockCount++;
        
        for(var i = 0; i < node.consequent.length; i++) {   
            visit(node.consequent[i]); 
        }
        ns.blockCount--;
    }
,   "EmptyStatement": function(node) {
        print(';'); 
    }
,   "BreakStatement": function(node) {
        indent(); 
        print('break;');
    }

,   "WhileStatement": function(node) {
        indent(); 
        print('while ( ');
        visit(node.test); 
        print(' ) ');
        indent();
        print('{'); 
        
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        
        indent();
        print('}'); 
    }
,   "AssignmentExpression": function(node) {
        visit(node.left);
        print(' '+node.operator+' '); 
        visit(node.right); 
    }
,   "MemberExpression": function(node) {
        visit(node.object);
        print('.'); 
        visit(node.property); 
    }

,   "ThisExpression": function(node) {
        print('this');  
    }

,   "SequenceExpression": function(node) {
        print('( ');   
        for ( var i = 0; i < node.expressions.length; i++) {
            visit(node.expressions[i]);
            if(i < node.expressions.length-1)
                print(', ');
        }
        print(' )');
    }
,   "DoWhileStatement": function(node) {
        indent();
        print('do');
        
        indent();
        print('{')
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent();
        print('}'); 
        indent();
        
        print('while ( ');
        visit(node.test);
        print(' );');
    }
,   "NewExpression": function(node) {
        print('new '); 
        visit(node.callee); 
        print('('); 
        for ( var i = 0; i < node.arguments.length; i++) {
            visit(node.arguments[i]);
            if(i < node.arguments.length-1)
                print(', ');
        }
        print(')'); 
    }
,   "WithStatement": function(node) {
        indent();
        print('with ( '); 
        visit(node.object); 
        print(' )'); 
        indent();
        print('{')
        ns.blockCount++;
        visit(node.body);
        ns.blockCount--;
        indent();
        print('};');    
        indent();
    }

,   "IfStatement": function(node, config) {
        if(!config || !config.noFirstNewLine)
            indent(); 
        print('if ( '); 
        visit(node.test); 
        print(' )'); 
        indent();
        
        print('{');
        ns.blockCount++;
        visit(node.consequent);
        ns.blockCount--;
        indent();
        print('}');

        if(node.alternate) {
            indent();
            print('else ');
            if(node.alternate.test==null) {
                indent();
                print('{');
                ns.blockCount++;
            }
            visit(node.alternate, {noFirstNewLine: true});
            if(node.alternate.test==null) {
                ns.blockCount--;
                indent();
                print('}');
            }
        }
    }

,   "FunctionDeclaration": function(node, config) {
        indent(); 
        print('function ');
        visit(node.id); 
        print(' ( '); 
        if(node.params) for ( var i = 0; i < node.params.length; i++) {
            visit(node.params[i]); 
            if(i< node.params.length-1)
                print(', ');         
        }
        print(' ) '); 
        indent();
        print('{');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "UnaryExpression": function(node) {
        print(node.operator+" ");
        visit(node.argument); 
    }
,   "LogicalExpression": function(node) {
        visit(node.left); 
        print(' '+node.operator+' '); 
        visit(node.right); 
    }

,   "TryStatement": function(node) {
        indent();
        print('try');
        indent();
        print('{');
        ns.blockCount++;
        visit(node.block); 
        ns.blockCount--;
        indent();
        print('}');
        for ( var i = 0; i < node.handlers.length; i++) {
            visit(node.handlers[i]); 
        }
        if(node.finalizer) {
            indent();
            print('finally'); 
            indent();
            print('{');
            ns.blockCount++;
            visit(node.finalizer); 
            ns.blockCount--;
            indent();
            print('}');
        }
    }
,   "CatchClause": function(node) {
//      console.log(node); 
        indent();
        print('catch ( '); 
        node.param && visit(node.param); 
//      if(node.params) for ( var i = 0; i < node.params.length; i++) {
//          visit(node.params[i]); 
//          if(i< node.params.length-1)
//              print(', ');         
//      }
        print(' ) ');
        indent();
        print('{');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "ThrowStatement": function(node) {
        indent();
        print('throw '); 
        visit(node.argument);
        print(';')
    }
,   "ForInStatement": function(node) {
        indent();
        print("for ( "); 
        visit(node.left, {noFirstNewLine: true, noLastSemicolon: true});    
        print(' in '); 
        visit(node.right); 
        print(' )')
        
        indent();
        print('{');
        ns.blockCount++;
        visit(node.body); 
        ns.blockCount--;
        indent();
        print('}');
    }
,   "ContinueStatement": function(node){
        indent();
        print('continue;'); 
    }

    
,   "Block": function(node) {/* support for block comments like this one*/
        indent();
        print('/* '); 
        print(node.value); 
        print(' */'); 
//      indent(); 
    }
,   "Line": function(node) {//support for line comments like this one
        indent(); 
        print('// '); 
        print(node.value); 
        indent(); 
    }

}; 
})();


