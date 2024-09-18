const LIFT_HEIGHT = 14; // rem
const LIFT_WIDTH = 6; // rem
const LIFT_GAP = 5; // rem
const DOOR_OPEN_CLOSE_DURATION = 1400; // ms
const CLOSE_DOOR_AFTER_DURATION = 3500; // ms
const MOVE_LIFT_AFTER_DOOR_CLOSE_DURATION = 1600; // ms
const OPEN_DOOR_AFTER_DURATION = 700; // ms
const FLOOR_REACH_DURATION = 2000; // ms

const floorEls = [];
const elevators = [];
const STATES = {
    IDLE: 0,
    DOWN: 1,
    UP: 2,
};

const params = new URLSearchParams(window.location.search);
const totalFloors = Math.abs(parseInt(params.get("floors")));
const totalElevators = Math.abs(parseInt(params.get("lifts")));
const totalFloorsDigit = totalFloors.toString().length;

const getElevatorMarkup = ({ elevatorIdx }) => {
    const elevator = elevators[elevatorIdx];
    const translateX = elevatorIdx * (LIFT_WIDTH + LIFT_GAP);
    const translateY = -LIFT_HEIGHT * (elevator.floor - 1);

    const style = `transform: translate(${translateX}rem, ${translateY}rem)`;

    return `
    <div style='${style}' class="elevator-simulation__elevator">
        <div class="elevator-simulation__elevator-header">
            <div class="elevator-simulation__indicator">
                <div class="elevator-simulation__indicator-floor">${elevator.floor}</div>
                <div class="elevator-simulation__indicator-direction">&nbsp;</div>
            </div>
        </div>
        <div class="elevator-simulation__elevator-door-wrap">
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--left"></div>
            <div class="elevator-simulation__elevator-door elevator-simulation__elevator-door--right"></div>
        </div>
    </div>
`;
};

const addBlankDigit = (str, targetLength) => {
    return str + '&nbsp;'.repeat(targetLength - str.length);
};

