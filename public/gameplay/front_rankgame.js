class SoccerGame {
    constructor() {
        // DOM 요소 초기화
        this.field = document.querySelector('.field');
        this.ball = document.querySelector('.ball');
        this.homePlayers = Array.from(
            document.querySelectorAll('.player.home')
        );
        this.awayPlayers = Array.from(
            document.querySelectorAll('.player.away')
        );
        this.homeScore = document.querySelector('.home-score');
        this.awayScore = document.querySelector('.away-score');
        this.modal = document.querySelector('.modal');
        this.resultText = document.querySelector('.result-text');

        // 게임 초기화
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // 점수 초기화
        this.homeScore.textContent = '0';
        this.awayScore.textContent = '0';

        // 초기 트랜지션 제거
        [...this.homePlayers, ...this.awayPlayers, this.ball].forEach(
            (element) => {
                element.style.transition = 'none';
            }
        );

        // 초기 위치 설정
        this.setInitialPositions();

        // 강제 리플로우
        this.field.offsetHeight;

        // 트랜지션 복원
        [...this.homePlayers, ...this.awayPlayers, this.ball].forEach(
            (element) => {
                element.style.transition = 'all 0.5s ease-out';
            }
        );
    }

    setInitialPositions() {
        // 선수 초기 위치 설정
        this.homePlayers.forEach((player, index) => {
            player.style.left = '20%';
            player.style.top = `${30 + index * 20}%`;
        });

        this.awayPlayers.forEach((player, index) => {
            player.style.left = '80%';
            player.style.top = `${30 + index * 20}%`;
        });

        // 공 초기 위치 설정
        this.ball.style.left = '50%';
        this.ball.style.top = '50%';
    }

    setupEventListeners() {
        const modalButton = document.querySelector('.modal-button');
        if (modalButton) {
            modalButton.addEventListener('click', () => {
                window.location.href = './gameplay.html';
            });
        }
    }

    async simulateMatch(matchData) {
        // 각 골에 대해 순차적으로 시뮬레이션 실행
        for (let i = 0; i < matchData.goals.length; i++) {
            const goal = matchData.goals[i];

            // 각 골 시뮬레이션 전에 딜레이
            if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            await this.simulateGoal(goal);
        }

        // 마지막 시뮬레이션 후 결과 표시 전 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.showResult(matchData.finalScore);
    }

    async simulateGoal(goalData) {
        const { team } = goalData;
        const attackingPlayers =
            team === 'home' ? this.homePlayers : this.awayPlayers;
        const defendingPlayers =
            team === 'home' ? this.awayPlayers : this.homePlayers;
        const targetX = team === 'home' ? '90%' : '10%';

        // 1. 공격 선수들을 공으로 이동, 수비수들도 약간 뒤쪽으로 이동
        await Promise.all([
            this.movePlayersAroundBall(attackingPlayers, 'attack'),
            this.movePlayersAroundBall(defendingPlayers, 'defend', team),
        ]);

        // 2. 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 3. 공을 골대로 이동하면서 수비수들은 뒤쪽으로 물러남
        await Promise.all([
            this.moveBallToGoal(targetX),
            this.moveDefendersBack(defendingPlayers, team),
        ]);

        // 4. 점수 업데이트 및 대기
        this.updateScore(team);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 5. 모든 요소 초기 위치로 리셋
        await this.resetPositions();
    }

    async movePlayersAroundBall(players, type, attackingTeam = null) {
        const promises = players.map((player, index) => {
            return new Promise((resolve) => {
                let offsetX, offsetY;
                const baseRadius = 10; // 기본 반경

                if (type === 'attack') {
                    // 공격수들은 공 주변에 삼각형 형태로 배치
                    const angle = (index * 2 * Math.PI) / players.length;
                    offsetX = Math.cos(angle) * baseRadius;
                    offsetY = Math.sin(angle) * baseRadius;
                } else {
                    // 수비수들은 공격 방향에 따라 약간 뒤쪽에 위치
                    const angle = (index * 2 * Math.PI) / players.length;
                    const defenseRadius = baseRadius + 5; // 수비 반경은 약간 더 크게
                    const defenseOffsetX = attackingTeam === 'home' ? 5 : -5; // 공격 방향에 따라 수비 위치 조정

                    offsetX = Math.cos(angle) * defenseRadius + defenseOffsetX;
                    offsetY = Math.sin(angle) * defenseRadius;
                }

                player.style.transition = 'all 0.5s ease-out';
                player.style.left = `calc(50% + ${offsetX}%)`;
                player.style.top = `calc(50% + ${offsetY}%)`;

                setTimeout(resolve, 500);
            });
        });

        await Promise.all(promises);
    }

    async moveDefendersBack(defenders, attackingTeam) {
        const promises = defenders.map((player, index) => {
            return new Promise((resolve) => {
                const baseOffsetY = (index - 1) * 10; // 수직 간격
                const offsetX = attackingTeam === 'home' ? 15 : -15; // 수평 간격

                player.style.transition = 'all 0.5s ease-out';
                player.style.left = `calc(50% + ${offsetX}%)`;
                player.style.top = `calc(50% + ${baseOffsetY}%)`;

                setTimeout(resolve, 500);
            });
        });

        return Promise.all(promises);
    }

    async moveBallToGoal(targetX) {
        return new Promise((resolve) => {
            this.ball.style.transition = 'all 0.5s ease-out';
            this.ball.style.left = targetX;
            setTimeout(resolve, 500); // 애니메이션 완료 보장
        });
    }

    updateScore(team) {
        if (team === 'home') {
            this.homeScore.textContent =
                parseInt(this.homeScore.textContent) + 1;
        } else {
            this.awayScore.textContent =
                parseInt(this.awayScore.textContent) + 1;
        }
    }

    async resetPositions() {
        return new Promise((resolve) => {
            // 모든 요소에 트랜지션 적용
            [...this.homePlayers, ...this.awayPlayers, this.ball].forEach(
                (element) => {
                    element.style.transition = 'all 0.5s ease-out';
                }
            );

            // 위치 초기화
            this.setInitialPositions();

            // 애니메이션 완료 대기
            setTimeout(resolve, 500);
        });
    }

    showResult(finalScore) {
        this.resultText.textContent = `최종 스코어: ${finalScore}`;
        this.modal.style.display = 'flex';
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', async () => {
    const game = new SoccerGame();

    // 테스트용 매치 데이터
    let testMatchData = {
        goals: [
            { team: 'home', scorer: 1 },
            { team: 'away', scorer: 4 },
            { team: 'home', scorer: 2 },
        ],
        finalScore: '2-1',
    };

    const accessToken = localStorage.getItem('accessToken');
    const email = localStorage.getItem('email');

    if (!accessToken || !email) {
        alert('로그인이 필요합니다. 다시 로그인해 주세요.');
        throw new Error('Missing access token or email.');
    }

    //초반전 중반전 후반전
    // for (let i = 0; i < 3; i++) {
    //     const playingResponse = await fetch('/api/rankmatch/playing', {
    //         method: 'GET',
    //         headers: {
    //             Authorization: `Bearer ${accessToken}`,
    //             'x-info': email,
    //         },
    //     });

    //     if (!playingResponse.ok) {
    //         throw new Error('Error in playing phase');
    //     }
    // }

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

    console.log(resultData);
    testMatchData.finalScore = resultData.result;
    testMatchData.goals = [];
    let data =
        testMatchData.finalScore === '패배'
            ? { team: 'away', scorer: 1 }
            : { team: 'home', scorer: 1 };
    testMatchData.goals.push(data);

    // 시뮬레이션 시작
    setTimeout(() => {
        game.simulateMatch(testMatchData);
    }, 1000);
});
