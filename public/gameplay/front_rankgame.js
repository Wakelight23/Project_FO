document.addEventListener('DOMContentLoaded', () => {
    const gameData = JSON.parse(localStorage.getItem('rankGameData'));
    const homeScore = document.getElementById('homeScore');
    const awayScore = document.getElementById('awayScore');
    const matchLogList = document.getElementById('matchLogList');
    const modal = document.getElementById('modal');
    const resultMessage = document.getElementById('result-message');
    const returnToGameBtn = document.getElementById('return-to-game');

    const game = new FutsalGame(gameData);
    game.startGameSimulation();

    returnToGameBtn.addEventListener('click', () => {
        window.location.href = 'gameplay.html';
    });
});

class FutsalGame {
    constructor(gameData) {
        this.gameData = gameData;
        this.homeScore = document.getElementById('homeScore');
        this.awayScore = document.getElementById('awayScore');
        this.matchLogList = document.getElementById('matchLogList');
        this.modal = document.getElementById('modal');
        this.resultMessage = document.getElementById('result-message');
        this.opponentPlayers = gameData.opponentPlayers;
        this.currentScore = { home: 0, away: 0 };
        this.myPlayers = gameData.myPlayers;
        this.resetPositions(); // 초기 위치 설정
    }

    startGameSimulation() {
        let time = 0;
        const gameInterval = setInterval(() => {
            time++;
            this.simulateMovement();
            this.simulateRound();

            if (time >= 300) {
                clearInterval(gameInterval);
                this.endGame();
            }
        }, 50);
    }

    simulateMovement() {
        const players = document.querySelectorAll('.player');
        const ball = document.getElementById('ball');

        players.forEach((player) => {
            const speed = Math.random() * 2 + 1; // 1-3 사이의 랜덤 속도
            const angle = Math.random() * 2 * Math.PI; // 0-2π 사이의 랜덤 각도

            let currentLeft = parseFloat(player.style.left) || 50;
            let currentTop = parseFloat(player.style.top) || 50;

            currentLeft += Math.cos(angle) * speed;
            currentTop += Math.sin(angle) * speed;

            // 필드 경계 체크
            currentLeft = Math.max(0, Math.min(100, currentLeft));
            currentTop = Math.max(0, Math.min(100, currentTop));

            player.style.left = `${currentLeft}%`;
            player.style.top = `${currentTop}%`;
        });

        // 공 움직임
        const ballSpeed = Math.random() * 3 + 2; // 2-5 사이의 랜덤 속도
        const ballAngle = Math.random() * 2 * Math.PI;

        let ballLeft = parseFloat(ball.style.left) || 50;
        let ballTop = parseFloat(ball.style.top) || 50;

        ballLeft += Math.cos(ballAngle) * ballSpeed;
        ballTop += Math.sin(ballAngle) * ballSpeed;

        // 공 경계 체크
        ballLeft = Math.max(0, Math.min(100, ballLeft));
        ballTop = Math.max(0, Math.min(100, ballTop));

        ball.style.left = `${ballLeft}%`;
        ball.style.top = `${ballTop}%`;
    }

    simulateRound() {
        const allPlayers = [...this.myPlayers, ...this.opponentPlayers].sort(
            (a, b) => b.power - a.power
        );

        for (const player of allPlayers) {
            const goalProbability = Math.min(player.power / 1000, 0.7); // 최대 70% 확률로 제한

            if (Math.random() < goalProbability) {
                const isMyPlayer = this.myPlayers.includes(player);
                if (isMyPlayer) {
                    this.currentScore.home++;
                    this.updateScore(
                        this.currentScore.home,
                        this.currentScore.away
                    );
                    this.addMatchLog(
                        `${player.name || '우리 팀 선수'}이(가) 골을 넣었습니다!`
                    );
                } else {
                    this.currentScore.away++;
                    this.updateScore(
                        this.currentScore.home,
                        this.currentScore.away
                    );
                    this.addMatchLog(
                        `${player.name || '상대 팀 선수'}이(가) 골을 넣었습니다!`
                    );
                }
                this.resetPositions();
                return;
            }
        }
    }

    showResult() {
        const result =
            this.currentScore.home > this.currentScore.away ? '승리' : '패배';
        const ratingChange = this.calculateRatingChange();
        const currentRating = this.gameData.myRating || 0;

        this.resultMessage.innerHTML = `
            <p>최종 스코어: ${this.currentScore.home} - ${this.currentScore.away}</p>
            <p>${this.gameData.myNickname || '나의 팀'} VS ${this.gameData.opponent?.nickname || '상대 팀'}</p>
            <p>결과: ${result}</p>
            <p>변동 레이팅: ${currentRating} → ${currentRating + ratingChange} (${ratingChange >= 0 ? '+' : ''}${ratingChange})</p>
        `;
        this.modal.style.display = 'block';
    }

    calculateRatingChange() {
        const WIN_RATING = 10;
        const LOSE_RATING = -8;
        return this.currentScore.home > this.currentScore.away
            ? WIN_RATING
            : LOSE_RATING;
    }

    resetPositions() {
        const players = document.querySelectorAll('.player');
        const ball = document.getElementById('ball');

        // 홈팀 선수 초기 위치
        players[0].style.left = '20%';
        players[1].style.left = '40%';
        players[2].style.left = '60%';

        // 원정팀 선수 초기 위치
        players[3].style.left = '80%';
        players[4].style.left = '60%';
        players[5].style.left = '40%';

        // 모든 선수 y축 위치
        players.forEach((player) => {
            player.style.top = '50%';
        });

        // 공 위치 초기화
        ball.style.left = '50%';
        ball.style.top = '50%';
    }
}
