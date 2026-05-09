#!/data/data/com.termux/files/usr/bin/env node
// visual-agent.js — AutoGLM-Phone-9B 视觉手机控制代理
// 截图 → AutoGLM 视觉理解 → ADB 执行 → 循环
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

const HOME = process.env.HOME || '/data/data/com.termux/files/home';
const API_KEY = process.env.ZHIPU_API_KEY || '1773e112068947eb9ca0efe637381ac1.WEBeBhlSzWAMagIa';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'autoglm-phone';
const SCREENSHOT = '/sdcard/agent_screen.png';
const MAX_STEPS = 30;

let step = 0;

function adb(cmd) {
  return execSync('su -c "' + cmd.replace(/"/g, '\\"') + '"', { timeout: 10000, encoding: 'utf8' }).trim();
}

function captureScreen() {
  adb('screencap -p ' + SCREENSHOT);
  const buf = execSync('su -c "cat ' + SCREENSHOT + '"', { timeout: 10000 });
  return buf.toString('base64');
}

function callAutoGLM(screenshotB64, task) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: '当前任务: ' + task + '\n\n请分析当前屏幕，输出下一个操作。只输出 do(action=..., element=...) 或 do(action=..., text=...)。可用操作: Tap [x,y], Type [text], Swipe [x1,y1,x2,y2], Back, Home, Launch [app], Wait, Take_over' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,' + screenshotB64 } }
        ]
      }],
      max_tokens: 512,
      temperature: 0.1,
    });

    const u = new URL(API_URL);
    const opts = {
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json',
        'User-Agent': 'visual-agent/1.0', 'Connection': 'close',
      }, timeout: 30000,
    };

    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error('Parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseAction(text) {
  const actions = {
    Tap:    (m) => { adb('input tap ' + m[1] + ' ' + m[2]); return 'tap ' + m[1] + ',' + m[2]; },
    Type:   (m) => { const t = m[1].replace(/'/g, "'\\''"); adb("input text '" + t + "'"); return 'type "' + m[1].substring(0,20) + '"'; },
    Swipe:  (m) => { adb('input swipe ' + m[1] + ' ' + m[2] + ' ' + m[3] + ' ' + m[4]); return 'swipe'; },
    Back:   ()  => { adb('input keyevent 4'); return 'back'; },
    Home:   ()  => { adb('input keyevent 3'); return 'home'; },
    Launch: (m) => { adb('monkey -p ' + m[1] + ' 1 2>/dev/null || am start -n ' + m[1]); return 'launch ' + m[1]; },
    Wait:   ()  => { return 'wait'; },
    Take_over: () => { return 'take_over'; },
    Enter:  ()  => { adb('input keyevent 66'); return 'enter'; },
  };

  for (const [name, fn] of Object.entries(actions)) {
    if (name === 'Tap') {
      const m = text.match(/Tap[\(\[]\s*(\d+)\s*[,，]\s*(\d+)\s*[\)\]]/);
      if (m) return fn(m);
    }
    if (name === 'Type') {
      const m = text.match(/Type[\(\[]\s*['"]([^'"]+)['"]\s*[\)\]]/);
      if (m) return fn(m);
    }
    if (name === 'Swipe') {
      const m = text.match(/Swipe[\(\[]\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)/);
      if (m) return fn(m);
    }
    if (name === 'Launch') {
      const m = text.match(/Launch[\(\[]\s*['"]([^'"]+)['"]\s*[\)\]]/);
      if (m) return fn(m);
    }
    if (text.includes('Back')) return Back();
    if (text.includes('Home')) return Home();
    if (text.includes('Wait')) return Wait();
    if (text.includes('Take_over') || text.includes('take_over')) return Take_over();
    if (text.includes('Enter')) return Enter();
  }
  return 'unknown: ' + text.substring(0, 80);
}

async function run(task) {
  console.log('\n=== Visual Agent ===');
  console.log('Task: ' + task);
  console.log('Model: ' + MODEL);
  console.log('');

  for (step = 1; step <= MAX_STEPS; step++) {
    console.log('--- Step ' + step + ' ---');

    let screenshotB64;
    try {
      screenshotB64 = captureScreen();
      console.log('  screenshot: OK (' + (screenshotB64.length / 1024).toFixed(0) + 'KB)');
    } catch (e) {
      console.error('  screenshot FAILED: ' + e.message);
      break;
    }

    let result;
    try {
      result = await callAutoGLM(screenshotB64, task);
    } catch (e) {
      console.error('  API call FAILED: ' + e.message);
      break;
    }

    const content = result.choices?.[0]?.message?.content || '';
    console.log('  AutoGLM: ' + content.substring(0, 200).replace(/\n/g, ' '));

    const thinkMatch = content.match(/<think>(.*?)<\/think>/s);
    if (thinkMatch) console.log('  think: ' + thinkMatch[1].substring(0, 150));

    const answerMatch = content.match(/<answer>(.*?)<\/answer>/s);
    const actionText = answerMatch ? answerMatch[1] : content;

    const result_text = parseAction(actionText);
    console.log('  action: ' + result_text);

    if (result_text === 'take_over') {
      console.log('\n⚠️  AutoGLM 请求人工接管（登录/验证码场景）');
      break;
    }

    if (result_text === 'wait') {
      const waitMs = 2000;
      console.log('  waiting ' + waitMs + 'ms...');
      execSync('sleep ' + (waitMs / 1000));
    }

    // Check if task is done (AutoGLM says completed or user confirms)
    if (content.includes('完成') || content.includes('complete') || content.includes('Done') || content.includes('success')) {
      // Continue unless the model explicitly says task is fully done
      if (content.includes('任务已完成') || content.includes('task completed') || content.includes('Task completed')) {
        console.log('\n✅ 任务完成！');
        return true;
      }
    }
  }

  console.log('\n  reached max steps (' + MAX_STEPS + ')');
  return false;
}

// CLI
const task = process.argv.slice(2).join(' ');
if (!task) {
  console.log('Usage: node src/visual-agent.js "你的任务描述"');
  console.log('Example: node src/visual-agent.js "打开微信发消息给文件传输助手说你好"');
  process.exit(1);
}

run(task)
  .then((done) => { process.exit(done ? 0 : 1); })
  .catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
