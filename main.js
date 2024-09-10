const LIFT_HEIGHT = 11.8; // rem
const CLOSE_DOOR_AFTER_DURATION = 3500;
const MOVE_LIFT_AFTER_DOOR_CLOSE_DURATION = 1400;
const OPEN_DOOR_AFTER_DURATION = 700;
const FLOOR_REACH_DURATION = 1500;

const floorEls = [];
const elevatorEls = [];
const elevators = [];
const STATES = {
    DOWN: -1,
    IDLE: 0,
    UP: 1,
};

const params = new URLSearchParams(window.location.search);
const totalFloors = Math.abs(parseInt(params.get('floors')));
const totalElevators = Math.abs(parseInt(params.get('lifts')));

const getElevatorMarkup = ({ elevatorIdx }) => {
    const START_OFFSET = 10;
    const ELEVATOR_WIDTH = 6;
    const ELEVATOR_GAP = 5;

    const elevator = elevators[elevatorIdx];
    const left = START_OFFSET + ((elevatorIdx) * (ELEVATOR_WIDTH + ELEVATOR_GAP));
    const translateBy = -LIFT_HEIGHT * (elevator.floor - 1);

    const style = `left: ${left}rem; transform: translateY(${translateBy}rem)`;


    return `
    <div data-floor='${elevator.floor}' style='${style}' class="elevator-simulation__elevator">
        <div class="elevator-simulation__elevator-door-wrap">
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--left"></div>
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--right"></div>
        </div>
    </div>
`;
};

const getFloorMarkup = ({ currentFloor, isFirstFloor, isLastFloor }) => {
    const upBtn = isLastFloor ? '' : `<button data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--up">Up</button>`;
    const downBtn = isFirstFloor ? '' : `<button data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--down">Down</button>`;

    return `
    <div class="elevator-simulation__floor">
        <div class="elevator-simulation__floor-top">
            <div class="elevator-simulation__floor-btns">
                ${upBtn}
                ${downBtn}
            </div>
        </div>
        <div class="elevator-simulation__floor-bottom">
            <div class="elevator-simulation__floor-content">
                <div class="elevator-simulation__floor-base"></div>
                <div class="elevator-simulation__floor-label">Floor ${currentFloor}</div>
            </div>
        </div>
    </div>
`;
};

function addElevator(floor) {
    elevators.push({
        floor: floor,
        state: STATES.IDLE,
        requestedDir: STATES.IDLE,
        destinations: {
            [STATES.UP]: [],
            [STATES.DOWN]: []
        }
    });

}

const openDoors = (elevatorIdx) => {
    elevatorEls[elevatorIdx].classList.add('open');
    setTimeout(() => {
        closeDoors(elevatorIdx);
    }, CLOSE_DOOR_AFTER_DURATION);
};

const closeDoors = (elevatorIdx) => {
    const elevator = elevators[elevatorIdx];

    elevatorEls[elevatorIdx].classList.remove('open');
    setTimeout(() => {
        elevator.state = STATES.IDLE;
        reachFloor(elevatorIdx, elevator.requestedDir);
    }, MOVE_LIFT_AFTER_DOOR_CLOSE_DURATION);
};

const worker = (elevatorIdx, toFloor) => {
    const translateBy = -LIFT_HEIGHT * (toFloor - 1);
    elevatorEls[elevatorIdx].style.transform = `translateY(${translateBy}rem)`;

    setTimeout(() => {
        callback(elevatorIdx, toFloor);
    }, FLOOR_REACH_DURATION);
};

const callback = (elevatorIdx, lastFloor) => {
    const elevator = elevators[elevatorIdx];
    const elevatorDir = elevator.state;
    elevator.floor = lastFloor;

    if (elevator.destinations[elevator.requestedDir].includes(lastFloor)) {
        elevator.destinations[elevator.requestedDir] = elevator.destinations[elevator.requestedDir].filter(dest => dest !== lastFloor);
        setTimeout(() => openDoors(elevatorIdx), OPEN_DOOR_AFTER_DURATION);

        return;
    };

    const toFloor = elevatorDir === STATES.UP ? lastFloor + 1 : lastFloor - 1;
    worker(elevatorIdx, toFloor);
};

