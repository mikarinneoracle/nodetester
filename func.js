var fdk=require('@fnproject/fdk');
var i = 0;

fdk.handle(function(input, ctx){
  var use_sessions = 0;
    
  if (input) {
    use_sessions = input;
  }

  var res = new Object();
  res.i = i++;
  var json = JSON.stringify(res);
  return json; 
});