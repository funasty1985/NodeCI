const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

// We want to have a class to inheritate the properties of Page class 
// while having extra functions. 
// Although we can achieve such by subclassing CustomPage to Page using 'extend',
// there is no easy way to make pupperteer to use CustomPage class instead of Page class. 

// So we set a static method on CustomPage to do so where 
// a page instance is created when CustomPage.build() is called.
// The page instance is passed to the constructor , 
// later when instance of customPage is created (says customPage) and customPage.login() is called 
// pupperteer can use the page instance we created in the static method to set cookies. 

// We can create a Page instance(e.g page) outside CustomPage and pass the instance when 
// CustomPage is instantiated {ie const customPage = new CustomPage(page)},
// calling customPage.login() will be ok 
// However, if we have to use Page method in customPage , such as Page.prototype.goto , 
// we have to call customPage.page.goto(). 
// Using static way above will have a better encapsulation as it can call Page.prototype.goto directly 
// by customPage.goto . This enhanced encapsulation is achieved by using the Proxy class at the static method

// Alternatively, we can use the way in cache.js to change the properties of Page class , see line41 
class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: false
        });

        const page = await browser.newPage();
        const customPage = new CustomPage(page); // see constructor 

        return new Proxy(customPage, {
            get: function(target, property) {
                return customPage[property] || browser[property] || page[property];  // priority is important as different classes 
            }                                                                        // may have methods with the same name
                                                                                     // the lefter and higher the priority                                                                           
        });
    }

    // see the instaniation of CustomPage at static build
    // we save a referrence of the page instance 
    constructor(page) {
        this.page = page;
    }

    async login(){
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);
         
        // when setting a cookie , we have to consider the domain , 
        // in this case, pupperteer navigate the Page object 
        // to localhost:3000 (see beforeEach) before we set the cookie
        // so we don't have to consider the domain
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.setCookie({ name: 'session', value: session });
    
        // we have to refresh the page to update the header 
        // so that it will then contain the new cookie
        await this.page.goto('localhost:3000');
    
        // waiting for the logout button to appear. 
        // without this, the $val line below will run before the button is loaded 
        // which casuse a test fail. 
        await this.page.waitFor('a[href="/auth/logout"]');
    }
}

module.exports = CustomPage;

