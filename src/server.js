const { PORT = 5000 } = process.env;

const app = require("./app.js");

const listener = () => console.log(`Listening on Port ${PORT}!`);
app.listen(PORT, listener);