/**
 * Sector:
 *  status: 0 - empty, 1 - mine.
 *  opened: 0 - closed, 1 - opened.
 *  around: number of mines around the sector.
 *  flagged: 0 - not flagged, 1 - flagged.
 */

/** Node of the game field. */
let node_field = document.getElementById('field')
/** Node of the game field blocker. */
let node_fieldBlocker = document.getElementById('fieldBlocker')
/** Number of columns. Set within newGame(). */
let fieldWidth
/** Number of rows. Set within newGame(). */
let fieldHeight
/** Number of mines in the game. Set within newGame(). */
let minesTotal
/** Mines lost on the field (not flagged). */
let minesLast
/** Current best time. */
let bestTime
/** Total games won. */
let gamesWon
/** Node of the info line. */
let node_info = document.getElementById('info')
/** Node of the best-time. */
let node_bestTime = document.getElementById('best-time')
/** Node of the games-won. */
let node_gamesWon = document.getElementById('games-won')
/** Node of mines counter. */
let node_counter = document.getElementById('conter')
/** Node of timer. */
let node_timer = document.getElementById('timer')
/** An interval for the timer. */
let timerInterval
/** Time passed since the first move. */
let timer
/** First move marker for running timer. */
let firstMove

let modes = {
    easy: {
        fieldWidth: 10,
        fieldHeight: 10,
        minesTotal: 10
    },
    medium: {
        fieldWidth: 18,
        fieldHeight: 14,
        minesTotal: 40
    },
    hard: {
        fieldWidth: 24,
        fieldHeight: 20,
        minesTotal: 99
    }
}

let node_modes = document.getElementById('mode')
node_modes.value = localStorage.getItem('minesweeper-mode') || 'medium'
let mode = node_modes.value
node_modes.addEventListener('change', event => {
    mode = node_modes.value
    localStorage.setItem('minesweeper-mode', mode)
    newGame()
})




/**
 * Array of all the sectors.
 * Goes like sectors[x][y].status.
 * Each sector has:
 *  status: 0 - empty, 1 - mine.
 *  opened: 0 - closed, 1 - opened.
 *  around: number of mines around the sector.
 *  flagged: 0 - not flagged, 1 - flagged.
 */
let sectors = []

/**
 * Starts a new game.
 */
function newGame() {
    node_field.className = 'field'
    node_field.classList.add(`field-${mode}`)

    fieldWidth = modes[mode].fieldWidth
    fieldHeight = modes[mode].fieldHeight
    node_field.innerHTML = ''
    node_counter.innerHTML = minesLost = minesTotal  = modes[mode].minesTotal
    node_timer.innerHTML = timer = 0
    node_gamesWon.innerHTML = gamesWon = parseInt(localStorage.getItem(`minesweeper-games-won-${node_modes.value}`)) || 0
    node_bestTime.innerHTML = bestTime = parseInt(localStorage.getItem(`minesweeper-best-time-${node_modes.value}`)) || 0

    firstMove = true

    node_fieldBlocker.className = `field-blocker field-blocker-${mode}`
    node_info.style.width = `${node_fieldBlocker.offsetWidth}px`
    node_fieldBlocker.classList.add('hidden')

    sectors = []

    clearInterval(timerInterval)

    runField(createSector)

    for (let i = 0; i < minesTotal; i++) createMine()
    
    console.log('%cNew game started.', 'color: green;')
}


function endGame() {

}

/**
 * Runs the whole field and calls the callback.
 * @param {function} callback A callback for each sector.
 */
function runField(callback) {
    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) callback(i, j)
}

/**
 * Creates a new virgin sector at the given coordinates.
 * @param {number} x Coordinate X.
 * @param {number} y Coordinate Y. 
 */
function createSector(x, y) {
    let newSectorNode = document.createElement('div')
    newSectorNode.className = `field__sector field__sector-${mode} field__sector-closed`
    newSectorNode.id = `${x}-${y}`
    newSectorNode.addEventListener('click', event => dig(x, y))

    sectors[x] = sectors[x] ? sectors[x] : []
    sectors[x][y] = {status: 0, opened: 0, around: 0, flagged: 0}

    node_field.appendChild(newSectorNode)
}

/**
 * Creates a mine at a random sector.
 */
function createMine() {
    let x = Math.floor(Math.random() * (fieldHeight - 1))
    let y = Math.floor(Math.random() * (fieldWidth - 1))

    if (sectors[x][y].status != 0) return createMine()

    sectors[x][y].status = 1
    sectors[x][y].around = 0
    document.getElementById(`${x}-${y}`).className = `field__sector field__sector-${mode} field__sector-closed`

    // Run around the sector and increase the number of neighbour mines.
    for (let i = x - 1; i < x + 2; i++) for (let j = y - 1; j < y + 2; j++) {
        if (sectors[i] && sectors[i][j] && !sectors[i][j].status) sectors[i][j].around++
    }
}

/**
 * Click on a sector.
 * @param {string} event Event of the click.
 */
