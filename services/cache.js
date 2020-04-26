const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://172.17.0.2';
const client = redis.createClient(redisUrl);

// client.get from node-redis doesn't return a promise object, 
// but instead accepting a callback to handle its returned result
// e.g client.get('key',(r)=>{console.log(r)}) 
// promisify will overwrite client.get and make it return a promise object
// so that the new client.get is easier to read and write. 
client.hget = util.promisify(client.hget);

//  store the original exec method of Query class of mongoose
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options= {}){
    // we created an new attribute userCache to Query class 
    // to act as a flag to check if the overwritting process of Query.exec is needed 
    // ie. Blog.find({ _user: req.user.id }) -> no overwritting 
    // while Blog.find({ _user: req.user.id }).cache() will do so. 
    this.useCache =true;

    //  Top level cache key
    //  we created an new attribute hashKey to Query class
    //  to store the top level cache key ie req.user.id , 
    //  here we are using the nested Hashes key approach 
    this.hashKey = JSON.stringify(options.key || '');

    // making .cache chainable to aonther methods of Query class
    // eg. Blog.find({ _user: req.user.id }).cache().limit(10)
    return this;
}

// no arrow function here since it messes arround 'this' inside the func
// if we use class way to define function , this is always referred to 
// an object instantiated from the Query class 
// ie. it is a query which is going to be executed 
// query example : Blog.find({ _user: req.user.id })
mongoose.Query.prototype.exec = async function (){
    if (!this.useCache){
        return exec.apply(this, arguments)
    }

    // this.getQuery() returns the profile object of the Query 
    // we don't want to directly modify it which may lead to 
    // unexpected query result

    // the nested (second level)cache key 
    // query + collect form is consistant and unique key for redis 
    // const key = {...this.getQuery(), {colloection: this.mongooseCollection.name}}
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    // See if we have a value for 'key' in redis
    const cacheValue = await client.hget(this.hashKey, key);

    // If we do, return that 
    if (cacheValue){

        // JSON.parse(cacheValue)
        // if cacheValue is a single record of JSON -> js object 
        // if cacheValue is a record list of JSON -> js objects Array [{}, {} ....]
        console.log('cacheValue check :::', cacheValue)

        const doc = JSON.parse(cacheValue)

        return Array.isArray(doc) 
            ? doc.map(d => new this.model(d))
            : new this.model(doc);
            // Query.exec is expected to return a mongodb document instead of a js object 
            // model is a basic class of a mongofb document (see console.log(this))
            // we instantiate a mongodc document by this.model(JSON.parse(cacheValue)),
            // which is the same as new Blog({title: '...', content: '....'})
            // const doc = new this.model(JSON.parse(cacheValue))
    };

    // Otherwise, issue the query and store the result in redis
    // execute the original Query.exec()
    const result = await exec.apply(this, arguments);
    
    
    // const "result" above stored the data retrieved from mongoose query  
    // ( which is the same as Model.find(query) )
    // Although the return data , appearently, looks like a JSON
    // it is a document instance from mongodb. 
    // Document instance have extra method which is absent in JSON 
    // Note that we can only store string (JSON is string) but not js object nor mongodb documnet to redis.
    // We have to convert result (document object) to JSON before saving to redis 
    client.hset(this.hashKey,key , JSON.stringify(result), 'EX', 10);

    return result;
}

module.exports = {
    clearHash(hasKey) {
        client.del(JSON.stringify(hasKey))
    }
};