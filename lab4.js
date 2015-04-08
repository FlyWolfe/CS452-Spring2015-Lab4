//Mathew Sherry
//3-2-2015
var elt;

var canvas;
var gl;

var program;

var NumVertices  = 36;
var cubeVertexTextureCoordBuffer;

var pointsArray = [];
var normalsArray = [];

var framebuffer;

var direction = 0;

var flag = false;

var color = new Uint8Array(4);

//I made the vertices go through each other and create this really cool optical illusion :D
var vertices = [
        vec4( 0.0, 0.0,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.0, -0.5,  0.5, 1.0 ),
        vec4( 1.0, 0.0, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 ),
    ];
	
var texCoords = [];
var imgCoords = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0),
	];
	


var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 0.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4( 0.0, 0.8, 1.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

var thetaLoc;

var Index = 0;

var img;
var texture;

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = normalize(vec3(cross(t1, t2)));

	pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[0]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[1]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[2]);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[0]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[2]);

    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    texCoords.push(imgCoords[3]);
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    gl.enable(gl.CULL_FACE);
	
	
	// Load shaders and initialize attribute buffers.
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
	
	colorCube(); // For our model quads

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
	
	var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var aTexCoord = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoord);
	
	////// Texture configurations //////
	img = document.getElementById("tex");
    
    texture = gl.createTexture();
	
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	
	gl.generateMipmap(gl.TEXTURE_2D);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	////// END Texture Config //////

    thetaLoc = gl.getUniformLocation(program, "theta");
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    projection = ortho(-1, 1, -1, 1, -100, 100);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, flatten(projectionMatrix));
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular); 
	
	document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
          
    render();
}

function handleKeyDown(event) {
	flag = true;
    if (event.keyCode == 37) //LEFT
	{
		direction = 1; //Negative direction
    	axis = yAxis;  
    } else if (event.keyCode == 38) //UP
	{
		direction = 1;
    	axis = xAxis;  
    } else if (event.keyCode == 39) //RIGHT
	{
		direction = 0; //Positive direction
    	axis = yAxis;  
    } else if (event.keyCode == 40) //DOWN
	{
		direction = 0;
    	axis = xAxis;  
    }			
}

function handleKeyUp(event) {
	flag = false;
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT );
    if(flag && direction == 0) theta[axis] += 2.0;
	else if (flag && direction == 1) theta[axis] -= 2.0;
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.uniform1i(gl.getUniformLocation(program, "i"),0);
	
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
    

    requestAnimFrame(render);
}
