/**
 * @author Zhe Cui, from PolyChrome by Karthik Badam
 * https://github.com/karthikbadam/PolyChrome
 * created in April 2016
 */

var screenCount = 1;
var screenIndex = 1;
var myclick = false;
var deviceId = "";
var scaleX = 1;
var scaleY = 1;
var screenWidth = 10;
var screenHeight = 10;
var documentOrigin = {
    x: 0,
    y: 0
};
var hostname = '';
var port = '';

var idealWidth = 1920;
var idealHeight = 1080;

/* parse page URL to get peerId and screen details*/
var selfUrl = document.URL;
var idCheck = /[?&]peerId=([^&]+)/i;
var spaceCheck = /[?&]spaceConfig=([^&]+)/i;
var displayCheck = /[?&]displayConfig=([^&]+)/i;
var hostCheck = /[?&]host=([^&]+)/i;
var portCheck = /[?&]port=([^&]+)/i;

/* get peerId */
var match;
if (match != null) {
    deviceId = match[1];
} else {
    deviceId = randomString(10);
}

/* get peer configurations */
match = spaceCheck.exec(selfUrl);
if (match != null) {
    screenCount = parseInt(match[1]);
} else {
    screenCount = 1;
}

match = displayCheck.exec(selfUrl);
if (match != null) {
    screenIndex = parseInt(match[1]);
} else {
    screenIndex = 1;
}

match = hostCheck.exec(selfUrl);
if (match != null) {
    hostname = match[1];
} else {
    hostname = window.location.hostname.split(":")[0];
}

match = portCheck.exec(selfUrl);
if (match != null) {
    port = '' + match[1];
} else {
    port = "3000";
}

// for visualization plot
// width and height of the canvas
var w = Math.min(720, document.documentElement.Width - 20), 
    h = w/1.5;
    var x = [], y = [];
    
    var dataset = {};
    var canvas_width = 1000;
    var canvas_height = 600;
    var padding = 50;  // for chart edges

    





/* arraylist of all connections */
var connections = [];

// indicate the current client is master or not
var master = false;


/* generate a random string if no ID is present */
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}



/* Method to add new peer details to the UI when connected */
function addNewPeer (connectedPeer) {
    $('#VisHive-connected-Peers').append('<div id="VisHive-connected-Peers-' + connectedPeer + '">' + connectedPeer + '</div>');
}

/* Method to delete peer which left the Hive when disconnected */
function removePeer (disconnectedPeer) {
    var div = document.getElementById("VisHive-connected-Peers-" + disconnectedPeer);
    div.parentNode.removeChild(div);
}


//sample application
// data and functions should be applied to the data
//randomNum function generates random integer number between 0 and 99
function randomWholeNum() {  
  return Math.floor(Math.random() * 100);
}

var arrLen = 2000;
var data = new Array(arrLen);
// generate plotted data format, i.e., the data before tranformation
var plotdata = new Array(arrLen);

function exportToCsv(filename, rows) {
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }


// generate random numbers and export to a csv file if uncommented
// initialization();
// exportToCsv("randomNumber.csv", data);

// generate random points
function initialization() {
    for (var i = 0; i < arrLen; i++) {
        data[i] = new Array(2);
        data[i][0] = randomWholeNum();
        data[i][1] = randomWholeNum();
    }



    for(var i = 0; i < arrLen; i++ ) {
        plotdata[i] = {};
        plotdata[i].id = i;
        plotdata[i].x = data[i][0];
        plotdata[i].y = data[i][1];
    }

}

function jobFunction(numbers) {
    var res = [],
        para1 = 1.5, para2 = 2;
    numbers.forEach(function(number){
        var number1 = number[0],
            number2 = number[1];
            res.push([para1 * number1,
                    para2 * number2]);
    });
    return res;

}

var defaultChunk = 200;
var unfinishChunk = [];
var processingChunk = [];
var dataResult = [];
var RawData = [];

var ChunkLen = Math.floor(arrLen / defaultChunk);

var update = false;





for (var i = 1; i <= defaultChunk; i++) {
    unfinishChunk.push(i);
}

// split data into small chunk for distributed processing
function splitData(ChunkNo) {
    if(ChunkNo > defaultChunk) {
        return;
    }
    return data.slice((ChunkNo - 1) * ChunkLen, ChunkNo * ChunkLen);
}

// merge data from multiple devices
function mergeData(ChunkNo, Chunkdata, data) {
    var pair = {};
    for (var i = (ChunkNo - 1) * ChunkLen; i < ChunkNo * ChunkLen; i++) {
        var pair = {};
        pair.id = i;
        pair.x = Chunkdata[i - (ChunkNo - 1) * ChunkLen][0];
        pair.y = Chunkdata[i - (ChunkNo - 1) * ChunkLen][1];
        data.push(pair);
    }
    return data;
}

