const https = require('https');
const http = require('http');
const fs = require('fs');

const url = 'https://registry.npmmirror.com/@tencent-weixin/openclaw-weixin/-/openclaw-weixin-2.4.2.tgz';
const dest = '/data/data/com.termux/files/home/owx.tgz';

https.get(url, res => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    const redir = res.headers.location.startsWith('http') ? res.headers.location : 'https:' + res.headers.location;
    console.log('redirect to', redir);
    https.get(redir, r2 => {
      const file = fs.createWriteStream(dest);
      r2.pipe(file);
      file.on('finish', () => console.log('downloaded'));
    }).on('error', e => console.log('err:', e.message));
  } else {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => console.log('downloaded ' + fs.statSync(dest).size + ' bytes'));
  }
}).on('error', e => console.log('error:', e.message));
