const puppeteer = require('puppeteer')

let browser, page;

beforeEach(async()=>{
    browser = await puppeteer.launch({
        headless: false   // no GUI
    });
    page = await browser.newPage();

    await page.goto('localhost:3000');
});

afterEach(async() => {
    // await browser.close();
});

test('the header has the corredt text', async () => {
    
    const text = await page.$eval('a.brand-logo', el => el.innerHTML);

    expect(text).toEqual('Blogster');
});

test('clicking login starts oauth flow', async ()=> {

    await page.click('.right a');

    const url = await page.url();

    expect(url).toMatch(/accounts\.google\.com/)
});

// we set cookie to the chromium instance to fake our server we are login
// as an user we picked 
test.only('When signed in, shows logout button', async ()=> {
    // mongodb id but not google id
    const id = '5e901b51f5400d311db1fa8c';   

    const Buffer = require('safe-buffer').Buffer;
    const sessionObject = {
        passport: {
            user: id
        }
    };

    // mimicing the session string in cookie
    const sessionString = Buffer.from(
        JSON.stringify(sessionObject)
    ).toString('base64');

    const Keyrip = require('keygrip');
    const keys = require('../config/keys');
    const keygrip = new Keyrip([keys.cookieKey]);

    // mimicing the seesion.sig(signature) in cookie
    const sig = keygrip.sign('session=' + sessionString);
     
    // when setting a cookie , we have to consider the domain , 
    // in this case, pupperteer navigate the Page object 
    // to localhost:3000 (see beforeEach) before we set the cookie
    // so we don't have to consider the domain
    await page.setCookie({ name: 'session.sig', value: sig });
    await page.setCookie({ name: 'session', value: sessionString });

    // we have to refresh the page to update the header 
    // so that it will then contain the new cookie
    await page.goto('localhost:3000');

    // waiting for the logout button to appear. 
    // without this, the $val line below will run before the button is loaded 
    // which casuse a test fail. 
    await page.waitFor('a[href="/auth/logout"]');

    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

    expect(text).toEqual('Logout');
});