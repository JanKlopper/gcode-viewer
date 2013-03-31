/**
 * Parses a string of gcode instructions, and invokes handlers for
 * each type of command.
 *
 * Special handler:
 *   'default': Called if no other handler matches.
 */
function GCodeParser(handlers) {
  this.handlers = handlers || {};
  this.vars = {};
}

GCodeParser.prototype.replaceVars = function(output){
  $('#parsedgcode').show();
  for(varname in this.vars){
    output = output.replace('#'+varname,
                            this.vars[varname]);
  }
  return output;
}

GCodeParser.prototype.evalMath = function(input){
  var output = '';
  while(input.indexOf('[') > -1){
    // concat every bit of text outside the brackets to the output
    output = output + input.substr(0, input.indexOf('['));
    var mathPart = input.substring(input.indexOf('[')+1, input.indexOf(']'))
    // remove any non digits / Math operators, eval the result
    output = output + eval(mathPart.replace(/[^\d+\+\*\/-\\.]/g, ''));
    input = input.substr(input.indexOf(']')+1);
  }
  output = output + input;
  return output;
}


GCodeParser.prototype.parseLine = function(text, info) {
  text = text.replace(/;.*$/, '').trim(); // Remove comments
  text = text.replace(/\(.*\)/, ''); // Remove comments
  if (text) {
    if(text[0] == '#'){
        var parts = text.split('=');
        var varname = parts[0].trim().substr(1);
        this.vars[varname] = parseFloat(parts[1].trim(), 10);
    } else {
      if(text.indexOf('#') > -1){
			  text = this.replaceVars(text);
			}

      if(text.indexOf('[') > -1 && text.indexOf(']') > -1){
			  text = this.evalMath(text);
			}

      var tokens = text.split(' ');
      if (tokens) {
        var cmd = tokens[0];
        // see if we need to clean the command, remove extra 0's
        if (cmd.length == 3 && cmd[1] == '0'){
          cmd = cmd[0]+cmd[2];
        }
        var args = {
          'cmd': cmd
        };
        tokens.splice(1).forEach(function(token) {
          var key = token[0].toLowerCase();
          var value = parseFloat(token.substring(1));
          args[key] = value;
        });
        var handler = this.handlers[cmd] || this.handlers['default'];
        if (handler) {
          return handler(args, info);
        }
      }
    }
  }
};

GCodeParser.prototype.parse = function(gcode) {
  var lines = gcode.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (this.parseLine(lines[i], i) === false) {
      break;
    }
  }
};
