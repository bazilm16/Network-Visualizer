// Set up the SVG
var width = window.innerWidth;
var height = window.innerHeight;

// Generate an SVG element on the page
var svg = d3.select("body").append("svg")
    .attr("id", "svg-container")
    .attr("width", width)
    .attr("height", height * 1.25);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2));

//custom look
var lineStrokeColor = "#aaa";
var lineStrokeWidth = 4;
var nodeStrokeWidth = 0;
var colorPallete = ["#4d4d4d", "#5da5da", "#60bd68", "#f17cb0", "#b2912f", "#b276b2", "#decf3f", "#f15854", "#5D4037"];

function uploadFile() {
    try {
        const fileObj = typeof (FileReader) !== "undefined" ?
            document.getElementById("file-to-upload").files[0] : undefined;
        if (typeof fileObj !== "undefined") {
            var filePath = document.getElementById("file-to-upload").value.split("\\").reverse()[0];
            if (fileObj.size > 0 && fileObj.size <= 2500000) {
                const fileReader = new FileReader();
                fileReader.onloadend = function (e) {
                    const fileData = e.target.result.trim().split("\n");
                    document.getElementById("visualization-title").innerHTML = fileData[0];
                    fileData.shift();
                    displayData(prepareData(fileData));
                    document.getElementById("file-name").innerHTML = filePath;
                };
                try {
                    fileReader.readAsText(fileObj);
                } catch (e) {
                    console.error("The file failed to do justice");
                }
            } else {
                console.log("The file object is undefined");
            }
        }else {
            throw "File Object is undefined";
        }
    }catch(e){
        console.log("The file failed with error: " + e.message);
    }
}

//checks to see if a node exists in a node array
function nodeIndexOf(nodeArr, srcVal){
    for(var i = 0; i < nodeArr.length; i++) {
        if(nodeArr[i].id === srcVal) {
            return i;
        }
    }
    return -1;
}

function getNodeSizeRange(nodes) {
    var minSize = 1000;
    var maxSize = 0;
    for (var x = 0; x < nodes.length; x++) {
        minSize = Math.min(minSize, nodes[x].size);
        maxSize = Math.max(maxSize, nodes[x].size);
    }
    return [minSize, maxSize];
}

/**
 * generates the graph
 * @param data the array of connections read from the file
 * @return {{nodes: Array, links: Array}}
 */
function generateGraph(data) {

    var links = [];
    var nodes = [];

    //loop through the input and load the nodes
    for(var i = 0; i < data.length; i++) {
        var edge = data[i];
        var linkId = "link_" + edge.source.replace(" ","_") + "_" + edge.target.replace(" ","_");
        var index = nodeIndexOf(nodes, edge.source);
        var targetId = "source_" + edge.target.replace(" ", "_");
        var sourceId = "source_" + edge.source.replace(" ", "_");
        // Look for nodes that match this edge's source. If there aren't any, add one.
        if(index === -1) {
            nodes.push({id: edge.source, size: 1, linkIds: [linkId], sourceId: sourceId, targetIds: [targetId]});
            links.push({source: edge.source, target: edge.target, linkId: linkId});
        } else {
            nodes[index].size++;
            nodes[index].linkIds.push(linkId);
            nodes[index].targetIds.push(targetId);
            links.push({source: edge.source, target: edge.target, linkId: linkId});
        }
        // Look for nodes that match this edge's target. If there aren't any, add one.
        var _index = nodeIndexOf(nodes, edge.target);
        var _targetId = "source_" + edge.source.replace(" ", "_");
        var _sourceId = "source_" + edge.target.replace(" ", "_");
        if(_index === -1) {
            nodes.push({id: edge.target, size: 1, linkIds: [linkId], sourceId: _sourceId, targetIds: [_targetId]});
        } else {
            nodes[_index].size++;
            nodes[_index].linkIds.push(linkId);
            nodes[_index].targetIds.push(_targetId);
        }
    }

    return {
        nodes: nodes,
        links: links
    };

}

