document.addEventListener('DOMContentLoaded', () => {
    const gameData = JSON.parse(localStorage.getItem('rankGameData'));
    const homeScore = document.getElementById('homeScore');
    const awayScore = document.getElementById('awayScore');
    const matchLogList = document.getElementById('matchLogList');
    const modal = document.getElementById('modal');
    const resultMessage = document.getElementById('result-message');
    const returnToGameBtn = document.getElementById('return-to-game');

    const game = new SoccerGame(gameData);
    game.startGameSimulation();

    returnToGameBtn.addEventListener('click', () => {
        window.location.href = 'gameplay.html';
    });
});

class SoccerGame {
    constructor(gameData) {
        this.gameData = gameData;
        this.currentScore = { home: 0, away: 0 }; // 초기화
        this.players = this.initializePlayers();
        this.ball = new SoccerBall();
        this.modal = document.getElementById('modal');
        this.resultMessage = document.getElementById('result-message');
    }

    initializePlayers() {
        const homePlayers = [
            new SoccerPlayer('Home Player 1', 'attacker', 'home'),
            new SoccerPlayer('Home Player 2', 'defender', 'home'),
            new SoccerPlayer('Home Goalkeeper', 'goalkeeper', 'home'),
        ];
        const awayPlayers = [
            new SoccerPlayer('Away Player 1', 'attacker', 'away'),
            new SoccerPlayer('Away Player 2', 'defender', 'away'),
            new SoccerPlayer('Away Goalkeeper', 'goalkeeper', 'away'),
        ];
        return [...homePlayers, ...awayPlayers];
    }

    startGameSimulation() {
        const maxGameTime = 180; // 180초 (3분 게임)
        let elapsedTime = 0;

        const interval = setInterval(() => {
            this.updateGameState();
            elapsedTime++;

            if (elapsedTime >= maxGameTime) {
                clearInterval(interval); // 게임 루프 종료
                this.showResult(); // 결과 표시
            }
        }, 1000 / 30); // 30FPS
    }

    updateGameState() {
        console.log('Updating game state...');
        console.log('Current Score:', this.currentScore);

        this.ball.update();
        this.players.forEach((player) => player.act(this.ball, this.players));
        this.updateFieldUI(this.players, this.ball);
        this.checkGoal();
    }

    checkGoal() {
        console.log('Checking goal...');
        console.log('Ball position:', this.ball.position);
        console.log('Current Score:', this.currentScore);

        if (this.ball.position.x <= 0) {
            this.currentScore.away = (this.currentScore.away || 0) + 1;
            console.log('Away team scored!');
            this.resetPositions(this.players, this.ball);
        } else if (this.ball.position.x >= 100) {
            this.currentScore.home = (this.currentScore.home || 0) + 1;
            console.log('Home team scored!');
            this.resetPositions(this.players, this.ball);
        }

        document.getElementById('homeScore').textContent =
            this.currentScore.home || 0;
        document.getElementById('awayScore').textContent =
            this.currentScore.away || 0;
    }

    resetPositions(players, ball) {
        players
            .filter((p) => p.team === 'home')
            .forEach((player, index) => {
                if (player.role === 'attacker') {
                    player.position = { x: 30, y: 40 + index * 20 };
                } else if (player.role === 'defender') {
                    player.position = { x: 20, y: 30 + index * 20 };
                } else if (player.role === 'goalkeeper') {
                    player.position = { x: 10, y: 50 };
                }
            });

        players
            .filter((p) => p.team === 'away')
            .forEach((player, index) => {
                if (player.role === 'attacker') {
                    player.position = { x: 70, y: 40 + index * 20 };
                } else if (player.role === 'defender') {
                    player.position = { x: 80, y: 30 + index * 20 };
                } else if (player.role === 'goalkeeper') {
                    player.position = { x: 90, y: 50 };
                }
            });

        ball.position = { x: 50, y: 50 }; // 공 중앙 위치
        ball.velocity = { x: 0, y: 0 }; // 공 정지 상태

        this.updateFieldUI(players, ball);
    }

