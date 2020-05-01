const Page = require('./helpers/page')

let page;

beforeEach(async()=>{
    page = await Page.build();  // instantiate the CustomPage class

    await page.goto('localhost:3000');
});

afterEach(async() => {
    await page.close();
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
test('When signed in, shows logout button', async ()=> {  
    await page.login()

    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

    expect(text).toEqual('Logout');
});