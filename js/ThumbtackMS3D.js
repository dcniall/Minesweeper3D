/**
*
* Variables Initialized in start function
*
* blockSpacing: spacing between blocks
* scene: the scene node
* lookAt: the node that the camera looks at
* canvas: the drawing area
* dragging: is the user rotating the grid
* yaw: the rotatation angle (yaw) of the grid
* prevX: the last x coordinate clicked
* xDiff: used to determine if the user has rotated the game. It's the differance in location for mouseDown-mouseUp.
* gridActive: is the game grid lit up
*
**/
var blockSpacing;
var scene;
var lookAt;
var canvas;
var dragging;
var yaw;
var prevX;
var xDiff;
var gridActive;
/**
*
* An object which will contain information about each playing block:
*
* Coordinates <float> x,y,z
* id <string>: of the block in the format: "object_x_y_z"
* risk <integer>: represents number of surrounding bombs including itself. Range 0->27 (3^3)
* type <string>: what type of block is it ( "normal" | "bomb" )
* flagged <boolean>: has the user placed a flag on this block
* revealed <boolean>: Has the block been revealed ( (normal|flag) -> (bomb | number) )
* 
**/
function blockDetail(x, y, z, id, risk, type, flagged, revealed) {

    this.x = x;

    this.y = y;

    this.z = z;

    this.id = id;

    this.risk = risk;

    this.type = type;

    this.flagged = false;

    this.revealed = false;
}

