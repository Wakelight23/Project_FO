document.addEventListener('DOMContentLoaded', function () {
    const buttons = [
        { id: 'home', text: '홈', html_data: '../gacha/index.html' },
        {
            id: 'signup',
            text: '회원가입',
            html_data: '../gacha/register/register.html',
        },
        { id: 'login', text: '로그인', html_data: '../gacha/login/login.html' },
        {
            id: 'logout',
            text: '로그아웃',
            html_data: '../gacha/logout/logout.html',
        },
        {
            id: 'createCharacter',
            text: '매니저 생성',
            html_data: '../manager/create.html',
        },
        { id: 'cash', text: '캐쉬 상점', html_data: '../cash/cash.html' },
        {
            id: 'ranking',
            text: '정보 조회',
            html_data: '../ranking/ranking.html',
        },
        {
            id: 'recruitPlayer',
            text: '선수 영입',
            html_data: '../gacha/playerGacha/playerGacha.html',
        },
        {
            id: 'viewRoster',
            text: '선수 명단 보기<br />출전 선수 선발',
            html_data: '../teamMember/teamMember.html',
        },
        {
            id: 'selectRoster',
            text: '출전 선수 변경',
            html_data: '../teamMember/createRoster.html',
        },
        {
            id: 'itemGacha',
            text: '아이템 가챠',
            html_data: '../gacha/itemGacha/itemGacha.html',
        },
        {
            id: 'equipItem',
            text: '아이템 장착하기',
            html_data: '../equipItem/equipItem.html',
        },
        {
            id: 'equippedItems',
            text: '장착 아이템 확인',
            html_data: '../equipItem/equippedItems.html',
        },
        {
            id: 'gamePlay',
            text: '게임 시작하기',
            html_data: '../gameplay/gameplay.html',
        },
        {
            id: 'upgradePlayer',
            text: '선수 강화',
            html_data: '../teamMember/upgradeMember.html',
        },
    ];

    const buttonContainer = document.getElementById('menuSidebar');

    buttons.forEach((button) => {
        const btn = document.createElement('button');
        btn.id = button.id;
        btn.innerHTML = button.text;
        btn.onclick = function (event) {
            on_tab_button_click(event, button.html_data);
        };
        buttonContainer.appendChild(btn);
    });

    const contentDiv = document.getElementById('container_id');

    const newHtmlString = `<object
        id="${'main' + '_tab'}"
        type="text/html"
        data="../gacha/index.html"
        width="100%"
        height="100%"
        style="overflow: auto; border: 0px"
    ></object>`;

    contentDiv.innerHTML = newHtmlString;
});

function on_tab_button_click(event, html_data) {
    console.log(event);
    const contentDiv = document.getElementById('container_id');

    const newHtmlString = `<object
        id="${event.target.id + '_tab'}"
        type="text/html"
        data="${html_data}"
        width="100%"
        height="100%"
        style="overflow: auto; border: 0px"
    ></object>`;

    contentDiv.innerHTML = newHtmlString;
}

$('#menuSidebar').hide();

$('#menubox').on('mouseenter', function () {
    $('#menuSidebar').show();
});

$('#menuSidebar').on('mouseleave', function () {
    $('#menuSidebar').hide();
});