function plot (data) {

    if(!update) {
    //create svg
    svg = d3.select("#scatterplot")  // This is where we put our vis
        .append("svg")
        .attr("width", canvas_width)
        .attr("height", canvas_height);

    xScale = d3.scale.linear()  // xScale is width of graphic
        .domain([d3.min(data, function(d) { return d.x; }), d3.max(data, function(d) { return d.x; })])
        .range([padding, canvas_width - padding]); // output range


    yScale = d3.scale.linear()  // yScale is height of graphic
        .domain([d3.min(data, function(d) { return d.y; }), d3.max(data, function(d) { return d.y; })])
        .range([canvas_height - padding, padding]);  // remember y starts on top going down so we flip

    xScale.domain([0, 150]);
    yScale.domain([0, 200]);


    // define x axis
    xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom");

    // define y axis
    yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

    // Add to X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (canvas_height - padding) +")")
        .call(xAxis);

    // Add to Y axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + padding +",0)")
        .call(yAxis);

     // Create Circles
    svg.selectAll("circle")
        .data(data, function (d) {
            // [{id: "", x: 0, y:0},{}]
            return d.id;
        })
        .enter()
        .append("circle")  // Add circle svg
        .attr("cx", function(d) {
            return xScale(d.x);  // Circle's X
        })
        .attr("cy", function(d) {  // Circle's Y
            return yScale(d.y);
        })
        .attr("fill", "red")
        .attr("r", 2.5);  // radius

    update = true;     

    }
    else {
        // xScale.domain([d3.min(data, function(d) { return d.x; }), d3.max(data, function(d) { return d.x; })]);

        // yScale.domain([d3.min(data, function(d) { return d.x; }), d3.max(data, function(d) { return d.x; })]);  // remember y starts on top going down so we flip
        

        // Update X Axis
        svg.select(".x.axis")
            .transition()
            .duration(10)
            .call(xAxis);

        // Update Y Axis
        svg.select(".y.axis")
            .transition()
            .duration(10)
            .call(yAxis);
        // Create Circles
        var circle = svg.selectAll("circle")
            .data(data, function (d) {
                // [{id: "", x: 0, y:0},{}]
                return d.id;
            });

        // circle.exit().remove();
        
        circle.enter().append("circle")
            .attr("r", 2.5);

        circle.transition()  // Transition from old to new
            .duration(30)
            .each("start", function() {  // Start animation
                d3.select(this)  // 'this' means the current element
                    .attr("fill", "blue")  // Change color
                    .attr("r", 4);  // Change size
            })
            .ease("linear")
            .attr("id", function (d){ return d.id;}) // Add circle svg
            .attr("cx", function(d) { return xScale(d.x); })
            .attr("cy", function(d) { return yScale(d.y); });
            // .each("end", function() {  // End animation
            //     d3.select(this)  // 'this' means the current element
            //         .transition()
            //         .duration(200)
            //         .attr("fill", "red")  // Change color
            //         .attr("r", 2.5);  // Change radius
            // });
    }
    


    

}



// web workers for master
var w;


function startWorker() {
    if(typeof(Worker) !== "undefined") {

        if(typeof(w) == "number") {
            console.log(typeof(w));
            w = new Worker("javascripts/webworker.js");
            // Setup an event listener that will handle messages received from the worker.
            w.addEventListener('message', function(e) {
                // Log the workers message.
                if(e.data == 'ready') {
                    if(unfinishChunk.length > 0) {
                        var senData = {};
                        var ChunkNo = unfinishChunk[0];
                        senData.no = ChunkNo;
                        senData.data = splitData(ChunkNo);
                        w.postMessage(senData);
                        processingChunk.push(ChunkNo);
                        unfinishChunk.shift();
                        // $('#VisHive-computing').append('<div id="VisHive-actions-' + ChunkNo + '-tab"> sending data to webworkers! data chunk number is ' + ChunkNo + '</div>');

                    }
                }
                else {
                    var chunkNo = e.data.no;
                    var index = processingChunk.indexOf(chunkNo);
                    if(index > -1) {
                        processingChunk.splice(index, 1);
                    }
                    dataResult = mergeData(chunkNo, e.data.data, dataResult);
                    plot(dataResult);
                    if(unfinishChunk.length == 0 && processingChunk.length == 0) {
                        console.log("job finished!");
                        return;
                    }
                }
            
        });
        w.postMessage("run");
        w.onmessage = function(event) {
            document.getElementById("VisHive-Actions").innerHTML = "web worker is working!";
        };
    }
    } else {
        document.getElementById("VisHive-Actions").innerHTML = "Sorry, your browser does not support Web Workers...";
    }
}

