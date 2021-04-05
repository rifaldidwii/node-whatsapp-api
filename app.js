const fs = require('fs');
const qrcode = require('qrcode');
const axios = require('axios');
const express = require('express');
const { body, validationResult } = require('express-validator');
const { Client, MessageMedia } = require('whatsapp-web.js');
const { phoneNumberFormatter } = require('./helpers/formatter');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const SESSION_FILE_PATH = './session.json';

let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
    puppeteer: {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    },
    session: sessionData
});

client.initialize();

io.on('connection', (socket) => {
    socket.emit('message', 'Connecting...');

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            console.log('QR URL', url);
            socket.emit('qr', url);
            socket.emit('message', 'QR Code Generated...');
        });
    });

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        socket.emit('message', 'Client is authenticated...');
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('auth_failure', (msg) => {
        console.log('AUTHENTICATION FAILURE', ms);
        socket.emit('message', 'Authentication failed...');
    });

    client.on('ready', () => {
        console.log('READY');
        socket.emit('message', 'Client is ready...');
    });
});

const checkRegisteredUser = async (number) => {
    return await client.isRegisteredUser(number);
};

const validateApiToken = async (token) => {
    return await token === '7697ef28-8e3a-4363-a576-d25c31f4ed15';
};

app.post(
    '/send-message',
    body('phone').notEmpty(),
    body('text').notEmpty(),
    body('token').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: false,
                errors: errors.array()
            });
        }

        const isValid = await validateApiToken(req.body.token);
        
        if (!isValid) {
            return res.status(403).json({
                status: false,
                errors: 'The api token is invalid'
            });
        }

        const phone = phoneNumberFormatter(req.body.phone);
        const text = req.body.text;

        const isRegistered = await checkRegisteredUser(phone);

        if (!isRegistered) {
            return res.status(400).json({
                status: false,
                errors: 'The phone number is not registered in Whatsapp'
            });
        }

        client.sendMessage(phone, text).then(response => {
            res.status(200).json({
                status: true,
                response: response
            })
        }).catch(error => {
            res.status(500).json({
                status: false,
                response: error
            })
        });
    });

app.post(
    '/send-media',
    body('phone').notEmpty(),
    body('url').notEmpty(),
    body('token').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: false,
                errors: errors.array()
            });
        }

        const isValid = await validateApiToken(req.body.token);
        
        if (!isValid) {
            return res.status(403).json({
                status: false,
                errors: 'The api token is invalid'
            });
        }

        const phone = phoneNumberFormatter(req.body.phone);
        const caption = req.body.caption;
        const fileUrl = req.body.url;

        const isRegistered = await checkRegisteredUser(phone);

        if (!isRegistered) {
            return res.status(400).json({
                status: false,
                errors: 'The phone number is not registered in Whatsapp'
            });
        }

        let mimetype, data, name;
        await axios.get(fileUrl, { responseType: 'arraybuffer' }).then(response => {
            mimetype = response.headers['content-type'];
            data = response.data.toString('base64');
            name = mimetype == 'application/pdf' ? 'Document.pdf' : 'Image/Video';
        }).catch(error => {
            res.status(404).json({
                status: false,
                errors: error
            })
        });

        const media = new MessageMedia(mimetype, data, name);

        client.sendMessage(phone, media, { caption: caption }).then(response => {
            res.status(200).json({
                status: true,
                response: response
            })
        }).catch(error => {
            res.status(500).json({
                status: false,
                response: error
            })
        });
    });

http.listen(process.env.PORT || 3000, () => {
    console.log('App is running...');
});