const reachFloor = (elevatorIdx, requestedDir) => {
    const elevator = elevators[elevatorIdx];

    if (elevator.state !== STATES.IDLE) return;

    const fromFloor = elevator.floor;
    let destination = elevator.destinations[requestedDir][0];

    if (!destination) {
        requestedDir = requestedDir === STATES.UP ? STATES.DOWN : STATES.UP;
        destination = elevator.destinations[requestedDir][0];

        if (!destination) {
            elevator.state = STATES.IDLE;
            return;
        }
    }
    elevator.requestedDir = requestedDir;

    const diff = destination - fromFloor;
    if (diff === 0) {
        elevator.destinations[elevator.state] = elevator.destinations[elevator.state].filter(dest => dest !== destination);
        elevator.state = STATES.IDLE;
        return;
    }

    let toFloor = fromFloor + 1;
    if (diff < 0) {
        elevator.state = STATES.DOWN;
        toFloor = fromFloor - 1;
    }
    else {
        elevator.state = STATES.UP;
        toFloor = fromFloor + 1;
    }

    worker(elevatorIdx, toFloor);
};

const handleUp = (event) => {
    handleBtnClick(event, STATES.UP);
};

const handleDown = (event) => {
    handleBtnClick(event, STATES.DOWN);
};

const getScore = (elevatorIdx, requestedFloor, requestedDir) => {
    const elevator = elevators[elevatorIdx];

    const elevatorDir = elevator.state;
    const diff = requestedFloor - elevator.floor;

    const requiredDir = diff >= 0 ? STATES.UP : STATES.DOWN;



    console.log("getScore ==> ", { requestedDir, elevatorRequestedDir: elevator.requestedDir, requiredDir, elevatorDir, requestedFloor, elevatorFloor: elevator.floor, });


    let score = Math.abs(requestedFloor - elevator.floor);
    if (elevatorDir === requiredDir) score--;
    else if (elevatorDir !== STATES.IDLE) {
        // let lastDestination = elevator.destinations[elevatorDir].at(-1);
        let lastDestination = totalFloors;
        if (lastDestination) {
            score += (2 * Math.abs(elevator.floor - lastDestination));
            score += elevator.destinations[elevatorDir].length;
            // score += totalFloors; // can this be done?
        }
        else {
            // score += 1
        }
    }

    if (requestedDir !== elevator.requestedDir && elevator.requestedDir !== STATES.IDLE) {
        // let lastDestination = elevator.destinations[elevator.requestedDir].at(-1);
        let lastDestination = totalFloors;
        if (lastDestination) {
            score += (2 * Math.abs(elevator.floor - lastDestination));
            score += elevator.destinations[elevator.requestedDir].length;
        }
        else {
            // score += 1
        }
    }

    return score;
};


const handleBtnClick = (event, destDir) => {
    const currentFloor = parseInt(event.target.dataset.floor);
    console.log("handleBtnClic-k ", currentFloor, destDir);


    let elevatorIdx = 0;
    let minScore = Infinity;
    for (let i = 0; i < elevators.length; i++) {
        const currentScore = getScore(i, currentFloor, destDir);

        if (Math.abs(currentScore) < minScore) {
            minScore = currentScore;
            elevatorIdx = i;
        }

        console.log("diff ", { currentScore, i, destinations: elevators[i].destinations });
    }

    let sorter = (a, b) => a - b;
    if (destDir === STATES.DOWN) {
        sorter = (a, b) => b - a;
    }


    if (!elevators[elevatorIdx].destinations[destDir].includes(currentFloor)) {
        elevators[elevatorIdx].destinations[destDir].push(currentFloor);
        elevators[elevatorIdx].destinations[destDir].sort(sorter);

        if (elevators[elevatorIdx].state === STATES.IDLE) {
        // elevators[elevatorIdx].state = destDir;
            reachFloor(elevatorIdx, destDir);
        }
    }
    console.log("Best match elevator is ", elevatorIdx + 1, elevators[elevatorIdx].destinations);
};


