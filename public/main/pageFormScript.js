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
            html_data = '/public/signup/signup.html';
            break;
        case 'login':
            html_data = '/public/login/login.html';
            break;
        case 'createCharacter':
            html_data = '/public/manager/create.html';
            break;
        case 'recruitPlayer':
            html_data = '/public/gacha/gacha.html';
            break;
        case 'viewRoster':
            html_data = '/public/teamMember/teamMember.html';
            break;
        case 'selectRoster':
            html_data = '/public/teamMember/createRoster.html';
            break;
        case 'upgradePlayer':
            html_data = '/public/teamMember/upgradeMember.html';
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
