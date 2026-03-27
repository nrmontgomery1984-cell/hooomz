import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const html = `<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;700;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; }
  .og {
    width: 1200px;
    height: 630px;
    background: #111010;
    display: flex;
    font-family: 'Figtree', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .og-left-strip {
    width: 16px;
    background: #F0EDE8;
    flex-shrink: 0;
  }
  .og-content {
    flex: 1;
    padding: 80px 96px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .og-wordmark {
    font-family: 'Figtree', sans-serif;
    font-weight: 900;
    font-size: 120px;
    letter-spacing: 0.06em;
    color: white;
    line-height: 1;
  }
  .o1 { color: #DC2626; }
  .o2 { color: #D97706; }
  .o3 { color: #16A34A; }
  .og-sub {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    letter-spacing: 0.25em;
    color: #6B6560;
    text-transform: uppercase;
    margin-top: 16px;
  }
  .og-divider {
    width: 80px;
    height: 2px;
    background: #6B6560;
    margin: 32px 0;
  }
  .og-tagline {
    font-size: 36px;
    font-weight: 400;
    color: #9A8E84;
    line-height: 1.5;
    max-width: 760px;
  }
  .og-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .og-url {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
  }
  .og-mark svg {
    width: 28px;
    height: 80px;
  }
</style>
</head>
<body>
  <div class="og">
    <div class="og-left-strip"></div>
    <div class="og-content">
      <div>
        <div class="og-wordmark">H<span class="o1">O</span><span class="o2">O</span><span class="o3">O</span>MZ</div>
        <div class="og-sub">Interiors \u00B7 Southern New Brunswick</div>
        <div class="og-divider"></div>
        <div class="og-tagline">Interior finishing for homeowners who want to know.</div>
      </div>
      <div class="og-bottom">
        <div class="og-url">hooomz.ca/interiors</div>
        <div class="og-mark">
          <svg viewBox="0 0 20 56" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="none" stroke="#DC2626" stroke-width="3.5"/>
            <circle cx="10" cy="28" r="8" fill="none" stroke="#D97706" stroke-width="3.5"/>
            <circle cx="10" cy="46" r="8" fill="none" stroke="#16A34A" stroke-width="3.5"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.fonts.ready);
const screenshot = await page.screenshot({ type: 'jpeg', quality: 95 });
writeFileSync('./public/og-image.jpg', screenshot);
await browser.close();
console.log('Generated og-image.jpg at 1200x630');