const getFloorMarkup = ({ currentFloor, isFirstFloor, isLastFloor }) => {
    const upBtn = isLastFloor
        ? ""
        : `<button id='up-${currentFloor}' data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--up">Up</button>`;
    const downBtn = isFirstFloor
        ? ""
        : `<button id='down-${currentFloor}' data-floor='${currentFloor}' class="elevator-simulation__floor-btn elevator-simulation__floor-btn--down">Down</button>`;

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
                <div class="elevator-simulation__floor-label">Floor ${addBlankDigit(currentFloor.toString(), totalFloorsDigit)}</div>
            </div>
        </div>
    </div>
`;
};

const updateElevatorIndicator = (elevatorIdx) => {
    const elevator = elevators[elevatorIdx];
    const el = elevator.el;

    let dir = '&nbsp;';
    if (elevator.state === STATES.UP) dir = '&uArr;';
    else if (elevator.state === STATES.DOWN) dir = '&dArr;';
    const indicatorEl = el.querySelector('.elevator-simulation__indicator');
    indicatorEl.children[0].textContent = elevator.floor;
    indicatorEl.children[1].innerHTML = dir;
};

function addElevator(floor) {
    elevators.push({
        floor: floor,
        state: STATES.IDLE,
        requestedDirs: [],
        destinations: {
            [STATES.UP]: [],
            [STATES.DOWN]: [],
        },
        el: null
    });
}

const openDoors = (elevatorIdx) => {
    elevators[elevatorIdx].el.classList.add("open");

    setTimeout(() => {
        closeDoors(elevatorIdx);
    }, CLOSE_DOOR_AFTER_DURATION);
};

const closeDoors = (elevatorIdx) => {
    const elevator = elevators[elevatorIdx];
    elevators[elevatorIdx].el.classList.remove("open");

    setTimeout(() => {
        const requestedDir = elevator.requestedDirs.pop();
        elevator.destinations[requestedDir] = elevator.destinations[requestedDir].filter((dest) => dest !== elevator.floor);
        elevator.state = STATES.IDLE;

        updateElevatorIndicator(elevatorIdx);
        reachFloor(elevatorIdx, requestedDir);
    }, MOVE_LIFT_AFTER_DOOR_CLOSE_DURATION);
};

const worker = (elevatorIdx, toFloor) => {
    const translateX = elevatorIdx * (LIFT_WIDTH + LIFT_GAP);
    const translateY = -LIFT_HEIGHT * (toFloor - 1);

    elevators[
        elevatorIdx
    ].el.style.transform = `translate(${translateX}rem, ${translateY}rem)`;

    setTimeout(() => {
        callback(elevatorIdx, toFloor);
    }, FLOOR_REACH_DURATION);
};

const resetButtons = (floor, dir) => {
    let dirStr = dir === STATES.UP ? 'up' : 'down';
    document.getElementById(`${dirStr}-${floor}`).classList.remove('active');
};

const callback = (elevatorIdx, lastFloor) => {
    updateElevatorIndicator(elevatorIdx);

    const elevator = elevators[elevatorIdx];
    const elevatorDir = elevator.state;
    elevator.floor = lastFloor;


    let requestedDir = elevator.requestedDirs.at(-1);
    if (elevator.destinations[requestedDir].includes(lastFloor)) {
        setTimeout(() => openDoors(elevatorIdx), OPEN_DOOR_AFTER_DURATION);
        resetButtons(lastFloor, requestedDir);

        return;
    }

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
    elevator.requestedDirs.push(requestedDir);

    const diff = destination - fromFloor;
    if (diff === 0) {
        elevator.state = STATES.UP;
        openDoors(elevatorIdx);
        resetButtons(destination, requestedDir);

        setTimeout(() => {
            elevator.destinations[requestedDir] = elevator.destinations[requestedDir].filter((dest) => dest !== destination);
        }, DOOR_OPEN_CLOSE_DURATION + CLOSE_DOOR_AFTER_DURATION);
        return;
    }

    let toFloor = fromFloor;
    if (diff < 0) {
        elevator.state = STATES.DOWN;
        toFloor = fromFloor - 1;
    } else {
        elevator.state = STATES.UP;
        toFloor = fromFloor + 1;
    }

    updateElevatorIndicator(elevatorIdx);
    worker(elevatorIdx, toFloor);
};

const handleUp = (event) => {
    handleBtnClick(event, STATES.UP);
};

const handleDown = (event) => {
    handleBtnClick(event, STATES.DOWN);
};

const calculateTimeNeeded = (elevatorIdx, destinations) => {
    let totalTime = 0;
    let elevator = elevators[elevatorIdx];
    let currentFloor = elevator.floor;

    destinations.forEach((d, dIdx) => {
        let diff = Math.abs(d - currentFloor);
        // if (diff === 0) return;

        let timeNeeded = (diff * FLOOR_REACH_DURATION) + OPEN_DOOR_AFTER_DURATION;
        timeNeeded += DOOR_OPEN_CLOSE_DURATION + (CLOSE_DOOR_AFTER_DURATION - DOOR_OPEN_CLOSE_DURATION);
        timeNeeded += DOOR_OPEN_CLOSE_DURATION;

        if (dIdx !== destinations.length - 1) timeNeeded += (MOVE_LIFT_AFTER_DOOR_CLOSE_DURATION - DOOR_OPEN_CLOSE_DURATION);

        currentFloor = d;
        totalTime += timeNeeded;
    });

    return totalTime;
};

const getTimeNeeded = (elevatorIdx) => {
    let totalTime = 0;
    let elevator = elevators[elevatorIdx];

    totalTime += calculateTimeNeeded(elevatorIdx, elevator.destinations[STATES.UP]);
    totalTime += calculateTimeNeeded(elevatorIdx, elevator.destinations[STATES.DOWN]);

    return totalTime;
};

const getScore = (elevatorIdx, requestedFloor, requestedDir) => {
    const elevator = elevators[elevatorIdx];

    const elevatorDir = elevator.state;
    const diff = requestedFloor - elevator.floor;
    const requiredDir = diff >= 0 ? STATES.UP : STATES.DOWN;

    let score = Math.abs(requestedFloor - elevator.floor);
    if (elevatorDir === requiredDir) score--;
    else if ([STATES.UP, STATES.DOWN].includes(elevatorDir)) {
        let lastDestination = elevator.destinations[elevatorDir].at(-1);
        if (lastDestination) {
            score += 2 * Math.abs(elevator.floor - lastDestination);
            score += elevator.destinations[elevatorDir].length;
        }
    }

    const _requestedDir = elevator.requestedDirs.at(-1);
    if (
        ![requestedDir, STATES.IDLE, undefined].includes(_requestedDir)
    ) {
        let lastDestination = totalFloors;
        if (lastDestination) {
            score += 2 * Math.abs(elevator.floor - lastDestination);
            score += elevator.destinations[_requestedDir].length;
        }
    }

    let totalTime = getTimeNeeded(elevatorIdx);

    return score + totalTime;
};

const handleBtnClick = (event, destDir) => {
    if (event.target.classList.contains('active')) return;

    event.target.classList.add('active');
    const currentFloor = parseInt(event.target.dataset.floor);

    let elevatorIdx = 0;
    let minScore = Infinity;
    for (let i = 0; i < elevators.length; i++) {
        let elevator = elevators[i];

        if (elevator.floor === currentFloor && (elevator.state === STATES.IDLE || elevator.destinations[destDir].at(-1) === currentFloor)) {
            elevatorIdx = i;
            break;
        }
        const currentScore = getScore(i, currentFloor, destDir);

        if (Math.abs(currentScore) < minScore) {
            minScore = currentScore;
            elevatorIdx = i;
        }
    }

    let sorter = (a, b) => a - b;
    if (destDir === STATES.DOWN) {
        sorter = (a, b) => b - a;
    }

    const elevator = elevators[elevatorIdx];
    if (!elevator.destinations[destDir].includes(currentFloor)) {
        elevator.destinations[destDir].push(currentFloor);
        elevator.destinations[destDir].sort(sorter);

        if (elevator.state === STATES.IDLE) {
            reachFloor(elevatorIdx, destDir);
        }
    }

    if (elevator.floor === currentFloor) {
        resetButtons(currentFloor, destDir);
    }
};

function generateEntities() {
    const floorsFragment = new DocumentFragment();
    for (let i = 0; i < totalFloors; i++) {
        const tempDiv = document.createElement("div");
        const currentFloor = totalFloors - i;

        const isFirstFloor = currentFloor === 1;
        const isLastFloor = currentFloor === totalFloors;

        tempDiv.innerHTML = getFloorMarkup({
            currentFloor,
            isFirstFloor,
            isLastFloor,
        });
        const floorEl = tempDiv.children[0];

        if (!isLastFloor) {
            const btnUp = floorEl.querySelector(
                ".elevator-simulation__floor-btn--up"
            );
            btnUp.addEventListener("click", handleUp);
        }

        if (!isFirstFloor) {
            const btnDown = floorEl.querySelector(
                ".elevator-simulation__floor-btn--down"
            );
            btnDown.addEventListener("click", handleDown);
        }

        floorsFragment.appendChild(floorEl);
    }

    const elevatorsFragment = new DocumentFragment();
    elevators.forEach((elevator, elevatorIdx) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = getElevatorMarkup({ elevatorIdx: elevatorIdx });

        const elevatorEl = tempDiv.children[0];
        elevatorsFragment.appendChild(elevatorEl);
        elevators[elevatorIdx].el = elevatorEl;
    });

    const elevatorSimulationContent = document.getElementById(
        "elevator-simulation-content"
    );
    const floorsEl = elevatorSimulationContent.querySelector(
        ".elevator-simulation__floors"
    );
    const elevatorsEl = elevatorSimulationContent.querySelector(
        ".elevator-simulation__elevators"
    );

    floorsEl.appendChild(floorsFragment);
    elevatorsEl.appendChild(elevatorsFragment);

    const width = (LIFT_WIDTH + LIFT_GAP) * totalElevators;

    elevatorSimulationContent.style.minWidth = `${width + 20}rem`;

    window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: "smooth",
    });
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
    url.search = "";
    window.history.replaceState({}, "", url.toString());
}

if (totalFloors && totalElevators) {
    setupSimulation();
} else {
    setupForm();
}
