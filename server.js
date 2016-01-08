var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var server = http.createServer(connection);

function connection(request, response) {
  var method = request.method;
  console.log(method);
  var url = request.url.split('.');
  var fileType = url[1];
  url = url.join('.');
  console.log(url);
  console.log(fileType);
  var body = "";
  var postObj;
  var newDoc;
  if (method === "GET" && url !== "/index.html"){
    response.writeHead(200, {
      'Content-Type' : "text/" + fileType
    });
    fs.readFile("./public" + url, function(err,data){
      if (err) console.log(err);
      response.end(data);
      });
  }
  if (method === "GET" && url === "/index.html"){
    response.writeHead(200, {
      'Content-Type' : "text/" + fileType
    });
    fs.readFile("./public/indexTemplate.html", function(err,data){
      if (err) console.log(err);
      fs.readdir('./public', function(err, files){
        if (err) console.log(err);
        var toIgnore = ['.keep', 'index.html', 'indexTemplate.html', 'elTemplate.html', 'css'];
        var elementFiles = files.filter(function(file){
            return toIgnore.indexOf(file) === -1;
          });
        var index = data.toString();
        index = index.replace('elementTotal', elementFiles.length);
        index = index.split("splitHere");
        var links = "";
        for(var k = 0; k < elementFiles.length; k++) {
          var name = elementFiles[k].split('.')[0];
          //elementFiles[k].join('.');
          links += "<li>\n\t<a href=\'./" + elementFiles[k] + "\'>" + name + "</a>\n</li>\n";
        }
        index = index[0] + links + index[1];
        fs.writeFile('./public/index.html', index, function(err){
          if(err) console.log(err);
        });
      });
      fs.readFile("./public" + url, function(err,data){
            if (err) console.log(err);
            response.end(data);
            });
      });
  }
  if (method === "POST" && url === '/elements'){
    request.on('data', function(chunk){
      postObj = querystring.parse(chunk.toString());
      fs.access('./public/' + postObj.elementName + ".html", function(err){
        if(err){
          fs.readFile('./public/elTemplate.html', function(err,data){
            if(err) console.log(err);
            console.log("got here");
            newDoc = data.toString();
            for (var key in postObj){
              newDoc = newDoc.replace(key, postObj[key]);
              newDoc = newDoc.replace(key, postObj[key]);
            }
          fs.writeFile('./public/' + postObj.elementName + ".html", newDoc, function(err){
            if(err) console.log(err);
          });
           response.end(JSON.stringify({'success':true}));
          });
        } else {
          response.writeHead(302);
          response.end(JSON.stringify({'fileExists': 'use PUT to modify'}));
        }
      });
    });
  }
  if (method === "PUT"){
    request.on('data', function(chunk){
      postObj = querystring.parse(chunk.toString());
      fs.access('./public' + url, function(err){
        if(err){
          response.writeHead(404);
          response.end(JSON.stringify({'fileDoesNotExist': 'use POST to create ' + url}));
        } else {
          fs.readFile('./public/elTemplate.html', function(err,data){
            if(err) console.log(err);
            newDoc = data.toString();
            for (var key in postObj){
              newDoc = newDoc.replace(key, postObj[key]);
              newDoc = newDoc.replace(key, postObj[key]);
            }
            fs.writeFile('./public' + url, newDoc, function(err){
              if(err) console.log(err);
            });
           response.end(JSON.stringify({'success':true}));
          });
        }
      });
    });
  }
  if(method === "DELETE"){
    fs.unlink('./public' + url, function(err){
      if(err){
        response.writeHead(500);
        response.end(JSON.stringify({'fileDoesNotExist': 'check path' + url}));
      } else {
        response.end(JSON.stringify({'success':true}));
      }
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

