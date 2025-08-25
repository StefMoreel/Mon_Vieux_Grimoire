const http = require('http');
const app = require('./app');

const normalizePort = val => {
  const port = parseInt(val, 10); // Parse the port value as an integer

  if (isNaN(port)) {  
    return val; // Named pipe 
  }
  if (port >= 0) {
    return port; // Port number
  }
  return false; // Invalid port
};
const port = normalizePort(process.env.PORT ||'4000');
app.set('port', port); // Set the port for the Express application instance 

const errorHandler = error => {
  if (error.syscall !== 'listen') { // If the error is not related to the listen syscall, rethrow it 
    throw error;
  }
  const address = server.address(); // Get the address info of the server 
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port; // Determine if it's a pipe or port for logging 
  switch (error.code) { // Handle specific listen errors with friendly messages
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.'); // Log error message for permission issues 
      process.exit(1); // Exit the process with failure code
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.'); // Log error message for address already in use 
      process.exit(1); // Exit the process with failure code
      break; 
    default: 
      throw error; // Rethrow any other errors 
  }
};

const server = http.createServer(app); // Create an HTTP server using the Express application instance 

server.on('error', errorHandler); // Attach the error handler to the server
server.on('listening', () => { 
  const address = server.address(); // Get the address info of the server
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port; // Determine if it's a pipe or port for logging 
  console.log('Listening on ' + bind); // Log that the server is listening on the specified address
});

server.listen(port); // Start the server and have it listen on the specified port 