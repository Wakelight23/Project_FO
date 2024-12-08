const field = document.querySelector('.soccer-field');
const ball = document.querySelector('.ball');
const playersA = document.querySelectorAll('.team-a');
const playersB = document.querySelectorAll('.team-b');
const scoreboard = document.querySelector('.scoreboard');
const eventsLog = document.querySelector('.events-log');

let scoreA = 0;
let scoreB = 0;

const initialPositions = {
    teamA: [
        { x: 100, y: 50 },
        { x: 100, y: 150 },
        { x: 100, y: 250 },
    ],
    teamB: [
        { x: 400, y: 50 },
        { x: 400, y: 150 },
        { x: 400, y: 250 },
    ],
};

const gameState = {
    ballPosition: { x: 290, y: 190 },
    currentTime: 0,
};

const matchEvents = [
    { time: 5, team: 'A', scorer: 1, type: 'goal' },
    { time: 10, team: 'B', scorer: 2, type: 'goal' },
    { time: 15, team: 'A', scorer: 3, type: 'goal' },
    { time: 7, team: 'B', scorer: 1, type: 'foul' },
    { time: 12, team: 'A', scorer: 2, type: 'yellow-card' },
];

// 공 이동 애니메이션
function animateBall(targetX, targetY, duration, onComplete) {
    const startX = gameState.ballPosition.x;
    const startY = gameState.ballPosition.y;
    const startTime = performance.now();

    function move(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        gameState.ballPosition.x = startX + (targetX - startX) * progress;
        gameState.ballPosition.y = startY + (targetY - startY) * progress;
        ball.style.left = `${gameState.ballPosition.x}px`;
        ball.style.top = `${gameState.ballPosition.y}px`;

        if (progress < 1) {
            requestAnimationFrame(move);
        } else if (onComplete) {
            onComplete();
        }
    }

    requestAnimationFrame(move);
}

// 플레이어를 특정 위치로 이동
function moveElement(element, targetX, targetY, duration) {
    const startX = parseInt(element.style.left);
    const startY = parseInt(element.style.top);
    const startTime = performance.now();

    function move(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentX = startX + (targetX - startX) * progress;
        const currentY = startY + (targetY - startY) * progress;
        element.style.left = `${currentX}px`;
        element.style.top = `${currentY}px`;

        if (progress < 1) {
            requestAnimationFrame(move);
        }
    }

    requestAnimationFrame(move);
}

// 득점 이후 경기 재시작
function resetGame(teamScored) {
    // 공을 중앙으로 이동
    animateBall(290, 190, 2000, () => {
        gameState.ballPosition.x = 290;
        gameState.ballPosition.y = 190;

        // 플레이어를 초기 위치로 이동
        movePlayersToInitialPositions(playersA, initialPositions.teamA);
        movePlayersToInitialPositions(playersB, initialPositions.teamB);

        logEvent(`Game restarted after Team ${teamScored} scored!`);
    });
}

// 모든 플레이어를 특정 위치로 이동
function movePlayersToInitialPositions(players, initialPositions) {
    players.forEach((player, index) => {
        const { x, y } = initialPositions[index];
        moveElement(player, x, y, 2000);
    });
}

// 점수 업데이트
function updateScore(team) {
    if (team === 'A') scoreA++;
    if (team === 'B') scoreB++;
    scoreboard.textContent = `Team A: ${scoreA} - ${scoreB} Team B`;
}

// 이벤트 로그 기록
function logEvent(message) {
    const logItem = document.createElement('div');
    logItem.textContent = message;
    eventsLog.appendChild(logItem);
}

// 경기 이벤트 처리
function processEvents(currentTime) {
    const currentEvents = matchEvents.filter(
        (event) => event.time === currentTime
    );
    currentEvents.forEach((event) => {
        switch (event.type) {
            case 'goal':
                const goalX = event.team === 'A' ? 50 : 540; // 골대 위치
                const goalY = 190; // 골대 중앙
                animateBall(goalX, goalY, 2000, () => {
                    updateScore(event.team);
                    logEvent(
                        `${event.time}' GOAL: Team ${event.team}, Player ${event.scorer}`
                    );
                    resetGame(event.team);
                });
                break;
            case 'foul':
                logEvent(
                    `${event.time}' FOUL: Team ${event.team}, Player ${event.scorer}`
                );
                break;
            case 'yellow-card':
                logEvent(
                    `${event.time}' YELLOW CARD: Team ${event.team}, Player ${event.scorer}`
                );
                break;
        }
    });
}

// 시뮬레이션 실행
function simulateMatch() {
    const interval = setInterval(() => {
        gameState.currentTime++;

        // 플레이어는 공을 향해 이동
        playersA.forEach((player) =>
            moveElement(
                player,
                gameState.ballPosition.x + Math.random() - 5,
                gameState.ballPosition.y + Math.random() - 5,
                1000
            )
        );

        playersB.forEach((player) =>
            moveElement(
                player,
                gameState.ballPosition.x + Math.random() * Math.sin - 5,
                gameState.ballPosition.y + Math.random() * Math.cos - 5,
                1000
            )
        );

        // 이벤트 처리
        processEvents(gameState.currentTime);

        // 경기 종료
        if (gameState.currentTime >= 20) {
            clearInterval(interval);
            logEvent('Match Ended!');
        }
    }, 1000);
}

// 초기 공 배치
ball.style.left = `${gameState.ballPosition.x}px`;
ball.style.top = `${gameState.ballPosition.y}px`;

// 시뮬레이션 시작
simulateMatch();
