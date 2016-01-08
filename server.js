//node modules to require
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

//creates server
var server = http.createServer(connection);

//what to do upon connection
function connection(request, response) {

  //extract method, url, and fileType from request
  var method = request.method;
  var url = request.url.split('.');
  var fileType = url[1];
  url = url.join('.');

  //define variables to use for
  var body = "";
  var postObj;
  var newDoc;

  //GET method for everything but index.html
  if (method === "GET" && url !== "/index.html"){
    response.writeHead(200, {
      'Content-Type' : "text/" + fileType
    });
    fs.readFile("./public" + url, function(err,data){
      if (err) console.log(err);
      response.end(data);
      });
  }

  //GET index.html and update in accordance with total element files
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

  //POST method that only creates new files if they do not exist
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

  //PUT method for if the file exists, actually overwrites it
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

  //DELETE method unlinks file if it exists
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

//defines what port server will listen on when run
server.listen({
  host : "localhost",
  port : 8080
}, function(){
  address = server.address();
console.log("opened server address: ", address);
});

