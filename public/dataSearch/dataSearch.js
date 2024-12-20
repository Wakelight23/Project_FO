document
    .getElementById('fetchPlayersBtn')
    .addEventListener('click', fetchPlayers);
document
    .getElementById('fetchPlayerDetailsBtn')
    .addEventListener('click', fetchPlayerDetails);
document.getElementById('addPlayerForm').addEventListener('submit', addPlayer);
document
    .getElementById('updatePlayerForm')
    .addEventListener('submit', updatePlayer);
document
    .getElementById('deletePlayerForm')
    .addEventListener('submit', deletePlayer);

document.getElementById('uploadForm').addEventListener('submit', uploadCSVFile);

const API_BASE = 'http://localhost:3002';

const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
let isadmin;

async function adminCheck() {
    const tmpaccessToken = getAccessToken();
    const response = await fetch(`${API_BASE}/api/players/admin`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tmpaccessToken}`, // 인증 토큰
        },
    });
    const admincheck = await response.json();
    console.log(admincheck);
    isadmin = admincheck.admin;
}

// 기본으로 첫 번째 탭 열기
document.addEventListener('DOMContentLoaded', async function () {
    await adminCheck();
    console.log(isadmin);
    if (isadmin === 'true') {
        const admincontent = document.getElementsByClassName('adminFuction');
        for (let i = 0; i < admincontent.length; i++) {
            admincontent[i].style.display = 'block';
        }
    }
    document.querySelector('.tabPageLinks').click();
});
//선수/아이템 페이지
function openPageTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tabpagecontent');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    const tablinks = document.getElementsByClassName('tabPageLinks');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}
//선수 추가/수정/삭제
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tabplayercontent');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    const tablinks = document.getElementsByClassName('tabplayerlinks');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}

//선수 전체 조회
async function fetchPlayers() {
    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE}/api/players`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // 인증 토큰
        },
    });

    const players = await response.json();
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '<ul>';
    for (let element in players) {
        playerList.innerHTML += `<li> ${players[element].playerId}.  ${players[element].name} (레어도: ${players[element].rarity})</li>`;
    }
    playerList.innerHTML += '</ul>';
}
//선수 상세 조회
async function fetchPlayerDetails() {
    const playerId = document.getElementById('playerIdInput').value;
    console.log(playerId);
    if (playerId) {
        const accessToken = getAccessToken();
        const response = await fetch(`${API_BASE}/api/players/${playerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`, // 인증 토큰
            },
        });

        const player = await response.json();
        console.log(player);
        const playerDetails = document.getElementById('playerDetails');
        if (player.message) {
            playerDetails.innerHTML = `<p>${player.message}</p>`;
        } else {
            playerDetails.innerHTML = `<ul>
            <img src="${player.playerImage ?? 'anonymous.jpg'}" alt="서버에 이상이 발생했습니다!">
                <li>이름: ${player.name}</li>
                <li>클럽: ${player.club}</li>
                <li>스피드: ${player.speed}</li>
                <li>골마무리: ${player.goalFinishing}</li>
                <li>슈팅파워: ${player.shootPower}</li>
                <li>수비: ${player.defense}</li>
                <li>스태미너: ${player.stamina}</li>
                <li>레어도: ${player.rarity}</li>
                <li>타입: ${player.type}</li>
            </ul>`;
        }
    }
}
//선수 추가
async function addPlayer(event) {
    event.preventDefault();
    const playerData = {
        name: document.getElementById('addname').value,
        club: document.getElementById('addclub').value,
        speed: document.getElementById('addspeed').value,
        goalFinishing: document.getElementById('addgoalFinishing').value,
        shootPower: document.getElementById('addshootPower').value,
        defense: document.getElementById('adddefense').value,
        stamina: document.getElementById('addstamina').value,
        rarity: document.getElementById('addrarity').value,
        type: document.getElementById('addtype').value,
        playerImage: document.getElementById('addimage').value,
    };

    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE}/api/players`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // 인증 토큰
        },
        body: JSON.stringify(playerData),
    });

    const result = await response.json();
    alert(result.message);
}
//선수 수정
async function updatePlayer(event) {
    event.preventDefault();
    const playerId = document.getElementById('updateplayerId').value;

    const playerData = {
        name: document.getElementById('updatename').value,
        club: document.getElementById('updateclub').value,
        speed: document.getElementById('updatespeed').value,
        goalFinishing: document.getElementById('updategoalFinishing').value,
        shootPower: document.getElementById('updateshootPower').value,
        defense: document.getElementById('updatedefense').value,
        stamina: document.getElementById('updatestamina').value,
        rarity: document.getElementById('updaterarity').value,
        type: document.getElementById('updatetype').value,
        playerImage: document.getElementById('updateimage').value,
    };

    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE}/api/players/${playerId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // 인증 토큰
        },
        body: JSON.stringify(playerData),
    });

    const result = await response.json();
    alert(result.message);
}

// 선수 삭제
async function deletePlayer(event) {
    event.preventDefault();
    const playerId = document.getElementById('deleteplayerId').value;

    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE}/api/players/${playerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // 인증 토큰
        },
    });

    const result = await response.json();
    alert(result.message);
}

// CSV파일 업로드
async function uploadCSVFile(event) {
    event.preventDefault();
    const fileInput = document.getElementById('csvPlayerFileInput');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('csv', file);
        try {
            const accessToken = getAccessToken();
            const response = await fetch(`${API_BASE}/api/players/csv`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`, // 인증 토큰
                },
                body: formData,
            });
            const result = await response.json();
            console.log(result);
            document.getElementById('playerOutput').textContent =
                result.message;
        } catch (error) {
            document.getElementById('playerOutput').textContent =
                `파일 업로드 중 오류가 발생했습니다.`;
            console.error('Error uploading file:', error);
        }
    }
}
