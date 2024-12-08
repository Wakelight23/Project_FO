const API_BASE = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const modalBody = document.getElementById('modal-body');
    const returnToGameBtn = document.getElementById('return-to-game');
    const startGameBtn = document.getElementById('start-game');
    const startCaptainGameBtn = document.getElementById('start-captain-game');
    const gameProgress = document.getElementById('game-progress');
    const myCards = document.getElementById('my-cards');
    const opponentCards = document.getElementById('opponent-cards');

    const getAccessToken = () => localStorage.getItem('accessToken');
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    function getAuthHeaders() {
        const accessToken = getAccessToken();
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-info': email,
        };
    }

    function openModal(content) {
        modalBody.innerHTML = content;
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    }

    if (returnToGameBtn) {
        returnToGameBtn.addEventListener('click', closeModal);
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', async () => {
            const opponentId = document.getElementById('opponent-id').value;
            try {
                const response = await fetch(`${API_BASE}/choicematch/start`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ opponentManagerId: opponentId }),
                });
                const data = await response.json();
                if (response.ok) {
                    openModal(`
                        <h3>게임 결과</h3>
                        <p>총 전투력: ${data.data.totalPower}</p>
                        <p>상대방 전투력: ${data.data.opponentPower}</p>
                        <p>랜덤 결과: ${data.data.randomResult}</p>
                        <p>게임 결과: ${data.data.gameResult}</p>
                        <p>상대방: ${data.data.opponent.nickname} (레이팅: ${data.data.opponent.rating})</p>
                    `);
                } else {
                    openModal(`<p>오류: ${data.error}</p>`);
                }
            } catch (error) {
                openModal(`<p>오류: ${error.message}</p>`);
            }
        });
    }

    if (startCaptainGameBtn) {
        startCaptainGameBtn.addEventListener('click', async () => {
            const opponentId = document.getElementById(
                'captain-opponent-id'
            ).value;
            const selectedPlayers = Array.from(
                document.querySelectorAll('#player-selection input:checked')
            ).map((input) => input.value);

            if (selectedPlayers.length !== 3) {
                openModal('<p>3명의 선수를 선택해야 합니다.</p>');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/captain/start`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        opponentManagerId: opponentId,
                        selectedPlayerIds: selectedPlayers,
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    startCaptainGameProgress(
                        data.data.selectedPlayers,
                        data.data.opponent.selectedPlayers
                    );
                } else {
                    openModal(`<p>오류: ${data.error}</p>`);
                }
            } catch (error) {
                openModal(`<p>오류: ${error.message}</p>`);
            }
        });
    }

    function startCaptainGameProgress(myPlayers, opponentPlayers) {
        if (gameProgress) gameProgress.classList.remove('hidden');
        const playGame = document.getElementById('play-game');
        const captainGame = document.getElementById('captain-game');
        if (playGame) playGame.classList.add('hidden');
        if (captainGame) captainGame.classList.add('hidden');

        if (myCards)
            myCards.innerHTML = myPlayers
                .map((player) => createCard(player, false))
                .join('');
        if (opponentCards)
            opponentCards.innerHTML = opponentPlayers
                .map((player) => createCard(player, true))
                .join('');

        let round = 0;
        const interval = setInterval(() => {
            if (round < 3) {
                if (myCards && myCards.children[round])
                    flipCard(myCards.children[round]);
                setTimeout(() => {
                    if (opponentCards && opponentCards.children[round])
                        flipCard(opponentCards.children[round]);
                }, 1000);
                round++;
            } else {
                clearInterval(interval);
                setTimeout(showCaptainGameResult, 2000);
            }
        }, 2000);
    }

    function createCard(player, isOpponent) {
        return `
            <div class="card">
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">
                        <h3>${player.name}</h3>
                        <p>능력치: ${player.power}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function flipCard(card) {
        if (card) card.classList.add('flipped');
    }

    async function showCaptainGameResult() {
        try {
            const response = await fetch(`${API_BASE}/captain/result`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (response.ok) {
                let resultHtml = '<h3>대장전 결과</h3>';
                data.data.matches.forEach((match) => {
                    resultHtml += `<p>라운드 ${match.round}: ${match.myPlayer.name} vs ${match.opponentPlayer.name} - ${match.result}</p>`;
                });
                resultHtml += `<p>최종 결과: ${data.data.finalResult}</p>`;
                openModal(resultHtml);
            } else {
                openModal(`<p>오류: ${data.error}</p>`);
            }
        } catch (error) {
            openModal(`<p>오류: ${error.message}</p>`);
        }
    }

    if (returnToGameBtn) {
        returnToGameBtn.addEventListener('click', () => {
            closeModal();
            if (gameProgress) gameProgress.classList.add('hidden');
            const playGame = document.getElementById('play-game');
            const captainGame = document.getElementById('captain-game');
            if (playGame) playGame.classList.remove('hidden');
            if (captainGame) captainGame.classList.remove('hidden');
        });
    }

    loadPlayerSelectionOptions();
});

function loadPlayerSelectionOptions() {
    const playerSelection = document.getElementById('player-selection');
    if (playerSelection) {
        const players = [
            { id: 1, name: '선수1' },
            { id: 2, name: '선수2' },
            { id: 3, name: '선수3' },
            { id: 4, name: '선수4' },
            { id: 5, name: '선수5' },
        ];
        playerSelection.innerHTML = players
            .map(
                (player) =>
                    `<label><input type="checkbox" value="${player.id}"> ${player.name}</label>`
            )
            .join('');
    }
}
