const tls = require('tls');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

require('dotenv').config();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine','ejs');
app.set('views',path.resolve('./views'));

const messages = [];
const serverMsgArr = [];
let serverConFlag = 0;
let client = null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const genModel = genAI.getGenerativeModel({model: 'gemini-1.5-flash-8b'});

async function generateAIRes(){
    const query = messages[messages.length - 1];
    const aiResponse = await genModel.generateContent(query);
    // console.log(aiResponse.response.text());
    serverMsgArr.push(aiResponse.response.text());
    console.log(serverMsgArr[serverMsgArr.length - 1]);
}

app.post('/connect',(req,res)=>{
    const options = {
        ca: fs.readFileSync(path.resolve('./cert.pem')), 
    }

    client = tls.connect(5353,'localhost',options,()=>{
        if(client.authorized){
            console.log('server connected');
            serverConFlag = 1;
            client.write('Hello from client side :)');
        }
        else{
            console.log('connection not authorized');
        }
    });

    client.on('data',(data)=>{
        const utfData = data.toString('utf-8');
        console.log('server sent msg >>> ',utfData);
        serverMsgArr.push(utfData);
    });
    
    client.on('error',(err)=>{
        console.log('error msg ',err);
    });
});

app.get('/',(req,res)=>{
    return res.render('home');
})

app.get('/chat',(req,res)=>{
    console.log('Server connection flag:', serverConFlag);  // Debugging line
    res.render('chat',{msg: messages, serverMsg: serverMsgArr, flag: serverConFlag});
});

app.post('/chat',(req,res)=>{
    const clientMsg = req.body.clientMsg;
    if(clientMsg){
        messages.push(clientMsg);
        generateAIRes();
    }
    res.render('chat',{msg: messages, serverMsg: serverMsgArr, flag: serverConFlag});
    if(client){
        client.write(messages[messages.length-1]);
    }
});

app.post('/disconnect',(req,res)=>{
    if(client){
        client.end(()=>{
            console.log('disconnected from server');
            serverConFlag = 0;
        });
    }
    else{
        return res.json({success: false, msg: 'no server connected'});
    }
})

app.listen(process.env.PORT,()=>{
    console.log('server running on http://localhost:3001');
})
