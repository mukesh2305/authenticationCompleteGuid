const mongoose = require('mongoose');

mongoose.connect(process.env.MONGOD_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}
).catch((err) => {
    console.log(err.message);
});


mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log(err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

// when in our application we use ctrl+c to disconnect from mongodb
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});