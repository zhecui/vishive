/**
 * @author Zhe Cui, from PolyChrome by Karthik Badam
 * https://github.com/karthikbadam/PolyChrome
 * created in Nov 2016
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
var canvas_width = 1200;
var canvas_height = 800;
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







var arrLen = 200000;
var data = new Array(arrLen);
// generate plotted data format, i.e., the data before tranformation
var plotdata = {};
plotdata["nodes"] = [];
plotdata["links"] = [];
plotdata["tf"] = {};

var defaultChunk = 10;
var unfinishChunk = [];
var processingChunk = [];
var dataResult = [];
var RawData = [];

var ChunkLen = Math.floor(arrLen / defaultChunk);

var update = false;

// queue to store all the links from the existing
// and additional following pages
var links_queue = [{"source": "Machine_learning", "link": "Natural_language_processing"}, 
    {"source": "Machine_learning", "link": "Deep_learning"}];
var processed_links = [];
var processed_data = [];
// Store TF for different pages, should be made global
var TFStorage ={};

// merge data from multiple devices
function mergeData(data, TFStorage) {
    var analysis = {};
    analysis.TFStorage = TFIDF.storeTermFrequencies(data.data, TFStorage);
    analysis.IDF = TFIDF.normalizeTermFrequencies(data.data, analysis.TFStorage);
    analysis.mostUniqueTerms = TFIDF.identifyUniqueTerms(analysis.IDF);
    // console.log(analysis);
    return analysis;
}

function plot (data) {

    if(!update) {
    //create svg
    svg = d3.select("#scatterplot")  // This is where we put our vis
        .append("svg")
        .attr("width", canvas_width)
        .attr("height", canvas_height);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Define the div for the tooltip
    var tooltip_div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(10))
    .force("collide", d3.forceCollide().radius(18).iterations(1))
    .force("center", d3.forceCenter(canvas_width / 2, canvas_height / 2));

    var link = svg.selectAll("line")
      .attr("class", "links")
    .data(data.links)
    .enter().append("line");
    // .style("stroke", "#636363")
    // .style("stroke-width", 1);
      // .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.selectAll("g")
                .attr("class", "nodes")
                .data(data.nodes)
                .enter()
                .append("g");

    node.append("circle")
        .attr("fill", function(d) { return color(d.source); })
        .attr("r", 15)
        .on("mouseover", function(d) {      
            tooltip_div.transition()        
                .duration(200)      
                .style("opacity", 1.0);      
            tooltip_div .html(stringTooltip(d.id, data))
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");    
            })                
        .on("mouseout", function(d) {       
            tooltip_div.transition()        
                .duration(500)      
                .style("opacity", 0);   
        });
        // .call(d3.drag()
        //   .on("start", dragstarted)
        //   .on("drag", dragged)
        //   .on("end", dragended));

    node.append("text")
      .attr("class", "node_label")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text(function(d) { return stringInitial(d.id); });

    simulation
      .nodes(data.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(data.links);
      // .distance(50);

    function stringTooltip(id, data) { 
        var stringShow = "";
        stringShow += "<b>Page Name: " + id + "</b></br>"
                + "Top frequent terms:</br>";
        for(var i = 0; i < data.tf[id].length; i++ ) {
            stringShow += data.tf[id][i] +"</br>";
        }      
        return stringShow;          
    }

    function stringInitial(inputString) {
        var initials = "";
        var splitted = inputString.split("_");
        console.log(splitted);
        for(var i = 0; i < splitted.length; i++ ) {
            if(splitted[i] != "" && splitted[i] != "and") {
                initials = initials.concat(splitted[i].toUpperCase().charAt(0));
                if(initials.length >= 3) {
                    break;
                }
            }
        }
        return initials;
    }
    function ticked() {
        link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

        node
        // .attr("cx", function(d) { return d.x; })
        // .attr("cy", function(d) { return d.y; });
        .attr("transform", function (d) {

            // return "translate(" + d.x + "," + d.y + ")";
            return "translate(" + Math.max(15, Math.min(canvas_width - 15, d.x))
             + "," + Math.max(8, Math.min(canvas_height - 15, d.y)) + ")";
        });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }



    update = true;     

    }
    else {

        
    }
}



// web workers for master
var w;


function startWorker() {
    if(typeof(Worker) !== "undefined") {

        if(typeof(w) == "number") {
            w = new Worker("javascripts/webworker_ids.js");
            // Setup an event listener that will handle messages received from the worker.
            w.addEventListener('message', function(e) {
                // Log the workers message.
                if(e.data == 'ready') {
                    if(unfinishChunk.length > 0) {
                        var senData = {};
                        var ChunkNo = unfinishChunk[0];
                        senData.no = ChunkNo;
                        senData.data = splitData(ChunkNo, matrix_X);
                        w.postMessage(senData);
                        processingChunk.push(ChunkNo);
                        unfinishChunk.shift();

                    }
                }
                else {
                    var chunkNo = e.data.no;
                    var index = processingChunk.indexOf(chunkNo);
                    if(index > -1) {
                        processingChunk.splice(index, 1);
                    }
                    console.log(e.data);
                    if(unfinishChunk.length == 0 && processingChunk.length == 0) {
                        console.log("job finished!");
                        var end = new Date().getTime();
                        var time = end - start;
                        console.log(time);
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



// visualization variables
var svg;
var xScale, yScale; // scale function variable, updated when new data comes in
var xAxis, yAxis; // x, y axis variable

var start = new Date().getTime();

function jobFunction(page, new_links, termFrequency, success, callback) {
$(document).ready(function(){
    // for(var i = 0; i < page.length; i++ ) {
    curr_url = "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&redirects=yes&page="+ page + "&callback=?";
    $.ajax({
        type: "GET",
        url: curr_url,
        contentType: "application/json; charset=utf-8",
        async: true,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            // console.log(data);
            if(data.hasOwnProperty("error")) {
                success = false;
                callback();
                return;
            }
            var markup = data.parse.text["*"];
            var blurb = $('<div></div>').html(markup);
    
            blurb.find('a').each(function() {
                var link = $(this);
                var relativePath = link.attr('href').substring(1); // remove leading slash
                if(relativePath.substring(0, 5) == "wiki/" && !relativePath.substring(5).includes(":")) {
                    pageName = relativePath.substring(5);
                    new_links.push(pageName);
                }
                // remove links from the page
                $(this).replaceWith($(this).html());
                // console.log(link);
            }); 

            // remove any references
            blurb.find('sup').remove();
 
            // remove cite error
            blurb.find('.mw-ext-cite-error').remove();
            $('#article').html($(blurb).find('p'));
            var textContent = $(blurb).text().replace(/(\r\n|\n|\r|\^|\d+)/gm, " ").replace(/[^a-zA-Z]/g, " ");//.removeStopWords();
            termFrequency = TFIDF.countTermFrequencies(textContent);
            success = true;
            // console.log(termFrequency);
            callback(termFrequency);
        },
        error: function (errorMessage) {
            console.log(errorMessage);
            success = false;
            callback(0);
        }
    });
// }
});
}


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
            // plot(plotdata);
            master = true;
            // converToMatrix(inData);
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
                    //receive master message, send back ready to master
                    if(data == "master"){
                        $('#VisHive-id').append('<div id="VisHive-id-master"> ID: ' + id + '</div>');
                        conn.send("ready");
                        return;
                    }
                    else if(data == "change") {
                        console.log("master changed!")
                    }
                    else if(typeof data == 'object') {
                        var procData = {};
                        // console.log("before is ", data);
                        procData.data = {};
                        procData.links = [];
                        var success = true;
                        jobFunction(data.data, procData.links, procData.data, success, function(termFrequency) {
                            // console.log("after is ", procData.links);
                            if(!success) {
                                var index = processingChunk.indexOf(link);
                                if(index > -1) {
                                    processingChunk.splice(index, 1);
                                }
                            } else {
                                procData.data = termFrequency;
                                procData.no = data.no;
                                procData.source = data.source;
                                conn.send(procData);
                                
                                // console.log(procData);
                                conn.send("ready");
                            }
                        });
                        
                    }
                    
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
            console.log("sending data");
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
            if(data == 'ready') {
                if(links_queue.length > 0) {
                    var senData = {};
                    var links_chunk = links_queue.shift();
                    senData.no = links_chunk.link;
                    senData.source = links_chunk.source;
                    senData.data = links_chunk.link;
                    conn.send(senData);
                    processingChunk.push(links_chunk);
                    // links_queue.shift();
                    $('#VisHive-computing').append('<div id="VisHive-actions-' + conn.peer + '-tab"> sending data to ' + conn.peer + ', data chunk number is ' + 0 + '</div>');
                }
            }
            else {
                var link = data.no;
                for (var i = 0; i < Math.min(90, data.links.length); i++ ) {
                    if(processed_links.filter(function(ind_link) {
                        return ind_link.link == data.links[i];}).length == 0) {
                        links_queue.push({"source":link, "link":data.links[i]});
                    }
                }
                // links_queue = links_queue.concat(data.links.slice(0, Math.min(100, data.links.length)));
                var index = processingChunk.indexOf(link);
                if(index > -1) {
                    processingChunk.splice(index, 1);
                }
                if(processed_links.filter(function(ind_link) {
                        return ind_link.link == data.links[i];}).length == 0) {
                    processed_links.push({"source":data.source, "link":link});
                }
                // console.log(plotdata);
                var analysis = mergeData(data, TFStorage);
                processed_data.push(analysis.mostUniqueTerms.slice(0, 10));
                if(processed_links.length >= 1000) {
                    for(var i = 0; i < processed_links.length; i++ ) {
                        if(i == 0) {
                            plotdata["nodes"].push({"id":processed_links[i].source, "source": processed_links[i].source});
                        }
                        plotdata["nodes"].push({"id":processed_links[i].link, "source": processed_links[i].source});
                        plotdata["links"].push({"source":processed_links[i].source, "target":processed_links[i].link});
                        plotdata["tf"][processed_links[i].link] = processed_data[i];
                }
                var end = new Date().getTime();
                    var time = end - start;
                    console.log(time);
                console.log(plotdata);
                    plot(plotdata);
                    console.log("job finished!");
                    links_queue = [];
                    
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









