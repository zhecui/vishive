/**
 * @author Zhe Cui, part from PolyChrome by Karthik Badam
 * https://github.com/karthikbadam/PolyChrome
 * created in April 2016
 * Used: Node.js, PeerJS, WebRTC, D3, etc.
 */

 var screenCount = 1;
 var screenIndex = 1;
 var deviceId = "";

 var hostname = '';
 var port = '';

 /* parse page URL to get peerId and screen details*/
 var selfUrl = document.URL;
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
    var padding = 100;  // for chart edges

    /* arraylist of all connections */
    var connections = [];

// indicate the current client is master or not
var master = false;
var matrix_X = [];

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


/* Application specific params */
var arrLen = 5000;
var data = new Array(arrLen);
// generate plotted data format, i.e., the data before tranformation

var defaultChunk = 20;
var unfinishChunk = [];
var processingChunk = [];
var finishedChunk = [];
var dataResult = [];
var RawData = [];

var ChunkLen = Math.floor(arrLen / defaultChunk);

var update = false;
var scanned = new Array(arrLen);
for (var i = 1; i <= defaultChunk; i++) {
    unfinishChunk.push(i);
}

/* This is the function on the client side for computation */
function jobFunction(numbers, index) {
    var res = new Array(index[1] - index[0] + 1);
    for(var i = index[0]; i <= index[1]; i++ ) {
        res[i - index[0]] = new Array(numbers.length).fill(0);
        for (var j = Math.max(i, 0) + 1; j < numbers.length; j++) {
            res[i - index[0]][j] = distance(numbers[i], numbers[j]);
        } 
    }
    console.log("res is ", res);
    return res;
}

function distance(p, q) {
    var sum = 0;
    var i = Math.min(p.length, q.length);

    while (i--) {
        sum += (p[i] - q[i]) * (p[i] - q[i]);
    }
    return Math.sqrt(sum);
}

// split data into small chunk for distributed processing
function splitData(ChunkNo, data) {
    if(ChunkNo > defaultChunk) {
        return;
    }
    return data.slice((ChunkNo - 1) * ChunkLen, ChunkNo * ChunkLen);
}

// merge data from multiple devices
function mergeData(ChunkNo, Chunkdata, data) {
    var pair = {};
    for (var i = (ChunkNo - 1) * ChunkLen; i < ChunkNo * ChunkLen; i++) {
        pair.id = i;
        pair.x = Chunkdata[i - (ChunkNo - 1) * ChunkLen][0];
        pair.y = Chunkdata[i - (ChunkNo - 1) * ChunkLen][1];
        data.push(pair);
    }
    return data;
}

/* Clustering colors: different colors for different clusters */
var cValue = function(d) { return d.group;},
color = d3.scale.category10();


function plot(data) {
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

    // xScale.domain([0, 150]);
    // yScale.domain([0, 200]);

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
        // .append("text")
        // .attr("class", "label")
        // // .attr("x", 6)
        // // .attr("dx", ".8em")
        // .style("text-anchor", "end")
        // .text("x axis");

    // Add to Y axis
    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + padding +",0)")
    .call(yAxis);
        // .append("text")
        // .attr("class", "label")
        // .attr("transform", "rotate(-90)")
        // // .attr("y", 6)
        // // .attr("dy", ".8em")
        // .style("text-anchor", "end")
        // .text("y axis");
        console.log("attribute is ", data);
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
        // .style("fill", function(d) {
        //     return color(cValue(d));
        // })
        .style("fill", "636363")
        .style("stroke", "636363")
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
                .style("fill", function(d) {
                    return color(cValue(d));
        })  // Change color
                    .attr("r", 2.5);  // Change size
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

    /* Web worker configuration part */
// web workers for master
var w;

