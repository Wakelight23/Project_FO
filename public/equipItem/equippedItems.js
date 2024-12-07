document.addEventListener('DOMContentLoaded', async () => {
    const getAccessToken = () => localStorage.getItem('accessToken');
    const accessToken = getAccessToken();
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    if (!accessToken) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/equipment/equipped', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-info': email, // 헤더에 email 추가
            },
        });

        if (!response.ok) {
            throw new Error('장착된 아이템 데이터를 불러오는 데 실패했습니다.');
        }

        const equippedItemsResponse = await response.json();

        // 디버깅: API 응답 확인
        console.log('API 응답:', equippedItemsResponse);

        // 배열 데이터 추출
        const equippedItems = equippedItemsResponse?.data?.equippedItems;

        if (!Array.isArray(equippedItems)) {
            throw new Error(
                'API 응답이 예상과 다릅니다. equippedItems가 배열이 아닙니다.'
            );
        }

        const container = document.getElementById('equippedItemsContainer');
        container.innerHTML = equippedItems
            .map(
                (item) => `
                <div class="equipped-item-card">
                    <h3>${item.playerName}</h3>
                    ${
                        item.equippedItem
                            ? `
                        <p>아이템 이름: ${item.equippedItem.name}</p>
                    `
                            : '<p>장착된 아이템이 없습니다.</p>'
                    }
                </div>
            `
            )
            .join('');
    } catch (err) {
        console.error(err.message);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
});
