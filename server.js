const tls = require('tls');
const fs = require('fs');
const path = require('path');

const options = {
    key: fs.readFileSync(path.resolve('./key.pem')),
    cert: fs.readFileSync(path.resolve('./cert.pem')),
}

const server = tls.createServer(options,(socket)=>{
    console.log('client connected');

    socket.write('Hello from server!');
    socket.on('data',(data)=>{
        console.log('client sent msg >>> ',data.toString('utf-8'));
    });

    socket.on('end',()=>{
        console.log('client disconnected');
    });

    socket.on('error',(err)=>{
        console.log('error msg ',err); 
    });

});

server.listen(5353,()=>{
    console.log('server running on port 5353');
})