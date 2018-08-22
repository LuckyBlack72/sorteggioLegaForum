# gmail-api-create-message-body
Tiny utility function for creating a message body that can be used for the Gmail API upload urls.

## Example usage

```js
var rp = require('request-promise');
var fs = require('fs');
var path = require('path');
var createBody = require('gmail-api-create-message-body');

var catBase64 = fs.readFileSync(path.join(__dirname, 'cat.png')).toString('base64');
var dogBase64 = fs.readFileSync(path.join(__dirname, 'dog.jpg')).toString('base64');

var body = createBody({
  headers: {
    To: 'receiver@gmail.com',
    From: 'sender@gmail.com',
    Subject: 'This was rad, brother.'
  },
  textHtml: 'Thanks for last time, <b>buddy.</b>',
  textPlain: 'Thanks for last time, *buddy.*',
  threadId: '1536195a8ad6a354',
  attachments: [
    {
      type: 'image/jpeg',
      name: 'dog.jpg',
      data: dogBase64
    },
    {
      type: 'image/png',
      data: catBase64
    }
  ]
});

rp({
  method: 'POST',
  uri: 'https://www.googleapis.com/upload/gmail/v1/users/me/messages/send',
  headers: {
    Authorization: 'Bearer {ACCESS_TOKEN}',
    'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
  },
  body: body
});
```

## API


```js
/**
 * Creates a message body that can be used for the Gmail API simple upload urls.
 * @param  {object}   params
 * @param  {object}   params.[headers]            - Key-value object representing headers and their values
 * @param  {string}   params.[threadId]           - Id of the thread the message should be put into
 * @param  {string}   params.[textPlain]          - Plain text representation of the message
 * @param  {string}   params.[textHtml]           - Html text representation of the message
 * @param  {object[]} params.[attachments]        - Array of attachment objects
 * @param  {string}   params.attachments[].type   - Attachment type ('image/jpeg', 'image/png', ...)
 * @param  {string}   params.attachments[].[name] - Name of the attachment
 * @param  {string}   params.attachments[].data   - Base64 representation of the attachment data
 * @return {string}
 */
 createBody(params);
```

## Licence
MIT
