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

elevatorStates.push({
    floor: 4,
    state: STATES.IDLE,
    // destinations: [5, 6, 7],
    destinations: []
});
elevatorStates.push({
    floor: 1,
    state: STATES.IDLE,
    destinations: []
});
elevatorStates.push({
    floor: 1,
    state: STATES.DOWN,
    destinations: []
});

// for (let i = 0; i < totalElevators; i++) {
// elevatorStates.push({
//     floor: 1,
//     state: STATES.IDLE,
//     destinations: []
// });
// }

const getElevator = (floor, floorsWithElevators) => {

};

const openDoors = (elevatorIdx) => {
    const elevator = elevatorStates[elevatorIdx];
    console.log("Opening doors for ", elevatorIdx + 1, { currentFloor: elevator.floor });

    elevatorEls[elevatorIdx].classList.add('open');
    setTimeout(() => {
        closeDoors(elevatorIdx);
    }, 3000);
};

const closeDoors = (elevatorIdx) => {
    const elevator = elevatorStates[elevatorIdx];
    console.log("Closing doors for ", elevatorIdx + 1, elevator);


    elevatorEls[elevatorIdx].classList.remove('open');
    setTimeout(() => {
        elevator.state = STATES.IDLE;
        if (elevator.destinations.length > 0) {
            reachFloor(elevatorIdx);
        }
    }, 1400);
};

const worker = (elevatorIdx, toFloor) => {
    const translateBy = -LIFT_HEIGHT * (toFloor - 1);
    elevatorEls[elevatorIdx].style.transform = `translateY(${translateBy}px)`;

    setTimeout(() => {
        callback(elevatorIdx, toFloor);
    }, 1500);
};

const callback = (elevatorIdx, lastFloor) => {
    const elevator = elevatorStates[elevatorIdx];
    elevator.floor = lastFloor;
    if (elevator.destinations.includes(lastFloor)) {
        console.log("elevator ", elevator);

        elevator.destinations = elevator.destinations.filter(dest => dest !== lastFloor);

        setTimeout(() => openDoors(elevatorIdx), 650);
        return;
    };

    const toFloor = elevator.state === STATES.UP ? lastFloor + 1 : lastFloor - 1;
    worker(elevatorIdx, toFloor);
};

const reachFloor = (elevatorIdx) => {
    const elevator = elevatorStates[elevatorIdx];
    if (elevator.state !== STATES.IDLE) return;

    const fromFloor = elevator.floor;
    const destination = elevator.destinations[0] || fromFloor;
    const diff = destination - fromFloor;

    let toFloor = fromFloor + 1;
    if (diff === 0) {
        elevator.state = STATES.IDLE;
        elevator.destinations = elevator.destinations.filter(dest => dest !== destination);
        return;
    }
    else if (diff < 0) {
        toFloor = fromFloor - 1;
        elevator.state = STATES.DOWN;
    }
    else {
        elevator.state = STATES.UP;
    }
    worker(elevatorIdx, toFloor);
};

const handleUp = (event) => {
    const currentFloor = parseInt(event.target.dataset.floor);
    console.log("handleUp ", currentFloor);

    let elevatorIdx = 0;
    let affinityScore = Infinity;
    for (let i = 0; i < elevatorStates.length; i++) {
        // currentFloor
        // currentDirection
        let lastDestination = elevatorStates[i].destinations[0] || elevatorStates[i].floor;
        let currentAffinityScore = Math.abs(currentFloor - elevatorStates[i].floor) + (2 * Math.abs(elevatorStates[i].floor - lastDestination));

        if (Math.abs(currentAffinityScore) < affinityScore) {
            affinityScore = currentAffinityScore;
            elevatorIdx = i;
        }

        console.log("diff ", { currentAffinityScore, i, destinations: elevatorStates[i].destinations, lastDestination });


        continue;
        // let currentAffinityScore = currentFloor;

        // if (diff > 0) {
        //     if (elevatorStates[i].state === STATES.UP) {
        //         currentAffinityScore = currentFloor - elevatorStates[i].floor - 1;
        //     }
        //     else {
        //         currentAffinityScore = (currentFloor + elevatorStates[i].floor);
        //     }
        // }
        // else if (diff < 0) {
        //     if (elevatorStates[i].state === STATES.UP) {
        //         currentAffinityScore = (totalFloors - currentFloor);
        //     }
        //     else {
        //         currentAffinityScore = currentFloor - elevatorStates[i].floor - 1;
        //     }
        // }


        console.log("currentAffinityScore ", { i, currentAffinityScore });

    }

    if (!elevatorStates[elevatorIdx].destinations.includes(currentFloor)) {
        elevatorStates[elevatorIdx].destinations.push(currentFloor);
        elevatorStates[elevatorIdx].destinations.sort((a, b) => a - b);

        reachFloor(elevatorIdx);
    }
    console.log("Best match elevator is ", elevatorIdx + 1, elevatorStates[elevatorIdx].destinations);


    // const translateBy = -100 * currentFloor;
    // elevatorEls[currentFloor - 1].style.transform = `translateY(${translateBy}%)`
};

const handleDown = (event) => {
    console.log("handleDown ", event);
};

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
    btnDown.addEventListener('click', handleUp);

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
