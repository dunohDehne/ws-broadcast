const app = require('express')();
const http = require('http');
const WebSocket = require('ws');
const server = http.createServer(app);
const bodyParser = require("body-parser");
const wss = new WebSocket.Server({ server });
const AWS = require('aws-sdk');
const sns = new AWS.SNS({
                        accessKeyId: 'insert_access_key', secretAccessKey: 'insert_secret', region: 'insert_region'
                    });

app.use(function(req, res, next){
    if (req.is('text/*')) {
        req.text = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ req.text += chunk });
        req.on('end', next);
    } else {
        next();
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client.html');
});

app.post('/broadcast', function (req, res) {
    if(req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation'){
        console.log(JSON.parse(req.text)['Token']);
     }

    const body = req.headers['x-amz-sns-message-type'] ? JSON.parse(req.text) : req.body;
    console.log(`received message: ${body.Message}`);
    broadcast(body.Message);
    res.send('POST request to the homepage');
});


wss.on('connection', function connection(ws) {
  console.log('user connected');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('Connection received');
});

    function broadcast(data) {
        console.log("broadcasting to all clients");
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
        });
    }

server.listen(8080, function(){
    console.log('server on *:8080');
});