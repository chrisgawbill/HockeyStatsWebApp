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
let displayTeamInfo = (teamName, teamID) => {
  let teamListDiv = document.getElementById("home-team-list-div");
  let teamDiv = document.getElementById("team-div");

  teamListDiv.style.width = "60%";
  teamListDiv.style.height = "500px";
  teamDiv.style.width = "35%";
  teamDiv.style.height = "500px";

  teamDiv.style.border = "solid";

  teamListDiv.style.float = "left";
  teamDiv.style.float = "right";

  wipeTeamPanel();
  fillTeamPanel(teamName, teamID);
};
let fillTeamPanel = (teamName, teamID) => {
  let teamInfo;
  let teamRoster;

  getQuickTeamInfo(teamID, function (info) {
    teamInfo = info;
    getTeamRoster(teamID, function (roster) {
      teamRoster = roster;

      let teamDiv = document.getElementById("team-div");

      let teamInfoDiv = document.createElement("div");
      teamInfoDiv.id = "team-info-div";
      teamInfoDiv.style.height = "100%";
      teamInfoDiv.style.overflow = "auto";

      let teamHeader = document.createElement("h2");
      let teamHeaderText = document.createTextNode(teamName);

      teamHeader.appendChild(teamHeaderText);

      let teamRosterDiv = document.createElement("div");
      for (let i = 0; i < teamRoster.length; i++) {
        let playerID = teamRoster[i][0];
        let playerName = teamRoster[i][1];
        let playerJersey = teamRoster[i][2];
        let playerPosition = teamRoster[i][3];

        let playerString =
          playerName + "(" + playerJersey + ")(" + playerPosition + ")";

        let playerHead = document.createElement("p");
        playerHead.id = playerID;

        let playerHeadText = document.createTextNode(playerString);

        playerHead.appendChild(playerHeadText);

        playerHead.addEventListener("click", function (e) {
          fillPlayerPanel(e.target.id);
        });
        teamRosterDiv.appendChild(playerHead);
      }
      teamInfoDiv.appendChild(teamHeader);
      teamInfoDiv.appendChild(teamRosterDiv);

      teamDiv.appendChild(teamInfoDiv);
    });
  });
};
let fillPlayerPanel = (playerID) => {
    let teamDiv = document.getElementById("team-div");
    let teamInfoDiv = document.getElementById("team-info-div");
    let playerDiv = document.getElementById("player-info-div");

    teamInfoDiv.style.height = "50%";
    if(playerDiv != null){
        wipePlayerPanel();
    }else{
        playerDiv = null;
        teamDiv.style.position = 'relative';
        playerDiv = document.createElement('div');
        playerDiv.id = "player-info-div";
        playerDiv.style.borderLeft = 'none';
        playerDiv.style.borderRight = 'none';
        playerDiv.style.borderBottom = 'none';
        playerDiv.style.borderTop = 'solid';
        playerDiv.style.height = '50%';
        playerDiv.style.width = '100%';
        playerDiv.style.position ='absolute';
        playerDiv.style.bottom = '0';
        playerDiv.style.overflow = "auto";
    }

    getPlayerInfo(playerID, function(playerInfo){
        let playerName = playerInfo[0];

        let playerHead = document.createElement('h2');
        let playerTextHead =  document.createTextNode(playerName);
    
        playerHead.appendChild(playerTextHead);
    
        playerDiv.appendChild(playerHead);
        teamDiv.appendChild(playerDiv);
    });
}
let wipeTeamPanel = () => {
    let display = document.getElementById("team-div");
    while (display.hasChildNodes()) {
        display.removeChild(display.firstChild);
    }
}
let wipePlayerPanel = () =>{
    let display = document.getElementById("player-info-div");
    while (display.hasChildNodes()) {
        display.removeChild(display.firstChild);
    }
}
let getQuickTeamInfo = (teamID, callback) => {
    let teamIDSplitArray = teamID.split("-");
    let passingTeamID = teamIDSplitArray[1];

    let teamInfo = new Array();
    $.ajax({url:'/GetTeamInfo/' + passingTeamID, success:function(res){
        if(!(res === 'error')){
            teamInfo.push(res);
        }else{
            console.log("Error");
        }
    }});
    $.ajax({url:'/GetQuickTeamStats/' + passingTeamID, success:function(res){
        if(!(res === 'error')){
            teamInfo.push(res);
        }else{
            console.log("Error");
        }
    }});
    callback(teamInfo);
}
let getTeamRoster = (teamID, callback) =>{
    let teamIDSplitArray = teamID.split("-");
    let passingTeamID = teamIDSplitArray[1];

    $.ajax({url:'/GetTeamRoster/' + passingTeamID, success:function(res){
        if(!(res === 'error')){
            callback(res);
        }else{
            console.log("Error");
        }
    }});
}
let getPlayerInfo = (playerID, callback) =>{
    $.ajax({url:'/GetPlayerInfo/' + playerID, success:function(res){
        if(!(res === 'error')){
            callback(res);
        }else{
            console.log("Error");
        }
    }});
}