function startWorker() {
    if(typeof(Worker) != "undefined") {
        if(typeof(w) == "number") {
            w = new Worker("javascripts/webworker_dbscan.js");
            // Setup an event listener that will handle messages received from the worker.
            w.addEventListener('message', function(e) {
                var ChunkNo;
                // Log the workers message.
                if(e.data == 'ready') {
                    if(unfinishChunk.length > 0 || finishedChunk.length != defaultChunk) {
                        var senData = {};
                        ChunkNo = unfinishChunk.length != 0 ? unfinishChunk[0] : processingChunk[0];
                        senData.no = [ChunkNo, ChunkLen];
                        senData.data = matrix_X;
                        w.postMessage(senData);
                        processingChunk.push(ChunkNo);
                        if(unfinishChunk.length != 0) {
                            unfinishChunk.shift();
                        }
                        else {
                            processingChunk.shift();
                        }
                        
                        $('#VisHive-computing').append('<div id="VisHive-actions-' + ChunkNo + '-tab"> sending data to webworkers! data chunk number is ' + ChunkNo + '</div>');
                    }
                }
                else {
                    var chunkNo = e.data.no[0];
                    var index = processingChunk.indexOf(chunkNo);
                    if(index > -1) {
                        processingChunk.splice(index, 1);
                    }
                    for (var i = ChunkLen * (chunkNo - 1); i < chunkNo * ChunkLen; i++) {
                        scanned[i] = [];
                        scanned[i] = e.data.data[i - ChunkLen * (chunkNo - 1)];
                    }
                    finishedChunk.push(ChunkNo);
                    move(finishedChunk.length * 1.0 * 100 / defaultChunk);
                    // console.log(data.data);
                    if(unfinishChunk.length === 0 && processingChunk.length === 0) {
                        var dbscan = new DBSCAN();
                        // console.log(dbscan);
                        var clusters = dbscan.run(matrix_X, 18000, 3, scanned);
                        for (i = 0; i < clusters.length; i++) {
                            for(var j = 0; j < clusters[i].length; j++ ) {
                                plotdata[clusters[i][j]].group = i;
                            }
                        }
                        plot(plotdata);
                        console.log(clusters);
                        console.log("job finished!");
                        var end = new Date().getTime();
                        var time = end - start;
                        console.log(time);
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

/* job process callback function */
var plotdata = [];
//callback function for d3.csv
// this is data pre processing function and it can only be inserted here
// in order to get it run (why outside declaration is not suitable?)
function dataPreProcess(data){
    // function converToMatrix(data) {
        for(var i = 0; i < data.length; i++ ){
            var rowdata = [];
            for (var j in data[i]) {
                rowdata.push(+data[i][j]);
            }
            matrix_X.push(rowdata);
        // console.log(matrix_X.length);
    }
    
    for (i = 0; i < matrix_X.length; i++) {
        var point = {};
        point.id = i;
        point.group = 0;
        point.x = matrix_X[i][0];
        point.y = matrix_X[i][1];
        plotdata.push(point);
    }
    plot(plotdata);
    peer.on('connection', connect1); 
}

function connect1(conn) {
    conn.on('open', function () {
        connections.push(conn);
        addNewPeer(conn.peer);
        conn.send("master");

    });

    conn.on('data', function(data) {
        // console.log(data);
        //if current node is master, and receive 'ready' indicator, 
        // the slave is ready for processing data, 
        // we start sending data and functions to it.
        if(master) {            
            // dataPreProcessing(data);
            var ChunkNo;
            if(data == 'ready') {
                if(unfinishChunk.length > 0 || finishedChunk.length != defaultChunk) {
                    var senData = {};
                    ChunkNo = unfinishChunk.length != 0 ? unfinishChunk[0] : processingChunk[0];
                    senData.no = ChunkNo;
                    senData.data = matrix_X;
                    conn.send(senData);
                    processingChunk.push(ChunkNo);
                    if(unfinishChunk.length != 0) {
                        unfinishChunk.shift();
                    }
                    else {
                        processingChunk.shift();
                    }
                    // console.log(senData);
                    $('#VisHive-computing').append('<div id="VisHive-actions-' + conn.peer + '-tab"> sending data to ' + conn.peer + ', data chunk number is ' + ChunkNo + '</div>');
                }
            }
            else {
                var chunkNo = data.no;
                var index = processingChunk.indexOf(chunkNo);
                if(index > -1) {
                    processingChunk.splice(index, 1);
                }
                for (var i = ChunkLen * (chunkNo - 1); i < chunkNo * ChunkLen; i++) {
                    scanned[i] = data.data[i - ChunkLen * (chunkNo - 1)];
                }
                finishedChunk.push(ChunkNo);
                move(finishedChunk.length * 1.0 * 100 / defaultChunk);
                // console.log(data.data);
                if(unfinishChunk.length === 0 && processingChunk.length === 0) {
                    var dbscan = new DBSCAN();
                    // console.log(dbscan);
                    var clusters = dbscan.run(matrix_X, 18000, 3, scanned);
                    for (i = 0; i < clusters.length; i++) {
                        for(var j = 0; j < clusters[i].length; j++ ) {
                            plotdata[clusters[i][j]].group = i;
                        }
                    }
                    plot(plotdata);
                    console.log(clusters);
                    $('#Status').text("Congrats! The job is perfectly done!");
                    console.log("job finished!");
                    var end = new Date().getTime();
                    var time = end - start;
                    console.log(time);
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

// visualization plot variables
var svg;
var xScale, yScale; // scale function variable, updated when new data comes in
var xAxis, yAxis; // x, y axis variable

// data matrix

var start = new Date().getTime();

var peer = new Peer(deviceId, {
    host: hostname,
    port: 8000,
    path: '/VisHive',
    key: 'peerjs'
});

peer.on('open', function (id, clientIds) {
    peer.listAllPeers(function (clientIds) {
        // The first connected client is the master.
        if(clientIds.length == 1 && deviceId == clientIds) {
            master = true;
            d3.csv("/datasets/DBSCAN_s1_5000.csv", 
                dataPreProcess);
            console.log("master");
            $('#VisHive-id').append('<div id="VisHive-id-master"> ID: ' + id + '(master)</div>');
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
                    console.log(data);
                    //receive master message, send back ready to master
                    if(data == "master"){
                        $('#VisHive-id').append('<div id="VisHive-id-master"> master Id is ' + peerid + '</div>');
                        conn.send("ready");
                        console.log("sending ready");
                        return;
                    }
                    else if(data == "change") {
                        console.log("master changed!");
                    }
                    else if(typeof data == 'object') {
                        var procData = {};
                        console.log("before is ", data);
                        var index = [(data.no - 1) * ChunkLen, data.no * ChunkLen - 1];
                        console.log("index is ", index);
                        procData.data = jobFunction(data.data, index);
                        console.log("after is ", procData.data);
                        procData.no = data.no;
                        conn.send(procData);
                        $('#VisHive-computing').append('<div id="VisHive-actions-' + procData.no + '-tab"> receiving data from master! data chunk number is ' + procData.no + '</div>');
                        conn.send("ready");
                    }
                    // console.log(deviceId);  
                });
            });
        }
    });
});

/* make sure that peerjs connections are handled by the connect function */
peer.on('connection', connect);
function connect(conn) {
    conn.on('open', function () {
        // connections.push(conn);
        // console.log(conn);
        // if(master){
        //     addNewPeer(conn.peer);
        //     conn.send("master");
        //     console.log("sending data");
        // }
        // else {
            if(!master) {
                console.log("slave");
                addNewPeer(conn.peer);
                conn.send("ready");
            }
        // }
    });
}