function dig(x, y) {
    sector = document.getElementById(`${x}-${y}`)
    if (sectors[x][y].opened) return
    if (sectors[x][y].flagged) return
    if (sectors[x][y].status) {
        if (!firstMove) return loseGame(x, y)
        newGame()
        return dig(x, y)
    }
    if (sectors[x][y].around) {
        if (firstMove) {
            newGame()
            return dig(x, y)
        }
    }

    if (firstMove) timerInterval = setInterval(() => {node_timer.innerHTML = ++timer}, 1000)
    firstMove = false

    sectors[x][y].opened = 1
    sector.classList.remove(`field__sector-closed`)
    if (sectors[x][y].around) {
        sector.classList.add(`field__sector-${sectors[x][y].around}`)
        sector.innerHTML = sectors[x][y].around
    } else {
        runAround(x, y)
    }
    checkWin()
}

/**
 * Runs around the sector and opens empty ones.
 * @param {number} x Coordinate X.
 * @param {number} y Coordinate Y.
 */
function runAround(x, y) {
    x = parseInt(x)
    y = parseInt(y)
    for (let i = x - 1; i < x + 2; i++) for (let j = y - 1; j < y + 2; j++) {
        if (sectors[i] && sectors[i][j] && !sectors[i][j].opened && !sectors[i][j].flagged && !sectors[i][j].status) {
            dig(i, j)
        }
    }
}

/**
 * Right click on sector.
 * @param {string} event Event of the right click.
 */
function checkFlag(event) {
    let x = event.target.id.split('-')[0]
    let y = event.target.id.split('-')[1]
    if (sectors[x][y].opened) return

    if (firstMove) timerInterval = setInterval(() => {node_timer.innerHTML = ++timer}, 1000)
    firstMove = false

    if (sectors[x][y].flagged) {
        sectors[x][y].flagged = 0
        event.target.classList.remove(`field__sector-flag-${mode}`)
        node_counter.innerHTML = ++minesLost
    } else {
        sectors[x][y].flagged = 1
        event.target.classList.add(`field__sector-flag-${mode}`)
        node_counter.innerHTML = --minesLost
    }
}

/**
 * Checks if the game is won already.
 */
function checkWin() {
    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) {
        sector = sectors[i][j]
        if (!sector.opened && !sector.flagged && !sector.status) return
        if (sector.flagged && !sector.status) return
    }
    winGame()
}

/**
 * Blows a given mine on the field.
 * @param {Element} sector Sector with the mine.
 */
function showMine(sector) {
    sector.classList.add(`field__sector-mine-${mode}`)
    sector.classList.remove('field__sector-closed')
}

/**
 * Ends game with Losing the game.
 * @param {number} x Coordinate X of the last blown up sector.
 * @param {number} y Coordinate Y of the last blown up sector.
 */
async function loseGame(x, y) {
    document.getElementById(`${x}-${y}`).classList.add(`field__sector-mine-${mode}`)
    console.log('You lost..')
    clearInterval(timerInterval)
    node_fieldBlocker.classList.remove('hidden')
    let mines = []
    let currentMine = 0

    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) {
        if (sectors[i][j].status) mines.push(document.getElementById(`${i}-${j}`))
    }

    /**
     * Runs through all mines and blows them up.
     */
    function showMines() {
        if (currentMine >= minesTotal) return
        setTimeout(() => {
            showMine(mines[currentMine++])
            showMines()
        }, 50)
    }

    showMines()
}

/**
 * Marks a given sector with a flower.
 * @param {Element} sector Sector to mark with a flower.
 */
function growFlower(sector) {
    sector.classList.add(`field__sector-flower-${mode}`)
}

/**
 * Заканчивает игру выигрышем.
 */
function winGame() {
    console.log('You won!')
    clearInterval(timerInterval)
    node_fieldBlocker.classList.remove('hidden')
    let flowers = []
    let currentFlower = 0

    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) {
        if (sectors[i][j].status) flowers.push(document.getElementById(`${i}-${j}`))
    }

    /**
     * Runs through all empty sectors and marks them with flowers.
     */
    function growFlowers() {
        if (currentFlower >= flowers.length) return
        setTimeout(() => {
            growFlower(flowers[currentFlower++])
            growFlowers()
        }, 30)
    }

    bestTime = !bestTime || bestTime > timer ? timer : bestTime

    localStorage.setItem(`minesweeper-games-won-${node_modes.value}`, ++gamesWon)
    localStorage.setItem(`minesweeper-best-time-${node_modes.value}`, bestTime)
    node_gamesWon.innerHTML = gamesWon
    node_bestTime.innerHTML = bestTime

    growFlowers()
}

window.oncontextmenu = function (event) {
    if (event.target.classList.contains('field__sector')) {
        checkFlag(event)
    }
    return false    
}

/** Images that should be loaded before the first time the class added. */
let images = []
images[0] = new Image()
images[0].src = (`./images/flag.png`)
images[1] = new Image()
images[1].src = (`./images/mine.png`)
images[2] = new Image()
images[2].src = (`./images/flower.png`)

newGame()