// const handleBtnClick = (event, destDir) => {
//     const currentFloor = parseInt(event.target.dataset.floor);
//     console.log("handleBtnClic-k ", currentFloor, destDir);

//     let elevatorIdx = 0;
//     let affinityScore = Infinity;
//     for (let i = 0; i < elevators.length; i++) {
//         const elevator = elevators[i];
//         const elevatorDir = elevator.state;

//         const diff = currentFloor - elevator.floor;
//         let requiredDir = STATES.UP;
//         if (diff < 0) {
//             requiredDir = STATES.DOWN;
//         }

//         // elevatorDir === requiredDir // goood
//         // elevatorDir === requiredDir // goood



//         // currentFloor
//         // currentDirection
//         let lastDestination = elevator.destinations[0] || elevator.floor;
//         let currentAffinityScore = Math.abs(currentFloor - elevator.floor) + (2 * Math.abs(elevator.floor - lastDestination));

//         if (Math.abs(currentAffinityScore) < affinityScore) {
//             affinityScore = currentAffinityScore;
//             elevatorIdx = i;
//         }

//         console.log("diff ", { currentAffinityScore, i, destinations: elevator.destinations, lastDestination });
//         continue;
//     }

//     if (!elevators[elevatorIdx].destinations.includes(currentFloor)) {
//         elevators[elevatorIdx].destinations.push(currentFloor);
//         elevators[elevatorIdx].destinations.sort((a, b) => a - b);
//         reachFloor(elevatorIdx);
//     }
//     console.log("Best match elevator is ", elevatorIdx + 1, elevators[elevatorIdx].destinations);
// };

function generateEntities() {
    const floorsFragment = new DocumentFragment();
    for (let i = 0; i < totalFloors; i++) {
        const tempDiv = document.createElement('div');
        const currentFloor = totalFloors - i;

        const isFirstFloor = currentFloor === 1;
        const isLastFloor = currentFloor === totalFloors;

        tempDiv.innerHTML = getFloorMarkup({ currentFloor, isFirstFloor, isLastFloor });
        const floorEl = tempDiv.children[0];

        if (!isLastFloor) {
            const btnUp = floorEl.querySelector('.elevator-simulation__floor-btn--up');
            btnUp.addEventListener('click', handleUp);
        }

        if (!isFirstFloor) {
            const btnDown = floorEl.querySelector('.elevator-simulation__floor-btn--down');
            btnDown.addEventListener('click', handleDown);
        }

        floorsFragment.appendChild(floorEl);
    }

    const elevatorsFragment = new DocumentFragment();
    elevators.forEach((elevator, elevatorIdx) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = getElevatorMarkup({ elevatorIdx: elevatorIdx });

        const elevatorEl = tempDiv.children[0];
        elevatorsFragment.appendChild(elevatorEl);
        elevatorEls.push(elevatorEl);
    });

    const elevatorSimulationContent = document.getElementById('elevator-simulation-content');
    const floorsEl = elevatorSimulationContent.querySelector('.elevator-simulation__floors');
    const elevatorsEl = elevatorSimulationContent.querySelector('.elevator-simulation__elevators');

    floorsEl.appendChild(floorsFragment);
    elevatorsEl.appendChild(elevatorsFragment);
}

function removeEl(selector) {
    const el = document.querySelector(selector);
    el.remove();
}

function setupSimulation() {
    removeEl("#elevator-simulation-form");

    for (let i = 0; i < totalElevators; i++) {
        addElevator(1);
    }

    generateEntities();
}

function setupForm() {
    removeEl("#elevator-simulation-content");

    const url = new URL(window.location.href);
    url.search = '';
    // Use the History API to update the URL without reloading the page
    window.history.replaceState({}, '', url.toString());
}

if (totalFloors && totalElevators) {
    setupSimulation();
}
else {
    setupForm();
}