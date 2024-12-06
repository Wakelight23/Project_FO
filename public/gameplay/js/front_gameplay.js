const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const modalBody = document.getElementById('modal-body');
const returnToGameBtn = document.getElementById('return-to-game');
const startGameBtn = document.getElementById('start-game');
const startCaptainGameBtn = document.getElementById('start-captain-game');
const gameProgress = document.getElementById('game-progress');
const myCards = document.getElementById('my-cards');
const opponentCards = document.getElementById('opponent-cards');

function openModal(content) {
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

returnToGameBtn.addEventListener('click', closeModal);

startGameBtn.addEventListener('click', async () => {
    const opponentId = document.getElementById('opponent-id').value;
    try {
        const response = await fetch('/choicematch/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ opponentAccountId: opponentId }),
        });
        const data = await response.json();
        if (response.ok) {
            openModal(`
                <h3>게임 결과</h3>
                <p>${data.data.totalPower}</p>
                <p>${data.data.opponentPower}</p>
                <p>${data.data.randomResult}</p>
                <p>${data.data.gameResult}</p>
                <p>상대방: ${data.data.opponent.nickname} (레이팅: ${data.data.opponent.rating})</p>
            `);
        } else {
            openModal(`<p>오류: ${data.error}</p>`);
        }
    } catch (error) {
        openModal(`<p>오류: ${error.message}</p>`);
    }
});

startCaptainGameBtn.addEventListener('click', async () => {
    const opponentId = document.getElementById('captain-opponent-id').value;
    const selectedPlayers = Array.from(
        document.querySelectorAll('#player-selection input:checked')
    ).map((input) => input.value);

    if (selectedPlayers.length !== 3) {
        openModal('<p>3명의 선수를 선택해야 합니다.</p>');
        return;
    }

    try {
        const response = await fetch('/captain/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                opponentAccountId: opponentId,
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

function startCaptainGameProgress(myPlayers, opponentPlayers) {
    gameProgress.classList.remove('hidden');
    document.getElementById('play-game').classList.add('hidden');
    document.getElementById('captain-game').classList.add('hidden');

    myCards.innerHTML = myPlayers
        .map((player) => createCard(player, false))
        .join('');
    opponentCards.innerHTML = opponentPlayers
        .map((player) => createCard(player, true))
        .join('');

    let round = 0;
    const interval = setInterval(() => {
        if (round < 3) {
            flipCard(myCards.children[round]);
            setTimeout(() => flipCard(opponentCards.children[round]), 1000);
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
    card.classList.add('flipped');
}

async function showCaptainGameResult() {
    try {
        const response = await fetch('/captain/result');
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

returnToGameBtn.addEventListener('click', () => {
    closeModal();
    gameProgress.classList.add('hidden');
    document.getElementById('play-game').classList.remove('hidden');
    document.getElementById('captain-game').classList.remove('hidden');
});

// 선수 선택 옵션 로드 (실제 구현 시 서버에서 데이터를 가져와야 함)
function loadPlayerSelectionOptions() {
    const playerSelection = document.getElementById('player-selection');
    // 예시 데이터
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

loadPlayerSelectionOptions();
