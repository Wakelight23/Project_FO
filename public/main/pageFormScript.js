$('#menuSidebar').hide();

$('#menubox').on('mouseenter', function () {
    $('#menuSidebar').show();
});

$('#menuSidebar').on('mouseleave', function () {
    $('#menuSidebar').hide();
});

function on_tab_button_click(event) {
    console.log(event);
    let get_button_object = event.target;

    const contentDiv = document.getElementById('container_id');
    let html_data;

    switch (get_button_object.id) {
        case 'signup':
            html_data = '../signup/sign.html';
            break;
        case 'login':
            html_data = '../login/login.html';
            break;
        case 'createCharacter':
            html_data = '../manager/create.html';
            break;
        case 'ranking':
            html_data = '../ranking/ranking.html';
            break;
        case 'recruitPlayer':
            html_data = '../gacha/playerGacha/playerGacha.html';
            break;
        case 'viewRoster':
            html_data = '../teamMember/teamMember.html';
            break;
        case 'selectRoster':
            html_data = '../teamMember/createRoster.html';
            break;
        case 'equipItem':
            html_data = '../equipItem/equipItem.html';
            break;
        case 'gamePlay':
            html_data = '../gameplay/html/gameplay.html';
            break;
        case 'upgradePlayer':
            html_data = '../teamMember/upgradeMember.html';
            break;

        default:
    }
    const newHtmlString = `<object
        id="${get_button_object.id + '_tab'}"
        type="text/html"
        data="${html_data}"
        width="100%"
        height="100%"
        style="overflow: auto; border: 0px"
    ></object>`;
    console.log(contentDiv);
    console.log(newHtmlString);
    contentDiv.innerHTML = newHtmlString;
}
