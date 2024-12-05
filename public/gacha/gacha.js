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

// 100개의 캐릭터를 뽑아 결과를 표시하는 함수
function fetchAndDisplayCharacters() {
    resultList.innerHTML = ''; // 기존 결과 초기화

    // 카드 100장을 생성하여 표시
    for (let i = 0; i < 100; i++) {
        const card = document.createElement('div');
        card.className = 'result-item'; // 카드 클래스 설정

        // 랜덤 이미지 선택 (순환)
        const imageUrl = championImages[i % championImages.length];
        card.style.backgroundImage = `url('${imageUrl}')`;

        card.addEventListener('click', () =>
            showPopup({
                name: `캐릭터 ${i + 1}`,
                playerImage: imageUrl,
                speed: Math.floor(Math.random() * 100),
                goalFinishing: Math.floor(Math.random() * 100),
                shootPower: Math.floor(Math.random() * 100),
                defense: Math.floor(Math.random() * 100),
                stamina: Math.floor(Math.random() * 100),
                rarity: Math.floor(Math.random() * 5) + 1,
            })
        );
        resultList.appendChild(card);
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
