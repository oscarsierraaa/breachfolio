/* ──────────────────────────────────────────────────────────────────────────
 * Breachfolio Fake Hack Terminal — v2 (looping, multi-scenario)
 * ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const TERM_EL_ID = 'sf-hack-terminal';

  /* ── helpers ─────────────────────────────────────────────────────────── */
  async function fetchPublicIP() {
    const urls = ['https://api.ipify.org?format=json','https://ipapi.co/json/'];
    for (const u of urls) {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2500);
        const r = await fetch(u, { signal: c.signal }); clearTimeout(t);
        if (!r.ok) continue;
        const d = await r.json(), ip = d.ip || d.query;
        if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip;
      } catch (_) {}
    }
    return null;
  }
  function fallbackIP() {
    const a = [73,84,88,91,95,104,142,167,185,188,195,213];
    return a[Math.random()*a.length|0]+'.'+((Math.random()*256)|0)+'.'+((Math.random()*256)|0)+'.'+(1+(Math.random()*254|0));
  }
  function fakeMAC() {
    const h='0123456789ABCDEF'; let o='';
    for(let i=0;i<6;i++){if(i)o+=':';o+=h[Math.random()*16|0]+h[Math.random()*16|0];}return o;
  }
  function rPort(){return 1024+(Math.random()*64000|0);}
  function rnd(a){return a[Math.random()*a.length|0];}
  function getOS(){const u=navigator.userAgent;if(u.includes('Win'))return'Windows';if(u.includes('Mac'))return'macOS';if(u.includes('Linux'))return'Linux';if(u.includes('Android'))return'Android';if(u.includes('iPhone')||u.includes('iPad'))return'iOS';return'Unknown';}
  function getBrowser(){const u=navigator.userAgent;if(u.includes('Firefox'))return'Firefox';if(u.includes('Edg'))return'Edge';if(u.includes('Chrome'))return'Chrome';if(u.includes('Safari'))return'Safari';return'Unknown';}
  function ts(){return new Date().toTimeString().slice(0,8);}
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

  /* ── step shorthands ────────────────────────────────────────────────── */
  function cmd(t){return{t:'cmd',text:t};}
  function out(t,c){return{t:'out',text:t,c:c||''};}
  function w(ms){return{t:'wait',ms:ms||400};}
  function blank(){return out('');}
  function sep(){return out('─'.repeat(48),'muted');}

  /* ── scenario builders ──────────────────────────────────────────────── */
  function scenarioNmap(ip) {
    const p1=rPort(),p2=rPort(),mac=fakeMAC(),os=getOS(),br=getBrowser(),tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
    return [
      cmd('nmap -sS -sV -O -p- '+ip), w(1400),
      out('Starting Nmap 7.94SVN at '+ts(),'muted'),
      out('Scanning '+ip+' [65535 ports]','muted'), w(1000),
      out('   PORT      STATE  SERVICE        VERSION','muted'),
      out('   22/tcp    open   ssh            OpenSSH 9.6','good'),
      out('   80/tcp    open   http           nginx 1.25.4','good'),
      out('   443/tcp   open   https          nginx 1.25.4','good'),
      out('   '+p1+'/tcp  open   unknown','good'),
      out('   '+p2+'/tcp  filtered  ms-sql-s','warn'), w(700),
      out('OS detection: '+os+' ('+br+')','muted'),
      out('MAC Address: '+mac,'muted'),
      out('Timezone:    '+tz,'muted'),
      out('Nmap done: 1 IP address (1 host up) scanned in 4.82s','muted'),
      blank(),
    ];
  }

  function scenarioMetasploit(ip) {
    const p=rPort(),sess=1+(Math.random()*9|0);
    return [
      cmd('msfconsole -q'), w(1800),
      out('                                                  ','muted'),
      out('       =[ metasploit v6.4.9-dev                 ]','warn'),
      out('+ -- --=[ 2414 exploits - 1242 auxiliary         ]','muted'),
      out('+ -- --=[ 423 payloads - 48 encoders - 11 nops  ]','muted'),
      out('+ -- --=[ 9 evasion                              ]','muted'),
      blank(), w(1000),
      cmd('use exploit/multi/handler'),
      cmd('set PAYLOAD linux/x64/meterpreter/reverse_tcp'),
      out('PAYLOAD => linux/x64/meterpreter/reverse_tcp','muted'), w(500),
      cmd('set LHOST 10.10.14.'+((Math.random()*254|0)+1)),
      out('LHOST => 10.10.14.*','muted'),
      cmd('set LPORT '+p),
      out('LPORT => '+p,'muted'), w(600),
      cmd('exploit -j'), w(1600),
      out('[*] Exploit running as background job '+sess+'.','muted'),
      out('[*] Started reverse TCP handler on 0.0.0.0:'+p,'muted'), w(1200),
      out('[*] Sending stage (3045380 bytes) to '+ip,'muted'), w(1000),
      out('[*] Meterpreter session '+sess+' opened (10.10.14.*:'+p+' → '+ip+':'+rPort()+')','good'),
      blank(), w(800),
      cmd('sessions -i '+sess), w(600),
      out('[*] Starting interaction with '+sess+'…','muted'), w(500),
      cmd('sysinfo'), w(800),
      out('Computer     : target-'+((Math.random()*999|0)+100),'muted'),
      out('OS           : '+getOS(),'muted'),
      out('Architecture : x64','muted'),
      out('Meterpreter  : x64/linux','muted'),
      blank(), w(600),
      cmd('getuid'), w(500),
      out('Server username: www-data','warn'),
      cmd('hashdump'), w(1200),
      out('root:$6$rNd0m5aLt$kF9x…:0:0:root:/root:/bin/bash','warn'),
      out('www-data:$6$w3bH4sH$pL8…:33:33:www-data:/var/www:/usr/sbin/nologin','warn'),
      blank(),
    ];
  }

  function scenarioSQLi(ip) {
    const db=rnd(['wordpress','shop_db','users_prod','app_main']);
    const tbl=rnd(['wp_users','customers','accounts','admin_users']);
    return [
      cmd("sqlmap -u 'http://"+ip+"/page?id=1' --dbs --batch"), w(1500),
      out('['+ts()+'] [INFO] testing connection to the target URL','muted'), w(700),
      out('['+ts()+'] [INFO] testing if the target URL is stable','muted'), w(800),
      out('['+ts()+'] [INFO] heuristic (basic) test shows that GET parameter \'id\' might be injectable','warn'), w(700),
      out('['+ts()+'] [INFO] testing for SQL injection on GET parameter \'id\'','muted'), w(1000),
      out('['+ts()+'] [INFO] GET parameter \'id\' is vulnerable. Do you want to keep testing?','good'), w(500),
      out('Parameter: id (GET)','muted'),
      out('    Type: boolean-based blind','muted'),
      out('    Title: AND boolean-based blind - WHERE or HAVING clause','muted'),
      out("    Payload: id=1' AND 7482=7482 AND 'YLmR'='YLmR",'warn'),
      blank(), w(900),
      out('available databases [4]:','good'),
      out('[*] information_schema','muted'),
      out('[*] mysql','muted'),
      out('[*] performance_schema','muted'),
      out('[*] '+db,'good'), w(1000),
      cmd("sqlmap -u 'http://"+ip+"/page?id=1' -D "+db+" --tables --batch"), w(1400),
      out('Database: '+db,'muted'),
      out('[3 tables]','good'),
      out('+---------------+','muted'),
      out('| '+tbl.padEnd(14)+'|','good'),
      out('| sessions      |','muted'),
      out('| config        |','muted'),
      out('+---------------+','muted'),
      blank(), w(900),
      cmd("sqlmap -u 'http://"+ip+"/page?id=1' -D "+db+" -T "+tbl+" --dump --batch"), w(1600),
      out('['+ts()+'] [INFO] fetching columns for table \''+tbl+'\' in database \''+db+'\'','muted'), w(700),
      out('['+ts()+'] [INFO] retrieved: id, username, password, email','muted'), w(700),
      out('+----+----------+----------------------------------+-----------------------+','muted'),
      out('| id | username | password                         | email                 |','warn'),
      out('+----+----------+----------------------------------+-----------------------+','muted'),
      out('| 1  | admin    | 5f4dcc3b5aa765d61d8327deb882cf99 | admin@target.local    |','good'),
      out('| 2  | backup   | e99a18c428cb38d5f260853678922e03 | backup@target.local   |','good'),
      out('+----+----------+----------------------------------+-----------------------+','muted'),
      out('['+ts()+'] [INFO] recognized possible password hashes in column \'password\'','warn'),
      blank(),
    ];
  }

  function scenarioHydra(ip) {
    const svc=rnd(['ssh','ftp','rdp','mysql']);
    const port={'ssh':22,'ftp':21,'rdp':3389,'mysql':3306}[svc];
    return [
      cmd('hydra -l admin -P /usr/share/wordlists/rockyou.txt '+svc+'://'+ip+' -t 4 -vV'), w(1200),
      out('Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak','muted'), w(500),
      out('[DATA] max 4 tasks per 1 server, overall 4 tasks, 14344399 login tries (l:1/p:14344399)','muted'),
      out('[DATA] attacking '+svc+'://'+ip+':'+port+'/','muted'), w(1000),
      out('[ATTEMPT] target '+ip+' — login "admin" — pass "123456"','muted'), w(600),
      out('[ATTEMPT] target '+ip+' — login "admin" — pass "password"','muted'), w(500),
      out('[ATTEMPT] target '+ip+' — login "admin" — pass "12345678"','muted'), w(500),
      out('[ATTEMPT] target '+ip+' — login "admin" — pass "admin"','muted'), w(500),
      out('[ATTEMPT] target '+ip+' — login "admin" — pass "letmein"','muted'), w(700),
      out('['+port+']['+svc+'] host: '+ip+'   login: admin   password: letmein','good'), w(500),
      out('1 of 1 target successfully completed, 1 valid password found','good'),
      blank(),
    ];
  }

  function scenarioNikto(ip) {
    return [
      cmd('nikto -h http://'+ip), w(1400),
      out('- Nikto v2.5.0','muted'),
      out('+ Target IP:          '+ip,'muted'),
      out('+ Target Hostname:    '+ip,'muted'),
      out('+ Target Port:        80','muted'),
      out('+ Start Time:         '+ts(),'muted'), w(700),
      out('+ Server: nginx/1.25.4','muted'),
      out('+ /: The X-Content-Type-Options header is not set.','warn'), w(500),
      out('+ /: The X-Frame-Options header is not set.','warn'), w(500),
      out('+ /admin/: Directory indexing found.','good'), w(500),
      out('+ /admin/config.php: PHP config file found.','good'), w(500),
      out('+ /.env: Environment file found — may contain credentials.','good'), w(600),
      out('+ /backup.sql: Database backup file found.','good'), w(500),
      out('+ OSVDB-3092: /phpmyadmin/: phpMyAdmin panel found.','warn'), w(500),
      out('+ 7 item(s) reported on remote host','muted'),
      out('+ End Time: '+ts()+' (18 seconds)','muted'),
      blank(),
    ];
  }

  function scenarioEnum4linux(ip) {
    return [
      cmd('enum4linux -a '+ip), w(1200),
      out('Starting enum4linux v0.9.1','muted'),
      out('============================','muted'),
      out('|    Target Information    |','muted'),
      out('============================','muted'), w(500),
      out('Target ........... '+ip,'muted'),
      out('RID Range ........ 500-550','muted'),
      out('Username ......... \'\'','muted'),
      out('Password ......... \'\'','muted'), w(800),
      out('============================','muted'),
      out('|    Share Enumeration     |','muted'),
      out('============================','muted'), w(700),
      out('   Sharename   Type      Comment','muted'),
      out('   ---------   ----      -------','muted'),
      out('   IPC$        IPC       IPC Service','muted'),
      out('   ADMIN$      Disk      Admin share','warn'),
      out('   C$          Disk      Default share','warn'),
      out('   backup      Disk      Backup Files','good'), w(700),
      out('============================','muted'),
      out('|    Users on '+ip.substring(0,11)+'  |','muted'),
      out('============================','muted'), w(500),
      out('[+] user:[administrator] rid:[0x1f4]','good'),
      out('[+] user:[guest] rid:[0x1f5]','muted'),
      out('[+] user:[svc_backup] rid:[0x451]','good'),
      blank(),
    ];
  }

  function scenarioJohn(ip) {
    return [
      cmd('john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt --format=raw-md5'), w(1200),
      out('Using default input encoding: UTF-8','muted'),
      out('Loaded 2 password hashes with no different salts (Raw-MD5)','muted'), w(800),
      out('Press \'q\' or Ctrl-C to abort, \'s\' for status','muted'), w(1200),
      out('password         (admin)','good'), w(700),
      out('abc123           (backup)','good'), w(500),
      out('2g 0:00:00:03 DONE 0.5882g/s 12845Kp/s 12845Kc/s','muted'),
      out('Session completed.','muted'),
      blank(), w(700),
      cmd('cat cracked.txt'), w(600),
      out('admin:password','warn'),
      out('backup:abc123','warn'),
      blank(),
    ];
  }

  function scenarioWhatWeb(ip) {
    return [
      cmd('whatweb '+ip), w(1000),
      out('http://'+ip+' [200 OK]','good'),
      out('  Country[US], HTTPServer[nginx/1.25.4],','muted'),
      out('  HTML5, JQuery[3.7.1], Meta-Author[Breachfolio],','muted'),
      out('  Script[application/ld+json,text/javascript],','muted'),
      out('  Title[Target Dashboard],','muted'),
      out('  X-Powered-By[PHP/8.3.2]','warn'),
      blank(),
    ];
  }

  function scenarioCurl(ip) {
    return [
      cmd('curl -sI http://'+ip), w(800),
      out('HTTP/1.1 200 OK','good'),
      out('Server: nginx/1.25.4','muted'),
      out('Content-Type: text/html; charset=UTF-8','muted'),
      out('X-Powered-By: PHP/8.3.2','warn'),
      out('Set-Cookie: PHPSESSID=a3f8…; path=/; HttpOnly','warn'),
      out('X-Frame-Options: not set','warn'),
      out('Content-Security-Policy: not set','warn'),
      blank(),
    ];
  }

  /* ── scenario pool & loop ───────────────────────────────────────────── */
  function buildScenarioPool(ip) {
    return [
      scenarioNmap,
      scenarioMetasploit,
      scenarioSQLi,
      scenarioHydra,
      scenarioNikto,
      scenarioEnum4linux,
      scenarioJohn,
      scenarioWhatWeb,
      scenarioCurl,
    ].map(fn => () => fn(ip));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ── rendering ──────────────────────────────────────────────────────── */
  const COLORS = {
    good: 'text-[hsl(142,76%,55%)]',
    warn: 'text-[hsl(38,92%,62%)]',
    muted: 'text-muted-foreground',
    err:  'text-[hsl(0,84%,65%)]',
  };

  function makeLine(text, c) {
    const el = document.createElement('div');
    el.className = 'sf-term-line whitespace-pre font-mono text-[12.5px] md:text-[13px] leading-[1.65] ' + (COLORS[c] || '');
    el.textContent = text;
    return el;
  }

  function makePrompt() {
    const s = document.createElement('span');
    s.className = 'text-[hsl(142,76%,55%)]';
    s.textContent = 'attacker@kali:~$ ';
    return s;
  }

  async function typeInto(el, text, delay) {
    for (let i = 0; i < text.length; i++) {
      el.appendChild(document.createTextNode(text[i]));
      await sleep(delay);
    }
  }

  function autoScroll(c) { c.scrollTop = c.scrollHeight; }

  const MAX_LINES = 120;
  function trimLines(container) {
    const lines = container.querySelectorAll('.sf-term-line');
    if (lines.length > MAX_LINES) {
      const remove = lines.length - MAX_LINES;
      for (let i = 0; i < remove; i++) lines[i].remove();
    }
  }

  async function playSteps(container, steps) {
    for (const s of steps) {
      if (s.t === 'wait') { await sleep(s.ms); continue; }
      if (s.t === 'cmd') {
        const line = document.createElement('div');
        line.className = 'sf-term-line font-mono text-[12.5px] md:text-[13px] leading-[1.65] text-foreground';
        line.appendChild(makePrompt());
        container.appendChild(line);
        await typeInto(line, s.text, 35 + Math.random() * 30);
        autoScroll(container);
        continue;
      }
      if (s.t === 'out') {
        container.appendChild(makeLine(s.text, s.c));
        autoScroll(container);
        await sleep(120 + Math.random() * 160);
        continue;
      }
    }
    trimLines(container);
  }

  /* ── main loop ──────────────────────────────────────────────────────── */
  async function runLoop(container, ip) {
    const pool = buildScenarioPool(ip);

    // first pass: nmap + metasploit + sqli always first
    const first = [pool[0](), pool[1](), pool[2]()];
    for (const steps of first) {
      await playSteps(container, steps);
      await sleep(2800);
    }

    // then infinite shuffle loop of everything
    while (true) {
      const order = shuffle([...pool]);
      for (const fn of order) {
        await playSteps(container, fn());
        await sleep(3000 + Math.random() * 1500);
      }
    }
  }

  /* ── boot ───────────────────────────────────────────────────────────── */
  async function boot() {
    const term = document.getElementById(TERM_EL_ID);
    if (!term) return;
    const body = term.querySelector('[data-term-body]') || term;
    const ipEl = term.querySelector('[data-term-ip]');

    let ip = await fetchPublicIP();
    const real = !!ip;
    if (!ip) ip = fallbackIP();
    if (ipEl) ipEl.textContent = ip + (real ? '' : ' (sample)');

    let started = false;
    const start = () => { if (started) return; started = true; runLoop(body, ip); };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        for (const e of entries) { if (e.isIntersecting) { start(); obs.disconnect(); break; } }
      }, { threshold: 0.35 });
      obs.observe(term);
      setTimeout(start, 1200);
    } else { start(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
