const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../login/login.html';
}

// 카드 데이터 배열 (서버에서 불러온 데이터를 시뮬레이션)
let cardData = [
    { name: '첫 번째 카드', playerImage: '#FFD700' },
    { name: '두 번째 카드', playerImage: '#98FB98' },
    { name: '세 번째 카드', playerImage: '#87CEFA' },
    { name: '네 번째 카드', playerImage: '#DDA0DD' },
    { name: '다섯 번째 카드', playerImage: '#F0E68C' },
];

function clear() {
    const cardSlot = document.querySelector('.cardSlot');
    cardSlot.innerHTML = ''; // 기존 내용 완전 제거
    return cardSlot;
}

// 카드 슬롯 초기화 및 생성 함수
function initializeCardSlot(cards = cardData) {
    const cardSlot = clear();

    for (let i = 0; i < cards.length; i += 5) {
        const rowCards = cards.slice(i, i + 5);
        const row = document.createElement('div');
        row.classList.add('row');

        rowCards.forEach((cardInfo) => {
            const container = document.createElement('div');
            container.classList.add('container');

            const card = document.createElement('div');
            card.classList.add('card');

            // 앞면 생성
            const front = document.createElement('div');
            front.classList.add('card-front');
            front.style.backgroundImage = cardInfo.playerImage
                ? `url(${cardInfo.playerImage})`
                : `url('https://img.freepik.com/free-vector/empty-game-card-template_1308-73460.jpg?ga=GA1.1.822806027.1732811017&semt=ais_hybrid')`;

            if (cardInfo.playerImage) {
                console.log(cardInfo.playerImage);
            }
            front.textContent = cardInfo.name;

            // 뒷면 생성
            const back = document.createElement('div');
            back.classList.add('card-back');
            back.textContent = '뒷면';

            // 카드 구조 조립
            card.appendChild(front);
            card.appendChild(back);
            container.appendChild(card);
            row.appendChild(container);
        });

        cardSlot.appendChild(row);
    }

    applyInitialFlipAnimation();
    setupCardInteractions();
}

// 초기 애니메이션 적용 함수
function applyInitialFlipAnimation() {
    const containers = document.querySelectorAll('.container');
    containers.forEach((container, index) => {
        setTimeout(
            () => {
                container.classList.add('flip'); // 애니메이션 클래스 추가
            },
            1000 + index * 200
        );
    });
}

// 카드 호버 및 회전 이벤트 리스너 설정 함수
function setupCardInteractions() {
    const containers = document.querySelectorAll('.container');
    containers.forEach((container) => {
        container.addEventListener('mousemove', function (e) {
            const x = e.offsetX;
            const y = e.offsetY;
            const rotateY = (-1 / 5) * x + 20;
            const rotateX = (4 / 30) * y - 20;

            container.style.transform = `perspective(350px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        container.addEventListener('mouseout', function () {
            container.style.transform =
                'perspective(350px) rotateY(0deg) rotateX(0deg)';
        });
    });
}

// 새로운 카드 배열 추가 함수
function addNewCards(newCards) {
    cardData = [...newCards]; // 기존 카드 데이터에 새 카드 추가
    initializeCardSlot(cardData); // 카드 슬롯 다시 초기화
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    cardData = [];
    clear();

    // 버튼 클릭 시 서버에서 카드 불러오기
    const fetchButton_10 = document.getElementById('fetchCardsBtn_10');
    if (fetchButton_10) {
        fetchButton_10.addEventListener('click', () =>
            fetchCardsFromServer(10)
        );
    }
    const fetchButton_20 = document.getElementById('fetchCardsBtn_20');
    if (fetchButton_20) {
        fetchButton_20.addEventListener('click', () =>
            fetchCardsFromServer(20)
        );
    }
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        location.href = '../index.html';
        return;
    }

    initializeCardSlot();
});

// 서버에서 카드 불러오기 시뮬레이션 함수
async function fetchCardsFromServer(count) {
    const accessToken = localStorage.getItem('accessToken');
    const email = localStorage.getItem('email');

    const response = await fetch('/api/gacha/item', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // 인증 토큰
            'x-info': email, // 헤더에 email 추가
        },
        body: JSON.stringify({ drawCount: count }),
    });

    if (!response.ok) {
        alert('실패');
        throw new Error(`요청 실패: ${response.status}`);
    }
    const objects = await response.json();
    const items = objects.items;
    const newCards = items;
    console.log(newCards);
    if (!newCards) {
        alert('아이템 불러오기 실패');
        return;
    }
    addNewCards(newCards); // 새 카드 추가
}
