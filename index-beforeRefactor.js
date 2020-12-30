const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = 600;
const height = 600;
const cells = 6; //number of cells either horizontal or vertical - will change for rectangle

const unitLength = width/cells; //the size of our grid squares

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const render = Render.create({
    element: document.body,
    engine: engine, 
    options: {
        width,
        height,
        wireframes: false
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


//---------------Walls ----------------------------------------
const walls = [
    Bodies.rectangle((width * 0.5), 0, width, 2, { isStatic: true}),
    Bodies.rectangle((width * 0.5), height, width, 2, { isStatic: true}),
    Bodies.rectangle(0, (height * 0.5), 2, height, { isStatic: true}),
    Bodies.rectangle(width, (height * 0.5), 2, height, { isStatic: true})
];
World.add(world, walls)

//---------------Maze generation------------------------------
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
    //  console.log(counter, index);
      counter--;
  
      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
  
    return arr;
};

const grid = Array(cells)
    .fill(null)
    .map( () => Array(cells).fill(false));

const verticals = Array(cells)
    .fill(null)
    .map( () => Array(cells-1).fill(false));

const horizontals = Array(cells-1)
    .fill(null)
    .map( () => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
    //if I have visted the cell at [row, column], then return
    if (grid[row] [column]) {
        return;
    }
    //mark this cell as visited
    grid[row] [column] = true;
    //assemble randoly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
      ]);

    //For each neighbor...
    for (let neighbor of neighbors) {
    //See if neighbor is out of bounds (edge of grid)
        const [nextRow, nextColumn, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) {
            continue;
        }
    
        //If we have visited that neighbor, continue to next neighbor
        if (grid [nextRow] [nextColumn] === true) {
            continue;
        }
    
        //Remove a wall from horizontal/verticals array
        if (direction === 'left') {
        verticals[row][column - 1] = true;
        } else if (direction === 'right') {
        verticals[row][column] = true;
        } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
        horizontals[row][column] = true;
        }

    // Visit that next cell stepThroughCell(new place)
    stepThroughCell(nextRow, nextColumn);
    }
};

stepThroughCell(startRow, startColumn);

//--------Build the horizontals maze walls ------------------------------
horizontals.forEach( (row, rowIndex) => {
    row.forEach( (open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            (columnIndex * unitLength) + (unitLength / 2), //x-axis horizontal centerpoint of walls to keep
            (rowIndex * unitLength) + unitLength, //y-axis vertical centerpoint of walls to keep
            unitLength, //width
            15, //height,
            {
                isStatic: true,
                label: 'wall'
            }
        );
        World.add(world, wall);
    })
    
})

//------Build the verticals maze walls ------------------------------
verticals.forEach( (row, rowIndex) => {
    row.forEach( (open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            (columnIndex * unitLength) + unitLength, //x axis vertical centerpoint of walls to keep
            (rowIndex * unitLength) + (unitLength / 2), //y-ais vertical centerpoint of walls to keep
            15, //width
            unitLength, //height,
            {
                isStatic: true,
                label: 'wall'
            }
        );
        World.add(world, wall);
    })
    
})

//----------------Build the goal, always lower right corner ------------------
const goal = Bodies.rectangle(
    width - unitLength/2,
    height - unitLength/2,
    unitLength * 0.7,
    unitLength * 0.7,
    {
        isStatic: true,
        label: 'goal'
    }
);
World.add(world, goal);

//---------------Build the ball/start location upper left -------------------------
const ball = Bodies.circle(
    unitLength / 2,
    unitLength / 2,
    unitLength * 0.25,
    {
        label: 'ball'
    }
);
World.add(world, ball);


//---------------Controls for the ball - WSDA-------------------------
document.addEventListener('keydown', (event) => {
    const {x, y} = ball.velocity;
    if (event.keyCode === 87) { //up
        Body.setVelocity( ball, {x, y : y-5})
    }
    if (event.keyCode === 68) { //right
        Body.setVelocity( ball, {x : x + 5, y})
    }
    if (event.keyCode === 83) { //down
        Body.setVelocity( ball, {x, y : y + 5})
    }
    if (event.keyCode === 65) {//left
        Body.setVelocity( ball, {x : x - 5, y})
    }
})

//---------------win consition-------------------------
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach( (collision) => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
        }
    })
})