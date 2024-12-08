const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new SoccerGame();
    game.initializePlayers();
    game.startGameSimulation();
});

class SoccerGame {
    constructor() {
        this.currentScore = { home: 0, away: 0 }; // 초기화된 점수
        this.players = this.createPlayers(); // 선수 배열 초기화
        this.ball = new SoccerBall();
        this.modal = document.getElementById('modal');
        this.resultMessage = document.getElementById('result-message');
    }

    createPlayers() {
        return [
            // 홈 팀 플레이어
            {
                id: 'player1',
                name: 'Home Player 1',
                team: 'home',
                role: 'attacker',
                position: { x: 20, y: 30 },
            },
            {
                id: 'player2',
                name: 'Home Player 2',
                team: 'home',
                role: 'defender',
                position: { x: 20, y: 50 },
            },
            {
                id: 'player3',
                name: 'Home Player 3',
                team: 'home',
                role: 'midfielder',
                position: { x: 20, y: 70 },
            },

            // 어웨이 팀 플레이어
            {
                id: 'player4',
                name: 'Away Player 1',
                team: 'away',
                role: 'attacker',
                position: { x: 80, y: 30 },
            },
            {
                id: 'player5',
                name: 'Away Player 2',
                team: 'away',
                role: 'defender',
                position: { x: 80, y: 50 },
            },
            {
                id: 'player6',
                name: 'Away Player 3',
                team: 'away',
                role: 'midfielder',
                position: { x: 80, y: 70 },
            },
        ];
    }

    initializePlayers() {
        const fieldElement = document.getElementById('field');

        this.players.forEach((player) => {
            const playerElement = document.createElement('div');
            playerElement.id = player.id;
            playerElement.className = `player ${player.team}-player ${player.role}`;
            playerElement.style.left = `${player.position.x}%`;
            playerElement.style.top = `${player.position.y}%`;
            fieldElement.appendChild(playerElement);
        });
    }

    animateBallToGoal(scorer, team) {
        const ballElement = document.getElementById('ball');
        const fieldElement = document.getElementById('field');

        // 득점자의 위치 가져오기
        const scorerElement = document.getElementById(scorer.id); // 선수 DOM 요소
        const scorerRect = scorerElement.getBoundingClientRect();
        const fieldRect = fieldElement.getBoundingClientRect();

        // 골대 위치 계산
        const goalX =
            team === 'home' ? fieldRect.right - 20 : fieldRect.left + 20;
        const goalY = fieldRect.top + fieldRect.height / 2;

        // 공 위치 애니메이션
        ballElement.style.transition = 'all 1s ease';
        ballElement.style.left = `${goalX}px`;
        ballElement.style.top = `${goalY}px`;

        // 애니메이션 종료 후 상태 업데이트
        setTimeout(() => {
            this.updateScoreUI(); // 점수 업데이트
        }, 1000);
    }

    async startGameSimulation() {
        const loadingElement = document.getElementById('loading');
        console.log('Game simulation started.');
        loadingElement.style.display = 'block';

        try {
            const accessToken = localStorage.getItem('accessToken');
            const email = localStorage.getItem('email');

            if (!accessToken || !email) {
                alert('로그인이 필요합니다. 다시 로그인해 주세요.');
                throw new Error('Missing access token or email.');
            }

            const playingResponse = await fetch('/api/rankmatch/playing', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'x-info': email,
                },
            });

            if (!playingResponse.ok) {
                throw new Error('Error in playing phase');
            }

            const resultResponse = await fetch('/api/rankmatch/result', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'x-info': email,
                },
            });

            if (!resultResponse.ok) {
                throw new Error('Error fetching results');
            }

            const resultData = await resultResponse.json();
            this.currentScore.home =
                parseInt(resultData.score.split(':')[0]) || 0;
            this.currentScore.away =
                parseInt(resultData.score.split(':')[1]) || 0;
            this.simulateMatchLog(resultData.matchLog);

            setTimeout(() => {
                this.showResult(resultData.result, resultData.score);
            }, resultData.matchLog.length * 2000);
        } catch (error) {
            console.error('Error during game simulation:', error);
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    simulateMatchLog(matchLog) {
        matchLog.forEach((log, index) => {
            setTimeout(() => {
                this.addMatchLog(log);

                const match = log.match(/(.+?)이\(가\) 골을 넣었습니다!/);
                if (match) {
                    const scorerName = match[1];
                    const scorer = this.players.find(
                        (player) => player.name === scorerName
                    );

                    if (scorer) {
                        this.movePlayerToBall(scorer); // 득점자를 공으로 이동
                        this.animateBallToGoal(scorer, scorer.team); // 공을 골대로 이동
                    }
                }
            }, index * 2000);
        });
    }

    addMatchLog(log) {
        const logItem = document.createElement('p');
        logItem.textContent = log;
        document.getElementById('matchLogList').appendChild(logItem);
    }

    showResult(result, score) {
        const resultMessage = `
            <p>최종 스코어: ${score}</p>
            <p>결과: ${result}</p>
        `;
        this.resultMessage.innerHTML = resultMessage;
        this.modal.style.display = 'block';
    }

    resetBall() {
        const ballElement = document.getElementById('ball');
        ballElement.style.transition = 'none'; // 기존 애니메이션 제거
        ballElement.style.left = '50%'; // 중앙으로 이동
        ballElement.style.top = '50%';
    }

    initializePlayers() {
        const fieldElement = document.getElementById('field');
        this.players.forEach((player) => {
            const playerElement = document.createElement('div');
            playerElement.id = player.id;
            playerElement.className = `player ${player.team}-player`;
            playerElement.style.left = `${player.position.x}%`;
            playerElement.style.top = `${player.position.y}%`;
            fieldElement.appendChild(playerElement);
        });
    }

    calculateRatingChange(result) {
        const WIN_RATING = 10;
        const LOSE_RATING = -8;
        const DRAW_RATING = 0;

        if (result === '승리') {
            return WIN_RATING;
        } else if (result === '패배') {
            return LOSE_RATING;
        } else if (result === '무승부') {
            return DRAW_RATING;
        }
        return 0;
    }

    movePlayerToBall(player) {
        const ballElement = document.getElementById('ball');
        const playerElement = document.getElementById(player.id);

        const ballRect = ballElement.getBoundingClientRect();
        const playerRect = playerElement.getBoundingClientRect();

        // 방향 계산
        const dx = ballRect.left - playerRect.left;
        const dy = ballRect.top - playerRect.top;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            // 이동 방향과 속도 설정
            const stepX = (dx / distance) * player.speed;
            const stepY = (dy / distance) * player.speed;

            // 플레이어 위치 업데이트
            playerElement.style.left = `${playerRect.left + stepX}px`;
            playerElement.style.top = `${playerRect.top + stepY}px`;
        }
    }
}

class SoccerPlayer {
    constructor(name, role, team) {
        this.name = name;
        this.role = role; // 'attacker', 'defender', 'goalkeeper'
        this.team = team; // 'home' or 'away'
        this.position = { x: 50, y: 50 };
        this.speed = 2; // 기본 속도
    }
}

class SoccerBall {
    constructor() {
        this.position = { x: 50, y: 50 };
        this.velocity = { x: 0, y: 0 };
        this.friction = 0.98; // 마찰 계수
    }
}

document
    .getElementById('return-to-game')
    .addEventListener('click', async () => {
        window.location.href = 'gameplay.html';
    });
