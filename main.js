const LIFT_HEIGHT = 118;

const getElevatorMarkup = ({ elevatorIdx }) => {
    const START_OFFSET = 10;
    const ELEVATOR_WIDTH = 6;
    const ELEVATOR_GAP = 5;

    const elevator = elevatorStates[elevatorIdx];
    const left = START_OFFSET + ((elevatorIdx) * (ELEVATOR_WIDTH + ELEVATOR_GAP));
    const translateBy = -LIFT_HEIGHT * (elevator.floor - 1);

    const style = `left: ${left}rem; transform: translateY(${translateBy}px)`;


    return `
    <div data-floor='${elevator.floor}' style='${style}' class="elevator-simulation__elevator">
        <div class="elevator-simulation__elevator-door-wrap">
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--left"></div>
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--right"></div>
        </div>
    </div>
`;
};

const getFloorMarkup = ({ currentFloor }) => {
    return `
    <div class="elevator-simulation__floor">
        <div class="elevator-simulation__floor-top">
            <div class="elevator-simulation__floor-btns">
                <button data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--up">Up</button>
                <button data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--down">Down</button>
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

const elevatorSimulationContent = document.getElementById('elevator-simulation-content');
const floorsEl = elevatorSimulationContent.querySelector('.elevator-simulation__floors');
const elevatorsEl = elevatorSimulationContent.querySelector('.elevator-simulation__elevators');
const totalFloors = 7;
const totalElevators = 3;

const floorEls = [];
const elevatorEls = [];
const floorsWithElevators = [];
const elevatorStates = [];
const STATES = {
    DOWN: -1,
    IDLE: 0,
    UP: 1,
};

for (let i = 0; i < totalFloors; i++) {
    floorsWithElevators.push([]);
}

function addElevator(floor) {
    elevatorStates.push({
        floor: floor,
        state: STATES.IDLE,
        // requestedDir: STATES.IDLE,
        destinations: {
            [STATES.UP]: [],
            [STATES.DOWN]: []
        }
    });

}

addElevator(1);
addElevator(1);
addElevator(1);

// for (let i = 0; i < totalElevators; i++) {
// elevatorStates.push({
//     floor: 1,
//     state: STATES.IDLE,
//     destinations: []
// });
// }

const getElevator = (floor, floorsWithElevators) => {

};

const openDoors = (elevatorIdx, requestedDir) => {
    const elevator = elevatorStates[elevatorIdx];
    console.log("Opening doors for ", elevatorIdx + 1, { currentFloor: elevator.floor });

    elevatorEls[elevatorIdx].classList.add('open');
    setTimeout(() => {
        closeDoors(elevatorIdx, requestedDir);
    }, 3000);
};

const closeDoors = (elevatorIdx, requestedDir) => {
    const elevator = elevatorStates[elevatorIdx];
    console.log("Closing doors for ", elevatorIdx + 1, elevator);


    elevatorEls[elevatorIdx].classList.remove('open');
    setTimeout(() => {
        let elevatorDir = elevator.state;
        elevator.state = STATES.IDLE;

        // if (elevator.destinations[elevatorDir].length > 0) {
        reachFloor(elevatorIdx, requestedDir);
        // }
    }, 1400);
};

const worker = (elevatorIdx, toFloor, requestedDir) => {
    const translateBy = -LIFT_HEIGHT * (toFloor - 1);
    elevatorEls[elevatorIdx].style.transform = `translateY(${translateBy}px)`;

    setTimeout(() => {
        callback(elevatorIdx, toFloor, requestedDir);
    }, 1500);
};

const callback = (elevatorIdx, lastFloor, requestedDir) => {
    const elevator = elevatorStates[elevatorIdx];
    const elevatorDir = elevator.state;
    elevator.floor = lastFloor;

    if (elevator.destinations[requestedDir].includes(lastFloor)) {
        elevator.destinations[requestedDir] = elevator.destinations[requestedDir].filter(dest => dest !== lastFloor);
        setTimeout(() => openDoors(elevatorIdx, requestedDir), 650);

        return;
    };

    const toFloor = elevatorDir === STATES.UP ? lastFloor + 1 : lastFloor - 1;
    worker(elevatorIdx, toFloor, requestedDir);
};

const reachFloor = (elevatorIdx, requestedDir) => {
    const elevator = elevatorStates[elevatorIdx];

    if (elevator.state !== STATES.IDLE) return;

    const fromFloor = elevator.floor;
    let destination = elevator.destinations[requestedDir][0];
    // elevator.state = requestedDir;

    if (!destination) {
        // let _requestedDir = requestedDir === STATES.UP ? STATES.DOWN : STATES.UP;
        requestedDir = requestedDir === STATES.UP ? STATES.DOWN : STATES.UP;
        destination = elevator.destinations[requestedDir][0];

        if (!destination) {
            elevator.state = STATES.IDLE;
            return;
        }

        // elevator.state = _requestedDir;
    }

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


    // let toFloor = fromFloor + 1;
    // if (elevator.state === STATES.DOWN) {
    //     toFloor = fromFloor - 1;
    // }
    worker(elevatorIdx, toFloor, requestedDir);
};


const handleUp = (event) => {
    handleBtnClick(event, STATES.UP);
};

const handleDown = (event) => {
    handleBtnClick(event, STATES.DOWN);
};

const getScore = (elevatorIdx, requestedFloor, requestedDir) => {
    const elevator = elevatorStates[elevatorIdx];

    const elevatorDir = elevator.state;
    const diff = requestedFloor - elevator.floor;

    const requiredDir = diff >= 0 ? STATES.UP : STATES.DOWN;

    // let lastDestination = elevator.destinations[elevatorDir].at(-1);
    // if (!lastDestination) {
    //     let _elevatorDir = STATES.DOWN;
    //     if (elevatorDir === STATES.DOWN) _elevatorDir = STATES.UP;

    //     lastDestination = elevator.destinations[_elevatorDir].at(-1);
    // }

    console.log(("getScore ==> ", { requestedDir, requiredDir, elevatorDir, requestedFloor }));


    let score = Math.abs(requestedFloor - elevator.floor);
    if (elevatorDir === requiredDir) score--;
    else if (elevatorDir !== STATES.IDLE) {
        let lastDestination = elevator.destinations[elevatorDir].at(-1);
        if (lastDestination) {
            score = score + (2 * Math.abs(elevator.floor - lastDestination));
        }
        else {
            // score += 1
        }
    }

    if (requestedDir !== elevatorDir && elevatorDir !== STATES.IDLE) {
        let lastDestination = elevator.destinations[elevatorDir].at(-1);
        if (lastDestination) {
            score = score + (2 * Math.abs(elevator.floor - lastDestination));
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
    for (let i = 0; i < elevatorStates.length; i++) {
        const currentScore = getScore(i, currentFloor, destDir);

        if (Math.abs(currentScore) < minScore) {
            minScore = currentScore;
            elevatorIdx = i;
        }

        console.log("diff ", { currentScore, i, destinations: elevatorStates[i].destinations });
    }

    let sorter = (a, b) => a - b;
    if (destDir === STATES.DOWN) {
        sorter = (a, b) => b - a;
    }


    if (!elevatorStates[elevatorIdx].destinations[destDir].includes(currentFloor)) {
        elevatorStates[elevatorIdx].destinations[destDir].push(currentFloor);
        elevatorStates[elevatorIdx].destinations[destDir].sort(sorter);

        if (elevatorStates[elevatorIdx].state === STATES.IDLE) {
            // elevatorStates[elevatorIdx].state = destDir;
            reachFloor(elevatorIdx, destDir);
        }
    }
    console.log("Best match elevator is ", elevatorIdx + 1, elevatorStates[elevatorIdx].destinations);
};


// const handleBtnClick = (event, destDir) => {
//     const currentFloor = parseInt(event.target.dataset.floor);
//     console.log("handleBtnClic-k ", currentFloor, destDir);

//     let elevatorIdx = 0;
//     let affinityScore = Infinity;
//     for (let i = 0; i < elevatorStates.length; i++) {
//         const elevator = elevatorStates[i];
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

//     if (!elevatorStates[elevatorIdx].destinations.includes(currentFloor)) {
//         elevatorStates[elevatorIdx].destinations.push(currentFloor);
//         elevatorStates[elevatorIdx].destinations.sort((a, b) => a - b);
//         reachFloor(elevatorIdx);
//     }
//     console.log("Best match elevator is ", elevatorIdx + 1, elevatorStates[elevatorIdx].destinations);
// };

const floorsFragment = new DocumentFragment();
for (let i = 0; i < totalFloors; i++) {
    const tempDiv = document.createElement('div');
    const currentFloor = totalFloors - i;

    tempDiv.innerHTML = getFloorMarkup({ currentFloor });
    // tempDiv.innerHTML = getFloorMarkup({ currentFloor, totalElevators: currentFloor === 1 ? totalElevators : 0 });
    const floorEl = tempDiv.children[0];

    const btnUp = floorEl.querySelector('.elevator-simulation__floor-btn--up');
    const btnDown = floorEl.querySelector('.elevator-simulation__floor-btn--down');

    btnUp.addEventListener('click', handleUp);
    btnDown.addEventListener('click', handleDown);

    floorsFragment.appendChild(floorEl);
}

const elevatorsFragment = new DocumentFragment();
elevatorStates.forEach((elevator, elevatorIdx) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = getElevatorMarkup({ elevatorIdx: elevatorIdx });

    const elevatorEl = tempDiv.children[0];
    elevatorsFragment.appendChild(elevatorEl);
    elevatorEls.push(elevatorEl);
});

floorsEl.appendChild(floorsFragment);
elevatorsEl.appendChild(elevatorsFragment);
