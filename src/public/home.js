window.onload = () => {
    displayList();
}
let displayList = () =>{
    $.ajax({url:'/GetAllTeams', success:function(res){
        if(!(res === 'error')){
            const display = document.getElementById('home-team-list-div');
            const list = document.createElement("ul");
            list.className = "home-team-list";

            let name = null;
            let id = null;

            for(let i = 0; i < res.length; i++){
                let returnValue = res[i].split("|");
                name = returnValue[0];
                id = returnValue[1];
                console.log(name);

                const listItem = document.createElement("li");
                const listItemText = document.createTextNode(name);

                listItem.appendChild(listItemText);
                listItem.className = "team-" + id;
                listItem.id = name;

                listItem.addEventListener('click', function(e){
                    let passingTeamName = e.target.id;
                    let passingTeamID = e.target.className;
                    displayTeamInfo(passingTeamName, passingTeamID);
                });

                list.appendChild(listItem);
            }
            display.appendChild(list);
        }else{
            console.log("error");
        }
    }});
}
let displayTeamInfo = (teamName, teamID) =>{
    let teamListDiv = document.getElementById("home-team-list-div");
    let teamDiv = document.getElementById("team-div");

    teamListDiv.style.width = '60%';
    teamListDiv.style.height = '500px';
    teamDiv.style.width = '35%';
    teamDiv.style.height = '500px';

    teamDiv.style.border = 'solid';

    teamListDiv.style.float = 'left';
    teamDiv.style.float = 'right';

    wipeTeamPanel();
    fillTeamPanel(teamName, teamID);

}
let fillTeamPanel = (teamName, teamID) =>{
    let teamDiv = document.getElementById("team-div");
    
    let teamHeader = document.createElement('h2');
    let teamHeaderText = document.createTextNode(teamName);

    let playerTestHead = document.createElement("p");
    let playerTestHeadText  = document.createTextNode("Test Player Name");


    teamHeader.appendChild(teamHeaderText);
    playerTestHead.appendChild(playerTestHeadText);

    playerTestHead.addEventListener('click', fillPlayerPanel);

    teamDiv.appendChild(teamHeader);
    teamDiv.appendChild(playerTestHead);
}
let fillPlayerPanel = () => {
    let teamDiv = document.getElementById("team-div");
    teamDiv.style.position = 'relative';
    let playerDiv = document.createElement('div');
    playerDiv.style.borderLeft = 'none';
    playerDiv.style.borderRight = 'none';
    playerDiv.style.borderBottom = 'none';
    playerDiv.style.borderTop = 'solid';
    playerDiv.style.height = '50%';
    playerDiv.style.width = '100%';
    playerDiv.style.position ='absolute';
    playerDiv.style.bottom = '0';

    let playerHead = document.createElement('h2');
    let playerTextHead =  document.createTextNode("Claude Giroux");

    playerHead.appendChild(playerTextHead);

    playerDiv.appendChild(playerHead);
    teamDiv.appendChild(playerDiv);

}
let wipeTeamPanel = () => {
    let display = document.getElementById("team-div");
    while (display.hasChildNodes()) {
        display.removeChild(display.firstChild);
    }
}
let wipePlayerPanel = () =>{
    let display = document.getElementById("player-div");
    while (display.hasChildNodes()) {
        display.removeChild(display.firstChild);
    }
}