/**
*
* 	start() - called: onPageLoad
*
* - initialize variables
* - setupSceneJS
* - setup scene node references
* - setupBombs
* - add event listeners
* - start SceneJS
*
*	Future work: Thread SceneJS.start() using HTML5 Web Workers
*
**/
function start() {
	
    dragging = false;
    yaw = 0;
    xDiff = 0;
	blockSpacing = 100;
	gridActive = false;
	
	setupSceneJS();
	
    scene = SceneJS.scene("myScene");
    lookAt = scene.findNode("lookAtNode");

	setupBombs();

    canvas = document.getElementById("theCanvas");
	document.getElementById('size').value = getGridSize();
	document.getElementById('bombs').value = getBombCount();
    canvas.addEventListener('mousedown', mouseDown, true);
    canvas.addEventListener('mousemove', mouseMove, true);
    canvas.addEventListener('mouseup', mouseUp, true);
    canvas.addEventListener('mousewheel', mouseWheel, true);
    canvas.addEventListener('DOMMouseScroll', mouseWheel, true); 

	scene.start({});
}
/**
*
* Generate and returns a random number
*
**/
function random(size) {
    return Math.floor(Math.random() * size);
}
/**
*
* Retrieve the querystring values
*
**/
function getQuerystring(key, default_)
 {
    if (default_ == null) default_ = "";
    key = key.replace(/[[]/, "[").replace(/[]]/, "]");
    var regex = new RegExp("[?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);

    if (qs == null)
    return default_;
    else
    return qs[1];
}
/**
*
* Prepare the bombs for a new game
* Generates a set number of bombs and updates the neighbouring blocks risk value.
*
**/
function setupBombs() {
    var maxBombs = getBombCount();
    var size = getGridSize();
    var radius = (blockSpacing * size) / 2;

    while (maxBombs > 0) {

        while (true) {

            var x = -radius + random(size) * blockSpacing;
            var y = -radius + random(size) * blockSpacing;
            var z = -radius + random(size) * blockSpacing;
            var id = "object_" + x + "_" + y + "_" + z + "";

            if (scene.findNode(id).get("data").type == "normal") {

                scene.findNode(id).get("data").type = "bomb";

                for (var _x = x - blockSpacing; _x <= x + blockSpacing; _x += blockSpacing) {
                    for (var _y = y - blockSpacing; _y <= y + blockSpacing; _y += blockSpacing) {
                        for (var _z = z - blockSpacing; _z <= z + blockSpacing; _z += blockSpacing) {

                            var _id = "object_" + _x + "_" + _y + "_" + _z + "";
                            var node = scene.findNode(_id);

                            if (node) {
                                node.get("data").risk++;
                            }

                        }
                    }
                }
                break;
            }

        }
        maxBombs--;
    }
}
/**
*
* Check if the placed flags are correctly placed
*
**/
function validateFlags() {
    var correct = 0;
    var incorrect = 0;
    var blocks = getBlocks();

    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var data = block.get("data");
        if (data.flagged) {
            if (data.type == "bomb") {
                correct++;
            } else {
                incorrect++;
            }
        }
    }

    if (correct == getBombCount() && incorrect == 0) {
        alert("You Won!!");
    } else {
        alert("You lost :( You got " + correct + " correct flags, and " + incorrect + " incorrect flags");
    }

    window.location.href = 'index.html?size=' + getGridSize() + '&bombs=' + getBombCount();
}
/**
*
* Limit a number to a min and a max bound
* returns max by default
*
**/
function limit(number, min, max, _default){
	if(!number)
		number = _default;
	if(number<min)
		number = min;
	if(number>max)
		number=max;
	return number;
}
/**
*
* Return the diameter of the playing grid <block units>
* returns 7 by default, 2 minimum
*
**/
function getGridSize() {
    var size = getQuerystring("size");
    return limit(size, 2, 9, 6);
}
/**
*
* Return the number of bombs within the grid
* returns 30 by default, 1 minimum
*
**/
function getBombCount() {
    var bombs = getQuerystring("bombs");
	var size = getGridSize();
	var max = (size*size*size)-1;
	return limit(bombs, 1, max, 20);
}
/**
*
* Return a list of the active blocks within the grid (Excludes removed blocks)
*
**/
function getBlocks() {
	
    var size = getGridSize();
    var radius = (blockSpacing * size) / 2;
    var blocks = [];

    for (var x = -radius; x < radius; x += blockSpacing) {

        for (var y = -radius; y < radius; y += blockSpacing) {

            for (var z = -radius; z < radius; z += blockSpacing) {

                var id = "object_" + x + "_" + y + "_" + z + "";
                var block = scene.findNode(id);

                if (block) {
                    blocks.push(block);
                }
            }
        }
    }
    return blocks;
}
/**
*
* Display the risk factor associated with the block
*
**/
function showBlockNumber(id) {
	
    var data = scene.findNode(id).get("data");

    if (!data.revealed) {
        data.revealed = true;
        var risk = data.risk;
        if (risk > 9) {
            risk = "9+";
        }
        if (risk >= 1) {
            changeTexture(id, risk);
        }
    }
}
/**
*
* Place/Remove a flag from the block depending on its previous state.
*
**/
function showBlockFlag(id) {
	
    var data = scene.findNode(id).get("data");
    if (data.flagged) {

		if(data.revealed){
			data.revealed=false;
			showBlockNumber(id);
		}else{
			changeTexture(id, "");
		}
		data.flagged = false;	
		
    } else {
        changeTexture(id, "flag");
        data.flagged = true;
    }
}
/**
*
* Render the blocks which are mines with mine texture
* stop the scene from rendering while the scene nodes are updated
*
**/
function showMines() {
	
    lightupGrid();
    scene.stop();
    var blocks = getBlocks();

    for (var i = 0; i < blocks.length; i++) {

        var block = blocks[i];
        var data = block.get("data");

        if (data.type == "bomb") {
	
            data.revealed = true;
            changeTexture(data.id, "bomb");

        }
    }
    scene.start();
}
/**
*
* Display the risk factor associated with all blocks
* stop the scene from rendering while the scene nodes are updated
*
**/
function showNumbers() {
	
    lightupGrid();
    scene.stop();
    var blocks = getBlocks();

    for (var i = 0; i < blocks.length; i++) {
	
        var block = blocks[i];
        showBlockNumber(block.get("id"));

    }
    scene.start();

}
/**
*
* Remove a block from the scene
* stop the scene from rendering while the scene nodes are updated
*
**/
function removeBlock(id) {
    scene.stop();

    var block = scene.findNode(id);

    if (block) {
	
        var data = block.get("data");

        if (!data.flagged) {
	
            if (data.type == "bomb") {
				showMines(); 
                alert("Game Over!");
                window.location.href = 'index.html?size=' + getGridSize() + '&bombs=' + getBombCount();

            } else {
                data.revealed = true;
                recursiveRemove(data.id, true);
            }
        }
    }

    scene.start();
}
/*
* recursiveRemove
*
* Parameters:
* id = block id
* isRoot = is this the first recurse (Allows for the function to determine wheter to remove a block displaying its risk value,
* i.e., did the user click this node)
*
* Recursively remove all of the blocks surrounding the block with the given block <id>
* If a block with a risk factor is reached, display that risk factor and break the recursion cycle for that block.
* Else destroy that block and repeat
*
*/
function recursiveRemove(id, isRoot) {

    var block = scene.findNode(id);

    if (block) {
	
        var data = block.get("data");

        if (isRoot || data.risk == 0) {
            block.destroy();
        } else {
            if (data.risk > 0) {
		
                if (!data.revealed && !data.flagged) {
                    showBlockNumber(id);
                } 
                return;
            }
        }
        for (var _x = data.x - blockSpacing; _x <= data.x + blockSpacing; _x += blockSpacing) {

            for (var _y = data.y - blockSpacing; _y <= data.y + blockSpacing; _y += blockSpacing) {

                for (var _z = data.z - blockSpacing; _z <= data.z + blockSpacing; _z += blockSpacing) {

                    var _id = "object_" + _x + "_" + _y + "_" + _z + "";
                    recursiveRemove(_id, false);

                }
            }
        }
    }
}
/**
*
* light up the grid when the user clicks on it
* Uses SceneJS coreId feature, which allows for nodes to share a property. In this case the property is the nodes base color.
* Therefore only need to update one node, changes are reflected in all nodes sharing the same coreId.
*
**/
function lightupGrid() {
	if(!gridActive){
				
    	var origon = (blockSpacing * getGridSize()) / -2;
    	var baseColorNode = scene.findNode("object_" + origon + "_" + origon + "_" + origon + "_baseColorNode");

        baseColorNode.set("baseColor", { r: 0.9, g: 0.9, b: 0.9 });
		gridActive = true;
		
		return true;
	}
	return false;
}
/**
*
* Record the location that the user last clicked down on
*
**/
function mouseDown(event) {
    prevX = event.clientX;
    xDiff = prevX;
    dragging = true;
}
/**
* mouseUp = lightUpGrid | finishDragging | editBlock
*
* Only attempt to remove blocks on mouse up -> allows for the grid to be rotated effectively.
* Remove a block if Game was not rotated within this interaction
* xDiff is be used to determine if the user has rotated the game. It's the differance in location for mouseDown-mouseUp.
* If they have then don't delete the block where the mouse last unclicked.
*
**/
function mouseUp(event) {

    dragging = false;
    var coords = clickCoordsWithinElement(event);

    if (Math.abs(xDiff - event.clientX) < 20) {
        var hit = scene.pick(coords.x, coords.y, {
            rayPick: true
        });
        if (lightupGrid()) {
            xDiff = 0;
            return;
        }
        if (event.button == 2)
        {
            showBlockFlag(hit.name);
        }
        else
        {
            removeBlock(hit.name);
        }
    }
    xDiff = 0;
}
/**
*
* Calculate the clicked position within the canvas 
*
**/
function clickCoordsWithinElement(event) {

    var coords = {
        x: 0,
        y: 0
    };

    var element = event.target;
    var totalOffsetLeft = 0;
    var totalOffsetTop = 0;

    while (element.offsetParent)

    {
        totalOffsetLeft += element.offsetLeft;
        totalOffsetTop += element.offsetTop;
        element = element.offsetParent;

    }

    coords.x = event.pageX - totalOffsetLeft;
    coords.y = event.pageY - totalOffsetTop;

    return coords;
}
/**
*
* If the mouse button is held down, rotate the grid.
*
**/
function mouseMove(event) {

    if (dragging) {

        yaw -= (prevX - event.clientX) * 0.1;
        prevX = event.clientX;
        scene.findNode("yaw").set("angle", yaw);

    }
}
/**
*
* Fly/Zoom into the grid
*
**/
function mouseWheel(event) {
    var delta = 0;

    if (!event) event = window.event;

    if (event.wheelDelta) {

        delta = event.wheelDelta / 120;

        if (window.opera) delta = -delta;

    } else if (event.detail) {

        delta = -event.detail / 3;

    }

    if (delta) {

        var cam = scene.findNode("lookAtNode");
        var position = cam.get("eye");
        delta = (delta / Math.abs(delta)) * 10;

        cam.set("eye", {
            x: position.x + delta,
            y: 700,
            z: position.z + delta
        });

    }

    if (event.preventDefault)
    event.preventDefault();
    event.returnValue = false;

}
/**
*
* Returns a node representing a light source
*
**/
function createLightNode(color, direction) {

    return {
        type: "light",
        mode: "dir",
        color: color,
        diffuse: true,
        specular: true,
        dir: direction
    }

}
/**
*
* This method creates a texure library, which is created at startup. The library allows for textures to 
* be loaded once, and then referenced using the <coreId> tag.
*
**/
function createCachedTexturesNode() {
    return {
        type: "library",

        nodes: [

        createTexture("bomb"),
        createTexture("flag"),
        createTexture("1"),
        createTexture("2"),
        createTexture("3"),
        createTexture("4"),
        createTexture("5"),
        createTexture("6"),
        createTexture("7"),
        createTexture("8"),
        createTexture("9"),
        createTexture("9+")

        ]
    }
}
/**
*
* Returns a node representing a texture. Takes in the prefix name of the image file. 
*
**/
function createTexture(name) {
    return {

        type: "texture",
        coreId: name + "_material",
        id: name + "_material",
        layers: [
        {
            uri: "images/" + name + ".png",
            applyTo: "baseColor",
            blendMode: "add",
            blendFactor: 1.0
        }
        ]
    }
}
/**
*
* Changes the image of a block to (Flag | Number | Bomb | Normal)
*
* This is done by destroying the old node and creating a new node. 
*
* I implemented another texture switching method, where all textures are preloaded into each
* node, and their transparency value is changed to switch textures. However, this implementation
* proved to be very inneficient with memory, greatly reduced page loading times. Instead, I  
* cache textures as nodes with a sharable coreId. This means that textures are only loaded from file once, and
* can be applied to a node simply by referencing the coreId of the required texture node.
*
**/
function changeTexture(id, image) {
    var textureNode = scene.findNode(id + "_texture");
    if (textureNode) {
        textureNode.destroy();
    }
    if (image != null) {
        var baseNode = scene.findNode(id + "_base");
        if (baseNode) {
            baseNode.add("node", createTextureNode(id, image));
        }
    }
}
/**
*
* Returns a node containing a texture bound to a box. 
* Takes in the id of the block node, and the prefix name of the image.
*
**/
function createTextureNode(id, image) {
    if (image == "") {
        return {
            type: "node",
            id: id + "_texture",
            nodes: [
            {
                type: "box"
            }
            ]
        }
    }
    return {
        type: "texture",
        id: id + "_texture",
        coreId: image + "_material",
        nodes: [
        {
            type: "box"
        }
        ]
    }
}
/**
*
* Returns a list of block nodes representing the game grid
*
**/
function createGrid() {
    var size = getGridSize();
    var radius = (blockSpacing * size) / 2;
    var nodes = [];

    for (var x = -radius; x < radius; x += blockSpacing) {

        for (var y = -radius; y < radius; y += blockSpacing) {

            for (var z = -radius; z < radius; z += blockSpacing) {

                var id = "object_" + x + "_" + y + "_" + z + "";

                nodes.push( createBlock( new blockDetail(x, y, z, id, 0, "normal", false, false) ) );

            }
        }
    }

    return {
        type: "node",

        id: "gridOfNodes",

        nodes: nodes

    };

}
/**
*
* Returns a node representing a playing block <bomb, flag, number, normal> 
*
**/
function createBlock(data) {

    return {
        id: data.id,

        name: data.id,

        type: "name",

        data: data,

        nodes: [

        {

            type: "material",

            id: data.id + "_baseColorNode",

            coreId: "baseColorNode",

            baseColor: { r: 0, g: 0, b: 0 },

            specularColor: { r: 0.9, g: 0.9, b: 0.9 },

            shine: 40.0,

            nodes: [

            {

                type: "translate",

                x: data.x,

                y: data.y,

                z: data.z,

                nodes: [

                {
                    type: "scale",

                    id: data.id + "_base",

                    x: 40.0,

                    y: 40.0,

                    z: 40.0,

                    nodes: [
                    {
                        type: "node",

                        id: data.id + "_texture",

                        nodes: [
                        {

                            type: "box"

                        }
                        ]
                    }
                    ]
                }
                ]
            }
            ]
        }
        ]
    }
}
/**
*
* Build the root scene
*
**/
function setupSceneJS(){
	
	SceneJS.createScene({

    	type: "scene",

    	id: "myScene",

    	canvasId: 'theCanvas',

    	nodes: [

    	{

        	type: "lookAt",

        	id: "lookAtNode",

        	eye: { x: -800, y: 700, z: -800 },

        	up: { x: 0.0, y: 1.0, z: 0.0 },

        	nodes: [

        	{
			
            	type: "camera",

            	id: "cameraNodes",

            	optics: {

                	type: "perspective",

                	fovy: 45.0,

                	aspect: 1.47,

                	near: 0.10,

                	far: 4000.0
				
            	},

            	nodes: [

            	createCachedTexturesNode(),

            	createLightNode({ r: 1.0, g: 1.0, b: 1.0 }, { x: -1.0, y: -0.5, z: 0.0 }),

            	createLightNode({ r: 0.7, g: 0.7, b: 0.7 }, { x: 1.0, y: 0.5, z: 1.0 }),

            	createLightNode({ r: 0.7, g: 0.7, b: 0.7 }, { x: -1.0, y: 0.5, z: 1.0 }),

            	createLightNode({ r: 0.7, g: 0.7, b: 0.7 }, { x: -1.0, y: 0.5, z: -1.0 }),

            	{

                	type: "rotate",

                	id: "yaw",

                	y: 1.0,

                	nodes: [{

                    	type: "node",

                    	id: "blocks",

                    	name: "blocks",

                    	nodes: [
					
                    	{

                        	type: "shader",

                        	id: "blocksCore",

                        	nodes: [ createGrid() ]

                    	}
                    	]

                	}
                	]
				
            	}
            	]

        	}
        	]

    	}
    	]

	});
}