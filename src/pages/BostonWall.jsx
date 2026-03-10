import { useState, useEffect, useRef } from "react";

// ── FONT CONSTANTS ────────────────────────────────────────────
const MONUMENT = "'Barlow Condensed',Impact,sans-serif";
const MONO     = "'Space Mono','Courier New',monospace";
const ACCENT   = "'Playfair Display',Georgia,serif";

// ── TEAM COLORS ───────────────────────────────────────────────
const TEAM_COLORS = {
  "Boston Bruins":        { primary:"#FFC200", dark:"rgba(255,194,0,0.18)",   border:"rgba(255,194,0,0.6)",   glow:"0 0 16px rgba(255,194,0,0.5), 0 0 32px rgba(255,194,0,0.18)",   text:"#FFD278" },
  "Boston Celtics":       { primary:"#00C050", dark:"rgba(0,192,80,0.18)",    border:"rgba(0,192,80,0.6)",    glow:"0 0 16px rgba(0,192,80,0.5), 0 0 32px rgba(0,150,60,0.18)",     text:"#8CFFA8" },
  "Boston Red Sox":       { primary:"#E8203A", dark:"rgba(232,32,58,0.18)",   border:"rgba(232,32,58,0.6)",   glow:"0 0 16px rgba(232,32,58,0.5), 0 0 32px rgba(200,30,50,0.18)",   text:"#FFA0A5" },
  "New England Patriots": { primary:"#1A5FCC", dark:"rgba(26,95,204,0.25)",   border:"rgba(26,95,204,0.6)",   glow:"0 0 16px rgba(26,95,204,0.5), 0 0 32px rgba(26,95,204,0.2)",    text:"#B4D7FF" },
  "Boston Patriots":      { primary:"#1A5FCC", dark:"rgba(26,95,204,0.25)",   border:"rgba(26,95,204,0.6)",   glow:"0 0 16px rgba(26,95,204,0.5), 0 0 32px rgba(26,95,204,0.2)",    text:"#B4D7FF" },
  "Brooklyn Dodgers":     { primary:"#005A9C", dark:"rgba(0,90,156,0.18)",    border:"rgba(0,130,220,0.6)",   glow:"0 0 16px rgba(0,130,220,0.4), 0 0 32px rgba(0,90,156,0.18)",    text:"#80C4FF" },
};
const defaultColors = { primary:"#FF6B00", dark:"rgba(255,107,0,0.15)", border:"rgba(255,107,0,0.5)", glow:"0 0 14px rgba(255,107,0,0.4)", text:"rgba(255,180,80,1)" };

const TEAM_FILTERS   = ["ALL","Bruins","Celtics","Red Sox","Patriots"];
const TEAM_FILTER_MAP = {
  "Bruins":   "Boston Bruins",
  "Celtics":  "Boston Celtics",
  "Red Sox":  "Boston Red Sox",
  "Patriots": ["New England Patriots","Boston Patriots"],
};

function getTeamColors(players) {
  if (!players || players.length === 0) return defaultColors;
  return TEAM_COLORS[players[0].team] || defaultColors;
}

// ── SHEET CONFIG ──────────────────────────────────────────────
const LEGENDS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";
const CURRENT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=1681258019&single=true&output=csv";

