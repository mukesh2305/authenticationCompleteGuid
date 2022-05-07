const redis = require('redis');

const client = redis.createClient({
    host: 6379,
    port: "127.0.0.1",
    legacyMode: true

});
client.connect();

client.on('connect', () => {
    console.log('Redis client connected to redis server');
})

client.on('ready', () => {
    console.log('Redis client connected to redis server and ready to use');
})

client.on('error', (err) => {
    console.log(err.message);
});


client.on('end', () => {
    console.log('Redis client disconnected from redis server');
});

process.on('SIGINT', () => {
    client.quit();
});


module.exports = client;