function displayData(data) {
    //first remove any SVG
    document.getElementById("svg-container").innerHTML = "";
    document.getElementById("visualization-section").style.display = "none";

    var graph = generateGraph(data);

    var nodeSize = d3.scaleLinear().domain(getNodeSizeRange(graph.nodes)).range([20, 50]);

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("id", function (d) {return d.linkId})
        .attr("stroke-width", lineStrokeWidth)
        .attr("stroke", lineStrokeColor)
        .attr("stroke-opacity", 0.6);

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("id", function (d) {return d.sourceId})
        .attr("r", function (d) {return nodeSize(d.size)})
        .attr("fill", function(d, i) {return colorPallete[ i % colorPallete.length]})
        .attr("cursor", "pointer")
        .attr("stroke-width", nodeStrokeWidth)
        .attr("stroke", "#610cf9")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
         .on("mouseover", function (d) {
             d3.select(this)
                 .attr("r", function (d) {return nodeSize(d.size) * 1.3})
                 .attr("stroke", "#4c004c")
                 .attr("stroke-width", 8);
             for (var i = 0; i < d.linkIds.length; i++) {
                 d3.select("#" + d.linkIds[i])
                     .attr("stroke", "#800080")
                     .attr("stroke-width", 8);
             }
             for (var j = 0; j < d.targetIds.length; j++) {
                 d3.select("#" + d.targetIds[j])
                     .attr("stroke", "#800080")
                     .attr("stroke-width", 6);
             }
         })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("r", function (d) {return nodeSize(d.size)})
                .attr("stroke-width", nodeStrokeWidth);
            for (var i = 0; i < d.linkIds.length; i++) {
                d3.select("#" + d.linkIds[i])
                    .attr("stroke", lineStrokeColor)
                    .attr("stroke-width", lineStrokeWidth);
            }
            for (var j = 0; j < d.targetIds.length; j++) {
                d3.select("#" + d.targetIds[j])
                    .attr("stroke", lineStrokeColor)
                    .attr("stroke-width", nodeStrokeWidth);
            }
        });

    var label = svg.selectAll(".label")
        .data(graph.nodes)
        .enter()
        .append("text")
        .text(function (d) { return d.id; })
        .style("text-anchor", "middle")
        .style("font-family", "Arial")
        .style("fill", "#000")
        .style("font-weight", "bold")
        .style("font-size", 20);

    node.append("title")
        .text(function(d) { return d.id; });

    simulation.nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {

        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        label.attr("x", function(d){ return d.x; })
            .attr("y", function (d) {return d.y - 55; });
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

}

function prepareData(fileContents) {
    var objArray = [];
    //add the nodes to an array of objects
    for (var i = 0; i < fileContents.length; i++) {
        var modified = fileContents[i].split("-");
        objArray.push({
            source: modified[0].trim(),
            target: modified[1].trim()
        });
    }
    return objArray;
}

function setDisplay(id, display) {
    document.getElementById(id).style.display = display;
}

function changeThemeColor(color) {
    var fg = ".theme-color-fg{color: " + color + "}";
    var bg = ".theme-color-bg{background: " + color + "}";
    var border = ".theme-color-border{border-color: " + color + "}";
    var fu = "#file-upload-section{border-bottom: 2px solid " + color + "}";
    document.getElementById("theme-styles").innerHTML = fg + bg + border + fu;
}

function showColorMenu() {
    setDisplay("show-colors-btn", "none");
    setDisplay("hide-colors-btn", "block");
    setDisplay("menu-options", "block");
}

function hideColorMenu() {
    setDisplay("hide-colors-btn", "none");
    setDisplay("show-colors-btn", "block");
    setDisplay("menu-options", "none");
}

function showInfoOverlay() {
    setDisplay("show-overlay-btn", "none");
    setDisplay("instructions-overlay", "block");
    var deviceWidth = window.innerWidth;
    var deviceHeight = window.innerHeight;
    document.getElementById("instructions").style.marginLeft = ((deviceWidth - (deviceWidth / 2)) / 2) + "px";
    document.getElementById("instructions-overlay").style.height = deviceHeight + "px";
}

function hideInfoOverlay() {
    setDisplay("show-overlay-btn", "block");
    setDisplay("instructions-overlay", "none");
}