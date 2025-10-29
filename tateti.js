/* Tateti pro — con modal, bloqueo de clicks, highlights y sonidos */
(() => {
    // ====== DOM
    const boardEl = document.getElementById('board');
    const cells = Array.from(boardEl.querySelectorAll('.cell'));
    const turnEl = document.getElementById('turn');
    const sxEl = document.getElementById('sx');
    const soEl = document.getElementById('so');
    const sdEl = document.getElementById('sd');
    const resetBtn = document.getElementById('reset');
    const clearBtn = document.getElementById('clear');

    const dlg = document.getElementById('result');
    const resultTitle = document.getElementById('resultTitle');
    const resultMsg = document.getElementById('resultMsg');
    const playAgainBtn = document.getElementById('playAgain');
    const closeModalBtn = document.getElementById('closeModal');

    // ====== Estado
    const WINS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
        [0, 4, 8], [2, 4, 6]          // diagonales
    ];

    let board = Array(9).fill(null);
    let turn = 'X';
    let finished = false;

    // Marcadores persistentes (opcional)
    let score = JSON.parse(localStorage.getItem('ttt_score') || '{"X":0,"O":0,"D":0}');
    syncScoreUI();

    // ====== Sonidos (WebAudio, sin archivos externos)
    let actx;
    function beep(freq = 660, time = 0.12, type = 'sine', vol = 0.06) {
        try {
            actx = actx || new (window.AudioContext || window.webkitAudioContext)();
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.type = type; o.frequency.value = freq;
            g.gain.value = vol;
            o.connect(g); g.connect(actx.destination);
            o.start();
            setTimeout(() => { o.stop(); o.disconnect(); g.disconnect(); }, time * 1000);
        } catch (e) { /* sin audio está ok */ }
    }
    const sTap = () => beep(740, .07, 'square', .05);
    const sWin = () => { beep(523, .08, 'triangle', .06); setTimeout(() => beep(659, .09, 'triangle', .06), 100); setTimeout(() => beep(784, .12, 'triangle', .07), 220); };
    const sDraw = () => { beep(330, .1, 'sine', .05); setTimeout(() => beep(294, .1, 'sine', .05), 110); setTimeout(() => beep(262, .12, 'sine', .05), 220); };

    // ====== Lógica
    function setStatus() {
        turnEl.textContent = turn;
    }

    function checkWinner() {
        for (const [a, b, c] of WINS) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], line: [a, b, c] };
            }
        }
        if (board.every(Boolean)) return { winner: 'EMPATE', line: null };
        return null;
    }

    function highlight(line) {
        if (!line) return;
        for (const i of line) {
            cells[i].classList.add('win');
        }
    }

    function clearHighlight() {
        cells.forEach(c => c.classList.remove('win'));
    }

    function endGame(result) {
        finished = true;
        if (result.winner === 'EMPATE') {
            score.D++; sDraw();
            resultTitle.textContent = 'Empate';
            resultMsg.textContent = 'No hubo ganador esta vez.';
        } else {
            score[result.winner]++; sWin();
            resultTitle.textContent = `¡Ganó ${result.winner}!`;
            resultMsg.textContent = 'Buena jugada. ¿Vamos de nuevo?';
            highlight(result.line);
        }
        localStorage.setItem('ttt_score', JSON.stringify(score));
        syncScoreUI();
        dlg.showModal();
    }

    function syncScoreUI() {
        sxEl.textContent = score.X;
        soEl.textContent = score.O;
        sdEl.textContent = score.D;
    }

    function handleCellClick(e) {
        if (finished) return;
        const cell = e.currentTarget;
        const i = Number(cell.dataset.i);
        if (board[i]) return;

        board[i] = turn;
        cell.textContent = turn;
        cell.classList.add(turn.toLowerCase());
        sTap();

        const res = checkWinner();
        if (res) {
            endGame(res);
            return;
        }

        turn = turn === 'X' ? 'O' : 'X';
        setStatus();
    }

    function reset() {
        board.fill(null);
        finished = false;
        turn = 'X';
        cells.forEach(c => { c.textContent = ''; c.classList.remove('x', 'o'); });
        clearHighlight();
        setStatus();
    }

    function clearAll() {
        score = { X: 0, O: 0, D: 0 };
        localStorage.setItem('ttt_score', JSON.stringify(score));
        syncScoreUI();
    }

    // ====== Eventos
    cells.forEach(c => c.addEventListener('click', handleCellClick));
    resetBtn.addEventListener('click', reset);
    clearBtn.addEventListener('click', clearAll);

    playAgainBtn.addEventListener('click', () => { dlg.close(); reset(); });
    closeModalBtn.addEventListener('click', () => dlg.close());

    // Init
    setStatus();
})();
