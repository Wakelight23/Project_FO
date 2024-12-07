import { startCaptainGame, getCaptainResult } from './captainGame.js';
import { startChoiceMatch, getChoiceMatchResult } from './choiceMatch.js';
import { fetchRanking, fetchRecord } from './record.js';

// 대장전 게임 시작
document
    .getElementById('captain-start-form')
    .addEventListener('submit', startCaptainGame);

// 일반 게임 시작
document
    .getElementById('choice-match-form')
    .addEventListener('submit', startChoiceMatch);

// 전적 조회
document.getElementById('fetch-record').addEventListener('click', fetchRecord);

// 페이지 로드 시 랭킹 조회
window.addEventListener('load', fetchRanking);

// captainGame.js
export async function startCaptainGame(e) {
    e.preventDefault();
    const opponentId = document.getElementById('opponent-id').value;
    const selectedPlayers = Array.from(
        document.querySelectorAll('#player-selection input:checked')
    ).map((input) => input.value);

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
            document.getElementById('captain-result').textContent =
                data.data.message;
        } else {
            document.getElementById('captain-result').textContent = data.error;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getCaptainResult() {
    try {
        const response = await fetch('/captain/result');
        const data = await response.json();
        if (response.ok) {
            let resultHtml = '<h3>대장전 결과</h3>';
            data.data.matches.forEach((match) => {
                resultHtml += `<p>라운드 ${match.round}: ${match.myPlayer.name} vs ${match.opponentPlayer.name} - ${match.result}</p>`;
            });
            resultHtml += `<p>최종 결과: ${data.data.finalResult}</p>`;
            document.getElementById('captain-result').innerHTML = resultHtml;
        } else {
            document.getElementById('captain-result').textContent = data.error;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// choiceMatch.js
export async function startChoiceMatch(e) {
    e.preventDefault();
    const opponentId = document.getElementById(
        'choice-match-opponent-id'
    ).value;

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
            document.getElementById('choice-match-result').textContent =
                data.data.message;
        } else {
            document.getElementById('choice-match-result').textContent =
                data.error;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getChoiceMatchResult() {
    try {
        const response = await fetch('/choicematch/result');
        const data = await response.json();
        if (response.ok) {
            let resultHtml = `
                <p>${data.data.totalPower}</p>
                <p>${data.data.opponentPower}</p>
                <p>${data.data.randomResult}</p>
                <p>${data.data.gameResult}</p>
                <p>상대방: ${data.data.opponent.nickname} (레이팅: ${data.data.opponent.rating})</p>
            `;
            document.getElementById('choice-match-result').innerHTML =
                resultHtml;
        } else {
            document.getElementById('choice-match-result').textContent =
                data.error;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// record.js
export async function fetchRanking() {
    try {
        const response = await fetch('/ranking');
        const data = await response.json();
        if (response.ok) {
            const tableBody = document.querySelector('#ranking-table tbody');
            tableBody.innerHTML = '';
            data.data.forEach((rank) => {
                const row = `
                    <tr>
                        <td>${rank.rank}</td>
                        <td>${rank.nickname}</td>
                        <td>${rank.rating}</td>
                        <td>${rank.record.win}</td>
                        <td>${rank.record.draw}</td>
                        <td>${rank.record.lose}</td>
                        <td>${rank.record.winRate}%</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } else {
            console.error('랭킹 조회 실패:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function fetchRecord() {
    const accountId = document.getElementById('record-account-id').value;
    try {
        const response = await fetch(`/record/${accountId}`);
        const data = await response.json();
        if (response.ok) {
            let recordHtml = `
                <h3>${data.data.nickname}의 전적</h3>
                <p>레이팅: ${data.data.rating}</p>
                <p>승: ${data.data.record.win}, 무: ${data.data.record.draw}, 패: ${data.data.record.lose}</p>
                <p>승률: ${data.data.record.winRate}%</p>
                <h4>최근 게임</h4>
            `;
            data.data.recentGames.forEach((game) => {
                recordHtml += `<p>${game.result} - ${new Date(game.date).toLocaleDateString()}</p>`;
            });
            document.getElementById('record-result').innerHTML = recordHtml;
        } else {
            document.getElementById('record-result').textContent = data.error;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
