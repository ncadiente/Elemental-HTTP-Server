var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var server = http.createServer(connection);

function connection(request, response) {
  var method = request.method;
  //console.log(request.buffer);
  console.log(method);
  var url = request.url;
  var body = "";
  var postObj;
  var newDoc;
  if (method === "GET"){
    response.writeHead(200, {
      'Content-Type' : "text/html"
    });
    fs.readFile("." + url, function(err,data){
      if (err) console.log(err);
      response.end(data);
      });
  }
  if (method === "POST"){
    request.on('data', function(chunk){
      postObj = querystring.parse(chunk.toString());
      console.log(postObj);
    });
    fs.readFile('./public/elTemplate.html', function(err,data){
      if(err) console.log(err);
      newDoc = data.toString();
      for (var key in postObj){
        newDoc = newDoc.replace(key, postObj[key]);
        newDoc = newDoc.replace(key, postObj[key]);
      }
    fs.writeFile('./public/elements/' + postObj.elementName + ".html", newDoc, function(err){
      if(err) console.log(err);
    });
     response.end();
    });
  }
}

server.listen({
  host : "localhost",
  port : 8080
}, function(){
  address = server.address();
console.log("opened server address: ", address);
});

