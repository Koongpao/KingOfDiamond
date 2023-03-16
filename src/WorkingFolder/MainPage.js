import React from "react";
import "./Mainpage.css";

const MainPage = () => {
  const baseURL = "/Images/";
  const Players = [
    { image: baseURL + "player1.png" },
    { image: baseURL + "player2.png" },
    { image: baseURL + "player3.png" },
    { image: baseURL + "player4.png" },
    { image: baseURL + "player5.png" },
  ];

  const [Animation, setAnimation] = React.useState(
    Players.map(() => {
      return { portrait: false, banner: false, wintext: false, score: false };
    })
  );

  const [PlayerInfo, setPlayerInfo] = React.useState(
    Players.map(() => {
      return {
        score: 0,
        alive: true,
        number: -1,
        connected: false,
      };
    })
  );

  const [kotaeBoxShow, setKotaeBoxShow] = React.useState(false);

  const [OriginalState, setOriginalState] = React.useState([...Animation]);

  const [GameState, setGameState] = React.useState("connect_phase");
  // const [GameState, setGameState] = React.useState("rule_phase");

  // connect_phase รอผู้เล่น connect
  // round_phase grace period portrait ไม่มี animation
  // submit_phase รอผู้เล่น submit
  // kotae_phase แสดงคะแนน, แสดงผู้ชนะ, แสดงผู้ตาย, แสดงกฏใหม่44
  // rule_phase แสดงกฏใหม่
  // none แสดงแค่ background balance scale
  // congrat_phase last person alive

  const NumberAlive = React.useRef(10);
  // use 10 beacuse In react strict mode, NumberAlive.current -= 1 is executed twice

  const PrevNumberAlive = React.useRef(10);
  // for reference to show rule

  const [PlayerCongrat, setPlayerCongrat] = React.useState(0);
  // Last Player Alive (won the game)

  const [ShowRules, setShowRules] = React.useState([]);
  // const [ShowRules, setShowRules] = React.useState([4,3,2])

  // Show all rules

  const IsAlive = React.useRef([true, true, true, true, true]);

  const showKotae2Alive = React.useRef(true)

  //RECEIVED DATA SECTIONS

  const RCConnected = React.useRef([0, 0, 0, 0, 0]);
  const [G, setG] = React.useState(0);
  const RCNumber = React.useRef([-1,0,-1,100,-1]);
  const RCScore = React.useRef([0, 0, 0, 0, 0]);
  const [RCKotae, setRCKotae] = React.useState(0);
  const RCWinner = React.useRef([0, 0, 0, 0, 0]);

  const filePath = "/GameData.json";

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(filePath);
      const data = await response.json();
      // console.log(data);

      if (data.WA !== null) {
        RCWinner.current = data.WA;
      }
      // HANDLE WA (WINNER ARRAY)

      if (data.G !== null) {
        setG(data.G);
      }
      // HANDLE G (GAME START)

      if (data.Avg !== null) {
        setRCKotae(data.Avg);
      }
      //HANDLE AVG (NUMBER OR KOTAE)

      if (data.Sm !== null) {
        RCNumber.current = data.Sm;
        RCNumber.current.forEach((item, i) => {
          setPlayerInfo((prev) => {
            const newPlayerInfo = [...prev];
            newPlayerInfo[i] = {
              ...newPlayerInfo[i],
              number: RCNumber.current[i],
            };
            return newPlayerInfo;
          });
        });
      }
      //HANDLE SM (SUBMIT NUMBER)

      if (data.S !== null) {
        RCScore.current = data.S;
      }
      //HANDLE S (SCORE)

      if (data.C !== null) {
        RCConnected.current = data.C;
        RCConnected.current.forEach((item, i) => {
          if (item === 1) {
            setPlayerInfo((prev) => {
              const newPlayerInfo = [...prev];
              newPlayerInfo[i] = {
                ...newPlayerInfo[i],
                connected: true,
              };
              return newPlayerInfo;
            });
          }
        });
      }
      // HANDLE C
    };

    // Poll the JSON file every 5 seconds
    const intervalId = setInterval(fetchData, 1000);
  }, []);

  const handleClick = async () => {
    const response = await fetch(filePath, {
      method: "POST",
      body: JSON.stringify({ C: [0, 0, 0, 0, 1] }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    // console.log(data); // Log the server response
  };

  // END RECEIVED DATA SECTIONS

  const [time, setTime] = React.useState(30.0);
  const [paused, setPaused] = React.useState(true);

  React.useEffect(() => {
    let intervalId;

    if (!paused) {
      intervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 0.01;
          return newTime < 0 ? 0 : newTime;
        });
      }, 10);
    }

    return () => clearInterval(intervalId);
  }, [paused]);

  const startTimer = () => {
    setPaused(false);
  };

  const stopTimer = () => {
    setPaused(true);
  };

  const resetTimer = () => {
    setTime(30.0);
    setPaused(true);
  };

  // Animation and Calculation Section //

  const SetState_WinnerAnimation = () => {
    setAnimation((prevState) => {
      const updatedAnimation = prevState.map((item, i) => {
        if (RCWinner.current[i] === 1) {
          //Check if is Winner
          return { ...item, portrait: false, banner: true, wintext: true };
        } else if (PlayerInfo[i].alive && PlayerInfo[i].connected) {
          //Check if alive
          return { ...item, portrait: true };
        } else {
          return item;
        }
      });
      return updatedAnimation;
    });
  };

  const SetState_CalculateNewScore = () => {
    setPlayerInfo((prevState) => {
      const updatedPlayerInfo = prevState.map((prevPlayerInfo, i) => {
        if (RCWinner.current[i] === 1) {
          //Check if is Winner
          return prevPlayerInfo;
        } else if (prevPlayerInfo.alive && prevPlayerInfo.connected) {
          if (RCScore.current[i] === -10) {
            //If dead on current round
            NumberAlive.current -= 1;
            IsAlive.current[i] = false;
            return {
              ...prevPlayerInfo,
              score: RCScore.current[i],
              alive: false,
            };
          } else {
            return { ...prevPlayerInfo, score: RCScore.current[i] };
          }
        } else {
          return prevPlayerInfo;
        }
      });
      return updatedPlayerInfo;
    });
  };

  const SetState_OnScoreChange = () => {
    setAnimation((prevState) => {
      const updatedAnimation = prevState.map((item, i) => {
        if (RCWinner.current[i] === "1") {
          return { ...item, score: false };
        } else if (PlayerInfo[i].alive) {
          return { ...item, score: true };
        } else {
          return item;
        }
      });
      return updatedAnimation;
    });
  };

  // END Animation and Calculation Section //

  // Class Return Section //

  const Return_IfPortraitDark = (i) => {
    if (GameState === "connect_phase" && PlayerInfo[i].connected === false) {
      return "playerbanner-portrait hide"; //Connect Phase but not connected
    }
    if (GameState === "connect_phase" && PlayerInfo[i].connected === true) {
      return "playerbanner-portrait darken"; //Connect Phase and connected
    }
    if (PlayerInfo[i].connected === false) {
      return "playerbanner-portrait hide"; //if player didn't connected
    }
    if (PlayerInfo[i].alive === false) {
      return "playerbanner-portrait darken movedown"; //if player is dead
    }
    if (Animation[i].portrait) {
      return "playerbanner-portrait darken movedown"; // if player lose round
    }
    return "playerbanner-portrait";
  };

  const Return_IfRedBanner = (i) => {
    if (Animation[i].banner) {
      return "playerbanner redwin glow-border";
    }
    return "playerbanner";
  };

  const Return_WinTextState = (i) => {
    if (PlayerInfo[i].alive === false) {
      return "wintext show redtext";
    }
    if (Animation[i].wintext) {
      return "wintext show";
    }
    return "wintext";
  };

  const Return_ScoreAnimation = (i) => {
    if (GameState === "connect_phase") {
      return "playerbanner-score hide";
    }
    if (PlayerInfo[i].connected === false) {
      return "playerbanner-score hide";
    }
    if (PlayerInfo[i].alive === false) {
      return "playerbanner-score hide";
    }
    if (Animation[i].wintext) {
      return "playerbanner-score hide";
    }
    if (Animation[i].score) {
      return "playerbanner-score flip-x";
    }
    return "playerbanner-score";
  };

  const Return_ScoreColor = (i) => {
    const red = Math.round(
      213 - ((213 - 204) * (- PlayerInfo[i].score)) / 10
    );
    const green = Math.round(
      239 - ((239 - 39) * (- PlayerInfo[i].score)) / 10
    );
    const blue = Math.round(
      216 - ((216 - 52) * (- PlayerInfo[i].score)) / 10
    );
    return `rgba(${red}, ${green}, ${blue}, 255)`;
  };

  const Return_TimerColor = () => {
    const red = Math.round(213 - ((213 - 204) * (30 - time)) / 30);
    const green = Math.round(239 - ((239 - 39) * (30 - time)) / 30);
    const blue = Math.round(216 - ((216 - 52) * (30 - time)) / 30);
    return `rgba(${red}, ${green}, ${blue}, 255)`;
  };

  const Return_NumberBox = (i) => {
    if (PlayerInfo[i].alive === false) {
      return "playerbanner-numberbox hide";
    }
    if (PlayerInfo[i].connected === false) {
      return "playerbanner-numberbox hide";
    }
    if (PlayerInfo[i].number === -1) {
      return "playerbanner-numberbox hide";
    }
    if (GameState === "kotae_phase") {
      return "playerbanner-numberbox";
    }

    return "playerbanner-numberbox hide";
  };

  const Return_SubmittedText = (i) => {
    if (
      PlayerInfo[i].number >= 0 &&
      GameState === "submit_phase" &&
      PlayerInfo[i].connected
    ) {
      return "submit-text";
    } else {
      return "submit-text hide";
    }
  };

  const Return_TimerState = () => {
    if (GameState === "submit_phase") {
      return "timer";
    } else {
      return "timer hide";
    }
  };

  const Return_KotaeState = () => {
    if (GameState === "kotae_phase" && kotaeBoxShow) {
      return "kotaebox";
    } else {
      return "kotaebox hide";
    }
  };

  const Return_ConnectedText = (i) => {
    if (GameState === "connect_phase" && PlayerInfo[i].connected) {
      return "submit-text";
    } else {
      return "submit-text hide";
    }
  };

  const Return_AllPlayerHide = (i) => {
    if (GameState === "none" || GameState === "rule_phase") {
      return "playerbanner-box hide";
    }
    if (GameState === "congrat_phase") {
      return "playerbanner-box hide";
    }
    return "playerbanner-box";
  };

  const Return_ShowRule = () => {
    if (GameState === "rule_phase") {
      return "rules";
    } else {
      return "rules hide";
    }
  };

  const Return_MainPage = () => {
    if (GameState === "congrat_phase") {
      return "congrat-background";
    } else {
      return "main-page";
    }
  };

  const Return_CongratText = () => {
    if (GameState === "congrat_phase") {
      return "congrat-page";
    } else {
      return "congrat-page hide";
    }
  };

  //END Class Return Section//

  const Delay = async (seconds) => {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  };

  // MAIN SECTION//
  const State_RoundPhase = async () => {
    setPlayerInfo((prev) => {
        const newPrev = prev.map((eachPlayer) => {
          return { ...eachPlayer, number: -1 };
        });
        return newPrev;
    });
    console.log(NumberAlive.current)
    //4sec
    setGameState("roundphase");
    stopTimer();
    await Delay(2);
    setGameState("submit_phase");
    resetTimer();
    await Delay(2);
    State_SubmitPhase();
  };

  const State_SubmitPhase = async () => {
    //30sec
    startTimer();
    // Wait for 30s
    await Delay(1); //31
    State_DisplayWinnerPhase();
  };
  //add next phase 1 sec

  const State_DisplayWinnerPhase = async () => {
    //15sec + 1sec from preceding phase
    showKotae2Alive.current = true
    setKotaeBoxShow(false)
    //Back to original

    console.log(NumberAlive.current);
    setGameState("static");
    await Delay(2);
    
    if (NumberAlive.current === 2 && RCNumber.current.every((elem) => [0, 100, -1].includes(elem))) {
      console.log("special rule: don't show kotae")
      showKotae2Alive.current = false;
      console.log(showKotae2Alive.current)
    }
    setGameState("kotae_phase");
    await Delay(4);
    console.log("check" + showKotae2Alive.current)
    if (showKotae2Alive.current) {
      setKotaeBoxShow(true);
    }
    await Delay(2);
    SetState_WinnerAnimation();
    await Delay(2);
    SetState_OnScoreChange();
    await Delay(0.5);
    SetState_CalculateNewScore();
    await Delay(2.5);

    console.log(NumberAlive);
    if (NumberAlive.current === 1) {
      await Delay(4);
      await State_Congratulation();
      // EXIT TO CONGRAT PHASE
    } else {
      if (NumberAlive.current < PrevNumberAlive.current) {
        const NewRules = Array.from(
          { length: PrevNumberAlive.current - NumberAlive.current },
          (_, i) => NumberAlive.current + i
        );
        PrevNumberAlive.current = NumberAlive.current;
        // console.log("RULES:")
        // console.log(NumberAlive.current, PrevNumberAlive.current)
        // console.log(NewRules);
        await State_ShowNewRule(NewRules);
      }
      // TRANSITION TO RULE PHASE
      setGameState("round_phase");
      await Delay(1);
      setAnimation(OriginalState);
      setKotaeBoxShow(false);
      await Delay(1);
      //Reset submit state
      State_RoundPhase();
    }
    //LOOP AGAIN
  };

  const State_ShowNewRule = async (NewRules) => {
    // 15sec
    setGameState("none");
    await Delay(3);
    setGameState("rule_phase");
    setShowRules(NewRules);
    await Delay(11);
    setGameState("none");
    await Delay(2);
  };

  React.useEffect(() => {
    if (G === 1) {
      setGameState("round_phase");
      let aliveCount = 0;
      PlayerInfo.forEach((a, i) => {
        if (a.connected) {
          aliveCount++;
        }
      });
      NumberAlive.current = aliveCount;
      PrevNumberAlive.current = aliveCount;
      State_RoundPhase();
    }
  }, [G]);

  const State_Congratulation = async () => {
    setGameState("none");
    await Delay(2);
    setGameState("congrat_phase");
    IsAlive.current.forEach((item, i) => {
      if (item && PlayerInfo[i].connected) {
        console.log(item);
        console.log(item.alive, i);
        setPlayerCongrat(i);
      }
    });
  };

  // END MAIN SECTION//

  return (
    <div className={Return_MainPage()}>
      <button onClick={() => setG(1)}>Start game</button>
      <button onClick={() => console.log(IsAlive.current)}>is alive</button>
      <button onClick={() => console.log(NumberAlive.current)}>
        check alive
      </button>
      <button onClick={() => console.log(PlayerCongrat)}>player last</button>
      <button onClick={() => handleClick()}>write file</button>
      {Players.map((eachB, i) => (
        <button
          onClick={() => {
            RCConnected.current[i] = 1;
            setPlayerInfo((prev) => {
              const newPlayerInfo = [...prev];
              newPlayerInfo[i] = {
                ...newPlayerInfo[i],
                connected: RCConnected.current[i],
              };
              return newPlayerInfo;
            });
          }}
        >
          c{i}
        </button>
      ))}
      {Players.map((eachB, i) => (
        <button
          onClick={() => {
            RCNumber.current[i] = RCNumber.current[i] + 1;
            setPlayerInfo((prev) => {
              const newPlayerInfo = [...prev];
              newPlayerInfo[i] = {
                ...newPlayerInfo[i],
                number: RCNumber.current[i],
              };
              return newPlayerInfo;
            });
          }}
        >
          s{i}
        </button>
      ))}
      <div className={Return_AllPlayerHide()}>
        {Players.map((eachP, i) => (
          <div className={Return_IfRedBanner(i)}>
            <p className={Return_WinTextState(i)}>
              {PlayerInfo[i].alive ? "WIN" : "DEAD"}
            </p>
            <div className="playerbanner-scorebox">
              <div
                className={Return_ScoreAnimation(i)}
                style={{ color: Return_ScoreColor(i) }}
              >
                {PlayerInfo[i].score}
              </div>
            </div>
            <div className={Return_IfPortraitDark(i)}>
              <img src={eachP.image} alt="test"></img>
            </div>
            <div className={Return_NumberBox(i)}>
              <div className="playerbanner-number">{PlayerInfo[i].number}</div>
            </div>
            <p className={Return_SubmittedText(i)}>SUBMITTED</p>
            <p className={Return_ConnectedText(i)}>CONNECTED</p>
          </div>
        ))}
      </div>
      <div
        className={Return_TimerState()}
        style={{ color: Return_TimerColor() }}
      >
        {time.toFixed(2)}
      </div>
      <div className={Return_KotaeState()}>
        <p className="kotae">答え</p>
        {RCKotae}
      </div>
      <div className="corner-text">K♦</div>
      <div className={Return_ShowRule()}>
        {" "}
        <p style={{ textAlign: "center" }}>【 NEW RULE 】</p>{" "}
        {ShowRules.map((eachR) => {
          if (eachR === 4) {
            return (
              <p style={{ fontSize: "5vh" }}>
                ④ If there are 2 people or more choose the same number, the
                number they choose becomes invalid.
                <br />
              </p>
            );
          } else if (eachR === 3) {
            return (
              <p style={{ fontSize: "5vh" }}>
                ③ If there is a person who chooses the exact correct number, the
                loser penalty is doubled.
                <br />
              </p>
            );
          } else if (eachR === 2) {
            return (
              <p style={{ fontSize: "5vh" }}>
                ② If someone chooses 0, the player who chooses 100 is the
                winner.
                <br />
              </p>
            );
          } else {
            return "";
          }
        })}
      </div>
      <div className={Return_CongratText()}>
        <img
          className="congrat-page-image"
          src={Players[PlayerCongrat].image}
          alt="winner"
        />
        <p style={{ marginTop: "25vh" }}>GAME クリア </p>
        <p>こんごらっちゅれいらしよん</p>
      </div>
    </div>
  );
};

export default MainPage;
