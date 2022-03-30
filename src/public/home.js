window.onload = () => {
  displayList();
};
let displayList = () => {
  $.ajax({
    url: "/GetAllTeams",
    success: function (res) {
      if (!(res === "error")) {
        const display = document.getElementById("home-team-list-div");
        const list = document.createElement("ul");
        list.className = "home-team-list";

        let name = null;
        let id = null;

        for (let i = 0; i < res.length; i++) {
          let returnValue = res[i].split("|");
          name = returnValue[0];
          id = returnValue[1];
          console.log(name);

          const listItem = document.createElement("li");
          const listItemText = document.createTextNode(name);

          listItem.appendChild(listItemText);
          listItem.className = "team-" + id;
          listItem.id = name;

          listItem.addEventListener("click", function (e) {
            let passingTeamName = e.target.id;
            let passingTeamID = e.target.className;
            displayTeamInfo(passingTeamName, passingTeamID);
          });

          list.appendChild(listItem);
        }
        display.appendChild(list);
      } else {
        console.log("error");
      }
    },
  });
};
let displayTeamInfo = (teamName, teamID) => {
  let teamDiv = document.getElementById("team-div");

  teamDiv.style.display = "block";

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
        playerHead.id = playerID + "|" + playerPosition;

        let playerHeadText = document.createTextNode(playerString);

        playerHead.appendChild(playerHeadText);

        playerHead.addEventListener("click", function (e) {
          let playerIDArray = e.target.id.split("|");
          fillPlayerPanel(playerIDArray[0], playerIDArray[1]);
        });
        teamRosterDiv.appendChild(playerHead);
      }
      teamInfoDiv.appendChild(teamHeader);
      teamInfoDiv.appendChild(teamRosterDiv);

      teamDiv.appendChild(teamInfoDiv);
    });
  });
};
let fillPlayerPanel = (playerID, playerPositionCode) => {
  let teamDiv = document.getElementById("team-div");
  let teamInfoDiv = document.getElementById("team-info-div");
  let playerDiv = document.getElementById("player-info-div");

  teamInfoDiv.style.height = "50%";

  if (playerDiv != null) {
    wipePlayerPanel();
  } else {
    playerDiv = null;
    teamDiv.style.position = "relative";
    playerDiv = document.createElement("div");
    playerDiv.id = "player-info-div";
  }

  getPlayerInfo(playerID, function (playerInfo) {
    let playerName = playerInfo[0];
    getPlayerPhoto(playerName, function (playerPhotoURL) {
      let imageURL = playerPhotoURL;

      let playerImage = document.createElement("img");
      playerImage.src = imageURL;
      playerImage.id = "player-image"

      let playerHead = document.createElement("h2");
      let playerTextHead = document.createTextNode(playerName);
      playerHead.appendChild(playerTextHead);


      getCurrentPlayerStats(
        playerID,
        playerPositionCode,
        function (currentPlayerStats) {
          let statList = document.createElement("ul");

          if (playerPositionCode === "G") {
            let wins = currentPlayerStats[0];
            let losses = currentPlayerStats[1];
            let ot = currentPlayerStats[2];
            let savePercentage = currentPlayerStats[3];
            let goalAgainstAverage = currentPlayerStats[4];
            let gamesPlayed = currentPlayerStats[5];
            let shutouts = currentPlayerStats[6];

            let winListItem = document.createElement("li");
            let winListItemText = document.createTextNode("Wins: " + wins);

            let losesListItem = document.createElement("li");
            let losesListItemText = document.createTextNode(
              "Losses: " + losses
            );

            let otListItem = document.createElement("li");
            let otListItemText = document.createTextNode("OT: " + ot);

            let gamesPlayedListItem = document.createElement("li");
            let gamesPlayedListItemText = document.createTextNode(
              "Games Played: " + gamesPlayed
            );

            let savePercentageListItem = document.createElement("li");
            let savePercentageListItemText = document.createTextNode(
              "SA: " + savePercentage
            );

            let goalAgainstAverageListItem = document.createElement("li");
            let goalAgainstAverageListItemText = document.createTextNode(
              "GA: " + goalAgainstAverage
            );

            let shutoutsListItem = document.createElement("li");
            let shutoutsMinutesListItemText = document.createTextNode(
              "Shutouts: " + shutouts
            );

            winListItem.appendChild(winListItemText);
            losesListItem.appendChild(losesListItemText);
            otListItem.appendChild(otListItemText);
            gamesPlayedListItem.appendChild(gamesPlayedListItemText);
            savePercentageListItem.appendChild(savePercentageListItemText);
            goalAgainstAverageListItem.appendChild(
              goalAgainstAverageListItemText
            );
            shutoutsListItem.appendChild(shutoutsMinutesListItemText);

            statList.appendChild(winListItem);
            statList.appendChild(losesListItem);
            statList.appendChild(otListItem);
            statList.appendChild(gamesPlayedListItem);
            statList.appendChild(savePercentageListItem);
            statList.appendChild(goalAgainstAverageListItem);
            statList.appendChild(shutoutsListItem);
          } else {
            let goals = currentPlayerStats[0];
            let assists = currentPlayerStats[1];
            let points = currentPlayerStats[2];
            let gamesPlayed = currentPlayerStats[3];
            let penaltyMinutes = currentPlayerStats[4];
            let plusMinus = currentPlayerStats[5];
            let timeOnIce = currentPlayerStats[6];

            let goalListItem = document.createElement("li");
            let goalListItemText = document.createTextNode("Goals: " + goals);

            let assistListItem = document.createElement("li");
            let assistListItemText = document.createTextNode(
              "Assists: " + assists
            );

            let pointListItem = document.createElement("li");
            let pointListItemText = document.createTextNode(
              "Points: " + points
            );

            let gamesPlayedListItem = document.createElement("li");
            let gamesPlayedListItemText = document.createTextNode(
              "Games Played: " + gamesPlayed
            );

            let penaltyMinutesListItem = document.createElement("li");
            let penaltyMinutesListItemText = document.createTextNode(
              "PIM: " + penaltyMinutes
            );

            let plusMinusListItem = document.createElement("li");
            let plusMinusListItemText = document.createTextNode(
              "+/-: " + plusMinus
            );

            let toiListItem = document.createElement("li");
            let toiListItemText = document.createTextNode("TOI: " + timeOnIce);

            goalListItem.appendChild(goalListItemText);
            assistListItem.appendChild(assistListItemText);
            pointListItem.appendChild(pointListItemText);
            gamesPlayedListItem.appendChild(gamesPlayedListItemText);
            penaltyMinutesListItem.appendChild(penaltyMinutesListItemText);
            plusMinusListItem.appendChild(plusMinusListItemText);
            toiListItem.appendChild(toiListItemText);

            statList.appendChild(goalListItem);
            statList.appendChild(assistListItem);
            statList.appendChild(pointListItem);
            statList.appendChild(gamesPlayedListItem);
            statList.appendChild(penaltyMinutesListItem);
            statList.appendChild(plusMinusListItem);
            statList.appendChild(toiListItem);
          }
          playerDiv.appendChild(playerImage);
          playerDiv.appendChild(playerHead);
          playerDiv.appendChild(statList);
          teamDiv.appendChild(playerDiv);
        }
      );
    });
  });
};
let wipeTeamPanel = () => {
  let display = document.getElementById("team-div");
  while (display.hasChildNodes()) {
    display.removeChild(display.firstChild);
  }
};
let wipePlayerPanel = () => {
  let display = document.getElementById("player-info-div");
  while (display.hasChildNodes()) {
    display.removeChild(display.firstChild);
  }
};
let getQuickTeamInfo = (teamID, callback) => {
  let teamIDSplitArray = teamID.split("-");
  let passingTeamID = teamIDSplitArray[1];

  let teamInfo = new Array();
  $.ajax({
    url: "/GetTeamInfo/" + passingTeamID,
    success: function (res) {
      if (!(res === "error")) {
        teamInfo.push(res);
      } else {
        console.log("Error");
      }
    },
  });
  $.ajax({
    url: "/GetQuickTeamStats/" + passingTeamID,
    success: function (res) {
      if (!(res === "error")) {
        teamInfo.push(res);
      } else {
        console.log("Error");
      }
    },
  });
  callback(teamInfo);
};
let getTeamRoster = (teamID, callback) => {
  let teamIDSplitArray = teamID.split("-");
  let passingTeamID = teamIDSplitArray[1];

  $.ajax({
    url: "/GetTeamRoster/" + passingTeamID,
    success: function (res) {
      if (!(res === "error")) {
        callback(res);
      } else {
        console.log("Error");
      }
    },
  });
};
let getPlayerPhoto = (playerName, callback) => {
  let playerArray = playerName.split(" ");
  let adjustedPlayerName = playerArray[0] + "-" + playerArray[1];

  let url =
    "https://tsnimages.tsn.ca/ImageProvider/PlayerHeadshot?seoId=" +
    adjustedPlayerName;

  callback(url);
};
let getPlayerInfo = (playerID, callback) => {
  $.ajax({
    url: "/GetPlayerInfo/" + playerID,
    success: function (res) {
      if (!(res === "error")) {
        callback(res);
      } else {
        console.log("Error");
      }
    },
  });
};
let getCurrentPlayerStats = (playerID, playerPositionCode, callback) => {
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();
  let startYear;
  let endYear;
  if (currentMonth >= 9 && currentMonth <= 12) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    startYear = currentYear - 1;
    endYear = currentYear;
  }
  if (playerPositionCode === "G") {
    $.ajax({
      url:
        "/GetGoaliePlayerStats/" + playerID + "/" + startYear + "/" + endYear,
      success: function (res) {
        if (!(res === "error")) {
          callback(res);
        } else {
          console.log("Error");
        }
      },
    });
  } else {
    $.ajax({
      url:
        "/GetNonGoaliePlayerStats/" +
        playerID +
        "/" +
        startYear +
        "/" +
        endYear,
      success: function (res) {
        if (!(res === "error")) {
          callback(res);
        } else {
          console.log("Error");
        }
      },
    });
  }
};