    updateFieldUI(players, ball) {
        players.forEach((player, index) => {
            let playerElement = document.getElementById(`player-${index}`);
            if (!playerElement) {
                // 요소가 없는 경우 새로 생성
                playerElement = document.createElement('div');
                playerElement.id = `player-${index}`;
                playerElement.className =
                    player.team === 'home'
                        ? 'player home-player'
                        : 'player away-player';
                document.getElementById('field').appendChild(playerElement);
            }
            playerElement.style.left = `${player.position.x}%`;
            playerElement.style.top = `${player.position.y}%`;
        });

        let ballElement = document.getElementById('ball');
        if (!ballElement) {
            // 공 요소가 없는 경우 생성
            ballElement = document.createElement('div');
            ballElement.id = 'ball';
            ballElement.className = 'ball';
            document.getElementById('field').appendChild(ballElement);
        }
        ballElement.style.left = `${ball.position.x}%`;
        ballElement.style.top = `${ball.position.y}%`;
    }

    addMatchLog(message) {
        const logItem = document.createElement('p');
        logItem.textContent = message;
        document.getElementById('matchLogList').appendChild(logItem);
    }

    showResult() {
        const home = this.currentScore.home || 0;
        const away = this.currentScore.away || 0;

        let result;
        if (home > away) {
            result = '승리';
        } else if (home < away) {
            result = '패배';
        } else {
            result = '무승부';
        }

        const ratingChange = this.calculateRatingChange(result);

        this.resultMessage.innerHTML = `
            <p>최종 스코어: ${home} - ${away}</p>
            <p>${this.gameData.myNickname || '우리 팀'} VS ${this.gameData.opponent?.nickname || '상대 팀'}</p>
            <p>결과: ${result}</p>
            <p>변동 레이팅: ${ratingChange > 0 ? '+' : ''}${ratingChange}</p>
        `;
        this.modal.style.display = 'block';
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
        return 0; // 기본값
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

    moveTowards(target) {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const angle = Math.atan2(dy, dx);

        this.position.x += Math.cos(angle) * this.speed;
        this.position.y += Math.sin(angle) * this.speed;
    }

    act(ball, players) {
        const isNearBall = this.isNear(ball);

        if (isNearBall && this.role === 'attacker') {
            // 공격수: 공을 차서 골대로 슛
            const goalX = this.team === 'home' ? 100 : 0;
            const goalY = 50; // 골의 중앙
            const direction = Math.atan2(
                goalY - ball.position.y,
                goalX - ball.position.x
            );
            ball.kick(direction, 5); // 속도 5로 슛
        } else if (!isNearBall) {
            // 다른 선수: 공으로 이동
            this.moveTowards(ball.position);
        }

        // 충돌 회피
        this.avoidCollision(players);
    }

    avoidCollision(players) {
        players.forEach((otherPlayer) => {
            if (otherPlayer !== this) {
                const dx = otherPlayer.position.x - this.position.x;
                const dy = otherPlayer.position.y - this.position.y;
                const distance = Math.hypot(dx, dy);

                if (distance < 5) {
                    // 최소 거리 5 유지
                    // 서로 밀어내기
                    this.position.x -= dx * 0.1;
                    this.position.y -= dy * 0.1;
                }
            }
        });

        // 필드 경계 제한
        this.position.x = Math.max(0, Math.min(100, this.position.x));
        this.position.y = Math.max(0, Math.min(100, this.position.y));
    }

    isNear(ball) {
        const distance = Math.hypot(
            ball.position.x - this.position.x,
            ball.position.y - this.position.y
        );
        return distance < 5;
    }
}

class SoccerBall {
    constructor() {
        this.position = { x: 50, y: 50 };
        this.velocity = { x: 0, y: 0 };
        this.friction = 0.98; // 마찰 계수
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // 마찰 적용
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // 필드 경계 처리
        if (this.position.x <= 0 || this.position.x >= 100)
            this.velocity.x *= -1;
        if (this.position.y <= 0 || this.position.y >= 100)
            this.velocity.y *= -1;
    }

    kick(direction, speed) {
        this.velocity.x = Math.cos(direction) * speed;
        this.velocity.y = Math.sin(direction) * speed;
    }
}
