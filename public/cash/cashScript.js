// 로그인 후 받은 액세스 토큰을 로컬 스토리지에 저장

// DOM 로드 후 이벤트 리스너 연결
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('viewCashBtn');
    button.addEventListener('click', fetchCash);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('luckyCashBtn');
    button.addEventListener('click', fetchLuck);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('buyCashBtn');
    button.addEventListener('click', fetchBuy);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('giftCashBtn');
    button.addEventListener('click', fetchGift);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('playRouletteBtn');
    button.addEventListener('click', fetchRoulett);
});

const accessToken = localStorage.getItem('accessToken'); // 로그인 후 저장된 토큰을 가져옴
const email = localStorage.getItem('email');

// 버튼 클릭 시 캐시 조회 요청
async function fetchCash() {
    if (!accessToken) {
        document.getElementById('resultMessage').innerText =
            '로그인이 필요합니다.';
        return;
    }
    try {
        const response = await fetch('/api/cash', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`, // 인증 토큰
                'x-info': email, // 헤더에 email 추가
            },
        });

        if (!response.ok) {
            // 에러 메시지 출력
            const errorData = await response.json();
            document.getElementById('resultMessage').innerText =
                `Error: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        document.getElementById('resultMessage').innerText =
            `이메일: ${data.data.email}, 캐시: ${data.data.cash}`;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('resultMessage').innerText =
            '서버와 연결할 수 없습니다.';
    }
}

async function fetchLuck() {
    const accessToken = localStorage.getItem('accessToken'); // 로그인 후 저장된 토큰을 가져옴

    if (!accessToken) {
        document.getElementById('resultMessage').innerText =
            '로그인이 필요합니다.';
        return;
    }
    try {
        const response = await fetch('/cash/lucky', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`, // 저장된 토큰을 Authorization 헤더에 추가
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // 에러 메시지 출력
            const errorData = await response.json();
            document.getElementById('resultMessage').innerText =
                `Error: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        alert(data.cash);

        document.getElementById('resultMessage').innerText =
            `이메일: ${data.data.email}, 캐시: ${data.data.cash}`;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('resultMessage').innerText =
            '서버와 연결할 수 없습니다.';
    }
}

// + body
async function fetchBuy() {
    const accessToken = localStorage.getItem('accessToken'); // 로그인 후 저장된 토큰을 가져옴

    if (!accessToken) {
        document.getElementById('resultMessage').innerText =
            '로그인이 필요합니다.';
        return;
    }
    const buyCash = document.getElementById('buyCashInput').value; // 입력된 buyCash 값
    const password = document.getElementById('passwordInput').value; // 입력된 password 값
    try {
        const response = await fetch('/cash/payment', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`, // 저장된 토큰을 Authorization 헤더에 추가
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ buyCash, password }),
        });

        if (!response.ok) {
            // 에러 메시지 출력
            const errorData = await response.json();
            document.getElementById('resultMessage').innerText =
                `Error: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        document.getElementById('resultMessage').innerText =
            `이메일: ${data.data.email}, 캐시: ${data.data.cash}`;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('resultMessage').innerText =
            '서버와 연결할 수 없습니다.';
    }
}

// + body
async function fetchGift() {
    const accessToken = localStorage.getItem('accessToken'); // 로그인 후 저장된 토큰을 가져옴

    if (!accessToken) {
        document.getElementById('resultMessage').innerText =
            '로그인이 필요합니다.';
        return;
    }
    const receiverEmail = document.getElementById('receiverEmailInput').value; // 입력된 buyCash 값
    const amount = document.getElementById('amountInputt').value; // 입력된 buyCash 값
    const password = document.getElementById('passwordInput').value; // 입력된 password 값

    try {
        const response = await fetch('/cash/gift', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`, // 저장된 토큰을 Authorization 헤더에 추가
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ receiverEmail, amount, password }),
        });

        if (!response.ok) {
            // 에러 메시지 출력
            const errorData = await response.json();
            document.getElementById('resultMessage').innerText =
                `Error: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        document.getElementById('resultMessage').innerText =
            `이메일: ${data.data.email}, 캐시: ${data.data.cash}`;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('resultMessage').innerText =
            '서버와 연결할 수 없습니다.';
    }
}

// + body
async function fetchRoulett() {
    const accessToken = localStorage.getItem('accessToken'); // 로그인 후 저장된 토큰을 가져옴

    if (!accessToken) {
        document.getElementById('resultMessage').innerText =
            '로그인이 필요합니다.';
        return;
    }
    const amount = document.getElementById('amountInputt').value; // 입력된 buyCash 값
    const password = document.getElementById('passwordInput').value; // 입력된 password 값

    try {
        // const response = await fetch('/cash/roulette', {
        //     method: 'POST',
        //     headers: {
        //         Authorization: `Bearer ${accessToken}`, // 저장된 토큰을 Authorization 헤더에 추가
        //         'Content-Type': 'application/json',
        //     },
        //     body: { amount, password },
        // });

        if (!response.ok) {
            // 에러 메시지 출력
            const errorData = await response.json();
            document.getElementById('resultMessage').innerText =
                `Error: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        document.getElementById('resultMessage').innerText =
            `이메일: ${data.data.email}, 캐시: ${data.data.cash}`;
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('resultMessage').innerText =
            '서버와 연결할 수 없습니다.';
    }
}
