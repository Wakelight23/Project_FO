const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

const API_BASE = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const modalBody = document.getElementById('modal-body');
    const returnToGameBtn = document.getElementById('return-to-game');
    const startGameBtn = document.getElementById('start-game');
    const startCaptainGameBtn = document.getElementById('start-captain-game');
    const startRankGameBtn = document.getElementById('start-rank-game');

    const getAccessToken = () => localStorage.getItem('accessToken');
    const email = localStorage.getItem('email');

    function getAuthHeaders() {
        const accessToken = getAccessToken();
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-info': email,
        };
    }

    function openModal(content) {
        if (modal && overlay && modalBody) {
            modalBody.innerHTML = content;
            modal.style.display = 'block';
            overlay.style.display = 'block';
        }
    }

    function closeModal() {
        if (modal && overlay) {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }
    }

    if (returnToGameBtn) {
        returnToGameBtn.addEventListener('click', closeModal);
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', async () => {
            const opponentId = document.getElementById('opponent-id').value;
            try {
                openModal('<p>게임 진행 중...</p>');
                const response = await fetch(`${API_BASE}/choicematch/start`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        opponentManagerId: Number(opponentId),
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    const resultResponse = await fetch(
                        `${API_BASE}/choicematch/result`,
                        {
                            headers: getAuthHeaders(),
                        }
                    );
                    const resultData = await resultResponse.json();
                    if (resultResponse.ok) {
                        openModal(`
                            <h3>게임 결과</h3>
                            <p>${resultData.data.totalPower}</p>
                            <p>${resultData.data.opponentPower}</p>
                            <p>${resultData.data.randomResult}</p>
                            <p>${resultData.data.gameResult}</p>
                            <p>상대방: ${resultData.data.opponent.nickname} (레이팅: ${resultData.data.opponent.rating})</p>
                        `);
                    } else {
                        openModal(`<p>오류: ${resultData.error}</p>`);
                    }
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
            try {
                // 선택된 선수 정보 조회
                const response = await fetch(`${API_BASE}/selectplayer`, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (response.ok) {
                    const selectedPlayers = data.myTeam.players;
                    let playerCards = '';
                    selectedPlayers.forEach((player) => {
                        playerCards += `
                            <div class="player-card">
                                <h3>${player.player.name}</h3>
                                <p>총합 능력치: ${player.totalPower}</p>
                                <select id="player-order-${player.player.playerId}">
                                    <option value="">순서 선택</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                            </div>
                        `;
                    });

                    openModal(`
                        <h2>대장전 선수 순서 선택</h2>
                        ${playerCards}
                        <button id="start-captain-match">대장전 게임 시작</button>
                    `);

                    document
                        .getElementById('start-captain-match')
                        .addEventListener('click', () => {
                            if (
                                !selectedPlayers ||
                                selectedPlayers.length === 0
                            ) {
                                alert('선택된 선수가 없습니다.');
                                return;
                            }

                            const orderedPlayers = selectedPlayers
                                .map((player) => ({
                                    ...player,
                                    order:
                                        parseInt(
                                            document.getElementById(
                                                `player-order-${player.player.playerId}`
                                            ).value
                                        ) || 0,
                                }))
                                .filter((player) => player.order > 0)
                                .sort((a, b) => a.order - b.order);

                            if (orderedPlayers.length !== 3) {
                                alert('3명의 선수 순서를 모두 입력해주세요.');
                                return;
                            }

                            const selectedPlayerIds = orderedPlayers.map(
                                (player) => player.player.playerId
                            );
                            console.log(selectedPlayerIds);

                            const requestBody = {
                                opponentManagerId: parseInt(opponentId),
                                selectedPlayerIds: selectedPlayerIds,
                            };

                            fetch(`${API_BASE}/captain/start`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...getAuthHeaders(),
                                },
                                body: JSON.stringify(requestBody),
                            })
                                .then((response) => response.json())
                                .then((data) => {
                                    console.log('Received data:', data);
                                    if (data.error) {
                                        console.log(
                                            'Error detected:',
                                            data.error
                                        );
                                        alert(`오류: ${data.error}`);
                                    } else {
                                        console.log(
                                            'Starting captain game with data:',
                                            data
                                        );
                                        startCaptainGame(
                                            opponentId,
                                            selectedPlayerIds
                                        );
                                    }
                                })
                                .catch((error) => {
                                    alert(`오류: ${error.message}`);
                                });
                        });
                } else {
                    openModal(`<p>오류: ${data.error}</p>`);
                }
            } catch (error) {
                openModal(`<p>오류: ${error.message}</p>`);
            }
        });
    }

    async function startCaptainGame(opponentId, selectedPlayerIds) {
        try {
            console.log(
                `startCaptainGame : ${opponentId}, ${JSON.stringify(selectedPlayerIds)}`
            );
            const response = await fetch(`${API_BASE}/captain/start`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    opponentManagerId: opponentId,
                    selectedPlayerIds: selectedPlayerIds,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                showCaptainGameProgress(
                    data.data.selectedPlayers,
                    data.data.opponent.selectedPlayers
                );
            } else {
                openModal(`<p>오류: ${data.error}</p>`);
            }
        } catch (error) {
            openModal(`<p>오류: ${error.message}</p>`);
        }
    }
    // 게임 진행 UI 설정
    function showCaptainGameProgress(myPlayers, opponentPlayers) {
        // 데이터를 로컬 스토리지에 저장
        localStorage.setItem('myPlayers', JSON.stringify(myPlayers));
        localStorage.setItem(
            'opponentPlayers',
            JSON.stringify(opponentPlayers)
        );

        // captaingame.html로 페이지 전환
        window.location.href = 'captaingame.html';

        // 페이지 로드 완료 후 실행될 함수
        window.onload = function () {
            const myPlayersData = localStorage.getItem('myPlayers');
            const opponentPlayersData = localStorage.getItem('opponentPlayers');

            console.log('myPlayersData:', myPlayersData);
            console.log('opponentPlayersData:', opponentPlayersData);

            if (myPlayersData && opponentPlayersData) {
                try {
                    const myPlayers = JSON.parse(myPlayersData || '[]');
                    const opponentPlayers = JSON.parse(
                        opponentPlayersData || '[]'
                    );

                    if (
                        Array.isArray(myPlayers) &&
                        Array.isArray(opponentPlayers)
                    ) {
                        const gameArea = document.getElementById('game-area');
                        gameArea.classList.remove('hidden');
                        gameArea.innerHTML = `
                        <div class="captain-game-board">
                            <div class="my-cards">
                                ${myPlayers.map((player, index) => createPlayerCard(player, true, index)).join('')}
                            </div>
                            <div class="opponent-cards">
                                ${opponentPlayers.map((player, index) => createPlayerCard(player, false, index)).join('')}
                            </div>
                        </div>
                    `;

                        let round = 0;
                        const interval = setInterval(() => {
                            if (round < 3) {
                                flipCard(
                                    document.querySelector(
                                        `.my-cards .player-card:nth-child(${round + 1})`
                                    )
                                );
                                setTimeout(() => {
                                    flipCard(
                                        document.querySelector(
                                            `.opponent-cards .player-card:nth-child(${round + 1})`
                                        )
                                    );
                                    round++;
                                }, 1000);
                            } else {
                                clearInterval(interval);
                                setTimeout(showCaptainGameResult, 2000);
                            }
                        }, 2000);
                    } else {
                        throw new Error('유효하지 않은 플레이어 데이터 형식');
                    }
                } catch (error) {
                    console.error('JSON 파싱 오류:', error);
                    openModal('<p>데이터 로드 중 오류가 발생했습니다.</p>');
                }
            } else {
                console.error('플레이어 데이터가 없습니다.');
                openModal('<p>플레이어 데이터를 찾을 수 없습니다.</p>');
            }
        };

        function createPlayerCard(player, isMyPlayer, index) {
            return `
            <div class="player-card ${isMyPlayer ? 'my-player' : 'opponent-player'}">
                <div class="card-inner">
                    <div class="card-front">
                        <h3>${isMyPlayer ? '내 선수' : '상대 선수'} ${index + 1}</h3>
                    </div>
                    <div class="card-back">
                        <h3>${player.name}</h3>
                        <p>능력치: ${player.power}</p>
                    </div>
                </div>
            </div>
        `;
        }

        function flipCard(card) {
            if (card) {
                card.querySelector('.card-inner').style.transform =
                    'rotateY(180deg)';
            }
        }

        async function showCaptainGameResult() {
            try {
                const response = await fetch(`${API_BASE}/captain/result`, {
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (response.ok) {
                    let resultHTML = '<h2>대장전 결과</h2>';
                    data.data.matches.forEach((match) => {
                        resultHTML += `<p>라운드 ${match.round}: ${match.myPlayer.name} vs ${match.opponentPlayer.name} - ${match.result}</p>`;
                    });
                    resultHTML += `<p>최종 결과: ${data.data.finalResult}</p>`;
                    resultHTML +=
                        '<button id="return-to-gameplay">게임 대기화면으로 돌아가기</button>';

                    openModal(resultHTML);

                    document
                        .getElementById('return-to-gameplay')
                        .addEventListener('click', () => {
                            closeModal();
                            window.location.href = 'gameplay.html';
                        });
                } else {
                    openModal(`<p>오류: ${data.error}</p>`);
                }
            } catch (error) {
                openModal(`<p>오류: ${error.message}</p>`);
            }
        }
    }

    if (startRankGameBtn) {
        startRankGameBtn.addEventListener('click', async () => {
            try {
                openModal(
                    '<p>랭크 매치를 시작합니다. 상대를 찾고 있습니다...</p>'
                );
                const response = await fetch(`${API_BASE}/rankmatch/start`, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (response.ok) {
                    openModal(
                        `<p>상대를 찾았습니다! ${data.opponent.nickname}(레이팅: ${data.opponent.rating})와의 게임을 시작합니다.</p>`
                    );
                    setTimeout(() => startRankGameSimulation(data), 2000);
                } else {
                    openModal(`<p>오류: ${data.error}</p>`);
                }
            } catch (error) {
                openModal(`<p>오류: ${error.message}</p>`);
            }
        });
    }

    function startRankGameSimulation(gameData) {
        // rankgame.html로 이동하면서 게임 데이터 전달
        localStorage.setItem('rankGameData', JSON.stringify(gameData));
        window.location.href = 'rankgame.html';
    }

    // if (checkRankPlayingBtn) {
    //     checkRankPlayingBtn.addEventListener('click', async () => {
    //         try {
    //             const response = await fetch(`${API_BASE}/rankmatch/playing`, {
    //                 headers: getAuthHeaders(),
    //             });
    //             const data = await response.json();
    //             if (response.ok) {
    //                 openModal(`
    //                     <h3>랭크 매치 진행 상황</h3>
    //                     <p>내 점수: ${data.myScore}</p>
    //                     <p>상대방 점수: ${data.opponentScore}</p>
    //                     <p>경기 로그:</p>
    //                     <ul>${data.matchLog.map((log) => `<li>${log}</li>`).join('')}</ul>
    //                 `);
    //             } else {
    //                 openModal(`<p>오류: ${data.error}</p>`);
    //             }
    //         } catch (error) {
    //             openModal(`<p>오류: ${error.message}</p>`);
    //         }
    //     });
    // }

    // if (checkRankResultBtn) {
    //     checkRankResultBtn.addEventListener('click', async () => {
    //         try {
    //             const response = await fetch(`${API_BASE}/rankmatch/result`, {
    //                 headers: getAuthHeaders(),
    //             });
    //             const data = await response.json();
    //             if (response.ok) {
    //                 openModal(`
    //                     <h3>랭크 매치 결과</h3>
    //                     <p>결과: ${data.result}</p>
    //                     <p>점수: ${data.score}</p>
    //                     <p>경기 로그:</p>
    //                     <ul>${data.matchLog.map((log) => `<li>${log}</li>`).join('')}</ul>
    //                 `);
    //             } else {
    //                 openModal(`<p>오류: ${data.error}</p>`);
    //             }
    //         } catch (error) {
    //             openModal(`<p>오류: ${error.message}</p>`);
    //         }
    //     });
    // }

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
