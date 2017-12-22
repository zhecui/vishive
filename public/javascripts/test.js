var i = 0;


// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', function(e) {
  // Send the message back.
  console.log(e.data);
  self.postMessage('You said: ' + e.data);
}, false);


function timedCount() {
    i = i + 1;
    postMessage(i);
    setTimeout("timedCount()",500);
}

// timedCount();