// ── STATIC FALLBACK DATA (bundled from CSVs — always loads instantly) ────────
const BOSTON_LEGENDS_STATIC = [
  {"Number":"0","Tier":"LEGEND","Name":"Jayson Tatum","Sport":"Basketball","League":"NBA","Status":"Active","Era":"New Dynasty","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"3","Role":"Small Forward","Fun Fact":"2024 Finals MVP - the face of the new dynasty - still writing it","Notes":""},
  {"Number":"1","Tier":"LEGEND","Name":"Bobby Doerr","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Golden Age","Team":"Boston Red Sox","Signature Stat":"223","Stat Label":"Career Home Runs","Stat Weight":"2","Role":"Second Base","Fun Fact":"Hall of Famer who played alongside Ted Williams - his #1 is retired by the Red Sox","Notes":""},
  {"Number":"1","Tier":"LEGEND","Name":"Gerry Cheevers","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"2","Stat Label":"Stanley Cup Rings","Stat Weight":"2","Role":"Goaltender","Fun Fact":"He used to draw stitches on his mask every time a puck hit it - by the end of his career it looked like Frankenstein","Notes":""},
  {"Number":"2","Tier":"LEGEND","Name":"Red Auerbach","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"9","Stat Label":"Championships as coach","Stat Weight":"3","Role":"Head Coach","Fun Fact":"He lit a victory cigar before the game even ended - that's how confident he was his team would win","Notes":""},
  {"Number":"3","Tier":"LEGEND","Name":"Dennis Johnson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Big Three","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Point Guard","Fun Fact":"Larry Bird called him the best teammate he ever had - high praise from the greatest Celtic","Notes":"Died at 52 - Hall of Fame case pending"},
  {"Number":"3","Tier":"LEGEND","Name":"Jimmie Foxx","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Pre-War Era","Team":"Boston Red Sox","Signature Stat":"534","Stat Label":"Career Home Runs","Stat Weight":"2","Role":"First Base","Fun Fact":"He hit 50 home runs in 1938 and batted .349 in his first year in Boston - The Beast was terrifying","Notes":""},
  {"Number":"4","Tier":"LEGEND","Name":"Bobby Orr","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"102","Stat Label":"Career Goals (D record)","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He flew through the air after scoring the 1970 Cup winner - arms out horizontal - the most iconic photo in Boston sports","Notes":""},
  {"Number":"4","Tier":"LEGEND","Name":"Joe Cronin","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Pre-War Era","Team":"Boston Red Sox","Signature Stat":"1071","Stat Label":"Career RBI","Stat Weight":"1","Role":"Shortstop","Fun Fact":"He was a player-manager - hitting and managing the team at the same time - and later became AL President","Notes":""},
  {"Number":"5","Tier":"LEGEND","Name":"Kevin Garnett","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Big Three Era","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Power Forward","Fun Fact":"After winning the 2008 title he screamed ANYTHING IS POSSIBLE into the camera - the city felt every word","Notes":""},
  {"Number":"5","Tier":"LEGEND","Name":"Nomar Garciaparra","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Revival","Team":"Boston Red Sox","Signature Stat":"0.372","Stat Label":"Peak Season AVG","Stat Weight":"2","Role":"Shortstop","Fun Fact":"He had a full batting ritual before every single pitch - gloves tightened exactly the same way - Fenway loved every second of it","Notes":""},
  {"Number":"6","Tier":"SACRED","Name":"Bill Russell","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"11","Stat Label":"Championships","Stat Weight":"3","Role":"Center","Fun Fact":"The NBA retired his number across all 30 teams in 2022 - 55 years after his last championship - because some things take time to understand","Notes":""},
  {"Number":"6","Tier":"LEGEND","Name":"Johnny Pesky","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Mid-Century","Team":"Boston Red Sox","Signature Stat":"1455","Stat Label":"Career Hits","Stat Weight":"2","Role":"Shortstop","Fun Fact":"The right field foul pole at Fenway is officially named the Pesky Pole after him - he hit a few key homers around it","Notes":""},
  {"Number":"7","Tier":"LEGEND","Name":"Jaylen Brown","Sport":"Basketball","League":"NBA","Status":"Active","Era":"New Dynasty","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Shooting Guard","Fun Fact":"He was the forgotten man in Boston until he wasn't - then he won the 2024 Finals alongside Tatum","Notes":""},
  {"Number":"7","Tier":"LEGEND","Name":"Phil Esposito","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"459","Stat Label":"Goals as a Bruin","Stat Weight":"3","Role":"Center","Fun Fact":"When he was traded to the Rangers in 1975 fans held a protest at the Garden - that's how much Boston loved him","Notes":""},
  {"Number":"8","Tier":"LEGEND","Name":"Cam Neely","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"395","Stat Label":"Career Goals","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He invented the power forward position before anyone called it that - goals, hits, fights, and broken bones from injuries that would've ended anyone else","Notes":""},
  {"Number":"8","Tier":"LEGEND","Name":"Carl Yastrzemski","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Mid-Century","Team":"Boston Red Sox","Signature Stat":"3419","Stat Label":"Career Hits","Stat Weight":"3","Role":"Left Field","Fun Fact":"In 1967 he won the Triple Crown and carried the Red Sox to the pennant almost single-handedly - one man willing a team to greatness","Notes":""},
  {"Number":"9","Tier":"LEGEND","Name":"Johnny Bucyk","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"545","Stat Label":"Career Goals","Stat Weight":"2","Role":"Left Wing","Fun Fact":"He played 21 seasons in Boston - all of them in a Bruins jersey - the definition of a franchise lifer","Notes":""},
  {"Number":"9","Tier":"LEGEND","Name":"Ted Williams","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Golden Age","Team":"Boston Red Sox","Signature Stat":"0.406","Stat Label":"Season Batting AVG","Stat Weight":"3","Role":"Left Field","Fun Fact":"He hit .406 in 1941 and nobody has done it since. He also lost five prime years serving in WWII and Korea and came back and was still the best hitter alive.","Notes":""},
  {"Number":"10","Tier":"LEGEND","Name":"Jo Jo White","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics 70s","Team":"Boston Celtics","Signature Stat":"2","Stat Label":"Championships","Stat Weight":"2","Role":"Guard","Fun Fact":"He was the 1976 Finals MVP - the engine of the Celtics dynasty between Russell and Bird that most people forget about","Notes":""},
  {"Number":"11","Tier":"LEGEND","Name":"Julian Edelman","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Wide Receiver","Fun Fact":"He was Brady's security blanket - most reliable hands in the clutch - and won Super Bowl LIII MVP with a circus catch performance","Notes":"Confidence 3 - Legend tier debated"},
  {"Number":"12","Tier":"LEGEND","Name":"Tom Brady","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"6","Stat Label":"Super Bowl Wins as Patriot","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He was the 199th pick in the 2000 draft. Nobody wanted him. He went on to win six Super Bowls in New England.","Notes":""},
  {"Number":"14","Tier":"LEGEND","Name":"Bob Cousy","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"6","Stat Label":"Championships","Stat Weight":"2","Role":"Point Guard","Fun Fact":"He invented what modern point guards do - behind-the-back passes and court vision - in the 1950s when nobody had seen it before","Notes":""},
  {"Number":"14","Tier":"LEGEND","Name":"Jim Rice","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 70s-80s","Team":"Boston Red Sox","Signature Stat":"382","Stat Label":"Career Home Runs","Stat Weight":"2","Role":"Left Field","Fun Fact":"He was so feared that AL managers would walk him to face someone less dangerous - 1978 MVP was unanimous","Notes":""},
  {"Number":"14","Tier":"LEGEND","Name":"Steve Grogan","Sport":"Football","League":"NFL","Status":"Retired","Era":"Pre-Dynasty Patriots","Team":"New England Patriots","Signature Stat":"182","Stat Label":"Career TD Passes","Stat Weight":"2","Role":"Quarterback","Fun Fact":"He played through injuries that would have ended modern careers - the toughest quarterback of his era","Notes":""},
  {"Number":"15","Tier":"LEGEND","Name":"Dustin Pedroia","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Modern","Team":"Boston Red Sox","Signature Stat":"2","Stat Label":"World Series Rings","Stat Weight":"3","Role":"Second Base","Fun Fact":"He won Rookie of Year, MVP, and two World Series rings in Boston - and played most of his career hurt because he refused to quit","Notes":"The Laser Show"},
  {"Number":"15","Tier":"LEGEND","Name":"Kristaps Porzingis","Sport":"Basketball","League":"NBA","Status":"Active","Era":"New Dynasty","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Center","Fun Fact":"He was the secret weapon of the 2024 title run - when healthy he's basically unguardable as a 7-foot shooter","Notes":"Active - update each season"},
  {"Number":"15","Tier":"LEGEND","Name":"Milt Schmidt","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"229","Stat Label":"Career Goals","Stat Weight":"2","Role":"Center","Fun Fact":"He served in WWII during his prime years - gave up three seasons to the war - and came back to win the Cup","Notes":""},
  {"Number":"16","Tier":"LEGEND","Name":"Derek Sanderson","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Dynasty","Team":"Boston Bruins","Signature Stat":"2","Stat Label":"Stanley Cup Rings","Stat Weight":"2","Role":"Center","Fun Fact":"He was the coolest player in the NHL in the early 70s - faceoff wizard, two Cups, and signed the biggest contract in hockey history at the time","Notes":"Turk"},
  {"Number":"16","Tier":"LEGEND","Name":"Dwight Evans","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 70s-80s","Team":"Boston Red Sox","Signature Stat":"385","Stat Label":"Career Home Runs","Stat Weight":"2","Role":"Right Field","Fun Fact":"He won eight Gold Gloves in right field at Fenway - the wall is brutal to play and he made it look easy for two decades","Notes":""},
  {"Number":"16","Tier":"LEGEND","Name":"Tom Heinsohn","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"8","Stat Label":"Championships as player","Stat Weight":"2","Role":"Forward","Fun Fact":"He won eight rings as a player and then coached the Celtics to two more - and then called every game on TV for decades","Notes":""},
  {"Number":"17","Tier":"LEGEND","Name":"John Havlicek","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"8","Stat Label":"Championships","Stat Weight":"3","Role":"Small Forward","Fun Fact":"Havlicek stole the ball - those four words from the 1965 broadcast are the most famous call in Celtics history","Notes":""},
  {"Number":"17","Tier":"LEGEND","Name":"Milan Lucic","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"1","Role":"Left Wing","Fun Fact":"He was the enforcer of the 2011 Cup team - the guy who made sure nobody touched Bergeron - Bruins fans loved him deeply","Notes":""},
  {"Number":"18","Tier":"LEGEND","Name":"Dave Cowens","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics 70s","Team":"Boston Celtics","Signature Stat":"2","Stat Label":"Championships","Stat Weight":"2","Role":"Center","Fun Fact":"He was undersized for a center and it didn't matter - he out-hustled everyone and willed two championships through pure fury","Notes":""},
  {"Number":"18","Tier":"LEGEND","Name":"Johnny Damon","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Revival","Team":"Boston Red Sox","Signature Stat":"1","Stat Label":"World Series Ring","Stat Weight":"2","Role":"Center Field","Fun Fact":"He called himself and his teammates The Idiots - and then in the 2004 ALCS he hit a grand slam that helped complete the comeback from 3-0","Notes":"Broke hearts going to the Yankees after"},
  {"Number":"19","Tier":"LEGEND","Name":"Don Nelson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"5","Stat Label":"Championships","Stat Weight":"1","Role":"Forward","Fun Fact":"He won five rings as a Celtic and then became one of the great offensive coaching minds in NBA history - two careers, both exceptional","Notes":""},
  {"Number":"19","Tier":"LEGEND","Name":"Fred Lynn","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 70s","Team":"Boston Red Sox","Signature Stat":"1","Stat Label":"Rookie of Year + MVP","Stat Weight":"3","Role":"Center Field","Fun Fact":"In 1975 he became the only player in baseball history to win Rookie of Year and MVP in the same season - still the only one","Notes":""},
  {"Number":"20","Tier":"LEGEND","Name":"Gino Cappelletti","Sport":"Football","League":"NFL","Status":"Retired","Era":"Original Patriots","Team":"Boston Patriots","Signature Stat":"1130","Stat Label":"Career Points","Stat Weight":"2","Role":"Wide Receiver/Kicker","Fun Fact":"He was both a wide receiver and a kicker - at the same time - in the 1960s AFL - and won the scoring title five times","Notes":""},
  {"Number":"20","Tier":"LEGEND","Name":"Kevin Youkilis","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Modern","Team":"Boston Red Sox","Signature Stat":"2","Stat Label":"World Series Rings","Stat Weight":"2","Role":"First/Third Base","Fun Fact":"He was called The Greek God of Walks because his on-base percentage was absurd - two rings and a one-of-a-kind plate approach","Notes":"Youk"},
  {"Number":"20","Tier":"LEGEND","Name":"Ray Allen","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Big Three Era","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Shooting Guard","Fun Fact":"He made the most important three-pointer in Finals history in 2013 - as a Miami Heat - but he earned his legend first in Boston","Notes":""},
  {"Number":"22","Tier":"LEGEND","Name":"Ed Macauley","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"3","Stat Label":"All-Star selections","Stat Weight":"1","Role":"Center","Fun Fact":"He was traded to St. Louis in 1956 for the draft pick that became Bill Russell - the trade that built everything","Notes":""},
  {"Number":"22","Tier":"LEGEND","Name":"Roger Clemens","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 80s-90s","Team":"Boston Red Sox","Signature Stat":"192","Stat Label":"Wins as Red Sox","Stat Weight":"2","Role":"Pitcher","Fun Fact":"He struck out 20 batters in a single game in 1986 - still one of the most dominant pitching performances ever","Notes":"Complex legacy but undeniable Boston impact"},
  {"Number":"22","Tier":"LEGEND","Name":"Willie O'Ree","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins History","Team":"Boston Bruins","Signature Stat":"4","Stat Label":"NHL Goals","Stat Weight":"3","Role":"Left Wing","Fun Fact":"In 1958 he became the first Black player in NHL history - he was also legally blind in one eye and nobody knew until decades later","Notes":""},
  {"Number":"23","Tier":"LEGEND","Name":"Frank Ramsey","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"7","Stat Label":"Championships","Stat Weight":"2","Role":"Guard/Forward","Fun Fact":"He invented the sixth man role - coming off the bench to give the team a spark - seven rings for being great at something nobody had codified before","Notes":""},
  {"Number":"23","Tier":"LEGEND","Name":"Luis Tiant","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 70s","Team":"Boston Red Sox","Signature Stat":"122","Stat Label":"Wins as Red Sox","Stat Weight":"2","Role":"Pitcher","Fun Fact":"His windup was unlike anything in baseball - he turned his back completely to the hitter before delivering - Fenway loved the theater of it","Notes":"The windup was performance art"},
  {"Number":"24","Tier":"LEGEND","Name":"Manny Ramirez","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Revival","Team":"Boston Red Sox","Signature Stat":"274","Stat Label":"Home Runs as Red Sox","Stat Weight":"2","Role":"Left Field","Fun Fact":"He was the most naturally gifted right-handed hitter of his generation - and he did everything on his own schedule which is why they say Manny Being Manny","Notes":"Manny Being Manny"},
  {"Number":"24","Tier":"LEGEND","Name":"Sam Jones","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"10","Stat Label":"Championships","Stat Weight":"2","Role":"Guard","Fun Fact":"Ten championships in twelve seasons - the greatest role player in the history of dynasty basketball","Notes":"The Bank Shot"},
  {"Number":"24","Tier":"LEGEND","Name":"Terry O'Reilly","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"204","Stat Label":"Career Goals","Stat Weight":"2","Role":"Right Wing","Fun Fact":"He was called Taz because he played like a Tasmanian devil - the most beloved Bruin of his era because he gave everything every night","Notes":""},
  {"Number":"25","Tier":"LEGEND","Name":"K.C. Jones","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Dynasty","Team":"Boston Celtics","Signature Stat":"8","Stat Label":"Championships","Stat Weight":"2","Role":"Guard","Fun Fact":"He won eight rings as a Celtic player and then came back to coach Larry Bird and Kevin McHale to two more - a Celtic for two dynasties","Notes":""},
  {"Number":"25","Tier":"LEGEND","Name":"Tony Conigliaro","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 60s-70s","Team":"Boston Red Sox","Signature Stat":"162","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Right Field","Fun Fact":"He was 22 years old and had already hit 100 home runs - the youngest AL homer king ever - and then a pitch hit him in the face and changed everything","Notes":""},
  {"Number":"26","Tier":"LEGEND","Name":"Wade Boggs","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 80s","Team":"Boston Red Sox","Signature Stat":"5","Stat Label":"AL Batting Titles","Stat Weight":"3","Role":"Third Base","Fun Fact":"He won five batting titles in Boston and ate chicken before every game as a ritual and was one of the purest hitters who ever lived","Notes":""},
  {"Number":"27","Tier":"LEGEND","Name":"Carlton Fisk","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox 70s","Team":"Boston Red Sox","Signature Stat":"1","Stat Label":"Home Run Game 6 1975 WS","Stat Weight":"3","Role":"Catcher","Fun Fact":"He waved it fair with his whole body as the ball drifted toward the left field foul pole - the most iconic moment in Red Sox history","Notes":""},
  {"Number":"28","Tier":"LEGEND","Name":"Corey Dillon","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"1635","Stat Label":"Rushing Yards in 2004","Stat Weight":"2","Role":"Running Back","Fun Fact":"He set the Patriots single-season rushing record in the same year they won the Super Bowl - the forgotten dynasty piece","Notes":""},
  {"Number":"31","Tier":"LEGEND","Name":"Cedric Maxwell","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Big Three","Team":"Boston Celtics","Signature Stat":"2","Stat Label":"Championships","Stat Weight":"2","Role":"Forward","Fun Fact":"He told his teammates to get on his back in the 1984 Finals when they were struggling - and then he went out and won Finals MVP","Notes":""},
  {"Number":"32","Tier":"LEGEND","Name":"Kevin McHale","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Big Three","Team":"Boston Celtics","Signature Stat":"3","Stat Label":"Championships","Stat Weight":"3","Role":"Power Forward","Fun Fact":"He had a move called the Dream Shake before Hakeem - his low post footwork was so good they literally changed the rules to try to stop it","Notes":""},
  {"Number":"33","Tier":"LEGEND","Name":"Larry Bird","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Big Three","Team":"Boston Celtics","Signature Stat":"3","Stat Label":"Championships","Stat Weight":"3","Role":"Small Forward","Fun Fact":"He once told the other team exactly where he was going to shoot and from what spot and then did it - and they still couldn't stop him","Notes":""},
  {"Number":"33","Tier":"LEGEND","Name":"Zdeno Chara","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"2","Role":"Defenseman","Fun Fact":"At 6-foot-9 he was the tallest player in NHL history - and he captained the Bruins to the Stanley Cup like it was what tall people do","Notes":""},
  {"Number":"34","Tier":"LEGEND","Name":"David Ortiz","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Revival","Team":"Boston Red Sox","Signature Stat":"541","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Designated Hitter","Fun Fact":"In 2004 he hit a grand slam off Joe Nathan to help complete the greatest comeback in baseball history - and in 2013 he stood at Fenway after the marathon bombing and told the city this is our f***ing city","Notes":""},
  {"Number":"34","Tier":"LEGEND","Name":"Paul Pierce","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Big Three Era","Team":"Boston Celtics","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Small Forward","Fun Fact":"He carried the Celtics through the dark years when they were terrible and it would have been easy to leave - and then he brought them back to glory","Notes":""},
  {"Number":"35","Tier":"LEGEND","Name":"Reggie Lewis","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Gap Years","Team":"Boston Celtics","Signature Stat":"20.8","Stat Label":"Career PPG","Stat Weight":"3","Role":"Small Forward","Fun Fact":"He died on a practice court at 27 - the city still wonders what he would have become - the career points average alone shows what was lost","Notes":"One of the great Boston tragedies"},
  {"Number":"36","Tier":"LEGEND","Name":"Patrice Bergeron","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"6","Stat Label":"Selke Trophies","Stat Weight":"3","Role":"Center","Fun Fact":"He won six Selke Trophies as the best defensive forward in hockey - from the same team - over 19 seasons - a standard of excellence that may never be matched","Notes":""},
  {"Number":"38","Tier":"LEGEND","Name":"Curt Schilling","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Revival","Team":"Boston Red Sox","Signature Stat":"1","Stat Label":"World Series Ring","Stat Weight":"3","Role":"Pitcher","Fun Fact":"He pitched the 2004 ALCS with a torn tendon in his ankle - the stitches holding his tendon in place bled through his sock on national television","Notes":""},
  {"Number":"40","Tier":"LEGEND","Name":"Tuukka Rask","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"2","Role":"Goaltender","Fun Fact":"He left the bubble during COVID to be with his family - and then came back the next season to give the team one last run because he wasn't done yet","Notes":""},
  {"Number":"42","Tier":"SACRED","Name":"Jackie Robinson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Civil Rights Era","Team":"Brooklyn Dodgers","Signature Stat":"6","Stat Label":"Stolen Base Titles","Stat Weight":"3","Role":"Second Base","Fun Fact":"His number is retired across all of baseball - not just one team - and every April 15th every single player wears 42 because what he did was bigger than baseball","Notes":"Played for Brooklyn Dodgers - included because #42 is honored at Fenway every April 15"},
  {"Number":"44","Tier":"LEGEND","Name":"Danny Ainge","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"Celtics Big Three","Team":"Boston Celtics","Signature Stat":"2","Stat Label":"Championships","Stat Weight":"1","Role":"Guard","Fun Fact":"He won two rings as a Celtic player and then came back as GM to build the team that won in 2008 - built two different dynasties","Notes":""},
  {"Number":"45","Tier":"LEGEND","Name":"Pedro Martinez","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Red Sox Modern","Team":"Boston Red Sox","Signature Stat":"2.26","Stat Label":"ERA as Red Sox","Stat Weight":"3","Role":"Pitcher","Fun Fact":"In 1999 he was so dominant that AFTER he left with injury his team still won because the Red Sox scored enough to cover - he was that far ahead of his era","Notes":""},
  {"Number":"46","Tier":"LEGEND","Name":"David Krejci","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"2","Role":"Center","Fun Fact":"He led the playoffs in scoring in 2011 when the Bruins won the Cup - the most underrated Bruin of the championship era - came back from the Czech league because he wasn't done","Notes":""},
  {"Number":"50","Tier":"LEGEND","Name":"Mike Vrabel","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Linebacker","Fun Fact":"He was a linebacker who somehow caught a touchdown pass in three different Super Bowls - physically this should not be possible","Notes":""},
  {"Number":"54","Tier":"LEGEND","Name":"Tedy Bruschi","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"3","Role":"Linebacker","Fun Fact":"He had a stroke in February 2005 and by October he was back on the field for the Patriots - the soul of the dynasty","Notes":""},
  {"Number":"55","Tier":"LEGEND","Name":"Willie McGinest","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Linebacker/DE","Fun Fact":"He holds the NFL record for most sacks in a single playoff game - in a must-win situation he took over games","Notes":""},
  {"Number":"59","Tier":"LEGEND","Name":"Andre Tippett","Sport":"Football","League":"NFL","Status":"Retired","Era":"Pre-Dynasty Patriots","Team":"New England Patriots","Signature Stat":"100","Stat Label":"Career Sacks","Stat Weight":"2","Role":"Linebacker","Fun Fact":"He was a Hall of Fame pass rusher who also practiced martial arts and became a martial arts master - the most underrated great Patriot","Notes":""},
  {"Number":"63","Tier":"LEGEND","Name":"Brad Marchand","Sport":"Hockey","League":"NHL","Status":"Active","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"3","Role":"Left Wing","Fun Fact":"He's the franchise all-time points leader, won the Cup, and plays like a guy who was told he was too small to make it - because he was told that","Notes":"Active - update annually"},
  {"Number":"72","Tier":"LEGEND","Name":"Matt Light","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Offensive Tackle","Fun Fact":"He protected Tom Brady's blind side for 11 years and three Super Bowls - the most important Patriot nobody talks about","Notes":""},
  {"Number":"73","Tier":"LEGEND","Name":"John Hannah","Sport":"Football","League":"NFL","Status":"Retired","Era":"Pre-Dynasty Patriots","Team":"New England Patriots","Signature Stat":"9","Stat Label":"Pro Bowl Selections","Stat Weight":"3","Role":"Offensive Guard","Fun Fact":"Sports Illustrated called him the best offensive lineman who ever played - not the best of his era - the best ever","Notes":""},
  {"Number":"75","Tier":"LEGEND","Name":"Vince Wilfork","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"5","Stat Label":"Pro Bowl Selections","Stat Weight":"2","Role":"Defensive Tackle","Fun Fact":"He was a 325-pound nose tackle who ran down a ball carrier from behind on an interception return - and people think of him as just a run stopper","Notes":""},
  {"Number":"77","Tier":"LEGEND","Name":"Ray Bourque","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"1169","Stat Label":"Career Points (D record)","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He gave up his #7 so Phil Esposito could retire it - wore #77 for the rest of his career - the most selfless act in Boston sports history","Notes":""},
  {"Number":"81","Tier":"LEGEND","Name":"Randy Moss","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"23","Stat Label":"Single Season TDs (2007 record)","Stat Weight":"3","Role":"Wide Receiver","Fun Fact":"He caught 23 touchdown passes in 2007 - the single-season record that still stands - on a team that went 16-0 in the regular season","Notes":""},
  {"Number":"83","Tier":"LEGEND","Name":"Wes Welker","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"672","Stat Label":"Receptions as Patriot","Stat Weight":"2","Role":"Slot Receiver","Fun Fact":"He caught 672 passes in five seasons - the most reliable hands Brady ever had - and then dropped the one that would have beaten the Giants in Super Bowl XLVI","Notes":"Dropped the crucial pass in Super Bowl XLVI"},
  {"Number":"87","Tier":"LEGEND","Name":"Rob Gronkowski","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"4","Stat Label":"Super Bowl Rings","Stat Weight":"3","Role":"Tight End","Fun Fact":"He is the greatest tight end in NFL history and he made it look fun - nobody has ever combined size, speed, blocking, and pure force at that position","Notes":"Gronk"},
  {"Number":"88","Tier":"LEGEND","Name":"David Pastrnak","Sport":"Hockey","League":"NHL","Status":"Active","Era":"Bruins Modern Era","Team":"Boston Bruins","Signature Stat":"61","Stat Label":"Goals in 2022-23","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He tied for the NHL goal scoring title in 2022-23 - 61 goals - and plays with a joy that makes you want to watch every shift","Notes":"Active - update annually"},
  {"Number":"93","Tier":"LEGEND","Name":"Richard Seymour","Sport":"Football","League":"NFL","Status":"Retired","Era":"Patriots Dynasty","Team":"New England Patriots","Signature Stat":"3","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Defensive End","Fun Fact":"He was the quiet anchor of the early dynasty - three rings - does not get mentioned enough considering how dominant he was","Notes":"Hall of Famer"}
];

const BOSTON_CURRENT_STATIC = [
  {"Number":"","Tier":"","Name":"Anfernee Simons","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"22","Stat Label":"PPG 2024-25 with Portland","Stat Weight":"2","Role":"Guard","Fun Fact":"Traded to Boston 2025 - the scoring punch the Celtics needed after losing Holiday","Notes":""},
  {"Number":"","Tier":"","Name":"Antonio Gibson","Sport":"Football","League":"NFL","Status":"Retired","Era":"","Team":"","Signature Stat":"538","Stat Label":"Rushing Yards 2024","Stat Weight":"1","Role":"Running Back","Fun Fact":"The change-of-pace back who earned AFC Player of the Week in 2025 Week 2","Notes":""},
  {"Number":"","Tier":"","Name":"Brad Marchand","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"3","Role":"Left Wing","Fun Fact":"The Little Ball of Hate - franchise points leader - a legend still playing","Notes":""},
  {"Number":"","Tier":"","Name":"Brandon Carlo","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"3","Stat Label":"Career Plus/Minus top 10","Stat Weight":"1","Role":"Defenseman","Fun Fact":"Long-serving defensive defenseman","Notes":""},
  {"Number":"","Tier":"","Name":"Brayan Bello","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"11","Stat Label":"Wins 2023","Stat Weight":"2","Role":"Pitcher","Fun Fact":"The ace of the future - stuff is electric","Notes":""},
  {"Number":"","Tier":"","Name":"Charlie Coyle","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"18","Stat Label":"Goals 2023-24","Stat Weight":"1","Role":"Center","Fun Fact":"Local kid made good - heart of the third line","Notes":""},
  {"Number":"","Tier":"","Name":"Chris Martin","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"2.45","Stat Label":"ERA 2023","Stat Weight":"1","Role":"Reliever","Fun Fact":"Setup man in the bullpen","Notes":""},
  {"Number":"","Tier":"","Name":"Connor Wong","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"14","Stat Label":"Home Runs 2023","Stat Weight":"2","Role":"Catcher","Fun Fact":"Emerging as a genuine star at catcher","Notes":""},
  {"Number":"","Tier":"","Name":"Craig Smith","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"16","Stat Label":"Goals 2022-23","Stat Weight":"1","Role":"Right Wing","Fun Fact":"Reliable depth contributor","Notes":""},
  {"Number":"","Tier":"","Name":"Danny Jansen","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"13","Stat Label":"Home Runs 2023","Stat Weight":"1","Role":"Catcher","Fun Fact":"Veteran backstop depth","Notes":""},
  {"Number":"","Tier":"","Name":"Dante Fabbro","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"24","Stat Label":"Points 2023-24","Stat Weight":"1","Role":"Defenseman","Fun Fact":"Steadying D presence","Notes":""},
  {"Number":"","Tier":"","Name":"David Pastrnak","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"61","Stat Label":"Goals 2022-23","Stat Weight":"3","Role":"Right Wing","Fun Fact":"The best player on the Bruins - tied for NHL goal scoring title 2023","Notes":""},
  {"Number":"","Tier":"","Name":"Derek Forbort","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"12","Stat Label":"Points 2022-23","Stat Weight":"1","Role":"Defenseman","Fun Fact":"Physical shutdown D","Notes":""},
  {"Number":"","Tier":"","Name":"Derrick White","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"1","Stat Label":"Championship 2024","Stat Weight":"2","Role":"Guard","Fun Fact":"The most underrated Celtic - hit the biggest shots in the 2024 run","Notes":""},
  {"Number":"","Tier":"","Name":"Drake Maye","Sport":"Football","League":"NFL","Status":"Retired","Era":"","Team":"","Signature Stat":"14-3","Stat Label":"Team record 2025 season","Stat Weight":"3","Role":"Quarterback","Fun Fact":"Led Patriots to 14-3 and a Super Bowl in his second NFL season - the post-Brady hope is real","Notes":""},
  {"Number":"","Tier":"","Name":"Emil Forssberg","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"10","Stat Label":"Points 2024-25","Stat Weight":"1","Role":"Right Wing","Fun Fact":"Young Swede making his mark","Notes":""},
  {"Number":"","Tier":"","Name":"Hampus Lindholm","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"46","Stat Label":"Points 2023-24","Stat Weight":"2","Role":"Defenseman","Fun Fact":"The anchor of the Bruins blue line post-Chara","Notes":""},
  {"Number":"","Tier":"","Name":"Jake DeBrusk","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"27","Stat Label":"Goals 2021-22","Stat Weight":"1","Role":"Left Wing","Fun Fact":"Solid contributor - son of Bruins legend Luke DeBrusk","Notes":""},
  {"Number":"","Tier":"","Name":"James van Riemsdyk","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"58","Stat Label":"Career Goals with Bruins","Stat Weight":"1","Role":"Left Wing","Fun Fact":"Veteran presence on left wing","Notes":""},
  {"Number":"","Tier":"","Name":"Jarren Duran","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"24","Stat Label":"Home Runs 2024","Stat Weight":"2","Role":"Center Field","Fun Fact":"All-Star 2024 - fastest Red Sox in a generation - stole the show in the summer","Notes":""},
  {"Number":"","Tier":"","Name":"Jaylen Brown","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"29.1","Stat Label":"PPG 2025-26 (career high)","Stat Weight":"3","Role":"Shooting Guard","Fun Fact":"Carried the Celtics to 41-21 without Tatum - in the MVP conversation - the best version of himself","Notes":""},
  {"Number":"","Tier":"","Name":"Jayson Tatum","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"26.8","Stat Label":"PPG 2024-25 season","Stat Weight":"3","Role":"Small Forward","Fun Fact":"Returned from torn Achilles after 10 months - 2024 Finals MVP and the face of the Celtics dynasty","Notes":""},
  {"Number":"","Tier":"","Name":"Jeremy Swayman","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"28","Stat Label":"Save Percentage .920+","Stat Weight":"2","Role":"Goaltender","Fun Fact":"The future of the Bruins in net - franchise goalie locked in long term","Notes":""},
  {"Number":"","Tier":"","Name":"Johnny Beecher","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"12","Stat Label":"Goals 2023-24","Stat Weight":"1","Role":"Center","Fun Fact":"Young center developing into a key piece","Notes":""},
  {"Number":"","Tier":"","Name":"Kenley Jansen","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"33","Stat Label":"Saves 2023","Stat Weight":"2","Role":"Closer","Fun Fact":"Elite closer - one of the great closers of his generation","Notes":""},
  {"Number":"","Tier":"","Name":"Kutter Crawford","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"12","Stat Label":"Wins 2023","Stat Weight":"1","Role":"Pitcher","Fun Fact":"Developing into a key rotation piece","Notes":""},
  {"Number":"","Tier":"","Name":"Masataka Yoshida","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"0.289","Stat Label":"AVG 2023","Stat Weight":"2","Role":"Designated Hitter","Fun Fact":"Japanese superstar - massive signing - still finding his footing","Notes":""},
  {"Number":"","Tier":"","Name":"Matt Grzelcyk","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"1","Role":"Defenseman","Fun Fact":"Local Boston kid - 2011 Cup ring","Notes":""},
  {"Number":"","Tier":"","Name":"Milan Lucic","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"1","Stat Label":"Stanley Cup Ring","Stat Weight":"1","Role":"Left Wing","Fun Fact":"Return to Boston - beloved veteran presence","Notes":""},
  {"Number":"","Tier":"","Name":"Morgan Geekie","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"21","Stat Label":"Goals 2023-24","Stat Weight":"2","Role":"Center","Fun Fact":"Breakout season - the surprise of the Bruins rebuild","Notes":""},
  {"Number":"","Tier":"","Name":"Neemias Queta","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"8","Stat Label":"Rebounds per game 2025-26","Stat Weight":"2","Role":"Center","Fun Fact":"Led Portugal to their best EuroBasket finish ever - now the starting C in Boston","Notes":""},
  {"Number":"","Tier":"","Name":"Pavel Zacha","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"54","Stat Label":"Points 2023-24","Stat Weight":"2","Role":"Center","Fun Fact":"Emerging as a true second-line center","Notes":""},
  {"Number":"","Tier":"","Name":"Payton Pritchard","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"17","Stat Label":"PPG 2025-26 (career high)","Stat Weight":"2","Role":"Point Guard","Fun Fact":"Won Sixth Man of Year 2024-25 - now a starter - the most improved Celtic of the dynasty era","Notes":""},
  {"Number":"","Tier":"","Name":"Rafael Devers","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"33","Stat Label":"Home Runs 2023","Stat Weight":"3","Role":"Third Base","Fun Fact":"The franchise cornerstone - elite bat - the best Red Sox hitter since Ortiz","Notes":""},
  {"Number":"","Tier":"","Name":"Rhamondre Stevenson","Sport":"Football","League":"NFL","Status":"Retired","Era":"","Team":"","Signature Stat":"14","Stat Label":"Regular season TDs 2025","Stat Weight":"2","Role":"Running Back","Fun Fact":"3 TDs in the final game of the season - workhorse of the Pats Super Bowl run under Vrabel","Notes":""},
  {"Number":"","Tier":"","Name":"Sam Hauser","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"","Team":"","Signature Stat":"155","Stat Label":"Three Pointers 2023-24","Stat Weight":"2","Role":"Small Forward","Fun Fact":"Elite shooter coming into his own in the championship era","Notes":""},
  {"Number":"","Tier":"","Name":"Stefon Diggs","Sport":"Football","League":"NFL","Status":"Retired","Era":"","Team":"","Signature Stat":"1535","Stat Label":"Career receiving yards 2024","Stat Weight":"2","Role":"Wide Receiver","Fun Fact":"Veteran star WR - key target for Drake Maye in the Super Bowl season","Notes":""},
  {"Number":"","Tier":"","Name":"Tanner Houck","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"9","Stat Label":"Wins 2023","Stat Weight":"2","Role":"Pitcher","Fun Fact":"Settled into the rotation - stuff plays at the top of the order","Notes":""},
  {"Number":"","Tier":"","Name":"TreVeyon Henderson","Sport":"Football","League":"NFL","Status":"Retired","Era":"","Team":"","Signature Stat":"2","Stat Label":"NFL Draft Round 2025","Stat Weight":"2","Role":"Running Back","Fun Fact":"Explosive rookie RB - 4.43 speed - paired with Stevenson all season on the Super Bowl run","Notes":""},
  {"Number":"","Tier":"","Name":"Trent Frederic","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"","Team":"","Signature Stat":"14","Stat Label":"Goals 2022-23","Stat Weight":"1","Role":"Left Wing","Fun Fact":"Physical forward earning his spot","Notes":""},
  {"Number":"","Tier":"","Name":"Triston Casas","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"16","Stat Label":"Home Runs 2023","Stat Weight":"2","Role":"First Base","Fun Fact":"The future of the Red Sox lineup - best power bat they have developed in years","Notes":""},
  {"Number":"","Tier":"","Name":"Tyler ONeill","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"31","Stat Label":"Home Runs 2023","Stat Weight":"2","Role":"Left Field","Fun Fact":"Power bat in left field","Notes":""},
  {"Number":"","Tier":"","Name":"Wilyer Abreu","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"","Team":"","Signature Stat":"10","Stat Label":"Home Runs 2024","Stat Weight":"1","Role":"Right Field","Fun Fact":"Young outfielder growing into the lineup","Notes":""}
];
const SPORT_ICON_MAP_B = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };

function parseCSVLine_B(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += line[i]; }
  }
  result.push(cur.trim());
  return result;
}

function buildBostonData(rows) {
  const data = {};
  for (let i = 0; i <= 99; i++) data[i] = { tier:"UNWRITTEN", players:[] };
  rows.forEach(r => {
    const num = parseInt(r["Number"]);
    if (isNaN(num) || !r["Name"]) return;
    const sport = r["Sport"] || "";
    const team  = r["Team"] || r["City + Team"] || "";
    const player = {
      name: r["Name"], sport, league: r["League"] || "", team,
      status: r["Status"] || "Retired", era: r["Era"] || "",
      stat: r["Signature Stat"] || r["Stat"] || "",
      statLabel: r["Stat Label"] || r["StatLabel"] || "",
      statWeight: parseInt(r["Stat Weight"] || r["StatWeight"]) || 1,
      role: r["Role"] || "", funFact: r["Fun Fact"] || r["FunFact"] || "",
      color: (TEAM_COLORS[team] || {}).primary || "#FF6B00",
      icon: SPORT_ICON_MAP_B[sport] || "🏅",
    };
    if (!data[num]) data[num] = { tier:"UNWRITTEN", players:[] };
    data[num].players.push(player);
    const t = (r["Tier"] || "").toUpperCase().trim();
    if      (t === "SACRED") data[num].tier = "SACRED";
    else if (t === "LEGEND" && data[num].tier !== "SACRED") data[num].tier = "LEGEND";
    else if (t === "ACTIVE" && data[num].tier === "UNWRITTEN") data[num].tier = "ACTIVE";
    else if (t === "" && data[num].players.length > 1 && data[num].tier === "UNWRITTEN") data[num].tier = "LEGEND";
  });
  return data;
}

// ── COMPONENT ─────────────────────────────────────────────────
export default function BostonWall() {
  const [tab, setTab]           = useState("legends");
  const [selected, setSelected] = useState(null);
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [isDesktop, setIsDesktop]   = useState(false);
  const [legendsData, setLegendsData] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [loading, setLoading]   = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const filterRef = useRef(null);
  const sheetRef  = useRef(null);

  const handleShare = (num, players) => {
    const url   = `${window.location.origin}/boston?n=${num}`;
    const names = players.map(p => p.name).join(" · ");
    if (navigator.share) { navigator.share({ title:`#${num} on The Boston Wall`, text:names, url }); }
    else { navigator.clipboard?.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
  };

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 960);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setSelected(null); }, [tab, teamFilter]);

  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("n"));
    if (!isNaN(n) && n >= 0 && n <= 99) setSelected(n);
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const names  = selectedPlayers.map(p => p.name).join(" · ");
    const ogUrl  = `https://thenumberwall.com/api/og?n=${selected}&wall=boston`;
    const setMeta = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop.startsWith("og:") || prop.startsWith("twitter:") ? "property" : "name", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title", `#${selected} on The Boston Wall`);
    setMeta("og:description", names || `Who wore #${selected}?`);
    setMeta("og:image", ogUrl); setMeta("og:url", `https://thenumberwall.com/boston?n=${selected}`);
    setMeta("twitter:card","summary_large_image"); setMeta("twitter:image", ogUrl);
  }, [selected]);

  useEffect(() => { if (filterRef.current) filterRef.current.scrollLeft = 0; }, [teamFilter]);

  useEffect(() => {
    // Load static data immediately so the wall always renders
    setLegendsData(buildBostonData(BOSTON_LEGENDS_STATIC));
    setCurrentData(buildBostonData(BOSTON_CURRENT_STATIC));
    setLoading(false);

    // Then try to fetch live data from sheet in the background
    const parseSheet = (csv) => {
      const lines = csv.split("\n").filter(Boolean);
      const headers = parseCSVLine_B(lines[0]);
      return lines.slice(1).map(line => {
        const vals = parseCSVLine_B(line); const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] || ""); return obj;
      });
    };
    const fetchSheet = (url) =>
      fetch(url, { redirect: "follow" }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });

    Promise.all([fetchSheet(LEGENDS_URL), fetchSheet(CURRENT_URL)])
      .then(([legCsv, curCsv]) => {
        setLegendsData(buildBostonData(parseSheet(legCsv)));
        setCurrentData(buildBostonData(parseSheet(curCsv)));
      })
      .catch(() => { /* static data already loaded, silently ignore */ });
  }, []);

  const DATA = tab === "legends" ? legendsData : currentData;

  const filteredPlayers = (num) => {
    const d = DATA && DATA[num];
    if (!d || !d.players) return [];
    if (teamFilter === "ALL") return d.players;
    const teamName = TEAM_FILTER_MAP[teamFilter];
    return d.players.filter(p => Array.isArray(teamName) ? teamName.includes(p.team) : p.team === teamName);
  };

  const cellColors = (num) => {
    const players = filteredPlayers(num);
    if (!players.length) return { bg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.18)", glow:"none", text:"rgba(255,255,255,0.38)" };
    const all   = DATA[num]?.players || [];
    const count = teamFilter === "ALL" ? all.length : players.length;

    if (teamFilter === "ALL") {
      if (count >= 6) return { bg:"rgba(220,70,0,0.75)",  border:"rgba(255,120,20,1)",   glow:"0 0 22px rgba(255,120,20,0.85),0 0 44px rgba(255,80,0,0.45)", text:"rgba(255,210,120,1)" };
      if (count >= 4) return { bg:"rgba(210,60,0,0.65)",  border:"rgba(255,100,20,0.9)", glow:"0 0 18px rgba(255,100,20,0.7),0 0 36px rgba(255,80,0,0.35)",  text:"rgba(255,190,100,1)" };
      if (count >= 3) return { bg:"rgba(200,50,0,0.55)",  border:"rgba(255,85,10,0.75)", glow:"0 0 14px rgba(255,85,10,0.55),0 0 28px rgba(255,70,0,0.25)",  text:"rgba(255,170,85,1)"  };
      if (count === 2) return { bg:"rgba(180,40,0,0.45)", border:"rgba(240,70,5,0.6)",   glow:"0 0 10px rgba(240,70,5,0.4),0 0 20px rgba(220,60,0,0.15)",    text:"rgba(255,145,65,1)"  };
      return                { bg:"rgba(150,30,0,0.35)",   border:"rgba(200,55,0,0.45)",  glow:"0 0 6px rgba(200,55,0,0.3)",                                   text:"rgba(220,110,50,0.9)"};
    }

    const tc  = getTeamColors(players);
    const hex = tc.primary;
    const rr  = parseInt(hex.slice(1,3),16);
    const gg  = parseInt(hex.slice(3,5),16);
    const bb  = parseInt(hex.slice(5,7),16);
    const isPatriots = players.some(p => p.team === "New England Patriots" || p.team === "Boston Patriots");
    const br  = isPatriots ? Math.min(255,rr+80) : rr;
    const bg2 = isPatriots ? Math.min(255,gg+60) : gg;
    const bbl = isPatriots ? Math.min(255,bb+120) : bb;
    const intensity = Math.min(1, 0.3 + count * 0.14);
    return {
      bg:     `rgba(${br},${bg2},${bbl},${Math.min(0.65, intensity)})`,
      border: `rgba(${br},${bg2},${bbl},${Math.min(1, intensity + 0.35)})`,
      glow:   `0 0 ${8 + count * 4}px rgba(${br},${bg2},${bbl},${Math.min(0.85, intensity + 0.25)}), 0 0 ${16 + count * 8}px rgba(${br},${bg2},${bbl},${Math.min(0.35, intensity * 0.5)})`,
      text:   tc.text,
    };
  };

  const selectedPlayers = selected !== null ? filteredPlayers(selected) : [];
  const selectedData    = selected !== null ? DATA[selected] : null;
  const selColors       = selected !== null ? cellColors(selected) : {};

  // ── PLAYER CARD ────────────────────────────────────────────
  // FIX 3: Active = plain label. FIX 8: team color on stat. FIX 9: no serif. FIX 10: Barlow Condensed
  const renderPlayerCard = (p, i) => {
    const tc = TEAM_COLORS[p.team] || defaultColors;
    return (
      <div key={i} className="player-card" style={{ marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"nowrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
            <span style={{ fontSize:20 }}>{p.icon}</span>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:20, letterSpacing:1, lineHeight:1, marginBottom:4, color:"#fff" }}>{p.name}</div>
              <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontFamily:MONO, color:"rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:4, padding:"2px 7px", letterSpacing:1 }}>{p.team}</span>
                {/* FIX 3: Active = plain label, no green badge */}
                {p.status === "Active" && (
                  <span style={{ fontSize:10, fontFamily:MONO, color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>ACTIVE</span>
                )}
                {p.era && <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:MONO }}>{p.era}</span>}
                {p.role && <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:MONO }}>{p.role}</span>}
              </div>
              {p.funFact && (
                <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{p.funFact}</div>
              )}
            </div>
          </div>
          {p.stat && (
            <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
              {/* FIX 8: stat number uses team color */}
              <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:28, lineHeight:1, color:tc.text }}>{p.stat}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontFamily:MONO, letterSpacing:1, maxWidth:110, textAlign:"right", lineHeight:1.3 }}>{p.statLabel}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── PANEL ─────────────────────────────────────────────────
  const renderPanel = () => {
    if (selected === null) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", minHeight:200, gap:10 }}>
        <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:28, letterSpacing:3, color:"rgba(255,255,255,0.08)" }}>THE BOSTON WALL</div>
        <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:3, color:"rgba(255,255,255,0.12)" }}>PICK A NUMBER.</div>
      </div>
    );

    const empty = selectedPlayers.length === 0;
    return (
      <div>
        {/* FIX 1: X button position:absolute, never inline with number */}
        <div style={{ position:"relative", marginBottom:16, paddingRight:44 }}>
          <button className="close-btn" onClick={() => setSelected(null)}
            style={{ position:"absolute", top:0, right:0 }}>✕</button>

          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:52, lineHeight:1, letterSpacing:2, color:selColors.text || "#fff" }}>
              #{selected}
            </div>
            <div>
              <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.28)", marginBottom:5 }}>
                {teamFilter === "ALL" ? "ALL TEAMS" : teamFilter} — JERSEY NUMBER
              </div>
              <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:14, letterSpacing:1, color:"rgba(255,255,255,0.6)" }}>
                {empty ? "NO LEGENDS FOR THIS NUMBER" : `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS`}
              </div>
            </div>
          </div>
        </div>

        {selectedPlayers.map((p, i) => renderPlayerCard(p, i))}

        {selectedPlayers.length > 0 && (() => {
          const tc  = selectedPlayers[0]?.color || "#FF6B00";
          const rr  = parseInt(tc.slice(1,3)||"FF",16);
          const gg  = parseInt(tc.slice(3,5)||"6B",16);
          const bb  = parseInt(tc.slice(5,7)||"00",16);
          const btnBg    = shareCopied ? "rgba(143,217,32,0.1)"  : `rgba(${rr},${gg},${bb},0.12)`;
          const btnBdr   = shareCopied ? "rgba(143,217,32,0.35)" : `rgba(${rr},${gg},${bb},0.45)`;
          const btnColor = shareCopied ? "#8FD920"               : `rgba(${Math.min(255,rr+60)},${Math.min(255,gg+60)},${Math.min(255,bb+60)},0.9)`;
          return (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.18)" }}>
                THENUMBERWALL.COM · #{selected}
              </span>
              <button onClick={() => handleShare(selected, selectedPlayers)}
                style={{ display:"flex", alignItems:"center", gap:6, background:btnBg, border:`1px solid ${btnBdr}`, borderRadius:6, padding:"5px 12px", color:btnColor, fontFamily:MONO, fontSize:10, letterSpacing:1, cursor:"pointer", transition:"all 0.15s" }}>
                {shareCopied
                  ? <><svg style={{width:11,height:11,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>&nbsp;COPIED</>
                  : <><svg style={{width:12,height:12,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>&nbsp;SHARE #{selected}</>
                }
              </button>
            </div>
          );
        })()}
      </div>
    );
  };

  // ── GRID CELL ─────────────────────────────────────────────
  const renderCell = (num) => {
    const players    = filteredPlayers(num);
    const hasPlayers = players.length > 0;
    const isSelected = selected === num;
    const colors     = cellColors(num);
    return (
      <div key={num} className="cell"
        style={{
          aspectRatio:"1", background:isSelected?"rgba(255,255,255,0.14)":colors.bg,
          border:`1px solid ${isSelected?"rgba(255,255,255,0.75)":colors.border}`,
          boxShadow: isSelected ? `0 0 0 2px rgba(255,255,255,0.45), ${colors.glow}` : colors.glow,
          color: isSelected ? "#fff" : colors.text,
          fontFamily:MONUMENT, letterSpacing:1,
          cursor: hasPlayers ? "pointer" : "default",
        }}
        onClick={() => hasPlayers && setSelected(selected === num ? null : num)}
      >
        <span className="cell-label">{num}</span>
      </div>
    );
  };

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080c10", color:"white", position:"relative" }}>
      {loading && (
        <div style={{ position:"fixed", inset:0, background:"#080c10", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
          <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:28, letterSpacing:4, color:"rgba(255,255,255,0.28)" }}>THE BOSTON WALL</div>
          <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:3, color:"rgba(232,124,42,0.6)" }}>617 LEGENDS LOADING...</div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Space+Mono&family=Playfair+Display:ital@1&display=swap');
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; overflow-x:hidden; -webkit-text-size-adjust:100%; }
        /* FIX 2: scanline removed */
        .cell { border-radius:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:900; transition:transform 0.15s ease,box-shadow 0.15s ease; position:relative; user-select:none; }
        .cell:hover { transform:scale(1.15) !important; z-index:10; }
        .player-card { border-radius:10px; padding:12px 14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); animation:cardIn 0.3s ease both; }
        @keyframes cardIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes panelIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .panel-in { animation:panelIn 0.35s ease both; }
        /* FIX 7: filter pills — unified pill style, no bold/special treatment */
        .filter-pill { border-radius:20px; padding:5px 12px; font-size:11px; cursor:pointer; border:1px solid; transition:all 0.2s; letter-spacing:1px; font-family:'Space Mono','Courier New',monospace; }
        .filter-pill:hover { transform:translateY(-1px); }
        .close-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); border-radius:7px; color:rgba(255,255,255,0.45); cursor:pointer; padding:4px 10px; font-size:12px; transition:all 0.2s; font-family:'Space Mono',monospace; }
        .close-btn:hover { background:rgba(255,255,255,0.12); color:white; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.14); border-radius:2px; }
        .grid-wrap { display:grid; grid-template-columns:repeat(8,1fr); gap:3px; }
        .cell-label { font-size:11px; }
        .filter-scroll { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
        .filter-scroll::-webkit-scrollbar { display:none; }
        .desktop-layout { display:flex; height:calc(100vh - 140px); }
        .desktop-grid-col { flex:0 0 61.8%; overflow-y:auto; padding:16px 14px; border-right:1px solid rgba(255,255,255,0.06); }
        .desktop-panel-col { flex:0 0 38.2%; overflow-y:auto; padding:20px; }
        .bottom-sheet { position:fixed; bottom:0; left:0; right:0; background:#0d1117; border-top:1px solid rgba(255,255,255,0.1); border-radius:18px 18px 0 0; z-index:200; max-height:72vh; overflow-y:auto; padding:0 16px 40px; transition:transform 0.35s cubic-bezier(0.32,0.72,0,1); -webkit-overflow-scrolling:touch; }
        .sheet-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:199; backdrop-filter:blur(2px); }
        @media (min-width:480px) { .grid-wrap { grid-template-columns:repeat(10,1fr); gap:4px; } .cell-label { font-size:12px; } }
        @media (min-width:700px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:5px; } }
        @media (min-width:960px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:6px; } }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"10px 14px 10px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        {/* Back link */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <a href="/" style={{ textDecoration:"none", color:"rgba(255,255,255,0.25)", fontFamily:MONO, fontSize:9, letterSpacing:2, display:"flex", alignItems:"center", gap:4, transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.55)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.25)"}>
            ← THE NUMBER WALL
          </a>
          <a href="/about" style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.22)", textDecoration:"none", transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.55)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.22)"}>ABOUT</a>
        </div>

        <div style={{ textAlign:"center", marginBottom:8 }}>
          {/* FIX 2 + 10: Barlow Condensed 900 */}
          <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:"clamp(22px,5vw,34px)", letterSpacing:3, lineHeight:1 }}>THE BOSTON WALL</div>
          <div style={{ fontFamily:ACCENT, fontStyle:"italic", fontSize:17, color:"#E87C2A", textShadow:"0 0 14px rgba(232,124,42,0.5)", marginTop:3 }}>617 legends live here.</div>
        </div>

        {/* FIX 7: LEGENDS/2025–26 tabs use same .filter-pill class as team filters */}
        <div ref={filterRef} className="filter-scroll" style={{ marginBottom:4 }}>
          {/* Tab toggles — same pill style */}
          {[{key:"legends",label:"LEGENDS"},{key:"current",label:"2025–26"}].map(({key,label}) => {
            const active = tab === key;
            return (
              <button key={key} className="filter-pill"
                style={{ background:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.04)", borderColor:active?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.1)", color:active?"#0a0d14":"rgba(255,255,255,0.4)", boxShadow:active?"0 0 10px rgba(255,255,255,0.2)":"none", flexShrink:0 }}
                onClick={() => setTab(key)}>{label}</button>
            );
          })}

          {/* Divider */}
          <div style={{ width:1, background:"rgba(255,255,255,0.12)", alignSelf:"stretch", margin:"0 2px", flexShrink:0 }} />

          {/* Team filters — same pill style */}
          {TEAM_FILTERS.map(t => {
            const active = teamFilter === t;
            return (
              <button key={t} className="filter-pill"
                style={{ background:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.04)", borderColor:active?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.1)", color:active?"#0a0d14":"rgba(255,255,255,0.4)", boxShadow:active?"0 0 10px rgba(255,255,255,0.2)":"none", flexShrink:0 }}
                onClick={() => setTeamFilter(t)}>{t}</button>
            );
          })}
        </div>

        <div style={{ textAlign:"center", marginTop:6, fontFamily:MONO, fontSize:9, letterSpacing:3, color:"rgba(255,255,255,0.16)" }}>PICK A NUMBER.</div>
      </div>

      {/* DESKTOP */}
      {isDesktop ? (
        <div className="desktop-layout">
          <div className="desktop-grid-col">
            <div className="grid-wrap">{Array.from({length:100},(_,i) => renderCell(i))}</div>
          </div>
          <div className="desktop-panel-col panel-in">{renderPanel()}</div>
        </div>
      ) : (
        <div style={{ padding:"10px 12px", overflowX:"hidden", maxWidth:"100vw" }}>
          <div className="grid-wrap">{Array.from({length:100},(_,i) => renderCell(i))}</div>
        </div>
      )}

      {/* FIX 6: FOOTER */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px 16px", background:"rgba(0,0,0,0.4)", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, flexWrap:"wrap", marginBottom:8 }}>
          {[["THE NUMBER WALL","/"],["ABOUT","/about"],["CONTACT","mailto:dmurphy.dpm@gmail.com"]].map(([label,href]) => (
            <a key={label} href={href} style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.25)", textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.55)"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.25)"}>{label}</a>
          ))}
        </div>
        <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.12)" }}>
          © {new Date().getFullYear()} THE NUMBER WALL · THENUMBERWALL.COM
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      {!isDesktop && selected !== null && (
        <>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="bottom-sheet" ref={sheetRef}>
            <div style={{ width:30, height:3, borderRadius:2, background:"rgba(255,255,255,0.14)", margin:"12px auto 14px" }} />
            {renderPanel()}
          </div>
        </>
      )}
    </div>
  );
}