function stopWorker() { 
    w.terminate();
    w = 0;
}
// $.get
// $.ajax({
//     type: 'POST',
//     data: JSON.stringify(data),
//     contentType: 'application/json',
//     url: 'http://localhost:3000/',                      
//     success: function(data) {
//         console.log('success');
//         console.log(data);
//     }
// });




// visualization variables
var svg;
var xScale, yScale; // scale function variable, updated when new data comes in
var xAxis, yAxis; // x, y axis variable


var peer = new Peer(deviceId, {
    host: hostname,
    port: 8000,
    path: '/VisHive',
    key: 'peerjs'
});

peer.on('open', function (id, clientIds) {
    $('#VisHive-id').text("Your PeerJS ID: " + id);

    peer.listAllPeers(function (clientIds) {
        // The first connected client is the master.
        if(clientIds.length == 1 && deviceId == clientIds) {
            initialization();
            plot(plotdata);
            master = true;
            $('#VisHive-id').append('<div id="VisHive-id-master"> You are the master! </div>');
        }
        else {
            clientIds.forEach(function (peerid) {
                if (peerid == deviceId) {
                    return;
                }
                var conn = peer.connect(peerid);

                conn.on('open', function () {
                        connections.push(conn);
                        addNewPeer(conn.peer);
                });
                conn.on('data', function (data) {
                    //receive master message, send back ready to master
                    if(data == "master"){
                        $('#VisHive-id').append('<div id="VisHive-id-master"> master Id is ' + peerid + '</div>');
                        conn.send("ready");
                        return;
                    }
                    else if(data == "change") {
                        console.log("master changed!")
                    }
                    else if(typeof data == 'object') {
                        var procData = {};
                        procData.data = jobFunction(data.data);
                        procData.no = data.no;
                        conn.send(procData);
                        
                        // console.log(procData);
                        conn.send("ready");
                    }
                    //  && deviceId == clientIds[0]
                    
                    // console.log(deviceId);
                    console.log(clientIds[0]);
                    
                });
            });
        }
    });
});
/* make sure that peerjs connections are handled by the connect function */
peer.on('connection', connect);



function connect(conn) {
    conn.on('open', function () {
        connections.push(conn);
        if(master){
            addNewPeer(conn.peer);
            conn.send("master");
        }
        else {
            addNewPeer(conn.peer);
            conn.send("ready");
        }
    });

    conn.on('data', function(data) {

        //if current node is master, and receive 'ready' indicator, 
        // the slave is ready for processing data, 
        // we start sending data and functions to it.
        if(master) {
            // jobProcessing(data);
            if(data == 'ready') {
                if(unfinishChunk.length > 0) {
                    var senData = {};
                    var ChunkNo = unfinishChunk[0];
                    senData.no = ChunkNo;
                    senData.data = splitData(ChunkNo);
                    conn.send(senData);
                    RawData = mergeData(ChunkNo, senData.data, RawData);
                    // plot(RawData);
                    processingChunk.push(ChunkNo);
                    unfinishChunk.shift();
                    if(unfinishChunk.length == 0) {
                        // plot(RawData);
                    }
                    $('#VisHive-computing').append('<div id="VisHive-actions-' + conn.peer + '-tab"> sending data to ' + conn.peer + ', data chunk number is ' + ChunkNo + '</div>');
                }
            }
            else {
                var chunkNo = data.no;
                var index = processingChunk.indexOf(chunkNo);
                if(index > -1) {
                    processingChunk.splice(index, 1);
                }
                // console.log(data);
                // console.log("received chunk NO. is ", data);
                // console.log("peer id is ", conn.peer);
                dataResult = mergeData(chunkNo, data.data, dataResult);
                plot(dataResult);
                //console.log("received result is ", data);
                if(unfinishChunk.length == 0 && processingChunk.length == 0) {
                    // plot(dataResult);
                    console.log(dataResult);
                    console.log("job finished!");
                    
                    return;
                }
            }



            // svg.select("#"+datum.id).attr("cx", datum.x).attr("cy", datum.y)
        }
    });

    conn.on("close", function() {
        removePeer(conn.peer);
        console.log(conn.peer, " is closed!");
    });
}



// var socket = io.connect('http://localhost:8000');
// socket.on('peerlist', function (data) {
//     console.log(data);
//     // socket.emit('my other event', { my: 'data' });
// });


