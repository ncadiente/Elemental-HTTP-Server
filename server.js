//node modules to require
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var config = require('./config.json');


//creates server
var server = http.createServer(connection);

//what to do upon connection
function connection(request, response) {

  //extract method, url, and fileType from request
  var method = request.method;
  var url = request.url.split('.');
  var fileType = url[1];
  url = url.join('.');

  //deal with root requests
  if(url === '/'){
    url = "/index.html";
  }
  if(fileType === undefined){
    fileType = "html";
  }

  //require authorization, if not prompt log in and return not authorized html
  if(!request.headers.hasOwnProperty('authorization')){
    response.writeHead(401, {
      "authorization" : "authorization required",
      "WWW-Authenticate" : "Basic realm='Secure Area'"
    });
    return response.end("<html><body>Not Authorized</body></html>");
  }

  //if we have authorizeation, decrypt
  if(request.headers.hasOwnProperty('authorization')){
    var encoded = request.headers.authorization.split(' ')[1];
    var base64Buffer = new Buffer(encoded, 'base64');
    var decodedString = base64Buffer.toString();

    //if authorization is wrong, prompt log in and return not authorized html
    if(decodedString !== config.verification){
      response.writeHead(401, {
      "authorization" : "authorization required",
      "WWW-Authenticate" : "Basic realm='Secure Area'"
      });
      return response.end("<html><body>Not Authorized</body></html>");
    }

    //if authorization  is present and correct allow request
    if(decodedString === config.verification) {

        //define variables to modify and use for requests
        var body = "";
        var postObj;
        var newDoc;

        //GET method for everything but index.html, returns sucessful html doc
        if (method === "GET" && url !== "/index.html"){
          response.writeHead(200, {
            'Content-Type' : "text/" + fileType
          });
          fs.readFile("./public" + url, function(err,data){
            if (err) console.log(err);
            return response.end(data);
            });
        }

        //GET index.html and update in accordance with total element files
        if (method === "GET" && url === "/index.html"){
          response.writeHead(200, {
            'Content-Type' : "text/" + fileType
          });

          //read in the index template
          fs.readFile("./public/indexTemplate.html", function(err,data){
            if (err) console.log(err);

            //check public directories files
            fs.readdir('./public', function(err, files){
              if (err) console.log(err);

              //used to filter out everything but element htmls
              var toIgnore = ['.keep', 'index.html', 'indexTemplate.html', 'elTemplate.html', 'css'];
              var elementFiles = files.filter(function(file){
                  return toIgnore.indexOf(file) === -1;
                });

              //read in index template and change element total , then split to insert links
              var index = data.toString();
              index = index.replace('elementTotal', elementFiles.length);
              index = index.split("splitHere");

              //loop through all elementFiles, compile list a hrefs and store in links
              var links = "";
              for(var k = 0; k < elementFiles.length; k++) {
                var name = elementFiles[k].split('.')[0];
                links += "<li>\n\t<a href=\'./" + elementFiles[k] + "\'>" + name + "</a>\n</li>\n";
              }

              //insert links into index template and rewrite index html and return new index
              index = index[0] + links + index[1];
              fs.writeFile('./public/index.html', index, function(err){
                if(err) console.log(err);
                response.end(index);
              });
            });
          });
        }

        //POST method that only creates new files if they do not exist
        if (method === "POST" && url === '/elements'){

          //parse post request data
          request.on('data', function(chunk){
            postObj = querystring.parse(chunk.toString());

            //check if we have access/ this elementName exists
            fs.access('./public/' + postObj.elementName + ".html", function(err){

              //when the file doesn't exist, write it
              if(err){

                //read in element template and store data to newDoc
                fs.readFile('./public/elTemplate.html', function(err,data){
                  if(err) console.log(err);
                  newDoc = data.toString();

                  //loop through object to replace all necessary data, runs twice for multiple instances
                  for (var key in postObj){
                    newDoc = newDoc.replace(key, postObj[key]);
                    newDoc = newDoc.replace(key, postObj[key]);
                  }

                //write to a new html with elementName and give success response
                fs.writeFile('./public/' + postObj.elementName + ".html", newDoc, function(err){
                  if(err) console.log(err);
                });
                 response.end(JSON.stringify({'success':true}));
                });

                //return error if file exists
              } else {
                response.writeHead(302);
                response.end(JSON.stringify({'fileExists': 'use PUT to modify'}));
              }
            });
          });
        }

        //PUT method for if the file exists, actually overwrites it
        if (method === "PUT"){

          // parse through the PUT request for what to change
          request.on('data', function(chunk){
            postObj = querystring.parse(chunk.toString());

            //check if file exists
            fs.access('./public' + url, function(err){

              //if it does not exist return not found error
              if(err){
                response.writeHead(404);
                response.end(JSON.stringify({'fileDoesNotExist': 'use POST to create ' + url}));

              //else overwrite it
              } else {

                //read in element template and store to newDoc
                fs.readFile('./public/elTemplate.html', function(err,data){
                  if(err) console.log(err);
                  newDoc = data.toString();

                  //loop through object and replace items, run twice to cover duplicates
                  for (var key in postObj){
                    newDoc = newDoc.replace(key, postObj[key]);
                    newDoc = newDoc.replace(key, postObj[key]);
                  }
                  //write and replace file and return success
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

