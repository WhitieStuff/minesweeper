/**
 * Sector
 *  status: 0 - пусто, 1 - мина
 *  opened: 0 - закрыто, 1 - открыто
 *  around: число мин-соседей
 *  flagged: 0 - флага нет, 1 - флаг стоит
 */

/**
 * Элемент игрового поля.
 */
let node_field = document.getElementById('field')
/**
 * Элемент блокировщика поля при окончании иры.
 */
let node_fieldBlocker = document.getElementById('fieldBlocker')
/**
 * Количество клеток по горизонтали. Задается в функции newGame().
 */
let fieldWidth
/**
 * Количество клеток по вертикали. Задается в функции newGame().
 */
let fieldHeight
/**
 * Количество мин на поле. Задается в функции newGame().
 */
let minesTotal
/**
 * Оставшееся количество мин (при пометке флажками).
 */
let minesLast

/**
 * Элемент счетчика мин.
 */
let node_counter = document.getElementById('conter')
/**
 * Элемент таймера.
 */
let node_timer = document.getElementById('timer')
/**
 * Интвал для счетчика времени.
 */
let timerInterval
/**
 * Время с начала хода.
 */
let timer
/**
 * Показатель первого хода, чтобы включать счетчик времени.
 */
let firstMove


/**
 * Массив секторов с их статусами и данными.
 */
let sectors = []

/**
 * Начинает новую игру.
 */
function newGame() {
    fieldWidth = 18
    fieldHeight = 14
    node_field.innerHTML = ''
    node_counter.innerHTML = minesLost = minesTotal  = 40
    node_timer.innerHTML = timer = 0
    firstMove = true
    node_fieldBlocker.classList.add('hidden')
    clearInterval(timerInterval)

    runField(createSector)

    for (let i = 0; i < minesTotal; i++) createMine()
    
    console.log('%cИгра начата.', 'color: green;')
}


function endGame() {

}

/**
 * Проходит по полю и вызывает коллбэк на каждом секторе.
 * @param {function} callback Коллбэк для каждого сектора.
 */
function runField(callback) {
    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) callback(i, j)
}

/**
 * Создает новый чистый сектор по заданной координате.
 * @param {number} i Координата X.
 * @param {number} j Координата Y. 
 */
function createSector(i,j) {
    let newSectorNode = document.createElement('div')
    newSectorNode.classList.add('field__sector')
    newSectorNode.classList.add('field__sector-closed')
    newSectorNode.id = `${i}-${j}`
    newSectorNode.addEventListener('click', event => dig(i, j))

    sectors[i] = sectors[i] ? sectors[i] : []
    sectors[i][j] = {status: 0, opened: 0, around: 0, flagged: 0}

    node_field.appendChild(newSectorNode)
}

/**
 * Создает мину в случайном месте поля.
 */
function createMine() {
    let x = Math.floor(Math.random() * (fieldHeight - 1))
    let y = Math.floor(Math.random() * (fieldWidth - 1))

    if (sectors[x][y].status != 0) return createMine()

    sectors[x][y].status = 1
    sectors[x][y].around = 0
    document.getElementById(`${x}-${y}`).className='field__sector field__sector-closed'

    // Увеличиваем счетчик соседских мин для секторов вокруг.
    for (let i = x - 1; i < x + 2; i++) for (let j = y - 1; j < y + 2; j++) {
        if (sectors[i] && sectors[i][j] && !sectors[i][j].status) sectors[i][j].around++
    }
}

/**
 * Нажатие по сектору.
 * @param {string} event Событие нажатия сектора.
 */
function dig(x, y) {
    sector = document.getElementById(`${x}-${y}`)
    if (sectors[x][y].opened) return
    if (sectors[x][y].flagged) return
    if (sectors[x][y].status) return loseGame(x, y)

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
 * Проверяет все соседние секторы вокруг заданных координат, если не бомба и не открыто - открывает.
 * @param {number} x Координата X.
 * @param {number} y Координата Y.
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
 * Нажатие по сектору.
 * @param {string} event Событие нажатия сектора.
 */
function checkFlag(event) {
    let x = event.target.id.split('-')[0]
    let y = event.target.id.split('-')[1]
    if (sectors[x][y].opened) return

    if (firstMove) interval = setInterval(() => {node_timer.innerHTML = ++timer}, 1000)
    firstMove = false

    if (sectors[x][y].flagged) {
        sectors[x][y].flagged = 0
        event.target.classList.remove('field__sector-flag')
        node_counter.innerHTML = ++minesLost
    } else {
        sectors[x][y].flagged = 1
        event.target.classList.add('field__sector-flag')
        node_counter.innerHTML = --minesLost
        // if (minesLost == 0) checkWin()
    }
}

/**
 * Проверяет ход на завершение игры.
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
 * Открывает все мины на поле.
 * @param {Element} sector Сектор для обработки.
 */
function showMine(sector) {
    sector.classList.add('field__sector-mine')
    sector.classList.remove('field__sector-closed')
}

/**
 * Заканчивает игру проигрышем.
 * @param {number} x Координата X взорванного сектора.
 * @param {number} y Координата Y взорванного сектора.
 */
async function loseGame(x, y) {
    document.getElementById(`${x}-${y}`).classList.add('field__sector-mine')
    console.log('Игра проиграна!')
    clearInterval(timerInterval)
    node_fieldBlocker.classList.remove('hidden')
    let mines = []
    let currentMine = 0

    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) {
        if (sectors[i][j].status) mines.push(document.getElementById(`${i}-${j}`))
    }

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
 * Помечает пустые поля цветками.
 * @param {Element} sector Сектор для обработки.
 */
function growFlower(sector) {
    sector.classList.add('field__sector-flower')
}

/**
 * Заканчивает игру выигрышем.
 */
function winGame() {
    console.log('Игра выиграна!')
    clearInterval(timerInterval)
    node_fieldBlocker.classList.remove('hidden')
    let flowers = []
    let currentFlower = 0

    for (let i = 0; i < fieldHeight; i++) for (let j = 0; j < fieldWidth; j++) {
        if (!sectors[i][j].status && !sectors[i][j].around) flowers.push(document.getElementById(`${i}-${j}`))
    }
    function growFlowers() {
        if (currentFlower >= flowers.length) return
        setTimeout(() => {
            growFlower(flowers[currentFlower++])
            growFlowers()
        }, 50)
    }

    growFlowers()
}

window.oncontextmenu = function (event) {
    if (event.target.classList.contains('field__sector')) checkFlag(event)
    return false
}

newGame()