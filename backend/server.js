const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');

const port = process.env.PORT || 9000;
const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
    console.log("server is running on port " + port);
})