const video = document.getElementById('gachaVideo');
const resultList = document.getElementById('resultList');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popupTitle');
const popupImage = document.getElementById('popupImage');
const popupDetails = document.getElementById('popupDetails');

// 비디오 자동 재생
video.play();
video.playbackRate = 1.5; // 비디오 재생 속도 1.5배속

const championImages = [
    'https://i.namu.wiki/i/Zd_R6pGVt0CokiwArMkbpGFwAdwL38z79nzlFg8PirteueCdxYHkakWBKJ9ZglBAnAj4t4S-89zDZNfpu8fl4gBiCFoxlfJ0SBN4uaFrvfWtuWZeRbfO9TKNic71nOPSDMik7emT7YJRckF0XvfImw.webp',
];
const accessToken = sessionStorage.getItem('accessToken');

// 100개의 캐릭터를 뽑아 결과를 표시하는 함수
async function fetchAndDisplayCharacters() {
    resultList.innerHTML = ''; // 기존 결과 초기화

    //#서버에서 카드가져오기

    try {
        //const response = await fetch('/gacha/players'); // 서버에서 캐릭터 정보 요청
        const response = await fetch('/gacha/player', {
            method: 'POST',
            headers: {
                // headers 객체 내에 포함
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`, // 대문자로 'Authorization' 사용
            },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();

        if (data.success) {
            // 가져온 카드 개수 만큼 생성
            data.items.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'result-item'; // 카드 클래스 설정
                card.style.backgroundImage = `url('${item.playerImage}')`;

                card.addEventListener('click', () =>
                    showPopup({
                        name: item.name,
                        playerImage: item.playerImage,
                        speed: Math.floor(Math.random() * 100),
                        goalFinishing: Math.floor(Math.random() * 100),
                        shootPower: Math.floor(Math.random() * 100),
                        defense: Math.floor(Math.random() * 100),
                        stamina: Math.floor(Math.random() * 100),
                        rarity: item.rarity,
                    })
                );
                resultList.appendChild(card);
            });
        } else {
            console.error('캐릭터 정보를 가져오는 데 실패했습니다.');
        }
    } catch (error) {
        console.error('서버와의 통신 중 오류 발생:', error);
    }
}

// 팝업창에 캐릭터 정보 표시
function showPopup(item) {
    popupTitle.innerText = item.name;
    popupImage.src = item.playerImage;
    popupDetails.innerText = `
            Speed: ${item.speed}
            Goal Finishing: ${item.goalFinishing}
            Shoot Power: ${item.shootPower}
            Defense: ${item.defense}
            Stamina: ${item.stamina}
            Rarity: ${item.rarity}
        `;
    popup.style.display = 'block';
}

// 팝업 닫기
document.getElementById('closePopup').addEventListener('click', () => {
    popup.style.display = 'none';
});

// 팝업 외부 클릭 시 닫기
window.onclick = function (event) {
    if (event.target === popup) {
        popup.style.display = 'none';
    }
};

// 페이지 로드 시 캐릭터 뽑기 함수 호출
fetchAndDisplayCharacters();
