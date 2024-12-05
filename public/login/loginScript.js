document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 기본 폼 제출 방지

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(
                    'http://localhost:3002/api/sign-in',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    }
                );

                const data = await response.json();
                console.log(data);
                if (response.ok) {
                    // 로그인 성공 시 액세스 토큰 저장
                    localStorage.setItem('accessToken', data.accessToken);
                    document.getElementById('message').innerText =
                        '로그인 성공!';

                    // 매니저 여부 확인
                    const managerResponse = await fetch(
                        'http://localhost:3002/api/check-manager',
                        {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${data.accessToken}`,
                            },
                        }
                    );

                    const managerData = await managerResponse.json();
                    if (managerResponse.ok) {
                        // 매니저 계정 여부에 따라 리디렉션
                        if (managerData.isManager) {
                            window.location.href =
                                'file:///C:/Project_FO/public/home/home.html'; // 매니저 페이지
                        } else {
                            window.location.href =
                                'file:///C:/Project_FO/public/manager/create.html'; // 일반 사용자 페이지
                        }
                    } else {
                        // 매니저 확인 실패 처리
                        const managerErrorData = await managerResponse.json(); // 오류 응답 내용 가져오기
                        console.log(
                            '매니저 확인 응답 상태:',
                            managerResponse.status
                        ); // 상태 코드 로그
                        console.log('매니저 확인 오류 응답:', managerErrorData); // 오류 응답 내용 로그
                        document.getElementById('message').innerText =
                            '매니저 여부 확인 중 오류가 발생했습니다.';
                    }
                } else {
                    // 오류 처리 (예: 로그인 실패 메시지)

                    document.getElementById('message').innerText =
                        '로그인 실패. 이메일 또는 비밀번호를 확인하세요.';
                }
            } catch (error) {
                console.error('로그인 중 오류 발생:', error);
                document.getElementById('message').innerText =
                    '로그인 중 오류가 발생했습니다.';
            }
        });
    } else {
        console.error('loginForm 요소를 찾을 수 없습니다.');
    }
});
