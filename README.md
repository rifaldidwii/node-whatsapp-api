# Node Whatsapp API

This is a Whatsapp API created with <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>

### How to use?

- Clone or download this repo
- Enter to the project directory
- Run `npm install`
- Run `npm run start`
- Open browser and go to the address `http://localhost:3000`
- Scan the QR Code
- Enjoy!

### Send message

You can send the message to any registered whatsapp number.

**Paramaters:**

- `phone` : the receiver phone number
- `text`: the message

**Endpoint:**
`/send-message`

### Send media

You can also send the media (images/audio/documents) to any registered whatsapp number.

**Paramaters:**

- `phone` : the receiver phone number
- `caption` (optional): the additional message
- `url`: the media source

**Endpoint:**
`/send-media`